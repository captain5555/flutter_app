const express = require('express');
const path = require('path');
const fs = require('fs');
const db = require('../config/database');
const storage = require('../config/storage');
const { authenticateToken } = require('../middleware/auth');
const { requireRole, isAdmin } = require('../middleware/permission');
const { asyncHandler, sendSuccess, sendError } = require('../utils/helpers');
const { createBackup, listBackups, deleteBackup, getBackupPath } = require('../services/backup');

const router = express.Router();

// Get system stats
router.get('/stats', authenticateToken, requireRole('admin'), asyncHandler(async (req, res) => {
  const users = await db.getAllUsers();
  const storageStats = await db.getStorageStats();

  const totalFiles = storageStats.reduce((sum, s) => sum + s.file_count, 0);
  const totalSize = storageStats.reduce((sum, s) => sum + s.total_size, 0);

  sendSuccess(res, {
    userCount: users.length,
    totalFiles,
    totalSize,
    storageByUser: storageStats
  });
}));

// Get all materials (admin)
router.get('/materials', authenticateToken, requireRole('admin'), asyncHandler(async (req, res) => {
  const { userId } = req.query;
  const materials = await db.getAllMaterials({ userId: userId ? parseInt(userId) : null });

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

// Get operation logs
router.get('/logs', authenticateToken, requireRole('admin'), asyncHandler(async (req, res) => {
  const { userId, action } = req.query;
  const logs = await db.getLogs({
    userId: userId ? parseInt(userId) : null,
    action
  });
  sendSuccess(res, logs);
}));

// Trigger backup
router.post('/backup', authenticateToken, requireRole('admin'), asyncHandler(async (req, res) => {
  const backup = await createBackup();
  sendSuccess(res, backup);
}));

// List backups
router.get('/backups', authenticateToken, requireRole('admin'), asyncHandler(async (req, res) => {
  const backups = await listBackups();
  sendSuccess(res, backups);
}));

// Download backup
router.get('/backups/:id/download', authenticateToken, requireRole('admin'), asyncHandler(async (req, res) => {
  const backupId = req.params.id;
  const backupPath = getBackupPath(backupId);

  if (!backupPath || !fs.existsSync(backupPath)) {
    return sendError(res, 'Backup not found', 404);
  }

  res.download(backupPath, `backup-${backupId}.zip`);
}));

// Delete backup
router.delete('/backups/:id', authenticateToken, requireRole('admin'), asyncHandler(async (req, res) => {
  const backupId = req.params.id;
  const result = await deleteBackup(backupId);
  sendSuccess(res, result);
}));

module.exports = router;
