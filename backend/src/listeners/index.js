const LogListener = require('./LogListener');

let logListener = null;

function initListeners() {
  logListener = new LogListener();
  return { logListener };
}

function getListeners() {
  return { logListener };
}

module.exports = { initListeners, getListeners };
