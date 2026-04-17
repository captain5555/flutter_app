const BaseModel = require('./BaseModel');

class FolderModel extends BaseModel {
  async getFolders(userId) {
    return await this.all(
      'SELECT * FROM folders WHERE user_id = ? ORDER BY name',
      [userId]
    );
  }

  async createFolder(userId, folderType, name) {
    const result = await this.run(
      'INSERT INTO folders (user_id, folder_type, name) VALUES (?, ?, ?)',
      [userId, folderType, name]
    );
    return { id: result.lastID, user_id: userId, folder_type: folderType, name };
  }

  async updateFolder(id, name) {
    await this.run(
      'UPDATE folders SET name = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [name, id]
    );
    return await this.get('SELECT * FROM folders WHERE id = ?', [id]);
  }

  async deleteFolder(id) {
    const result = await this.run('DELETE FROM folders WHERE id = ?', [id]);
    return { deleted: result.changes > 0 };
  }
}

module.exports = FolderModel;
