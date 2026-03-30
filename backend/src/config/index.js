require('dotenv').config();

module.exports = {
  port: process.env.PORT || 3001,
  nodeEnv: process.env.NODE_ENV || 'development',
  databaseType: process.env.DATABASE_TYPE || 'sqlite',
  storageType: process.env.STORAGE_TYPE || 'local',
  jwtSecret: process.env.JWT_SECRET || 'dev-secret-key',
  jwtExpiresIn: '24h',
  backup: {
    enabled: process.env.BACKUP_ENABLED !== 'false',
    schedule: process.env.BACKUP_SCHEDULE || '0 2 * * *',
    retentionDays: parseInt(process.env.BACKUP_RETENTION_DAYS) || 7
  },
  log: {
    retentionDays: parseInt(process.env.LOG_RETENTION_DAYS) || 90
  },
  cors: {
    origins: process.env.CORS_ORIGINS || '*'
  },
  oss: {
    accessKeyId: process.env.OSS_ACCESS_KEY_ID,
    accessKeySecret: process.env.OSS_ACCESS_KEY_SECRET,
    bucket: process.env.OSS_BUCKET,
    region: process.env.OSS_REGION
  },
  upload: {
    maxFileSize: {
      image: 50 * 1024 * 1024,
      video: 500 * 1024 * 1024
    },
    allowedTypes: {
      image: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
      video: ['video/mp4', 'video/quicktime', 'video/x-msvideo']
    }
  }
};
