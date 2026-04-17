const fs = require('fs');
const db = require('../config/database');
const storage = require('../config/storage');
const { validateFile, generateUniqueFilename } = require('../utils/validators');
const { getClientIp } = require('../utils/helpers');
const { logOperation } = require('../middleware/logger');
const { eventBus, events } = require('../events');

class MaterialService {
  /**
   * 上传素材
   * @param {number} userId - 用户ID
   * @param {object} data - 请求数据
   * @param {File} file - 上传的文件
   * @returns {Promise<object>} 创建的素材
   */
  async upload(userId, data, file) {
    const { folderType = 'images', filename_utf8 } = data;

    // 1. 处理文件名
    let originalFilename = file?.originalname || 'unknown';
    if (filename_utf8) {
      try {
        originalFilename = decodeURIComponent(escape(atob(filename_utf8)));
      } catch (e) {
      }
    }

    if (!/[\u4e00-\u9fff]/.test(originalFilename)) {
      try {
        const buffer = Buffer.from(originalFilename, 'latin1');
        const utf8Name = buffer.toString('utf8');
        if (/[\u4e00-\u9fff]/.test(utf8Name)) {
          originalFilename = utf8Name;
        }
      } catch (e) {
      }
    }

    // 2. 验证文件
    const fileValidation = validateFile(file, folderType);
    if (!fileValidation.valid) {
      try {
        if (file?.path && fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }
      } catch (e) {
      }
      throw new Error(fileValidation.message);
    }

    // 3. 生成文件名和路径
    const isImage = folderType === 'images' || folderType === 'image';
    const filename = generateUniqueFilename(originalFilename);
    const filePath = `${folderType}/${filename}`;

    // 4. 上传文件到存储
    const uploadResult = await storage.uploadFile(file.path, filePath, {
      generateThumbnail: true,
      isImage
    });

    // 5. 转换缩略图路径
    let thumbnailPath = uploadResult.thumbnailPath;
    if (thumbnailPath) {
      thumbnailPath = thumbnailPath.replace(/\\/g, '/');
    }

    // 6. 创建数据库记录
    const material = await db.createMaterial({
      user_id: userId,
      folder_type: folderType,
      file_name: originalFilename,
      file_path: filePath,
      file_size: file.size,
      file_type: file.mimetype,
      thumbnail_path: thumbnailPath
    });

    return material;
  }

  /**
   * 获取用户素材列表
   * @param {number} userId - 用户ID
   * @param {string} folderType - 文件夹类型
   * @returns {Promise<Array>} 素材列表
   */
  async getMaterials(userId, folderType) {
    const materials = await db.getMaterials(userId, folderType);

    for (const mat of materials) {
      if (mat.file_path) {
        mat.file_path = mat.file_path.replace(/\\/g, '/');
        mat.file_url = await storage.getFileUrl(mat.file_path);
      }
      if (mat.thumbnail_path) {
        mat.thumbnail_path = mat.thumbnail_path.replace(/\\/g, '/');
        mat.thumbnail_url = await storage.getFileUrl(mat.thumbnail_path);
      }
    }

    return materials;
  }

  /**
   * 获取垃圾箱素材
   * @param {number} userId - 用户ID
   * @param {boolean} isAdmin - 是否为管理员
   * @returns {Promise<Array>} 垃圾箱素材列表
   */
  async getTrashMaterials(userId, isAdmin = false) {
    let materials;

    if (isAdmin) {
      materials = await db.getAllTrashMaterials();
    } else {
      materials = await db.getTrashMaterials(userId);
    }

    for (const mat of materials) {
      if (mat.file_path) {
        mat.file_path = mat.file_path.replace(/\\/g, '/');
        mat.file_url = await storage.getFileUrl(mat.file_path);
      }
      if (mat.thumbnail_path) {
        mat.thumbnail_path = mat.thumbnail_path.replace(/\\/g, '/');
        mat.thumbnail_url = await storage.getFileUrl(mat.thumbnail_path);
      }
    }

    return materials;
  }

  /**
   * 获取单个素材
   * @param {number} materialId - 素材ID
   * @returns {Promise<object|null>} 素材
   */
  async getMaterial(materialId) {
    const material = await db.getMaterial(materialId);
    if (!material) return null;

    if (material.file_path) {
      material.file_path = material.file_path.replace(/\\/g, '/');
      material.file_url = await storage.getFileUrl(material.file_path);
    }
    if (material.thumbnail_path) {
      material.thumbnail_path = material.thumbnail_path.replace(/\\/g, '/');
      material.thumbnail_url = await storage.getFileUrl(material.thumbnail_path);
    }

    return material;
  }

  /**
   * 更新素材
   * @param {number} materialId - 素材ID
   * @param {object} data - 更新数据
   * @returns {Promise<object>} 更新后的素材
   */
  async updateMaterial(materialId, data) {
    return await db.updateMaterial(materialId, data);
  }

  /**
   * 移动素材到垃圾箱
   * @param {number} materialId - 素材ID
   * @param {number} userId - 用户ID
   * @returns {Promise<object>} 结果
   */
  async deleteMaterial(materialId, userId) {
    return await db.deleteMaterial(materialId);
  }

  /**
   * 批量移动到垃圾箱
   * @param {Array<number>} ids - 素材ID列表
   * @param {number} userId - 用户ID
   * @param {boolean} isAdmin - 是否为管理员
   * @returns {Promise<object>} 结果
   */
  async batchMoveToTrash(ids, userId, isAdmin = false) {
    // 管理员传 null，可以操作所有用户的素材；普通用户传自己的 id
    const actualUserId = isAdmin ? null : userId;
    return await db.batchMoveToTrash(ids, actualUserId);
  }

  /**
   * 批量恢复
   * @param {Array<number>} ids - 素材ID列表
   * @param {number} userId - 用户ID
   * @param {boolean} isAdmin - 是否为管理员
   * @returns {Promise<object>} 结果
   */
  async batchRestore(ids, userId, isAdmin = false) {
    // 管理员传 null，可以操作所有用户的素材；普通用户传自己的 id
    const actualUserId = isAdmin ? null : userId;
    return await db.batchRestore(ids, actualUserId);
  }

  /**
   * 批量永久删除
   * @param {Array<number>} ids - 素材ID列表
   * @param {number|null} userId - 用户ID（null表示管理员）
   * @returns {Promise<object>} 结果
   */
  async batchPermanentDelete(ids, userId) {
    const result = await db.batchDelete(ids, userId);

    for (const filePath of result.filePaths || []) {
      await storage.deleteFile(filePath);
    }
    for (const thumbPath of result.thumbnailPaths || []) {
      await storage.deleteFile(thumbPath);
    }

    return result;
  }

  /**
   * 批量复制
   * @param {Array<number>} ids - 素材ID列表
   * @param {number} sourceUserId - 源用户ID
   * @param {number} targetUserId - 目标用户ID
   * @param {boolean} isAdmin - 是否为管理员
   * @returns {Promise<object>} 结果
   */
  async batchCopy(ids, sourceUserId, targetUserId, isAdmin = false) {
    const actualSourceUserId = (isAdmin && sourceUserId !== targetUserId) ? null : sourceUserId;
    return await db.batchCopy(ids, actualSourceUserId, targetUserId);
  }

  /**
   * 批量移动
   * @param {Array<number>} ids - 素材ID列表
   * @param {number} sourceUserId - 源用户ID
   * @param {number} targetUserId - 目标用户ID
   * @param {string} targetFolder - 目标文件夹
   * @param {boolean} isAdmin - 是否为管理员
   * @returns {Promise<object>} 结果
   */
  async batchMove(ids, sourceUserId, targetUserId, targetFolder, isAdmin = false) {
    const actualSourceUserId = (isAdmin && sourceUserId !== targetUserId) ? null : sourceUserId;
    return await db.batchMove(ids, actualSourceUserId, targetUserId, targetFolder);
  }
}

module.exports = new MaterialService();
