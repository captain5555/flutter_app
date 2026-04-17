const BaseModel = require('./BaseModel');

class LogModel extends BaseModel {
  async createLog(data) {
    const { user_id, action, target_type, target_id, details, ip_address } = data;
    const result = await this.run(
      'INSERT INTO operation_logs (user_id, action, target_type, target_id, details, ip_address) VALUES (?, ?, ?, ?, ?, ?)',
      [user_id, action, target_type, target_id, details, ip_address]
    );
    return { id: result.lastID, ...data };
  }

  async getLogs(filters = {}) {
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
    return await this.all(sql, params);
  }
}

module.exports = LogModel;
