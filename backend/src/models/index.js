const UserModel = require('./UserModel');
const MaterialModel = require('./MaterialModel');
const FolderModel = require('./FolderModel');
const LogModel = require('./LogModel');
const AISettingsModel = require('./AISettingsModel');

let models = null;

function initModels(db) {
  models = {
    user: new UserModel(db),
    material: new MaterialModel(db),
    folder: new FolderModel(db),
    log: new LogModel(db),
    aiSettings: new AISettingsModel(db)
  };
  return models;
}

function getModels() {
  return models;
}

module.exports = { initModels, getModels };
