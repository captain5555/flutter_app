const express = require('express');
const cors = require('cors');
const path = require('path');
const config = require('./config');
const db = require('./config/database');
const { initScheduledBackup } = require('./services/backup');
const { sendError } = require('./utils/helpers');
const { initListeners } = require('./listeners');
const { eventBus, events } = require('./events');

const app = express();

// Middleware
app.use(cors({
  origin: config.cors.origins === '*' ? true : config.cors.origins.split(',')
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Serve static files
const uploadsPath = path.join(__dirname, '../data/uploads');
app.use('/uploads', express.static(uploadsPath));

// Serve frontend
const frontendPath = path.join(__dirname, '../../frontend/public');
app.use(express.static(frontendPath));

// API Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/materials', require('./routes/materials'));
app.use('/api/folders', require('./routes/folders'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/ai', require('./routes/ai'));
app.use('/', require('./routes/system'));

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  sendError(res, err.message || 'Internal server error', 500);
});

// 404 handler for API
app.use('/api/*', (req, res) => {
  sendError(res, 'API endpoint not found', 404);
});

// Start server
async function startServer() {
  try {
    // Initialize database
    await db.init();
    console.log('Database initialized');

    // Initialize scheduled backups
    initScheduledBackup();

    // Initialize event listeners (Phase 3 - optional enhancement)
    initListeners();
    console.log('Event listeners initialized');

    // Emit system startup event
    eventBus.emit(events.SYSTEM_STARTUP, { timestamp: Date.now() });

    app.listen(config.port, () => {
      console.log(`Server running on port ${config.port}`);
      console.log(`Environment: ${config.nodeEnv}`);
      console.log(`Database: ${config.databaseType}`);
      console.log(`Storage: ${config.storageType}`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

startServer();
