const fs = require('fs');
const path = require('path');
const AdmZip = require('adm-zip');
const cron = require('node-cron');
const config = require('../config');

const backupsDir = path.join(__dirname, '../../data/backups');
const dbDir = path.join(__dirname, '../../data/db');

// Ensure backups directory exists
if (!fs.existsSync(backupsDir)) {
  fs.mkdirSync(backupsDir, { recursive: true });
}

function getBackupId() {
  return new Date().toISOString().replace(/[:.]/g, '-');
}

function getBackupPath(backupId) {
  return path.join(backupsDir, `${backupId}.zip`);
}

async function createBackup() {
  const backupId = getBackupId();
  const backupPath = getBackupPath(backupId);

  const zip = new AdmZip();

  // Add database file
  const dbPath = path.join(dbDir, 'nas-materials.db');
  if (fs.existsSync(dbPath)) {
    zip.addLocalFile(dbPath, 'db');
  }

  // Add .env if it exists
  const envPath = path.join(__dirname, '../../.env');
  if (fs.existsSync(envPath)) {
    zip.addLocalFile(envPath);
  }

  // Save zip
  zip.writeZip(backupPath);

  // Cleanup old backups
  await cleanupOldBackups();

  const stats = fs.statSync(backupPath);
  return {
    id: backupId,
    path: backupPath,
    size: stats.size,
    createdAt: new Date().toISOString()
  };
}

async function listBackups() {
  if (!fs.existsSync(backupsDir)) {
    return [];
  }

  const files = fs.readdirSync(backupsDir);
  return files
    .filter(f => f.endsWith('.zip'))
    .map(f => {
      const backupPath = path.join(backupsDir, f);
      const stats = fs.statSync(backupPath);
      return {
        id: f.replace('.zip', ''),
        name: f,
        size: stats.size,
        createdAt: stats.mtime.toISOString()
      };
    })
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

async function deleteBackup(backupId) {
  const backupPath = getBackupPath(backupId);
  if (fs.existsSync(backupPath)) {
    fs.unlinkSync(backupPath);
    return { deleted: true };
  }
  return { deleted: false };
}

async function cleanupOldBackups() {
  const backups = await listBackups();
  const retentionDays = config.backup.retentionDays;
  const cutoffDate = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000);

  for (const backup of backups) {
    if (new Date(backup.createdAt) < cutoffDate) {
      await deleteBackup(backup.id);
    }
  }
}

function initScheduledBackup() {
  if (!config.backup.enabled) {
    console.log('Scheduled backups disabled');
    return;
  }

  console.log(`Scheduled backups enabled: ${config.backup.schedule}`);
  cron.schedule(config.backup.schedule, async () => {
    console.log('Running scheduled backup...');
    try {
      const backup = await createBackup();
      console.log(`Backup created: ${backup.id}`);
    } catch (err) {
      console.error('Backup failed:', err);
    }
  });
}

module.exports = {
  createBackup,
  listBackups,
  deleteBackup,
  getBackupPath,
  cleanupOldBackups,
  initScheduledBackup
};
