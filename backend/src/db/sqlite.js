const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');
const AbstractDatabase = require('./abstract');
const bcrypt = require('bcrypt');

class SQLiteDatabase extends AbstractDatabase {
  constructor(dbPath) {
    super();
    const dataDir = path.join(__dirname, '../../data/db');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    this.dbPath = dbPath || path.join(dataDir, 'nas-materials.db');
    this.db = null;
  }

  async init() {
    return new Promise((resolve, reject) => {
      this.db = new sqlite3.Database(this.dbPath, (err) => {
        if (err) {
          reject(err);
        } else {
          this._initSchema().then(resolve).catch(reject);
        }
      });
    });
  }

  async _initSchema() {
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');

    return new Promise((resolve, reject) => {
      this.db.exec(schema, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }

  async close() {
    return new Promise((resolve, reject) => {
      if (this.db) {
        this.db.close((err) => {
          if (err) reject(err);
          else resolve();
        });
      } else {
        resolve();
      }
    });
  }

  // User operations
  async getUser(id) {
    return new Promise((resolve, reject) => {
      this.db.get('SELECT id, username, role, created_at, updated_at FROM users WHERE id = ?', [id], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  }

  async getUserByUsername(username) {
    return new Promise((resolve, reject) => {
      this.db.get('SELECT * FROM users WHERE username = ?', [username], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  }

  async createUser(data) {
    return new Promise((resolve, reject) => {
      const { username, password, role = 'user' } = data;
      bcrypt.hash(password, 10, (err, passwordHash) => {
        if (err) {
          reject(err);
          return;
        }
        this.db.run(
          'INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)',
          [username, passwordHash, role],
          function(err) {
            if (err) reject(err);
            else resolve({ id: this.lastID, username, role });
          }
        );
      });
    });
  }

  async updateUser(id, data) {
    return new Promise(async (resolve, reject) => {
      const fields = [];
      const values = [];

      if (data.username) {
        fields.push('username = ?');
        values.push(data.username);
      }
      if (data.password) {
        fields.push('password_hash = ?');
        values.push(await bcrypt.hash(data.password, 10));
      }
      if (data.role) {
        fields.push('role = ?');
        values.push(data.role);
      }

      if (fields.length === 0) {
        resolve(await this.getUser(id));
        return;
      }

      fields.push('updated_at = CURRENT_TIMESTAMP');
      values.push(id);

      this.db.run(
        `UPDATE users SET ${fields.join(', ')} WHERE id = ?`,
        values,
        async function(err) {
          if (err) reject(err);
          else resolve(await this.getUser(id));
        }
      );
    });
  }

  async deleteUser(id) {
    return new Promise((resolve, reject) => {
      this.db.run('DELETE FROM users WHERE id = ?', [id], function(err) {
        if (err) reject(err);
        else resolve({ deleted: this.changes > 0 });
      });
    });
  }

  async getAllUsers() {
    return new Promise((resolve, reject) => {
      this.db.all('SELECT id, username, role, created_at, updated_at FROM users ORDER BY created_at DESC', [], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }

  // Material operations (partial implementation - more to follow)
  async getMaterial(id) {
    return new Promise((resolve, reject) => {
      this.db.get('SELECT * FROM materials WHERE id = ?', [id], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  }

  async getMaterials(userId, folderType, options = {}) {
    return new Promise((resolve, reject) => {
      let sql = 'SELECT * FROM materials WHERE user_id = ? AND is_deleted = 0';
      const params = [userId];

      if (folderType) {
        sql += ' AND folder_type = ?';
        params.push(folderType);
      }

      sql += ' ORDER BY created_at DESC';

      this.db.all(sql, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }

  async getTrashMaterials(userId) {
    return new Promise((resolve, reject) => {
      this.db.all(
        'SELECT * FROM materials WHERE user_id = ? AND is_deleted = 1 ORDER BY deleted_at DESC',
        [userId],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        }
      );
    });
  }

  async createMaterial(data) {
    return new Promise((resolve, reject) => {
      const { user_id, folder_type, file_name, file_path, file_size, file_type, thumbnail_path } = data;
      this.db.run(
        'INSERT INTO materials (user_id, folder_type, file_name, file_path, file_size, file_type, thumbnail_path) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [user_id, folder_type, file_name, file_path, file_size, file_type, thumbnail_path],
        function(err) {
          if (err) reject(err);
          else resolve({ id: this.lastID, ...data });
        }
      );
    });
  }

  async updateMaterial(id, data) {
    return new Promise((resolve, reject) => {
      const fields = [];
      const values = [];

      ['file_name', 'folder_type', 'usage_tag', 'viral_tag', 'title', 'description'].forEach(key => {
        if (data[key] !== undefined) {
          fields.push(`${key} = ?`);
          values.push(data[key]);
        }
      });

      if (fields.length === 0) {
        this.getMaterial(id).then(resolve).catch(reject);
        return;
      }

      fields.push('updated_at = CURRENT_TIMESTAMP');
      values.push(id);

      this.db.run(
        `UPDATE materials SET ${fields.join(', ')} WHERE id = ?`,
        values,
        async (err) => {
          if (err) reject(err);
          else resolve(await this.getMaterial(id));
        }
      );
    });
  }

  async deleteMaterial(id) {
    return new Promise((resolve, reject) => {
      this.db.run(
        'UPDATE materials SET is_deleted = 1, deleted_at = CURRENT_TIMESTAMP WHERE id = ?',
        [id],
        function(err) {
          if (err) reject(err);
          else resolve({ deleted: this.changes > 0 });
        }
      );
    });
  }

  async batchMoveToTrash(ids, userId) {
    return new Promise((resolve, reject) => {
      const placeholders = ids.map(() => '?').join(',');
      this.db.run(
        `UPDATE materials SET is_deleted = 1, deleted_at = CURRENT_TIMESTAMP WHERE id IN (${placeholders}) AND user_id = ?`,
        [...ids, userId],
        function(err) {
          if (err) reject(err);
          else resolve({ updated: this.changes });
        }
      );
    });
  }

  async batchRestore(ids, userId) {
    return new Promise((resolve, reject) => {
      const placeholders = ids.map(() => '?').join(',');
      this.db.run(
        `UPDATE materials SET is_deleted = 0, deleted_at = NULL WHERE id IN (${placeholders}) AND user_id = ?`,
        [...ids, userId],
        function(err) {
          if (err) reject(err);
          else resolve({ updated: this.changes });
        }
      );
    });
  }

  async batchDelete(ids, userId) {
    return new Promise((resolve, reject) => {
      const placeholders = ids.map(() => '?').join(',');
      this.db.all(
        `SELECT file_path, thumbnail_path FROM materials WHERE id IN (${placeholders}) AND user_id = ?`,
        [...ids, userId],
        (err, rows) => {
          if (err) {
            reject(err);
            return;
          }
          const filePaths = rows.map(r => r.file_path).filter(Boolean);
          const thumbnailPaths = rows.map(r => r.thumbnail_path).filter(Boolean);

          this.db.run(
            `DELETE FROM materials WHERE id IN (${placeholders}) AND user_id = ?`,
            [...ids, userId],
            function(err) {
              if (err) reject(err);
              else resolve({ deleted: this.changes, filePaths, thumbnailPaths });
            }
          );
        }
      );
    });
  }

  // Folder operations
  async getFolders(userId) {
    return new Promise((resolve, reject) => {
      this.db.all('SELECT * FROM folders WHERE user_id = ? ORDER BY name', [userId], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }

  async createFolder(userId, folderType, name) {
    return new Promise((resolve, reject) => {
      this.db.run(
        'INSERT INTO folders (user_id, folder_type, name) VALUES (?, ?, ?)',
        [userId, folderType, name],
        function(err) {
          if (err) reject(err);
          else resolve({ id: this.lastID, user_id: userId, folder_type: folderType, name });
        }
      );
    });
  }

  async updateFolder(id, name) {
    return new Promise((resolve, reject) => {
      this.db.run(
        'UPDATE folders SET name = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [name, id],
        async function(err) {
          if (err) reject(err);
          else {
            this.db.get('SELECT * FROM folders WHERE id = ?', [id], (err, row) => {
              if (err) reject(err);
              else resolve(row);
            });
          }
        }
      );
    });
  }

  async deleteFolder(id) {
    return new Promise((resolve, reject) => {
      this.db.run('DELETE FROM folders WHERE id = ?', [id], function(err) {
        if (err) reject(err);
        else resolve({ deleted: this.changes > 0 });
      });
    });
  }

  // Operation logs
  async createLog(data) {
    return new Promise((resolve, reject) => {
      const { user_id, action, target_type, target_id, details, ip_address } = data;
      this.db.run(
        'INSERT INTO operation_logs (user_id, action, target_type, target_id, details, ip_address) VALUES (?, ?, ?, ?, ?, ?)',
        [user_id, action, target_type, target_id, details, ip_address],
        function(err) {
          if (err) reject(err);
          else resolve({ id: this.lastID, ...data });
        }
      );
    });
  }

  async getLogs(filters = {}) {
    return new Promise((resolve, reject) => {
      let sql = 'SELECT * FROM operation_logs WHERE 1=1';
      const params = [];

      if (filters.user_id) {
        sql += ' AND user_id = ?';
        params.push(filters.user_id);
      }
      if (filters.action) {
        sql += ' AND action = ?';
        params.push(filters.action);
      }

      sql += ' ORDER BY created_at DESC LIMIT 100';

      this.db.all(sql, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }

  // Admin
  async getAllMaterials(filters = {}) {
    return new Promise((resolve, reject) => {
      let sql = 'SELECT m.*, u.username FROM materials m LEFT JOIN users u ON m.user_id = u.id WHERE 1=1';
      const params = [];

      if (filters.user_id) {
        sql += ' AND m.user_id = ?';
        params.push(filters.user_id);
      }

      sql += ' ORDER BY m.created_at DESC LIMIT 200';

      this.db.all(sql, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }

  async getStorageStats() {
    return new Promise((resolve, reject) => {
      this.db.all(
        `SELECT
           user_id,
           COUNT(*) as file_count,
           SUM(file_size) as total_size
         FROM materials
         WHERE is_deleted = 0
         GROUP BY user_id`,
        [],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        }
      );
    });
  }

  async batchCopy(ids, sourceUserId, targetUserId) {
    return new Promise((resolve, reject) => {
      const placeholders = ids.map(() => '?').join(',');
      this.db.all(
        `SELECT folder_type, file_name, file_path, file_size, file_type, thumbnail_path
         FROM materials WHERE id IN (${placeholders}) AND user_id = ?`,
        [...ids, sourceUserId],
        (err, rows) => {
          if (err) {
            reject(err);
            return;
          }

          let copied = 0;
          let completed = 0;

          rows.forEach((row) => {
            this.db.run(
              `INSERT INTO materials (user_id, folder_type, file_name, file_path, file_size, file_type, thumbnail_path)
               VALUES (?, ?, ?, ?, ?, ?, ?)`,
              [targetUserId, row.folder_type, row.file_name, row.file_path, row.file_size, row.file_type, row.thumbnail_path],
              (err) => {
                if (!err) copied++;
                completed++;
                if (completed === rows.length) {
                  resolve({ copied, total: rows.length });
                }
              }
            );
          });

          if (rows.length === 0) {
            resolve({ copied: 0, total: 0 });
          }
        }
      );
    });
  }

  async batchMove(ids, sourceUserId, targetUserId, targetFolder) {
    return new Promise((resolve, reject) => {
      const placeholders = ids.map(() => '?').join(',');
      this.db.run(
        `UPDATE materials SET user_id = ?, folder_type = ?, updated_at = CURRENT_TIMESTAMP
         WHERE id IN (${placeholders}) AND user_id = ?`,
        [targetUserId, targetFolder, ...ids, sourceUserId],
        function(err) {
          if (err) reject(err);
          else resolve({ moved: this.changes });
        }
      );
    });
  }

  // Get all trash materials (admin)
  async getAllTrashMaterials() {
    return new Promise((resolve, reject) => {
      this.db.all(
        'SELECT m.*, u.username FROM materials m LEFT JOIN users u ON m.user_id = u.id WHERE m.is_deleted = 1 ORDER BY m.deleted_at DESC',
        [],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        }
      );
    });
  }

  // Delete user and transfer materials
  async deleteUserAndTransferMaterials(userId, targetUserId = 1) {
    return new Promise((resolve, reject) => {
      this.db.serialize(() => {
        // 1. 统计要转移的素材数量
        this.db.get('SELECT COUNT(*) as count FROM materials WHERE user_id = ?', [userId], (err, row) => {
          if (err) { reject(err); return; }
          const count = row ? row.count : 0;

          // 2. 转移素材给目标用户
          this.db.run('UPDATE materials SET user_id = ? WHERE user_id = ?', [targetUserId, userId], (err) => {
            if (err) { reject(err); return; }

            // 3. 删除用户
            this.db.run('DELETE FROM users WHERE id = ?', [userId], function(err) {
              if (err) reject(err);
              else resolve({ deleted: this.changes > 0, transferredMaterials: count });
            });
          });
        });
      });
    });
  }

  // AI Settings operations
  async getAISettings() {
    return new Promise((resolve, reject) => {
      this.db.get('SELECT * FROM ai_settings WHERE id = ?', ['global'], (err, row) => {
        if (err) reject(err);
        else resolve(row || {
          api_url: '',
          api_key: '',
          model: '',
          title_prompt: '',
          description_prompt: '',
          safety_rules: '',
          replacement_words: ''
        });
      });
    });
  }

  async saveAISettings(settings) {
    return new Promise((resolve, reject) => {
      const { api_url, api_key, model, title_prompt, description_prompt, safety_rules, replacement_words } = settings;
      this.db.run(
        `INSERT OR REPLACE INTO ai_settings
         (id, api_url, api_key, model, title_prompt, description_prompt, safety_rules, replacement_words, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
        ['global', api_url || '', api_key || '', model || '', title_prompt || '', description_prompt || '', safety_rules || '', replacement_words || ''],
        function(err) {
          if (err) reject(err);
          else resolve({ success: true });
        }
      );
    });
  }
}

module.exports = new SQLiteDatabase();
