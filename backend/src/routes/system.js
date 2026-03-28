const express = require('express');
const os = require('os');
const { sendSuccess } = require('../utils/helpers');

const router = express.Router();

// Health check
router.get('/health', (req, res) => {
  sendSuccess(res, {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Public health check without auth
router.get('/healthz', (req, res) => {
  res.json({ status: 'ok' });
});

module.exports = router;
