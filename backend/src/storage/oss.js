/**
 * Alibaba Cloud OSS storage implementation (placeholder)
 * This will be implemented in a future iteration
 */
const AbstractStorage = require('./abstract');

class OSSStorage extends AbstractStorage {
  constructor() {
    super();
    throw new Error('OSS storage not implemented yet. Use local storage for now.');
  }
}

module.exports = new OSSStorage();
