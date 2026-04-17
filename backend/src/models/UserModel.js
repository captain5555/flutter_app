const bcrypt = require('bcrypt');
const BaseModel = require('./BaseModel');

class UserModel extends BaseModel {
  async getUser(id) {
    return await this.get(
      'SELECT id, username, role, created_at, updated_at FROM users WHERE id = ?',
      [id]
    );
  }

  async getUserByUsername(username) {
    return await this.get(
      'SELECT * FROM users WHERE username = ?',
      [username]
    );
  }

  async createUser(data) {
    const { username, password, role = 'user' } = data;

    if (!password) {
      const result = await this.run(
        'INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)',
        [username, '', role]
      );
      return { id: result.lastID, username, role };
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const result = await this.run(
      'INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)',
      [username, passwordHash, role]
    );
    return { id: result.lastID, username, role };
  }

  async updateUser(id, data) {
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
      return await this.getUser(id);
    }

    fields.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id);

    await this.run(
      `UPDATE users SET ${fields.join(', ')} WHERE id = ?`,
      values
    );
    return await this.getUser(id);
  }

  async deleteUser(id) {
    const result = await this.run('DELETE FROM users WHERE id = ?', [id]);
    return { deleted: result.changes > 0 };
  }

  async getAllUsers() {
    return await this.all(
      'SELECT id, username, role, created_at, updated_at FROM users ORDER BY created_at DESC',
      []
    );
  }

  async deleteUserAndTransferMaterials(userId, targetUserId = 1) {
    return new Promise((resolve, reject) => {
      this.db.serialize(async () => {
        try {
          const countRow = await this.get(
            'SELECT COUNT(*) as count FROM materials WHERE user_id = ?',
            [userId]
          );
          const count = countRow ? countRow.count : 0;

          await this.run(
            'UPDATE materials SET user_id = ? WHERE user_id = ?',
            [targetUserId, userId]
          );

          const result = await this.run(
            'DELETE FROM users WHERE id = ?',
            [userId]
          );

          resolve({ deleted: result.changes > 0, transferredMaterials: count });
        } catch (err) {
          reject(err);
        }
      });
    });
  }
}

module.exports = UserModel;
