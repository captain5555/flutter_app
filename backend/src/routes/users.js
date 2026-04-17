const express = require('express');
const db = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const { requireRole, canAccessUser } = require('../middleware/permission');
const { validateUsername, validatePassword } = require('../utils/validators');
const { asyncHandler, sendSuccess, sendError, getClientIp } = require('../utils/helpers');
const { logOperation } = require('../middleware/logger');

const router = express.Router();

// Get all users (public for login page - no auth required)
router.get('/', asyncHandler(async (req, res) => {
  const users = await db.getAllUsers();
  sendSuccess(res, users);
}));

// Get all users (public for login page - no auth required) - alias for /
router.get('/public', asyncHandler(async (req, res) => {
  const users = await db.getAllUsers();
  sendSuccess(res, users);
}));

// Get user by ID
router.get('/:id', authenticateToken, asyncHandler(async (req, res) => {
  const targetUserId = parseInt(req.params.id);

  if (!canAccessUser(req, targetUserId)) {
    return sendError(res, 'Permission denied', 403);
  }

  const user = await db.getUser(targetUserId);
  if (!user) {
    return sendError(res, 'User not found', 404);
  }

  sendSuccess(res, user);
}));

// Create user (admin only)
router.post('/', authenticateToken, requireRole('admin'), asyncHandler(async (req, res) => {
  const { username, password = '', role = 'user' } = req.body;

  console.log('[CreateUser] Request body:', { username, password: password ? '***' : '', role });

  const usernameValidation = validateUsername(username);
  if (!usernameValidation.valid) {
    console.log('[CreateUser] Username validation failed:', usernameValidation.message);
    return sendError(res, usernameValidation.message);
  }

  // 只有当密码不为空时才验证密码（创建用户时密码可选）
  if (password) {
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      return sendError(res, passwordValidation.message);
    }
  }

  const allUsers = await db.getAllUsers();
  console.log('[CreateUser] All existing users:', allUsers);

  const existingUser = await db.getUserByUsername(username);
  console.log('[CreateUser] Existing user check for "' + username + '":', existingUser ? 'Found' : 'Not found', existingUser);
  if (existingUser) {
    return sendError(res, 'Username already exists');
  }

  const user = await db.createUser({ username, password, role });

  await logOperation(
    req.user,
    'create_user',
    'user',
    user.id,
    `Created user: ${username}`,
    getClientIp(req)
  );

  sendSuccess(res, user);
}));

// Update user
router.put('/:id', authenticateToken, asyncHandler(async (req, res) => {
  const targetUserId = parseInt(req.params.id);

  if (!canAccessUser(req, targetUserId)) {
    return sendError(res, 'Permission denied', 403);
  }

  // Non-admin users can only update their own password
  if (req.user.role !== 'admin') {
    const allowedKeys = ['password'];
    const hasDisallowedKeys = Object.keys(req.body).some(k => !allowedKeys.includes(k));
    if (hasDisallowedKeys) {
      return sendError(res, 'Permission denied', 403);
    }
  }

  if (req.body.username) {
    const validation = validateUsername(req.body.username);
    if (!validation.valid) {
      return sendError(res, validation.message);
    }
  }

  if (req.body.password) {
    const validation = validatePassword(req.body.password);
    if (!validation.valid) {
      return sendError(res, validation.message);
    }
  }

  const user = await db.updateUser(targetUserId, req.body);

  await logOperation(
    req.user,
    'update_user',
    'user',
    targetUserId,
    null,
    getClientIp(req)
  );

  sendSuccess(res, user);
}));

// Delete user (admin only)
router.delete('/:id', authenticateToken, requireRole('admin'), asyncHandler(async (req, res) => {
  const targetUserId = parseInt(req.params.id);

  // Don't allow deleting yourself
  if (targetUserId === req.user.id) {
    return sendError(res, 'Cannot delete your own account', 400);
  }

  const result = await db.deleteUserAndTransferMaterials(targetUserId, 1); // admin id = 1

  await logOperation(
    req.user,
    'delete_user',
    'user',
    targetUserId,
    `Transferred ${result.transferredMaterials} materials`,
    getClientIp(req)
  );

  sendSuccess(res, result);
}));

module.exports = router;
