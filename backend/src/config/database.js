const config = require('./index');
const { getModels } = require('../models');

let db;

if (config.databaseType === 'sqlite') {
  db = require('../db/sqlite');
} else if (config.databaseType === 'postgres') {
  db = require('../db/postgres');
} else {
  throw new Error(`Unsupported database type: ${config.databaseType}`);
}

// 导出 db（向后兼容）和 models
module.exports = db;
module.exports.models = getModels;
