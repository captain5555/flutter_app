const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { authenticateToken } = require('../middleware/auth');
const { isAdmin, canAccessMaterial, canAccessUser } = require('../middleware/permission');
const { asyncHandler, sendSuccess, sendError, getClientIp } = require('../utils/helpers');
const { logOperation } = require('../middleware/logger');
const materialService = require('../services/materialService');

const router = express.Router();

// Configure multer for disk storage (avoid memory issues)
const tempDir = path.join(__dirname, '../../data/temp');
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir, { recursive: true });
}

// Fix filename encoding for Chinese characters
function decodeFilename(filename) {
  if (!filename) return filename;
  try {
    // Try to decode from latin1 to utf8 (common browser encoding issue)
    return Buffer.from(filename, 'latin1').toString('utf8');
  } catch (e) {
    return filename;
  }
}

const storageEngine = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, tempDir);
  },
  filename: (req, file, cb) => {
    // Fix encoding for originalname
    file.originalname = decodeFilename(file.originalname);
    const uniqueName = Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(file.originalname);
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage: storageEngine,
  limits: {
    fileSize: 500 * 1024 * 1024 // 500MB max
  }
});

// Get user materials
router.get('/user/:userId/folder/:folderType', authenticateToken, asyncHandler(async (req, res) => {
  const userId = parseInt(req.params.userId);
  const folderType = req.params.folderType;

  if (!canAccessUser(req, userId)) {
    return sendError(res, 'Permission denied', 403);
  }

  const materials = await materialService.getMaterials(userId, folderType);
  sendSuccess(res, materials);
}));

// Get user trash (or all trash for admin)
router.get('/user/:userId/trash', authenticateToken, asyncHandler(async (req, res) => {
  const userId = parseInt(req.params.userId);
  const { all } = req.query;

  if (all === 'true' && isAdmin(req)) {
    const materials = await materialService.getTrashMaterials(userId, true);
    sendSuccess(res, materials);
    return;
  }

  if (!canAccessUser(req, userId)) {
    return sendError(res, 'Permission denied', 403);
  }

  const materials = await materialService.getTrashMaterials(userId, false);
  sendSuccess(res, materials);
}));

// Get single material
router.get('/:id', authenticateToken, asyncHandler(async (req, res) => {
  const material = await materialService.getMaterial(parseInt(req.params.id));
  if (!material) {
    return sendError(res, 'Material not found', 404);
  }

  if (!canAccessMaterial(req, material)) {
    return sendError(res, 'Permission denied', 403);
  }

  sendSuccess(res, material);
}));

// Upload material
router.post('/upload', authenticateToken, upload.single('file'), asyncHandler(async (req, res) => {
  try {
    // Determine target user: if admin provides user_id or targetUserId, use it; otherwise use current user
    const isAdminUser = isAdmin(req);
    const targetUserId = (req.body.user_id || req.body.targetUserId) ? parseInt(req.body.user_id || req.body.targetUserId) : req.user.id;

    // Permission check: only admin can upload for other users
    if (targetUserId !== req.user.id && !isAdminUser) {
      return sendError(res, 'Permission denied', 403);
    }

    const material = await materialService.upload(targetUserId, req.body, req.file);

    await logOperation(
      req.user,
      'upload_material',
      'material',
      material.id,
      material.file_name,
      getClientIp(req)
    );

    sendSuccess(res, material);
  } catch (err) {
    // Clean up temp file on error
    try {
      if (req.file?.path && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
    } catch (e) {
      console.error('Cleanup error:', e);
    }
    throw err;
  }
}));

// Update material
router.put('/:id', authenticateToken, asyncHandler(async (req, res) => {
  const materialId = parseInt(req.params.id);
  const material = await materialService.getMaterial(materialId);

  if (!material) {
    return sendError(res, 'Material not found', 404);
  }

  if (!canAccessMaterial(req, material)) {
    return sendError(res, 'Permission denied', 403);
  }

  const updated = await materialService.updateMaterial(materialId, req.body);

  await logOperation(
    req.user,
    'update_material',
    'material',
    materialId,
    null,
    getClientIp(req)
  );

  sendSuccess(res, updated);
}));

// Delete material (move to trash)
router.delete('/:id', authenticateToken, asyncHandler(async (req, res) => {
  const materialId = parseInt(req.params.id);
  const material = await materialService.getMaterial(materialId);

  if (!material) {
    return sendError(res, 'Material not found', 404);
  }

  if (!canAccessMaterial(req, material)) {
    return sendError(res, 'Permission denied', 403);
  }

  const result = await materialService.deleteMaterial(materialId, req.user.id);

  await logOperation(
    req.user,
    'trash_material',
    'material',
    materialId,
    null,
    getClientIp(req)
  );

  sendSuccess(res, result);
}));

// Batch move to trash
router.post('/batch/trash', authenticateToken, asyncHandler(async (req, res) => {
  const { ids } = req.body;

  console.log('=== batch/trash called ===');
  console.log('User:', req.user);
  console.log('isAdmin:', isAdmin(req));
  console.log('Ids:', ids);

  if (!ids || !Array.isArray(ids)) {
    return sendError(res, 'Invalid ids');
  }

  const isAdminUser = isAdmin(req);
  const result = await materialService.batchMoveToTrash(ids, req.user.id, isAdminUser);

  console.log('Result:', result);

  await logOperation(
    req.user,
    'batch_trash',
    'material',
    null,
    `${ids.length} materials`,
    getClientIp(req)
  );

  sendSuccess(res, result);
}));

// Batch restore
router.post('/batch/restore', authenticateToken, asyncHandler(async (req, res) => {
  const { ids } = req.body;

  if (!ids || !Array.isArray(ids)) {
    return sendError(res, 'Invalid ids');
  }

  const isAdminUser = isAdmin(req);
  const result = await materialService.batchRestore(ids, req.user.id, isAdminUser);

  await logOperation(
    req.user,
    'batch_restore',
    'material',
    null,
    `${ids.length} materials`,
    getClientIp(req)
  );

  sendSuccess(res, result);
}));

// Batch permanent delete
router.delete('/batch/permanent', authenticateToken, asyncHandler(async (req, res) => {
  const { ids } = req.body;

  if (!ids || !Array.isArray(ids)) {
    return sendError(res, 'Invalid ids');
  }

  // 管理员可以删除任何用户的素材，普通用户只能删除自己的
  const isAdminUser = isAdmin(req);
  const result = await materialService.batchPermanentDelete(ids, isAdminUser ? null : req.user.id);

  await logOperation(
    req.user,
    'batch_delete',
    'material',
    null,
    `${ids.length} materials`,
    getClientIp(req)
  );

  sendSuccess(res, { deleted: result.deleted });
}));

// Batch copy
router.post('/batch/copy', authenticateToken, asyncHandler(async (req, res) => {
  const { ids, sourceUserId, targetUserId } = req.body;

  if (!ids || !Array.isArray(ids) || !targetUserId) {
    return sendError(res, 'Missing required fields');
  }

  const isAdminUser = isAdmin(req);
  const actualSourceUserId = sourceUserId || req.user.id;

  // Only admin can copy from/to other users
  if ((actualSourceUserId !== req.user.id || targetUserId !== req.user.id) && !isAdminUser) {
    return sendError(res, 'Permission denied', 403);
  }

  const result = await materialService.batchCopy(ids, actualSourceUserId, targetUserId, isAdminUser);

  await logOperation(
    req.user,
    'batch_copy',
    'material',
    null,
    `${result.copied} materials from user ${actualSourceUserId} to user ${targetUserId}`,
    getClientIp(req)
  );

  sendSuccess(res, result);
}));

// Batch move
router.post('/batch/move', authenticateToken, asyncHandler(async (req, res) => {
  const { ids, sourceUserId, targetUserId, targetFolder } = req.body;

  if (!ids || !Array.isArray(ids) || !targetUserId || !targetFolder) {
    return sendError(res, 'Missing required fields');
  }

  const isAdminUser = isAdmin(req);
  const actualSourceUserId = sourceUserId || req.user.id;

  // Only admin can move from/to other users
  if ((actualSourceUserId !== req.user.id || targetUserId !== req.user.id) && !isAdminUser) {
    return sendError(res, 'Permission denied', 403);
  }

  const result = await materialService.batchMove(ids, actualSourceUserId, targetUserId, targetFolder, isAdminUser);

  await logOperation(
    req.user,
    'batch_move',
    'material',
    null,
    `${result.moved} materials from user ${actualSourceUserId} to ${targetFolder} of user ${targetUserId}`,
    getClientIp(req)
  );

  sendSuccess(res, result);
}));

// Download material (video)
router.get('/:id/download', authenticateToken, asyncHandler(async (req, res) => {
  const materialId = parseInt(req.params.id);
  const material = await materialService.getMaterial(materialId);

  if (!material) {
    return sendError(res, 'Material not found', 404);
  }

  if (!canAccessMaterial(req, material)) {
    return sendError(res, 'Permission denied', 403);
  }

  const uploadsPath = path.join(__dirname, '../../data/uploads');
  const filePath = path.join(uploadsPath, material.file_path);

  if (!fs.existsSync(filePath)) {
    return sendError(res, 'File not found', 404);
  }

  res.download(filePath, material.file_name);
}));

module.exports = router;
