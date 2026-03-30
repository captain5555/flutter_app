const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const db = require('../config/database');
const storage = require('../config/storage');
const { authenticateToken } = require('../middleware/auth');
const { isAdmin, canAccessMaterial } = require('../middleware/permission');
const { validateFile, generateUniqueFilename } = require('../utils/validators');
const { asyncHandler, sendSuccess, sendError, getClientIp } = require('../utils/helpers');
const { logOperation } = require('../middleware/logger');

const router = express.Router();

// Configure multer for disk storage (avoid memory issues)
const tempDir = path.join(__dirname, '../../data/temp');
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir, { recursive: true });
}

const storageEngine = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, tempDir);
  },
  filename: (req, file, cb) => {
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

  const materials = await db.getMaterials(userId, folderType);
  // Add file URLs
  for (const mat of materials) {
    if (mat.file_path) {
      mat.file_url = await storage.getFileUrl(mat.file_path);
    }
    if (mat.thumbnail_path) {
      mat.thumbnail_url = await storage.getFileUrl(mat.thumbnail_path);
    }
  }
  sendSuccess(res, materials);
}));

// Get user trash
router.get('/user/:userId/trash', authenticateToken, asyncHandler(async (req, res) => {
  const userId = parseInt(req.params.userId);

  if (!canAccessUser(req, userId)) {
    return sendError(res, 'Permission denied', 403);
  }

  const materials = await db.getTrashMaterials(userId);
  for (const mat of materials) {
    if (mat.file_path) {
      mat.file_url = await storage.getFileUrl(mat.file_path);
    }
    if (mat.thumbnail_path) {
      mat.thumbnail_url = await storage.getFileUrl(mat.thumbnail_path);
    }
  }
  sendSuccess(res, materials);
}));

// Get single material
router.get('/:id', authenticateToken, asyncHandler(async (req, res) => {
  const material = await db.getMaterial(parseInt(req.params.id));
  if (!material) {
    return sendError(res, 'Material not found', 404);
  }

  if (!canAccessMaterial(req, material)) {
    return sendError(res, 'Permission denied', 403);
  }

  if (material.file_path) {
    material.file_url = await storage.getFileUrl(material.file_path);
  }
  if (material.thumbnail_path) {
    material.thumbnail_url = await storage.getFileUrl(material.thumbnail_path);
  }

  sendSuccess(res, material);
}));

// Upload material
router.post('/upload', authenticateToken, upload.single('file'), asyncHandler(async (req, res) => {
  const { folderType = 'images' } = req.body;

  const fileValidation = validateFile(req.file, folderType);
  if (!fileValidation.valid) {
    // Clean up temp file
    try {
      if (req.file?.path && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
    } catch (e) {
      console.error('Cleanup error:', e);
    }
    return sendError(res, fileValidation.message);
  }

  const isImage = folderType === 'images' || folderType === 'image';
  const filename = generateUniqueFilename(req.file.originalname);
  const filePath = path.join(folderType, filename);

  try {
    const uploadResult = await storage.uploadFile(req.file.path, filePath, {
      generateThumbnail: true,
      isImage
    });

    const material = await db.createMaterial({
      user_id: req.user.id,
      folder_type: folderType,
      file_name: req.file.originalname,
      file_path: filePath,
      file_size: req.file.size,
      file_type: req.file.mimetype,
      thumbnail_path: uploadResult.thumbnailPath
    });

    await logOperation(
      req.user,
      'upload_material',
      'material',
      material.id,
      req.file.originalname,
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
  const material = await db.getMaterial(materialId);

  if (!material) {
    return sendError(res, 'Material not found', 404);
  }

  if (!canAccessMaterial(req, material)) {
    return sendError(res, 'Permission denied', 403);
  }

  const updated = await db.updateMaterial(materialId, req.body);

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
  const material = await db.getMaterial(materialId);

  if (!material) {
    return sendError(res, 'Material not found', 404);
  }

  if (!canAccessMaterial(req, material)) {
    return sendError(res, 'Permission denied', 403);
  }

  const result = await db.deleteMaterial(materialId);

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
  if (!ids || !Array.isArray(ids)) {
    return sendError(res, 'Invalid ids');
  }

  const result = await db.batchMoveToTrash(ids, req.user.id);

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

  const result = await db.batchRestore(ids, req.user.id);

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
router.delete('/batch', authenticateToken, asyncHandler(async (req, res) => {
  const { ids } = req.body;
  if (!ids || !Array.isArray(ids)) {
    return sendError(res, 'Invalid ids');
  }

  const result = await db.batchDelete(ids, req.user.id);

  // Delete actual files
  for (const filePath of result.filePaths || []) {
    await storage.deleteFile(filePath);
  }
  for (const thumbPath of result.thumbnailPaths || []) {
    await storage.deleteFile(thumbPath);
  }

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
  const { ids, targetUserId } = req.body;

  if (!ids || !Array.isArray(ids) || !targetUserId) {
    return sendError(res, 'Missing required fields');
  }

  // Only admin can copy to other users
  if (targetUserId !== req.user.id && !isAdmin(req)) {
    return sendError(res, 'Permission denied', 403);
  }

  const result = await db.batchCopy(ids, req.user.id, targetUserId);

  await logOperation(
    req.user,
    'batch_copy',
    'material',
    null,
    `${result.copied} materials to user ${targetUserId}`,
    getClientIp(req)
  );

  sendSuccess(res, result);
}));

// Batch move
router.post('/batch/move', authenticateToken, asyncHandler(async (req, res) => {
  const { ids, targetUserId, targetFolder } = req.body;

  if (!ids || !Array.isArray(ids) || !targetUserId || !targetFolder) {
    return sendError(res, 'Missing required fields');
  }

  // Only admin can move to other users
  if (targetUserId !== req.user.id && !isAdmin(req)) {
    return sendError(res, 'Permission denied', 403);
  }

  const result = await db.batchMove(ids, req.user.id, targetUserId, targetFolder);

  await logOperation(
    req.user,
    'batch_move',
    'material',
    null,
    `${result.moved} materials to ${targetFolder}`,
    getClientIp(req)
  );

  sendSuccess(res, result);
}));

function canAccessUser(req, userId) {
  if (isAdmin(req)) return true;
  return req.user.id === userId;
}

module.exports = router;
