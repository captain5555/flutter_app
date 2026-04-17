const config = require('../config');

function validateUsername(username) {
  if (!username || username.length < 3 || username.length > 50) {
    return { valid: false, message: 'Username must be 3-50 characters' };
  }
  if (!/^[a-zA-Z0-9_]+$/.test(username)) {
    return { valid: false, message: 'Username can only contain letters, numbers, and underscores' };
  }
  return { valid: true };
}

function validatePassword(password) {
  if (!password || password.length < 6) {
    return { valid: false, message: 'Password must be at least 6 characters' };
  }
  return { valid: true };
}

function validateFile(file, folderType) {
  if (!file) {
    return { valid: false, message: 'No file provided' };
  }

  const limits = config.upload.maxFileSize;
  const allowedTypes = config.upload.allowedTypes[folderType] || [];

  if ((folderType === 'image' || folderType === 'images') && file.size > limits.image) {
    return { valid: false, message: 'Image file too large (max 50MB)' };
  }
  if ((folderType === 'video' || folderType === 'videos') && file.size > limits.video) {
    return { valid: false, message: 'Video file too large (max 500MB)' };
  }

  if (allowedTypes.length > 0 && !allowedTypes.includes(file.mimetype)) {
    return { valid: false, message: 'File type not allowed' };
  }

  return { valid: true };
}

function sanitizeFilename(filename) {
  // Remove path traversal characters
  return filename.replace(/[\\/:*?"<>|]/g, '_');
}

function generateUniqueFilename(originalName) {
  const ext = (originalName.split('.').pop() || 'mp4').toLowerCase();
  // 只使用时间戳和随机数生成安全的文件名，不依赖原始文件名
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `file_${timestamp}_${random}.${ext}`;
}

module.exports = {
  validateUsername,
  validatePassword,
  validateFile,
  sanitizeFilename,
  generateUniqueFilename
};
