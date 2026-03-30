/**
 * Database abstract interface
 * All database implementations must implement these methods
 */
class AbstractDatabase {
  // User operations
  async getUser(id) { throw new Error('Not implemented'); }
  async getUserByUsername(username) { throw new Error('Not implemented'); }
  async createUser(data) { throw new Error('Not implemented'); }
  async updateUser(id, data) { throw new Error('Not implemented'); }
  async deleteUser(id) { throw new Error('Not implemented'); }
  async getAllUsers() { throw new Error('Not implemented'); }

  // Material operations
  async getMaterial(id) { throw new Error('Not implemented'); }
  async getMaterials(userId, folderType, options = {}) { throw new Error('Not implemented'); }
  async getTrashMaterials(userId) { throw new Error('Not implemented'); }
  async createMaterial(data) { throw new Error('Not implemented'); }
  async updateMaterial(id, data) { throw new Error('Not implemented'); }
  async deleteMaterial(id) { throw new Error('Not implemented'); }
  async batchMoveToTrash(ids, userId) { throw new Error('Not implemented'); }
  async batchRestore(ids, userId) { throw new Error('Not implemented'); }
  async batchDelete(ids, userId) { throw new Error('Not implemented'); }
  async batchCopy(ids, sourceUserId, targetUserId) { throw new Error('Not implemented'); }
  async batchMove(ids, sourceUserId, targetUserId, targetFolder) { throw new Error('Not implemented'); }

  // Folder operations
  async getFolders(userId) { throw new Error('Not implemented'); }
  async createFolder(userId, folderType, name) { throw new Error('Not implemented'); }
  async updateFolder(id, name) { throw new Error('Not implemented'); }
  async deleteFolder(id) { throw new Error('Not implemented'); }

  // Operation logs
  async createLog(data) { throw new Error('Not implemented'); }
  async getLogs(filters = {}) { throw new Error('Not implemented'); }

  // Admin
  async getAllMaterials(filters = {}) { throw new Error('Not implemented'); }
  async getStorageStats() { throw new Error('Not implemented'); }

  // AI Settings
  async getAISettings() { throw new Error('Not implemented'); }
  async saveAISettings(settings) { throw new Error('Not implemented'); }

  // Initialization
  async init() { throw new Error('Not implemented'); }
  async close() { throw new Error('Not implemented'); }
}

module.exports = AbstractDatabase;
