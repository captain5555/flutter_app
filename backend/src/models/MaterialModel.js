const BaseModel = require('./BaseModel');

class MaterialModel extends BaseModel {
  async getMaterial(id) {
    return await this.get('SELECT * FROM materials WHERE id = ?', [id]);
  }

  async getMaterials(userId, folderType, options = {}) {
    let sql = 'SELECT * FROM materials WHERE user_id = ? AND is_deleted = 0';
    const params = [userId];

    if (folderType) {
      sql += ' AND folder_type = ?';
      params.push(folderType);
    }

    sql += ' ORDER BY created_at DESC';
    return await this.all(sql, params);
  }

  async getTrashMaterials(userId) {
    return await this.all(
      'SELECT * FROM materials WHERE user_id = ? AND is_deleted = 1 ORDER BY deleted_at DESC',
      [userId]
    );
  }

  async getAllTrashMaterials() {
    return await this.all(
      'SELECT m.*, u.username FROM materials m LEFT JOIN users u ON m.user_id = u.id WHERE m.is_deleted = 1 ORDER BY m.deleted_at DESC',
      []
    );
  }

  async getAllMaterials(filters = {}) {
    let sql = 'SELECT m.*, u.username FROM materials m LEFT JOIN users u ON m.user_id = u.id WHERE 1=1';
    const params = [];

    if (filters.user_id) {
      sql += ' AND m.user_id = ?';
      params.push(filters.user_id);
    }

    sql += ' ORDER BY m.created_at DESC LIMIT 200';
    return await this.all(sql, params);
  }

  async createMaterial(data) {
    const { user_id, folder_type, file_name, file_path, file_size, file_type, thumbnail_path } = data;
    const result = await this.run(
      'INSERT INTO materials (user_id, folder_type, file_name, file_path, file_size, file_type, thumbnail_path) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [user_id, folder_type, file_name, file_path, file_size, file_type, thumbnail_path]
    );
    return { id: result.lastID, ...data };
  }

  async updateMaterial(id, data) {
    const fields = [];
    const values = [];

    ['file_name', 'folder_type', 'usage_tag', 'viral_tag', 'title', 'description'].forEach(key => {
      if (data[key] !== undefined) {
        fields.push(`${key} = ?`);
        values.push(data[key]);

        if (key === 'usage_tag' && data[key] === 'used') {
          fields.push('used_at = CURRENT_TIMESTAMP');
        }
        if (key === 'usage_tag' && data[key] === 'unused') {
          fields.push('used_at = NULL');
        }
      }
    });

    if (fields.length === 0) {
      return await this.getMaterial(id);
    }

    fields.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id);

    await this.run(
      `UPDATE materials SET ${fields.join(', ')} WHERE id = ?`,
      values
    );
    return await this.getMaterial(id);
  }

  async deleteMaterial(id) {
    const result = await this.run(
      'UPDATE materials SET is_deleted = 1, deleted_at = CURRENT_TIMESTAMP WHERE id = ?',
      [id]
    );
    return { deleted: result.changes > 0 };
  }

  async batchMoveToTrash(ids, userId) {
    console.log('=== MaterialModel.batchMoveToTrash ===');
    console.log('ids:', ids);
    console.log('userId:', userId);

    const placeholders = ids.map(() => '?').join(',');
    let sql = `UPDATE materials SET is_deleted = 1, deleted_at = CURRENT_TIMESTAMP WHERE id IN (${placeholders})`;
    let params = [...ids];

    // 如果提供了 userId（非管理员），只允许操作自己的素材
    if (userId !== null) {
      sql += ` AND user_id = ?`;
      params.push(userId);
    }

    console.log('SQL:', sql);
    console.log('Params:', params);

    const result = await this.run(sql, params);
    console.log('Result changes:', result.changes);

    return { updated: result.changes };
  }

  async batchRestore(ids, userId) {
    const placeholders = ids.map(() => '?').join(',');
    let sql = `UPDATE materials SET is_deleted = 0, deleted_at = NULL WHERE id IN (${placeholders})`;
    let params = [...ids];

    // 如果提供了 userId（非管理员），只允许操作自己的素材
    if (userId !== null) {
      sql += ` AND user_id = ?`;
      params.push(userId);
    }

    const result = await this.run(sql, params);
    return { updated: result.changes };
  }

  async batchDelete(ids, userId) {
    const placeholders = ids.map(() => '?').join(',');

    let selectSql = `SELECT file_path, thumbnail_path, id, user_id, is_deleted FROM materials WHERE id IN (${placeholders})`;
    let deleteSql = `DELETE FROM materials WHERE id IN (${placeholders})`;
    let params = [...ids];

    if (userId !== null) {
      selectSql += ` AND user_id = ?`;
      deleteSql += ` AND user_id = ?`;
      params.push(userId);
    }

    const rows = await this.all(selectSql, params);
    const filePaths = rows.map(r => r.file_path).filter(Boolean);
    const thumbnailPaths = rows.map(r => r.thumbnail_path).filter(Boolean);

    const result = await this.run(deleteSql, params);
    return { deleted: result.changes, filePaths, thumbnailPaths };
  }

  async batchCopy(ids, sourceUserId, targetUserId) {
    const placeholders = ids.map(() => '?').join(',');

    let selectSql = `SELECT folder_type, file_name, file_path, file_size, file_type, thumbnail_path
         FROM materials WHERE id IN (${placeholders})`;
    let params = [...ids];

    if (sourceUserId !== null) {
      selectSql += ` AND user_id = ?`;
      params.push(sourceUserId);
    }

    const rows = await this.all(selectSql, params);

    let copied = 0;
    for (const row of rows) {
      try {
        await this.run(
          `INSERT INTO materials (user_id, folder_type, file_name, file_path, file_size, file_type, thumbnail_path)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [targetUserId, row.folder_type, row.file_name, row.file_path, row.file_size, row.file_type, row.thumbnail_path]
        );
        copied++;
      } catch (err) {
        console.error('Failed to copy material:', err);
      }
    }

    return { copied, total: rows.length };
  }

  async batchMove(ids, sourceUserId, targetUserId, targetFolder) {
    const placeholders = ids.map(() => '?').join(',');

    let updateSql = `UPDATE materials SET user_id = ?, folder_type = ?, updated_at = CURRENT_TIMESTAMP
         WHERE id IN (${placeholders})`;
    let params = [targetUserId, targetFolder, ...ids];

    if (sourceUserId !== null) {
      updateSql += ` AND user_id = ?`;
      params.push(sourceUserId);
    }

    const result = await this.run(updateSql, params);
    return { moved: result.changes };
  }

  async getStorageStats() {
    return await this.all(
      `SELECT user_id, COUNT(*) as file_count, SUM(file_size) as total_size
       FROM materials WHERE is_deleted = 0 GROUP BY user_id`,
      []
    );
  }
}

module.exports = MaterialModel;
