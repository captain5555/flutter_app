const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');
const AbstractDatabase = require('./abstract');
const { initModels, getModels } = require('../models');

class SQLiteDatabase extends AbstractDatabase {
  constructor(dbPath) {
    super();
    const dataDir = path.join(__dirname, '../../data/db');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    this.dbPath = dbPath || path.join(dataDir, 'nas-materials.db');
    this.db = null;
    this.models = null;
  }

  async init() {
    return new Promise((resolve, reject) => {
      this.db = new sqlite3.Database(this.dbPath, (err) => {
        if (err) {
          reject(err);
        } else {
          this.models = initModels(this.db);
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
        if (err) {
          reject(err);
          return;
        }

        // Run migrations
        this._runMigrations().then(resolve).catch(reject);
      });
    });
  }

  async _runMigrations() {
    // Check if used_at column exists
    return new Promise((resolve, reject) => {
      this.db.all("PRAGMA table_info(materials)", (err, columns) => {
        if (err) {
          reject(err);
          return;
        }

        const hasUsedAt = columns.some(col => col.name === 'used_at');
        if (!hasUsedAt) {
          console.log('Adding used_at column to materials table...');
          this.db.run('ALTER TABLE materials ADD COLUMN used_at DATETIME', (err) => {
            if (err) {
              console.error('Failed to add used_at column:', err);
            } else {
              console.log('used_at column added successfully');
            }
            resolve();
          });
        } else {
          resolve();
        }
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

  // User operations - delegate to UserModel
  async getUser(id) { return this.models.user.getUser(id); }
  async getUserByUsername(username) { return this.models.user.getUserByUsername(username); }
  async createUser(data) { return this.models.user.createUser(data); }
  async updateUser(id, data) { return this.models.user.updateUser(id, data); }
  async deleteUser(id) { return this.models.user.deleteUser(id); }
  async getAllUsers() { return this.models.user.getAllUsers(); }
  async deleteUserAndTransferMaterials(userId, targetUserId = 1) {
    return this.models.user.deleteUserAndTransferMaterials(userId, targetUserId);
  }

  // Material operations - delegate to MaterialModel
  async getMaterial(id) { return this.models.material.getMaterial(id); }
  async getMaterials(userId, folderType, options = {}) {
    return this.models.material.getMaterials(userId, folderType, options);
  }
  async getTrashMaterials(userId) { return this.models.material.getTrashMaterials(userId); }
  async getAllTrashMaterials() { return this.models.material.getAllTrashMaterials(); }
  async getAllMaterials(filters = {}) { return this.models.material.getAllMaterials(filters); }
  async createMaterial(data) { return this.models.material.createMaterial(data); }
  async updateMaterial(id, data) { return this.models.material.updateMaterial(id, data); }
  async deleteMaterial(id) { return this.models.material.deleteMaterial(id); }
  async batchMoveToTrash(ids, userId) { return this.models.material.batchMoveToTrash(ids, userId); }
  async batchRestore(ids, userId) { return this.models.material.batchRestore(ids, userId); }
  async batchDelete(ids, userId) { return this.models.material.batchDelete(ids, userId); }
  async batchCopy(ids, sourceUserId, targetUserId) {
    return this.models.material.batchCopy(ids, sourceUserId, targetUserId);
  }
  async batchMove(ids, sourceUserId, targetUserId, targetFolder) {
    return this.models.material.batchMove(ids, sourceUserId, targetUserId, targetFolder);
  }
  async getStorageStats() { return this.models.material.getStorageStats(); }

  // Folder operations - delegate to FolderModel
  async getFolders(userId) { return this.models.folder.getFolders(userId); }
  async createFolder(userId, folderType, name) {
    return this.models.folder.createFolder(userId, folderType, name);
  }
  async updateFolder(id, name) { return this.models.folder.updateFolder(id, name); }
  async deleteFolder(id) { return this.models.folder.deleteFolder(id); }

  // Operation logs - delegate to LogModel
  async createLog(data) { return this.models.log.createLog(data); }
  async getLogs(filters = {}) { return this.models.log.getLogs(filters); }

  // AI Settings - delegate to AISettingsModel
  async getAISettings() { return this.models.aiSettings.getAISettings(); }
  async saveAISettings(settings) { return this.models.aiSettings.saveAISettings(settings); }
}

module.exports = new SQLiteDatabase();
