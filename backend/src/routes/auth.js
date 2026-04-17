const express = require('express');
const bcrypt = require('bcrypt');
const db = require('../config/database');
const { authenticateToken, generateToken, refreshToken } = require('../middleware/auth');
const { validateUsername, validatePassword } = require('../utils/validators');
const { asyncHandler, sendSuccess, sendError, getClientIp } = require('../utils/helpers');
const { logOperation } = require('../middleware/logger');

const router = express.Router();

// Login
router.post('/login', asyncHandler(async (req, res) => {
  const { username, password } = req.body;

  if (!username) {
    return sendError(res, 'Username is required');
  }

  const user = await db.getUserByUsername(username);
  if (!user) {
    return sendError(res, 'Invalid username or password', 401);
  }

  // 如果用户没有设置密码（password_hash为空），则允许直接登录
  let validPassword = true;
  if (user.password_hash) {
    // 只有当password_hash不为空时才验证密码
    if (!password) {
      return sendError(res, 'Password is required', 401);
    }
    validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      return sendError(res, 'Invalid username or password', 401);
    }
  }

  const token = generateToken(user.id);

  await logOperation(
    { id: user.id },
    'login',
    'user',
    user.id,
    null,
    getClientIp(req)
  );

  sendSuccess(res, {
    token,
    user: {
      id: user.id,
      username: user.username,
      role: user.role
    }
  });
}));

// Logout
router.post('/logout', authenticateToken, asyncHandler(async (req, res) => {
  await logOperation(
    req.user,
    'logout',
    'user',
    req.user.id,
    null,
    getClientIp(req)
  );
  sendSuccess(res, { message: 'Logged out successfully' });
}));

// Refresh token
router.post('/refresh', asyncHandler(async (req, res) => {
  const { token } = req.body;
  if (!token) {
    return sendError(res, 'Token is required');
  }

  const newToken = refreshToken(token);
  if (!newToken) {
    return sendError(res, 'Token cannot be refreshed', 403);
  }

  sendSuccess(res, { token: newToken });
}));

// Get current user
router.get('/me', authenticateToken, asyncHandler(async (req, res) => {
  sendSuccess(res, req.user);
}));

// Simplified login (V2 compatibility - no password)
router.post('/login-simple', asyncHandler(async (req, res) => {
  const { username } = req.body;

  if (!username) {
    return sendError(res, 'Username is required');
  }

  const user = await db.getUserByUsername(username);
  if (!user) {
    return sendError(res, 'User not found', 401);
  }

  // Generate token using the same function as regular login
  const token = generateToken(user.id);

  await logOperation(
    { id: user.id },
    'login',
    'user',
    user.id,
    null,
    getClientIp(req)
  );

  sendSuccess(res, {
    token,
    user: {
      id: user.id,
      username: user.username,
      role: user.role
    }
  });
}));

module.exports = router;
