/**
 * PostgreSQL database implementation (placeholder)
 * This will be implemented in a future iteration
 */
const AbstractDatabase = require('./abstract');

class PostgresDatabase extends AbstractDatabase {
  constructor() {
    super();
    throw new Error('PostgreSQL not implemented yet. Use SQLite for now.');
  }
}

module.exports = new PostgresDatabase();
