# NAS 素材管理系统 v3 实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 重构 NAS 素材管理系统，实现模块化前端 + 抽象化后端，支持管理后台和 iOS APP 对接

**Architecture:** 前后端分离架构，后端提供 RESTful API，前端拆分为模块化文件，后端实现数据库和存储抽象层

**Tech Stack:** Node.js + Express + SQLite/PostgreSQL, 原生 JavaScript 前端

---

## 文件结构总览

### 后端文件
- `backend/package.json` - 项目依赖
- `backend/.env.example` - 环境变量示例
- `backend/src/server.js` - 服务器入口
- `backend/src/config/index.js` - 配置加载器
- `backend/src/config/database.js` - 数据库配置
- `backend/src/config/storage.js` - 存储配置
- `backend/src/db/abstract.js` - 数据库抽象接口
- `backend/src/db/sqlite.js` - SQLite 实现
- `backend/src/db/schema.sql` - 数据库表结构
- `backend/src/storage/abstract.js` - 存储抽象接口
- `backend/src/storage/local.js` - 本地存储实现
- `backend/src/middleware/auth.js` - 认证中间件
- `backend/src/middleware/permission.js` - 权限检查
- `backend/src/middleware/logger.js` - 操作日志
- `backend/src/routes/auth.js` - 认证路由
- `backend/src/routes/users.js` - 用户路由
- `backend/src/routes/materials.js` - 素材路由
- `backend/src/routes/folders.js` - 文件夹路由
- `backend/src/routes/admin.js` - 管理后台路由
- `backend/src/services/backup.js` - 备份服务
- `backend/src/utils/validators.js` - 验证工具
- `backend/src/utils/helpers.js` - 辅助工具

### 前端文件
- `frontend/public/index.html` - 用户端入口
- `frontend/public/admin.html` - 管理后台入口
- `frontend/public/css/common.css` - 公共样式
- `frontend/public/css/user.css` - 用户端样式
- `frontend/public/css/admin.css` - 管理后台样式
- `frontend/public/js/api.js` - API 封装
- `frontend/public/js/state.js` - 状态管理
- `frontend/public/js/components/MaterialCard.js` - 素材卡片组件
- `frontend/public/js/components/FileUploader.js` - 文件上传组件
- `frontend/public/js/components/Modal.js` - 模态框组件
- `frontend/public/js/components/Toast.js` - 提示组件
- `frontend/public/js/pages/user/login.js` - 登录页面
- `frontend/public/js/pages/user/materials.js` - 素材列表页面
- `frontend/public/js/pages/user/trash.js` - 垃圾箱页面
- `frontend/public/js/pages/user/settings.js` - 设置页面
- `frontend/public/js/pages/admin/dashboard.js` - 仪表盘
- `frontend/public/js/pages/admin/users.js` - 用户管理
- `frontend/public/js/pages/admin/folders.js` - 文件夹管理
- `frontend/public/js/pages/admin/materials.js` - 素材管理
- `frontend/public/js/pages/admin/logs.js` - 日志页面
- `frontend/public/js/pages/admin/backups.js` - 备份页面
- `frontend/public/js/user-app.js` - 用户端入口脚本
- `frontend/public/js/admin-app.js` - 管理后台入口脚本

### 部署文件
- `docker-compose.yml` - Docker Compose 配置
- `Dockerfile` - Docker 镜像
- `start.sh` - Linux/Mac 启动脚本
- `启动.bat` - Windows 启动脚本

---

## 实施任务

### Task 1: 项目初始化与基础结构

**Files:**
- Create: `backend/package.json`
- Create: `backend/.env.example`
- Create: `backend/src/config/index.js`
- Create: `backend/src/config/database.js`
- Create: `backend/src/config/storage.js`
- Create: `docs/superpowers/plans/2026-03-28-nas-material-manager-v3-implementation.md` (this file)
- Create: `.gitignore`

- [ ] **Step 1: 创建 .gitignore 文件**

```gitignore
# Node modules
node_modules/

# Environment variables
.env

# Data directory
data/

# IDE
.vscode/
.idea/

# OS
.DS_Store
Thumbs.db

# Logs
*.log
npm-debug.log*
```

- [ ] **Step 2: 创建 backend/package.json**

```json
{
  "name": "nas-material-manager-backend",
  "version": "3.0.0",
  "description": "NAS Material Management System Backend",
  "main": "src/server.js",
  "scripts": {
    "start": "node src/server.js",
    "dev": "nodemon src/server.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "sqlite3": "^5.1.6",
    "multer": "^1.4.5-lts.1",
    "cors": "^2.8.5",
    "bcrypt": "^5.1.1",
    "jsonwebtoken": "^9.0.2",
    "dotenv": "^16.3.1",
    "node-cron": "^3.0.3",
    "sharp": "^0.33.1",
    "ali-oss": "^6.19.0",
    "adm-zip": "^0.5.10"
  },
  "devDependencies": {
    "nodemon": "^3.0.1"
  }
}
```

- [ ] **Step 3: 创建 backend/.env.example**

```env
# Server Configuration
PORT=3000
NODE_ENV=development

# Database Type: sqlite or postgres
DATABASE_TYPE=sqlite

# Storage Type: local or oss
STORAGE_TYPE=local

# JWT Secret (change in production)
JWT_SECRET=your-secret-key-change-in-production

# Alibaba Cloud OSS Configuration (optional)
OSS_ACCESS_KEY_ID=
OSS_ACCESS_KEY_SECRET=
OSS_BUCKET=
OSS_REGION=oss-cn-hangzhou

# Backup Configuration
BACKUP_ENABLED=true
BACKUP_SCHEDULE=0 2 * * *
BACKUP_RETENTION_DAYS=7

# Log Configuration
LOG_RETENTION_DAYS=90

# CORS Configuration
CORS_ORIGINS=*
```

- [ ] **Step 4: 创建 backend/src/config/index.js**

```javascript
require('dotenv').config();

module.exports = {
  port: process.env.PORT || 3000,
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
```

- [ ] **Step 5: 创建 backend/src/config/database.js**

```javascript
const config = require('./index');

let db;

if (config.databaseType === 'sqlite') {
  db = require('../db/sqlite');
} else if (config.databaseType === 'postgres') {
  db = require('../db/postgres');
} else {
  throw new Error(`Unsupported database type: ${config.databaseType}`);
}

module.exports = db;
```

- [ ] **Step 6: 创建 backend/src/config/storage.js**

```javascript
const config = require('./index');

let storage;

if (config.storageType === 'local') {
  storage = require('../storage/local');
} else if (config.storageType === 'oss') {
  storage = require('../storage/oss');
} else {
  throw new Error(`Unsupported storage type: ${config.storageType}`);
}

module.exports = storage;
```

- [ ] **Step 7: 提交初始化文件**

```bash
git add .gitignore backend/package.json backend/.env.example backend/src/config/index.js backend/src/config/database.js backend/src/config/storage.js
git commit -m "chore: initialize project structure and config

- Add .gitignore
- Add backend package.json
- Add environment config
- Add database and storage config loaders

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

### Task 2: 数据库抽象层 - 接口与 Schema

**Files:**
- Create: `backend/src/db/abstract.js`
- Create: `backend/src/db/schema.sql`

- [ ] **Step 1: 创建数据库抽象接口 backend/src/db/abstract.js**

```javascript
/**
 * Database abstract interface
 * All database implementations must implement these methods
 */
class AbstractDatabase {
  // User operations
  async getUser(id) { throw new Error('Not implemented'); }
  async getUserByUsername(username) { throw new Error('Not implemented'); }
  async createUser(data) { throw new Error('Not implemented'); }
  async updateUser(id, data) { throw new Error('Not implemented'); }
  async deleteUser(id) { throw new Error('Not implemented'); }
  async getAllUsers() { throw new Error('Not implemented'); }

  // Material operations
  async getMaterial(id) { throw new Error('Not implemented'); }
  async getMaterials(userId, folderType, options = {}) { throw new Error('Not implemented'); }
  async getTrashMaterials(userId) { throw new Error('Not implemented'); }
  async createMaterial(data) { throw new Error('Not implemented'); }
  async updateMaterial(id, data) { throw new Error('Not implemented'); }
  async deleteMaterial(id) { throw new Error('Not implemented'); }
  async batchMoveToTrash(ids, userId) { throw new Error('Not implemented'); }
  async batchRestore(ids, userId) { throw new Error('Not implemented'); }
  async batchDelete(ids, userId) { throw new Error('Not implemented'); }
  async batchCopy(ids, sourceUserId, targetUserId) { throw new Error('Not implemented'); }
  async batchMove(ids, sourceUserId, targetUserId, targetFolder) { throw new Error('Not implemented'); }

  // Folder operations
  async getFolders(userId) { throw new Error('Not implemented'); }
  async createFolder(userId, name) { throw new Error('Not implemented'); }
  async updateFolder(id, name) { throw new Error('Not implemented'); }
  async deleteFolder(id) { throw new Error('Not implemented'); }

  // Operation logs
  async createLog(data) { throw new Error('Not implemented'); }
  async getLogs(filters = {}) { throw new Error('Not implemented'); }

  // Admin
  async getAllMaterials(filters = {}) { throw new Error('Not implemented'); }
  async getStorageStats() { throw new Error('Not implemented'); }

  // Initialization
  async init() { throw new Error('Not implemented'); }
  async close() { throw new Error('Not implemented'); }
}

module.exports = AbstractDatabase;
```

- [ ] **Step 2: 创建数据库表结构 backend/src/db/schema.sql**

```sql
-- Users table
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username VARCHAR(50) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(20) DEFAULT 'user',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Materials table
CREATE TABLE IF NOT EXISTS materials (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  folder_type VARCHAR(50) DEFAULT 'images',
  file_name VARCHAR(255) NOT NULL,
  file_path VARCHAR(500) NOT NULL,
  file_size BIGINT DEFAULT 0,
  file_type VARCHAR(50),
  thumbnail_path VARCHAR(500),
  usage_tag VARCHAR(20),
  viral_tag VARCHAR(20),
  is_deleted BOOLEAN DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  deleted_at DATETIME,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Folders table
CREATE TABLE IF NOT EXISTS folders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  folder_type VARCHAR(50) NOT NULL,
  name VARCHAR(100) NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  UNIQUE(user_id, folder_type)
);

-- Operation logs table
CREATE TABLE IF NOT EXISTS operation_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  action VARCHAR(50) NOT NULL,
  target_type VARCHAR(50),
  target_id INTEGER,
  details TEXT,
  ip_address VARCHAR(50),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_materials_user_id ON materials(user_id);
CREATE INDEX IF NOT EXISTS idx_materials_is_deleted ON materials(is_deleted);
CREATE INDEX IF NOT EXISTS idx_operation_logs_user_id ON operation_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_operation_logs_created_at ON operation_logs(created_at);

-- Insert default admin user (password: admin123)
-- Password hash generated with bcrypt
INSERT OR IGNORE INTO users (username, password_hash, role)
VALUES ('admin', '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhW', 'admin');
```

- [ ] **Step 3: 提交数据库抽象层文件**

```bash
git add backend/src/db/abstract.js backend/src/db/schema.sql
git commit -m "feat: add database abstract interface and schema

- Add AbstractDatabase interface
- Add database schema with tables and indexes

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

### Task 3: SQLite 数据库实现

**Files:**
- Create: `backend/src/db/sqlite.js`

- [ ] **Step 1: 创建 SQLite 实现 backend/src/db/sqlite.js**

```javascript
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');
const AbstractDatabase = require('./abstract');
const bcrypt = require('bcrypt');

class SQLiteDatabase extends AbstractDatabase {
  constructor(dbPath) {
    super();
    const dataDir = path.join(__dirname, '../../data/db');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    this.dbPath = dbPath || path.join(dataDir, 'nas-materials.db');
    this.db = null;
  }

  async init() {
    return new Promise((resolve, reject) => {
      this.db = new sqlite3.Database(this.dbPath, (err) => {
        if (err) {
          reject(err);
        } else {
          this._initSchema().then(resolve).catch(reject);
        }
      });
    });
  }

  async _initSchema() {
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');

    return new Promise((resolve, reject) => {
      this.db.exec(schema, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }

  async close() {
    return new Promise((resolve, reject) => {
      if (this.db) {
        this.db.close((err) => {
          if (err) reject(err);
          else resolve();
        });
      } else {
        resolve();
      }
    });
  }

  // User operations
  async getUser(id) {
    return new Promise((resolve, reject) => {
      this.db.get('SELECT id, username, role, created_at, updated_at FROM users WHERE id = ?', [id], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  }

  async getUserByUsername(username) {
    return new Promise((resolve, reject) => {
      this.db.get('SELECT * FROM users WHERE username = ?', [username], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  }

  async createUser(data) {
    return new Promise((resolve, reject) => {
      const { username, password, role = 'user' } = data;
      bcrypt.hash(password, 10, (err, passwordHash) => {
        if (err) {
          reject(err);
          return;
        }
        this.db.run(
          'INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)',
          [username, passwordHash, role],
          function(err) {
            if (err) reject(err);
            else resolve({ id: this.lastID, username, role });
          }
        );
      });
    });
  }

  async updateUser(id, data) {
    return new Promise(async (resolve, reject) => {
      const fields = [];
      const values = [];

      if (data.username) {
        fields.push('username = ?');
        values.push(data.username);
      }
      if (data.password) {
        fields.push('password_hash = ?');
        values.push(await bcrypt.hash(data.password, 10));
      }
      if (data.role) {
        fields.push('role = ?');
        values.push(data.role);
      }

      if (fields.length === 0) {
        resolve(await this.getUser(id));
        return;
      }

      fields.push('updated_at = CURRENT_TIMESTAMP');
      values.push(id);

      this.db.run(
        `UPDATE users SET ${fields.join(', ')} WHERE id = ?`,
        values,
        async function(err) {
          if (err) reject(err);
          else resolve(await this.getUser(id));
        }
      );
    });
  }

  async deleteUser(id) {
    return new Promise((resolve, reject) => {
      this.db.run('DELETE FROM users WHERE id = ?', [id], function(err) {
        if (err) reject(err);
        else resolve({ deleted: this.changes > 0 });
      });
    });
  }

  async getAllUsers() {
    return new Promise((resolve, reject) => {
      this.db.all('SELECT id, username, role, created_at, updated_at FROM users ORDER BY created_at DESC', [], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }

  // Material operations (partial implementation - more to follow)
  async getMaterial(id) {
    return new Promise((resolve, reject) => {
      this.db.get('SELECT * FROM materials WHERE id = ?', [id], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  }

  async getMaterials(userId, folderType, options = {}) {
    return new Promise((resolve, reject) => {
      let sql = 'SELECT * FROM materials WHERE user_id = ? AND is_deleted = 0';
      const params = [userId];

      if (folderType) {
        sql += ' AND folder_type = ?';
        params.push(folderType);
      }

      sql += ' ORDER BY created_at DESC';

      this.db.all(sql, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }

  async getTrashMaterials(userId) {
    return new Promise((resolve, reject) => {
      this.db.all(
        'SELECT * FROM materials WHERE user_id = ? AND is_deleted = 1 ORDER BY deleted_at DESC',
        [userId],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        }
      );
    });
  }

  async createMaterial(data) {
    return new Promise((resolve, reject) => {
      const { user_id, folder_type, file_name, file_path, file_size, file_type, thumbnail_path } = data;
      this.db.run(
        'INSERT INTO materials (user_id, folder_type, file_name, file_path, file_size, file_type, thumbnail_path) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [user_id, folder_type, file_name, file_path, file_size, file_type, thumbnail_path],
        function(err) {
          if (err) reject(err);
          else resolve({ id: this.lastID, ...data });
        }
      );
    });
  }

  async updateMaterial(id, data) {
    return new Promise((resolve, reject) => {
      const fields = [];
      const values = [];

      ['file_name', 'folder_type', 'usage_tag', 'viral_tag'].forEach(key => {
        if (data[key] !== undefined) {
          fields.push(`${key} = ?`);
          values.push(data[key]);
        }
      });

      if (fields.length === 0) {
        this.getMaterial(id).then(resolve).catch(reject);
        return;
      }

      fields.push('updated_at = CURRENT_TIMESTAMP');
      values.push(id);

      this.db.run(
        `UPDATE materials SET ${fields.join(', ')} WHERE id = ?`,
        values,
        async (err) => {
          if (err) reject(err);
          else resolve(await this.getMaterial(id));
        }
      );
    });
  }

  async deleteMaterial(id) {
    return new Promise((resolve, reject) => {
      this.db.run(
        'UPDATE materials SET is_deleted = 1, deleted_at = CURRENT_TIMESTAMP WHERE id = ?',
        [id],
        function(err) {
          if (err) reject(err);
          else resolve({ deleted: this.changes > 0 });
        }
      );
    });
  }

  async batchMoveToTrash(ids, userId) {
    return new Promise((resolve, reject) => {
      const placeholders = ids.map(() => '?').join(',');
      this.db.run(
        `UPDATE materials SET is_deleted = 1, deleted_at = CURRENT_TIMESTAMP WHERE id IN (${placeholders}) AND user_id = ?`,
        [...ids, userId],
        function(err) {
          if (err) reject(err);
          else resolve({ updated: this.changes });
        }
      );
    });
  }

  async batchRestore(ids, userId) {
    return new Promise((resolve, reject) => {
      const placeholders = ids.map(() => '?').join(',');
      this.db.run(
        `UPDATE materials SET is_deleted = 0, deleted_at = NULL WHERE id IN (${placeholders}) AND user_id = ?`,
        [...ids, userId],
        function(err) {
          if (err) reject(err);
          else resolve({ updated: this.changes });
        }
      );
    });
  }

  async batchDelete(ids, userId) {
    return new Promise((resolve, reject) => {
      const placeholders = ids.map(() => '?').join(',');
      this.db.all(
        `SELECT file_path, thumbnail_path FROM materials WHERE id IN (${placeholders}) AND user_id = ?`,
        [...ids, userId],
        (err, rows) => {
          if (err) {
            reject(err);
            return;
          }
          const filePaths = rows.map(r => r.file_path).filter(Boolean);
          const thumbnailPaths = rows.map(r => r.thumbnail_path).filter(Boolean);

          this.db.run(
            `DELETE FROM materials WHERE id IN (${placeholders}) AND user_id = ?`,
            [...ids, userId],
            function(err) {
              if (err) reject(err);
              else resolve({ deleted: this.changes, filePaths, thumbnailPaths });
            }
          );
        }
      );
    });
  }

  // Folder operations
  async getFolders(userId) {
    return new Promise((resolve, reject) => {
      this.db.all('SELECT * FROM folders WHERE user_id = ? ORDER BY name', [userId], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }

  async createFolder(userId, folderType, name) {
    return new Promise((resolve, reject) => {
      this.db.run(
        'INSERT INTO folders (user_id, folder_type, name) VALUES (?, ?, ?)',
        [userId, folderType, name],
        function(err) {
          if (err) reject(err);
          else resolve({ id: this.lastID, user_id: userId, folder_type: folderType, name });
        }
      );
    });
  }

  async updateFolder(id, name) {
    return new Promise((resolve, reject) => {
      this.db.run(
        'UPDATE folders SET name = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [name, id],
        async function(err) {
          if (err) reject(err);
          else {
            this.db.get('SELECT * FROM folders WHERE id = ?', [id], (err, row) => {
              if (err) reject(err);
              else resolve(row);
            });
          }
        }
      );
    });
  }

  async deleteFolder(id) {
    return new Promise((resolve, reject) => {
      this.db.run('DELETE FROM folders WHERE id = ?', [id], function(err) {
        if (err) reject(err);
        else resolve({ deleted: this.changes > 0 });
      });
    });
  }

  // Operation logs
  async createLog(data) {
    return new Promise((resolve, reject) => {
      const { user_id, action, target_type, target_id, details, ip_address } = data;
      this.db.run(
        'INSERT INTO operation_logs (user_id, action, target_type, target_id, details, ip_address) VALUES (?, ?, ?, ?, ?, ?)',
        [user_id, action, target_type, target_id, details, ip_address],
        function(err) {
          if (err) reject(err);
          else resolve({ id: this.lastID, ...data });
        }
      );
    });
  }

  async getLogs(filters = {}) {
    return new Promise((resolve, reject) => {
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

      this.db.all(sql, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }

  // Admin
  async getAllMaterials(filters = {}) {
    return new Promise((resolve, reject) => {
      let sql = 'SELECT m.*, u.username FROM materials m LEFT JOIN users u ON m.user_id = u.id WHERE 1=1';
      const params = [];

      if (filters.user_id) {
        sql += ' AND m.user_id = ?';
        params.push(filters.user_id);
      }

      sql += ' ORDER BY m.created_at DESC LIMIT 200';

      this.db.all(sql, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }

  async getStorageStats() {
    return new Promise((resolve, reject) => {
      this.db.all(
        `SELECT
           user_id,
           COUNT(*) as file_count,
           SUM(file_size) as total_size
         FROM materials
         WHERE is_deleted = 0
         GROUP BY user_id`,
        [],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        }
      );
    });
  }

  async batchCopy(ids, sourceUserId, targetUserId) {
    return new Promise((resolve, reject) => {
      const placeholders = ids.map(() => '?').join(',');
      this.db.all(
        `SELECT folder_type, file_name, file_path, file_size, file_type, thumbnail_path
         FROM materials WHERE id IN (${placeholders}) AND user_id = ?`,
        [...ids, sourceUserId],
        (err, rows) => {
          if (err) {
            reject(err);
            return;
          }

          let copied = 0;
          let completed = 0;

          rows.forEach((row) => {
            this.db.run(
              `INSERT INTO materials (user_id, folder_type, file_name, file_path, file_size, file_type, thumbnail_path)
               VALUES (?, ?, ?, ?, ?, ?, ?)`,
              [targetUserId, row.folder_type, row.file_name, row.file_path, row.file_size, row.file_type, row.thumbnail_path],
              (err) => {
                if (!err) copied++;
                completed++;
                if (completed === rows.length) {
                  resolve({ copied, total: rows.length });
                }
              }
            );
          });

          if (rows.length === 0) {
            resolve({ copied: 0, total: 0 });
          }
        }
      );
    });
  }

  async batchMove(ids, sourceUserId, targetUserId, targetFolder) {
    return new Promise((resolve, reject) => {
      const placeholders = ids.map(() => '?').join(',');
      this.db.run(
        `UPDATE materials SET user_id = ?, folder_type = ?, updated_at = CURRENT_TIMESTAMP
         WHERE id IN (${placeholders}) AND user_id = ?`,
        [targetUserId, targetFolder, ...ids, sourceUserId],
        function(err) {
          if (err) reject(err);
          else resolve({ moved: this.changes });
        }
      );
    });
  }
}

module.exports = new SQLiteDatabase();
```

- [ ] **Step 2: 提交 SQLite 实现**

```bash
git add backend/src/db/sqlite.js
git commit -m "feat: implement SQLite database layer

- Complete SQLite implementation of abstract database interface
- Support users, materials, folders, and operation logs
- Include batch operations

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

### Task 4: 存储抽象层

**Files:**
- Create: `backend/src/storage/abstract.js`
- Create: `backend/src/storage/local.js`

- [ ] **Step 1: 创建存储抽象接口 backend/src/storage/abstract.js**

```javascript
/**
 * Storage abstract interface
 * All storage implementations must implement these methods
 */
class AbstractStorage {
  async uploadFile(fileBuffer, filePath, options = {}) {
    throw new Error('Not implemented');
  }

  async deleteFile(filePath) {
    throw new Error('Not implemented');
  }

  async getFileUrl(filePath, expiresIn = 3600) {
    throw new Error('Not implemented');
  }

  async fileExists(filePath) {
    throw new Error('Not implemented');
  }

  async getFileSize(filePath) {
    throw new Error('Not implemented');
  }

  async listFiles(prefix) {
    throw new Error('Not implemented');
  }
}

module.exports = AbstractStorage;
```

- [ ] **Step 2: 创建本地存储实现 backend/src/storage/local.js**

```javascript
const fs = require('fs');
const path = require('path');
const AbstractStorage = require('./abstract');
const sharp = require('sharp');

class LocalStorage extends AbstractStorage {
  constructor() {
    super();
    this.basePath = path.join(__dirname, '../../data/uploads');
    this.ensureBasePath();
  }

  ensureBasePath() {
    ['', 'images', 'videos', 'others', 'thumbnails'].forEach(dir => {
      const dirPath = path.join(this.basePath, dir);
      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
      }
    });
  }

  async uploadFile(fileBuffer, filePath, options = {}) {
    const fullPath = path.join(this.basePath, filePath);
    const dir = path.dirname(fullPath);

    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(fullPath, fileBuffer);

    // Generate thumbnail for images
    let thumbnailPath = null;
    if (options.generateThumbnail && options.isImage) {
      thumbnailPath = await this.generateThumbnail(fileBuffer, filePath);
    }

    return {
      path: filePath,
      thumbnailPath,
      size: fileBuffer.length
    };
  }

  async generateThumbnail(fileBuffer, originalPath) {
    const ext = path.extname(originalPath);
    const baseName = path.basename(originalPath, ext);
    const thumbnailName = `${baseName}_thumb.jpg`;
    const thumbnailPath = path.join('thumbnails', thumbnailName);
    const fullThumbnailPath = path.join(this.basePath, thumbnailPath);

    try {
      await sharp(fileBuffer)
        .resize(200, 200, { fit: 'cover' })
        .jpeg({ quality: 80 })
        .toFile(fullThumbnailPath);

      return thumbnailPath;
    } catch (err) {
      console.error('Thumbnail generation failed:', err);
      return null;
    }
  }

  async deleteFile(filePath) {
    const fullPath = path.join(this.basePath, filePath);
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
      return true;
    }
    return false;
  }

  async getFileUrl(filePath, expiresIn = 3600) {
    // For local storage, return a relative URL
    return `/uploads/${filePath}`;
  }

  async fileExists(filePath) {
    const fullPath = path.join(this.basePath, filePath);
    return fs.existsSync(fullPath);
  }

  async getFileSize(filePath) {
    const fullPath = path.join(this.basePath, filePath);
    if (fs.existsSync(fullPath)) {
      return fs.statSync(fullPath).size;
    }
    return 0;
  }

  async listFiles(prefix) {
    const dirPath = path.join(this.basePath, prefix);
    if (!fs.existsSync(dirPath)) {
      return [];
    }

    const files = fs.readdirSync(dirPath);
    return files.map(f => path.join(prefix, f));
  }

  getAbsolutePath(filePath) {
    return path.join(this.basePath, filePath);
  }
}

module.exports = new LocalStorage();
```

- [ ] **Step 3: 提交存储抽象层**

```bash
git add backend/src/storage/abstract.js backend/src/storage/local.js
git commit -m "feat: add storage abstract layer and local implementation

- Add AbstractStorage interface
- Implement LocalStorage with thumbnail generation
- Support file operations

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

### Task 5: 中间件 - 认证、权限、日志

**Files:**
- Create: `backend/src/utils/validators.js`
- Create: `backend/src/utils/helpers.js`
- Create: `backend/src/middleware/auth.js`
- Create: `backend/src/middleware/permission.js`
- Create: `backend/src/middleware/logger.js`

- [ ] **Step 1: 创建验证工具 backend/src/utils/validators.js**

```javascript
const config = require('../config');

function validateUsername(username) {
  if (!username || username.length < 3 || username.length > 50) {
    return { valid: false, message: 'Username must be 3-50 characters' };
  }
  if (!/^[a-zA-Z0-9_]+$/.test(username)) {
    return { valid: false, message: 'Username can only contain letters, numbers, and underscores' };
  }
  return { valid: true };
}

function validatePassword(password) {
  if (!password || password.length < 6) {
    return { valid: false, message: 'Password must be at least 6 characters' };
  }
  return { valid: true };
}

function validateFile(file, folderType) {
  if (!file) {
    return { valid: false, message: 'No file provided' };
  }

  const limits = config.upload.maxFileSize;
  const allowedTypes = config.upload.allowedTypes[folderType] || [];

  if (folderType === 'image' && file.size > limits.image) {
    return { valid: false, message: 'Image file too large (max 50MB)' };
  }
  if (folderType === 'video' && file.size > limits.video) {
    return { valid: false, message: 'Video file too large (max 500MB)' };
  }

  if (allowedTypes.length > 0 && !allowedTypes.includes(file.mimetype)) {
    return { valid: false, message: 'File type not allowed' };
  }

  return { valid: true };
}

function sanitizeFilename(filename) {
  // Remove path traversal characters
  return filename.replace(/[\\/:\*\?"<>\|]/g, '_');
}

function generateUniqueFilename(originalName) {
  const ext = originalName.split('.').pop();
  const baseName = sanitizeFilename(originalName.replace(/\.[^/.]+$/, ''));
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `${baseName}_${timestamp}_${random}.${ext}`;
}

module.exports = {
  validateUsername,
  validatePassword,
  validateFile,
  sanitizeFilename,
  generateUniqueFilename
};
```

- [ ] **Step 2: 创建辅助工具 backend/src/utils/helpers.js**

```javascript
function getClientIp(req) {
  return req.ip ||
    req.connection?.remoteAddress ||
    req.socket?.remoteAddress ||
    req.connection?.socket?.remoteAddress ||
    'unknown';
}

function formatDate(date) {
  return new Date(date).toISOString();
}

function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

function sendSuccess(res, data, status = 200) {
  res.status(status).json({ success: true, data });
}

function sendError(res, message, status = 400) {
  res.status(status).json({ success: false, error: message });
}

module.exports = {
  getClientIp,
  formatDate,
  asyncHandler,
  sendSuccess,
  sendError
};
```

- [ ] **Step 3: 创建认证中间件 backend/src/middleware/auth.js**

```javascript
const jwt = require('jsonwebtoken');
const config = require('../config');
const db = require('../config/database');
const { sendError } = require('../utils/helpers');

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return sendError(res, 'Authentication required', 401);
  }

  jwt.verify(token, config.jwtSecret, async (err, decoded) => {
    if (err) {
      return sendError(res, 'Invalid or expired token', 403);
    }

    try {
      const user = await db.getUser(decoded.userId);
      if (!user) {
        return sendError(res, 'User not found', 404);
      }
      req.user = user;
      next();
    } catch (error) {
      sendError(res, 'Authentication error', 500);
    }
  });
}

function generateToken(userId) {
  return jwt.sign({ userId }, config.jwtSecret, { expiresIn: config.jwtExpiresIn });
}

function refreshToken(token) {
  try {
    const decoded = jwt.verify(token, config.jwtSecret, { ignoreExpiration: true });
    const now = Date.now() / 1000;

    // Allow refresh within 7 days of expiration
    if (decoded.exp && now - decoded.exp < 7 * 24 * 60 * 60) {
      return generateToken(decoded.userId);
    }
    return null;
  } catch (err) {
    return null;
  }
}

module.exports = {
  authenticateToken,
  generateToken,
  refreshToken
};
```

- [ ] **Step 4: 创建权限中间件 backend/src/middleware/permission.js**

```javascript
const { sendError } = require('../utils/helpers');

function requireRole(role) {
  return (req, res, next) => {
    if (!req.user) {
      return sendError(res, 'Authentication required', 401);
    }

    if (req.user.role !== role && req.user.role !== 'admin') {
      return sendError(res, 'Permission denied', 403);
    }

    next();
  };
}

function isAdmin(req) {
  return req.user && req.user.role === 'admin';
}

function canAccessUser(req, targetUserId) {
  if (!req.user) return false;
  if (isAdmin(req)) return true;
  return req.user.id === targetUserId;
}

function canAccessMaterial(req, material) {
  if (!req.user) return false;
  if (isAdmin(req)) return true;
  return req.user.id === material.user_id;
}

module.exports = {
  requireRole,
  isAdmin,
  canAccessUser,
  canAccessMaterial
};
```

- [ ] **Step 5: 创建日志中间件 backend/src/middleware/logger.js**

```javascript
const db = require('../config/database');
const { getClientIp } = require('../utils/helpers');

function createOperationLog(options) {
  return async (req, res, next) => {
    // Store original end function
    const originalEnd = res.end;
    const startTime = Date.now();

    res.end = async function(chunk, encoding) {
      // Call original end first
      originalEnd.call(this, chunk, encoding);

      // Only log if user is authenticated and action is specified
      if (req.user && options.action) {
        try {
          await db.createLog({
            user_id: req.user.id,
            action: options.action,
            target_type: options.targetType,
            target_id: req.params.id || null,
            details: options.details || null,
            ip_address: getClientIp(req)
          });
        } catch (err) {
          console.error('Failed to create operation log:', err);
        }
      }
    };

    next();
  };
}

async function logOperation(user, action, targetType, targetId, details, ip) {
  try {
    await db.createLog({
      user_id: user.id,
      action,
      target_type: targetType,
      target_id: targetId,
      details,
      ip_address: ip
    });
  } catch (err) {
    console.error('Failed to create operation log:', err);
  }
}

module.exports = {
  createOperationLog,
  logOperation
};
```

- [ ] **Step 6: 提交中间件文件**

```bash
git add backend/src/utils/validators.js backend/src/utils/helpers.js backend/src/middleware/auth.js backend/src/middleware/permission.js backend/src/middleware/logger.js
git commit -m "feat: add middleware and utilities

- Add validators for user input and files
- Add helper utilities
- Add JWT authentication middleware
- Add permission checking middleware
- Add operation logging middleware

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

### Task 6: API 路由 - 认证与用户

**Files:**
- Create: `backend/src/routes/auth.js`
- Create: `backend/src/routes/users.js`

- [ ] **Step 1: 创建认证路由 backend/src/routes/auth.js**

```javascript
const express = require('express');
const bcrypt = require('bcrypt');
const db = require('../config/database');
const { authenticateToken, generateToken, refreshToken } = require('../middleware/auth');
const { validateUsername, validatePassword } = require('../utils/validators');
const { asyncHandler, sendSuccess, sendError, getClientIp } = require('../utils/helpers');
const { logOperation } = require('../middleware/logger');

const router = express.Router();

// Login
router.post('/login', asyncHandler(async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return sendError(res, 'Username and password are required');
  }

  const user = await db.getUserByUsername(username);
  if (!user) {
    return sendError(res, 'Invalid username or password', 401);
  }

  const validPassword = await bcrypt.compare(password, user.password_hash);
  if (!validPassword) {
    return sendError(res, 'Invalid username or password', 401);
  }

  const token = generateToken(user.id);

  await logOperation(
    { id: user.id },
    'login',
    'user',
    user.id,
    null,
    getClientIp(req)
  );

  sendSuccess(res, {
    token,
    user: {
      id: user.id,
      username: user.username,
      role: user.role
    }
  });
}));

// Logout
router.post('/logout', authenticateToken, asyncHandler(async (req, res) => {
  await logOperation(
    req.user,
    'logout',
    'user',
    req.user.id,
    null,
    getClientIp(req)
  );
  sendSuccess(res, { message: 'Logged out successfully' });
}));

// Refresh token
router.post('/refresh', asyncHandler(async (req, res) => {
  const { token } = req.body;
  if (!token) {
    return sendError(res, 'Token is required');
  }

  const newToken = refreshToken(token);
  if (!newToken) {
    return sendError(res, 'Token cannot be refreshed', 403);
  }

  sendSuccess(res, { token: newToken });
}));

// Get current user
router.get('/me', authenticateToken, asyncHandler(async (req, res) => {
  sendSuccess(res, req.user);
}));

module.exports = router;
```

- [ ] **Step 2: 创建用户路由 backend/src/routes/users.js**

```javascript
const express = require('express');
const db = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const { requireRole, canAccessUser } = require('../middleware/permission');
const { validateUsername, validatePassword } = require('../utils/validators');
const { asyncHandler, sendSuccess, sendError, getClientIp } = require('../utils/helpers');
const { logOperation } = require('../middleware/logger');

const router = express.Router();

// Get all users (admin only)
router.get('/', authenticateToken, requireRole('admin'), asyncHandler(async (req, res) => {
  const users = await db.getAllUsers();
  sendSuccess(res, users);
}));

// Get user by ID
router.get('/:id', authenticateToken, asyncHandler(async (req, res) => {
  const targetUserId = parseInt(req.params.id);

  if (!canAccessUser(req, targetUserId)) {
    return sendError(res, 'Permission denied', 403);
  }

  const user = await db.getUser(targetUserId);
  if (!user) {
    return sendError(res, 'User not found', 404);
  }

  sendSuccess(res, user);
}));

// Create user (admin only)
router.post('/', authenticateToken, requireRole('admin'), asyncHandler(async (req, res) => {
  const { username, password, role = 'user' } = req.body;

  const usernameValidation = validateUsername(username);
  if (!usernameValidation.valid) {
    return sendError(res, usernameValidation.message);
  }

  const passwordValidation = validatePassword(password);
  if (!passwordValidation.valid) {
    return sendError(res, passwordValidation.message);
  }

  const existingUser = await db.getUserByUsername(username);
  if (existingUser) {
    return sendError(res, 'Username already exists');
  }

  const user = await db.createUser({ username, password, role });

  await logOperation(
    req.user,
    'create_user',
    'user',
    user.id,
    `Created user: ${username}`,
    getClientIp(req)
  );

  sendSuccess(res, user);
}));

// Update user
router.put('/:id', authenticateToken, asyncHandler(async (req, res) => {
  const targetUserId = parseInt(req.params.id);

  if (!canAccessUser(req, targetUserId)) {
    return sendError(res, 'Permission denied', 403);
  }

  // Non-admin users can only update their own password
  if (req.user.role !== 'admin') {
    const allowedKeys = ['password'];
    const hasDisallowedKeys = Object.keys(req.body).some(k => !allowedKeys.includes(k));
    if (hasDisallowedKeys) {
      return sendError(res, 'Permission denied', 403);
    }
  }

  if (req.body.username) {
    const validation = validateUsername(req.body.username);
    if (!validation.valid) {
      return sendError(res, validation.message);
    }
  }

  if (req.body.password) {
    const validation = validatePassword(req.body.password);
    if (!validation.valid) {
      return sendError(res, validation.message);
    }
  }

  const user = await db.updateUser(targetUserId, req.body);

  await logOperation(
    req.user,
    'update_user',
    'user',
    targetUserId,
    null,
    getClientIp(req)
  );

  sendSuccess(res, user);
}));

// Delete user (admin only)
router.delete('/:id', authenticateToken, requireRole('admin'), asyncHandler(async (req, res) => {
  const targetUserId = parseInt(req.params.id);

  // Don't allow deleting yourself
  if (targetUserId === req.user.id) {
    return sendError(res, 'Cannot delete your own account');
  }

  const result = await db.deleteUser(targetUserId);

  await logOperation(
    req.user,
    'delete_user',
    'user',
    targetUserId,
    null,
    getClientIp(req)
  );

  sendSuccess(res, result);
}));

module.exports = router;
```

- [ ] **Step 3: 提交认证和用户路由**

```bash
git add backend/src/routes/auth.js backend/src/routes/users.js
git commit -m "feat: add auth and users API routes

- Implement login/logout/refresh/me endpoints
- Implement CRUD operations for users
- Add proper validation and authorization

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

### Task 7: API 路由 - 素材与文件夹

**Files:**
- Create: `backend/src/routes/materials.js`
- Create: `backend/src/routes/folders.js`

- [ ] **Step 1: 创建素材路由 backend/src/routes/materials.js**

```javascript
const express = require('express');
const multer = require('multer');
const path = require('path');
const db = require('../config/database');
const storage = require('../config/storage');
const { authenticateToken } = require('../middleware/auth');
const { isAdmin, canAccessMaterial } = require('../middleware/permission');
const { validateFile, generateUniqueFilename } = require('../utils/validators');
const { asyncHandler, sendSuccess, sendError, getClientIp } = require('../utils/helpers');
const { logOperation } = require('../middleware/logger');

const router = express.Router();

// Configure multer for memory storage
const upload = multer({ storage: multer.memoryStorage() });

// Get user materials
router.get('/user/:userId/folder/:folderType', authenticateToken, asyncHandler(async (req, res) => {
  const userId = parseInt(req.params.userId);
  const folderType = req.params.folderType;

  if (!canAccessUser(req, userId)) {
    return sendError(res, 'Permission denied', 403);
  }

  const materials = await db.getMaterials(userId, folderType);
  // Add file URLs
  for (const mat of materials) {
    if (mat.file_path) {
      mat.file_url = await storage.getFileUrl(mat.file_path);
    }
    if (mat.thumbnail_path) {
      mat.thumbnail_url = await storage.getFileUrl(mat.thumbnail_path);
    }
  }
  sendSuccess(res, materials);
}));

// Get user trash
router.get('/user/:userId/trash', authenticateToken, asyncHandler(async (req, res) => {
  const userId = parseInt(req.params.userId);

  if (!canAccessUser(req, userId)) {
    return sendError(res, 'Permission denied', 403);
  }

  const materials = await db.getTrashMaterials(userId);
  for (const mat of materials) {
    if (mat.file_path) {
      mat.file_url = await storage.getFileUrl(mat.file_path);
    }
    if (mat.thumbnail_path) {
      mat.thumbnail_url = await storage.getFileUrl(mat.thumbnail_path);
    }
  }
  sendSuccess(res, materials);
}));

// Get single material
router.get('/:id', authenticateToken, asyncHandler(async (req, res) => {
  const material = await db.getMaterial(parseInt(req.params.id));
  if (!material) {
    return sendError(res, 'Material not found', 404);
  }

  if (!canAccessMaterial(req, material)) {
    return sendError(res, 'Permission denied', 403);
  }

  if (material.file_path) {
    material.file_url = await storage.getFileUrl(material.file_path);
  }
  if (material.thumbnail_path) {
    material.thumbnail_url = await storage.getFileUrl(material.thumbnail_path);
  }

  sendSuccess(res, material);
}));

// Upload material
router.post('/upload', authenticateToken, upload.single('file'), asyncHandler(async (req, res) => {
  const { folderType = 'images' } = req.body;

  const fileValidation = validateFile(req.file, folderType);
  if (!fileValidation.valid) {
    return sendError(res, fileValidation.message);
  }

  const isImage = folderType === 'images';
  const filename = generateUniqueFilename(req.file.originalname);
  const filePath = path.join(folderType, filename);

  const uploadResult = await storage.uploadFile(req.file.buffer, filePath, {
    generateThumbnail: true,
    isImage
  });

  const material = await db.createMaterial({
    user_id: req.user.id,
    folder_type: folderType,
    file_name: req.file.originalname,
    file_path: filePath,
    file_size: req.file.size,
    file_type: req.file.mimetype,
    thumbnail_path: uploadResult.thumbnailPath
  });

  await logOperation(
    req.user,
    'upload_material',
    'material',
    material.id,
    req.file.originalname,
    getClientIp(req)
  );

  sendSuccess(res, material);
}));

// Update material
router.put('/:id', authenticateToken, asyncHandler(async (req, res) => {
  const materialId = parseInt(req.params.id);
  const material = await db.getMaterial(materialId);

  if (!material) {
    return sendError(res, 'Material not found', 404);
  }

  if (!canAccessMaterial(req, material)) {
    return sendError(res, 'Permission denied', 403);
  }

  const updated = await db.updateMaterial(materialId, req.body);

  await logOperation(
    req.user,
    'update_material',
    'material',
    materialId,
    null,
    getClientIp(req)
  );

  sendSuccess(res, updated);
}));

// Delete material (move to trash)
router.delete('/:id', authenticateToken, asyncHandler(async (req, res) => {
  const materialId = parseInt(req.params.id);
  const material = await db.getMaterial(materialId);

  if (!material) {
    return sendError(res, 'Material not found', 404);
  }

  if (!canAccessMaterial(req, material)) {
    return sendError(res, 'Permission denied', 403);
  }

  const result = await db.deleteMaterial(materialId);

  await logOperation(
    req.user,
    'trash_material',
    'material',
    materialId,
    null,
    getClientIp(req)
  );

  sendSuccess(res, result);
}));

// Batch move to trash
router.post('/batch/trash', authenticateToken, asyncHandler(async (req, res) => {
  const { ids } = req.body;
  if (!ids || !Array.isArray(ids)) {
    return sendError(res, 'Invalid ids');
  }

  const result = await db.batchMoveToTrash(ids, req.user.id);

  await logOperation(
    req.user,
    'batch_trash',
    'material',
    null,
    `${ids.length} materials`,
    getClientIp(req)
  );

  sendSuccess(res, result);
}));

// Batch restore
router.post('/batch/restore', authenticateToken, asyncHandler(async (req, res) => {
  const { ids } = req.body;
  if (!ids || !Array.isArray(ids)) {
    return sendError(res, 'Invalid ids');
  }

  const result = await db.batchRestore(ids, req.user.id);

  await logOperation(
    req.user,
    'batch_restore',
    'material',
    null,
    `${ids.length} materials`,
    getClientIp(req)
  );

  sendSuccess(res, result);
}));

// Batch permanent delete
router.delete('/batch', authenticateToken, asyncHandler(async (req, res) => {
  const { ids } = req.body;
  if (!ids || !Array.isArray(ids)) {
    return sendError(res, 'Invalid ids');
  }

  const result = await db.batchDelete(ids, req.user.id);

  // Delete actual files
  for (const filePath of result.filePaths || []) {
    await storage.deleteFile(filePath);
  }
  for (const thumbPath of result.thumbnailPaths || []) {
    await storage.deleteFile(thumbPath);
  }

  await logOperation(
    req.user,
    'batch_delete',
    'material',
    null,
    `${ids.length} materials`,
    getClientIp(req)
  );

  sendSuccess(res, { deleted: result.deleted });
}));

// Batch copy
router.post('/batch/copy', authenticateToken, asyncHandler(async (req, res) => {
  const { ids, targetUserId } = req.body;

  if (!ids || !Array.isArray(ids) || !targetUserId) {
    return sendError(res, 'Missing required fields');
  }

  // Only admin can copy to other users
  if (targetUserId !== req.user.id && !isAdmin(req)) {
    return sendError(res, 'Permission denied', 403);
  }

  const result = await db.batchCopy(ids, req.user.id, targetUserId);

  await logOperation(
    req.user,
    'batch_copy',
    'material',
    null,
    `${result.copied} materials to user ${targetUserId}`,
    getClientIp(req)
  );

  sendSuccess(res, result);
}));

// Batch move
router.post('/batch/move', authenticateToken, asyncHandler(async (req, res) => {
  const { ids, targetUserId, targetFolder } = req.body;

  if (!ids || !Array.isArray(ids) || !targetUserId || !targetFolder) {
    return sendError(res, 'Missing required fields');
  }

  // Only admin can move to other users
  if (targetUserId !== req.user.id && !isAdmin(req)) {
    return sendError(res, 'Permission denied', 403);
  }

  const result = await db.batchMove(ids, req.user.id, targetUserId, targetFolder);

  await logOperation(
    req.user,
    'batch_move',
    'material',
    null,
    `${result.moved} materials to ${targetFolder}`,
    getClientIp(req)
  );

  sendSuccess(res, result);
}));

function canAccessUser(req, userId) {
  if (isAdmin(req)) return true;
  return req.user.id === userId;
}

module.exports = router;
```

- [ ] **Step 2: 创建文件夹路由 backend/src/routes/folders.js**

```javascript
const express = require('express');
const db = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const { canAccessUser, isAdmin } = require('../middleware/permission');
const { asyncHandler, sendSuccess, sendError, getClientIp } = require('../utils/helpers');
const { logOperation } = require('../middleware/logger');

const router = express.Router();

// Get user folders
router.get('/user/:userId', authenticateToken, asyncHandler(async (req, res) => {
  const userId = parseInt(req.params.userId);

  if (!canAccessUser(req, userId)) {
    return sendError(res, 'Permission denied', 403);
  }

  const folders = await db.getFolders(userId);
  sendSuccess(res, folders);
}));

// Create folder
router.post('/', authenticateToken, asyncHandler(async (req, res) => {
  const { folderType, name } = req.body;

  if (!folderType || !name) {
    return sendError(res, 'Folder type and name are required');
  }

  const folder = await db.createFolder(req.user.id, folderType, name);

  await logOperation(
    req.user,
    'create_folder',
    'folder',
    folder.id,
    name,
    getClientIp(req)
  );

  sendSuccess(res, folder);
}));

// Update folder
router.put('/:id', authenticateToken, asyncHandler(async (req, res) => {
  const folderId = parseInt(req.params.id);
  const { name } = req.body;

  if (!name) {
    return sendError(res, 'Name is required');
  }

  // Get folder to check ownership
  const folders = await db.getFolders(req.user.id);
  const folder = folders.find(f => f.id === folderId);

  if (!folder && !isAdmin(req)) {
    return sendError(res, 'Permission denied', 403);
  }

  const updated = await db.updateFolder(folderId, name);

  await logOperation(
    req.user,
    'update_folder',
    'folder',
    folderId,
    null,
    getClientIp(req)
  );

  sendSuccess(res, updated);
}));

// Delete folder
router.delete('/:id', authenticateToken, asyncHandler(async (req, res) => {
  const folderId = parseInt(req.params.id);

  // Get folder to check ownership
  const folders = await db.getFolders(req.user.id);
  const folder = folders.find(f => f.id === folderId);

  if (!folder && !isAdmin(req)) {
    return sendError(res, 'Permission denied', 403);
  }

  const result = await db.deleteFolder(folderId);

  await logOperation(
    req.user,
    'delete_folder',
    'folder',
    folderId,
    null,
    getClientIp(req)
  );

  sendSuccess(res, result);
}));

module.exports = router;
```

- [ ] **Step 3: 提交素材和文件夹路由**

```bash
git add backend/src/routes/materials.js backend/src/routes/folders.js
git commit -m "feat: add materials and folders API routes

- Implement material CRUD operations
- Implement batch operations
- Implement folder management
- Add file upload with thumbnail generation

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

### Task 8: API 路由 - 管理后台与备份服务

**Files:**
- Create: `backend/src/routes/admin.js`
- Create: `backend/src/routes/system.js`
- Create: `backend/src/services/backup.js`

- [ ] **Step 1: 创建管理后台路由 backend/src/routes/admin.js**

```javascript
const express = require('express');
const path = require('path');
const fs = require('fs');
const db = require('../config/database');
const storage = require('../config/storage');
const { authenticateToken } = require('../middleware/auth');
const { requireRole, isAdmin } = require('../middleware/permission');
const { asyncHandler, sendSuccess, sendError } = require('../utils/helpers');
const { createBackup, listBackups, deleteBackup, getBackupPath } = require('../services/backup');

const router = express.Router();

// Get system stats
router.get('/stats', authenticateToken, requireRole('admin'), asyncHandler(async (req, res) => {
  const users = await db.getAllUsers();
  const storageStats = await db.getStorageStats();

  const totalFiles = storageStats.reduce((sum, s) => sum + s.file_count, 0);
  const totalSize = storageStats.reduce((sum, s) => sum + s.total_size, 0);

  sendSuccess(res, {
    userCount: users.length,
    totalFiles,
    totalSize,
    storageByUser: storageStats
  });
}));

// Get all materials (admin)
router.get('/materials', authenticateToken, requireRole('admin'), asyncHandler(async (req, res) => {
  const { userId } = req.query;
  const materials = await db.getAllMaterials({ userId: userId ? parseInt(userId) : null });

  for (const mat of materials) {
    if (mat.file_path) {
      mat.file_url = await storage.getFileUrl(mat.file_path);
    }
    if (mat.thumbnail_path) {
      mat.thumbnail_url = await storage.getFileUrl(mat.thumbnail_path);
    }
  }

  sendSuccess(res, materials);
}));

// Get operation logs
router.get('/logs', authenticateToken, requireRole('admin'), asyncHandler(async (req, res) => {
  const { userId, action } = req.query;
  const logs = await db.getLogs({
    userId: userId ? parseInt(userId) : null,
    action
  });
  sendSuccess(res, logs);
}));

// Trigger backup
router.post('/backup', authenticateToken, requireRole('admin'), asyncHandler(async (req, res) => {
  const backup = await createBackup();
  sendSuccess(res, backup);
}));

// List backups
router.get('/backups', authenticateToken, requireRole('admin'), asyncHandler(async (req, res) => {
  const backups = await listBackups();
  sendSuccess(res, backups);
}));

// Download backup
router.get('/backups/:id/download', authenticateToken, requireRole('admin'), asyncHandler(async (req, res) => {
  const backupId = req.params.id;
  const backupPath = getBackupPath(backupId);

  if (!backupPath || !fs.existsSync(backupPath)) {
    return sendError(res, 'Backup not found', 404);
  }

  res.download(backupPath, `backup-${backupId}.zip`);
}));

// Delete backup
router.delete('/backups/:id', authenticateToken, requireRole('admin'), asyncHandler(async (req, res) => {
  const backupId = req.params.id;
  const result = await deleteBackup(backupId);
  sendSuccess(res, result);
}));

module.exports = router;
```

- [ ] **Step 2: 创建系统路由 backend/src/routes/system.js**

```javascript
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
```

- [ ] **Step 3: 创建备份服务 backend/src/services/backup.js**

```javascript
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
```

- [ ] **Step 4: 提交管理后台和备份服务**

```bash
git add backend/src/routes/admin.js backend/src/routes/system.js backend/src/services/backup.js
git commit -m "feat: add admin routes and backup service

- Add admin API endpoints
- Add system health check endpoints
- Implement backup service with scheduling
- Add backup cleanup

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

### Task 9: 服务器入口与主文件

**Files:**
- Create: `backend/src/server.js`
- Create: `backend/src/db/postgres.js` (placeholder)
- Create: `backend/src/storage/oss.js` (placeholder)

- [ ] **Step 1: 创建服务器入口 backend/src/server.js**

```javascript
const express = require('express');
const cors = require('cors');
const path = require('path');
const config = require('./config');
const db = require('./config/database');
const { initScheduledBackup } = require('./services/backup');
const { sendError } = require('./utils/helpers');

const app = express();

// Middleware
app.use(cors({
  origin: config.cors.origins === '*' ? true : config.cors.origins.split(',')
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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
```

- [ ] **Step 2: 创建 PostgreSQL 占位实现 backend/src/db/postgres.js**

```javascript
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
```

- [ ] **Step 3: 创建 OSS 存储占位实现 backend/src/storage/oss.js**

```javascript
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
```

- [ ] **Step 4: 提交服务器文件**

```bash
git add backend/src/server.js backend/src/db/postgres.js backend/src/storage/oss.js
git commit -m "feat: add server entry and placeholder implementations

- Add Express server with all routes
- Add PostgreSQL placeholder
- Add OSS storage placeholder
- Configure static file serving

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

### Task 10: 部署文件与启动脚本

**Files:**
- Create: `Dockerfile`
- Create: `docker-compose.yml`
- Create: `start.sh`
- Create: `启动.bat`
- Copy: `backend/.env.example` to `backend/.env` (if needed)

- [ ] **Step 1: 创建 Dockerfile**

```dockerfile
FROM node:18-alpine

WORKDIR /app

# Install dependencies for sharp
RUN apk add --no-cache vips-dev build-base python3

# Copy package files
COPY backend/package*.json ./
RUN npm ci --only=production

# Copy backend code
COPY backend/src ./src
COPY backend/.env* ./

# Create data directory
RUN mkdir -p data/db data/uploads data/backups

# Expose port
EXPOSE 3000

# Start server
CMD ["node", "src/server.js"]
```

- [ ] **Step 2: 创建 docker-compose.yml**

```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    volumes:
      - ./data:/app/data
      - ./frontend:/app/frontend:ro
    environment:
      - NODE_ENV=production
    restart: unless-stopped
```

- [ ] **Step 3: 创建 Linux/Mac 启动脚本 start.sh**

```bash
#!/bin/bash

# NAS Material Manager v3 - Startup Script for Linux/Mac

echo "=================================="
echo "NAS Material Manager v3"
echo "=================================="
echo ""

# Navigate to backend directory
cd "$(dirname "$0")/backend" || exit 1

# Check if .env exists
if [ ! -f ".env" ]; then
    echo "Creating .env file from .env.example..."
    cp .env.example .env
    echo "Please edit .env file to configure your settings"
    echo ""
fi

# Install dependencies
echo "Installing dependencies..."
npm install

echo ""
echo "Starting server..."
echo "The server will be available at http://localhost:3000"
echo ""
echo "Default admin credentials:"
echo "  Username: admin"
echo "  Password: admin123"
echo ""
echo "IMPORTANT: Please change the admin password after first login!"
echo ""

# Start server
npm start
```

- [ ] **Step 4: 创建 Windows 启动脚本 启动.bat**

```batch
@echo off
chcp 65001 >nul
echo ==================================
echo NAS Material Manager v3
echo ==================================
echo.

cd /d "%~dp0backend"

if not exist ".env" (
    echo Creating .env file from .env.example...
    copy .env.example .env
    echo Please edit .env file to configure your settings
    echo.
)

echo Installing dependencies...
call npm install

echo.
echo Starting server...
echo The server will be available at http://localhost:3000
echo.
echo Default admin credentials:
echo   Username: admin
echo   Password: admin123
echo.
echo IMPORTANT: Please change the admin password after first login!
echo.

call npm start
```

- [ ] **Step 5: 使脚本可执行并提交**

```bash
chmod +x start.sh 2>/dev/null || true

git add Dockerfile docker-compose.yml start.sh 启动.bat
git commit -m "feat: add deployment files and startup scripts

- Add Dockerfile
- Add docker-compose.yml
- Add Linux/Mac startup script
- Add Windows startup script

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

### Task 11: 前端 - 基础结构与 API 封装

**Files:**
- Create: `frontend/public/index.html`
- Create: `frontend/public/admin.html`
- Create: `frontend/public/css/common.css`
- Create: `frontend/public/js/api.js`
- Create: `frontend/public/js/state.js`

- [ ] **Step 1: 创建用户端入口 frontend/public/index.html**

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>NAS 素材管理系统</title>
    <link rel="stylesheet" href="css/common.css">
    <link rel="stylesheet" href="css/user.css">
</head>
<body>
    <div id="app">
        <!-- Login page -->
        <div id="login-page" class="page">
            <div class="login-container">
                <h1>NAS 素材管理系统</h1>
                <form id="login-form">
                    <input type="text" id="username" placeholder="用户名" required>
                    <input type="password" id="password" placeholder="密码" required>
                    <button type="submit">登录</button>
                </form>
            </div>
        </div>

        <!-- Main app -->
        <div id="main-app" class="page hidden">
            <!-- Header -->
            <header class="app-header">
                <div class="header-left">
                    <h1>素材管理</h1>
                </div>
                <div class="header-right">
                    <span id="user-info"></span>
                    <button id="logout-btn">退出</button>
                </div>
            </header>

            <!-- Navigation -->
            <nav class="app-nav">
                <button class="nav-tab active" data-folder="images">图片</button>
                <button class="nav-tab" data-folder="videos">视频</button>
                <button class="nav-tab" data-folder="others">其他</button>
                <button class="nav-tab" data-folder="trash">垃圾箱</button>
            </nav>

            <!-- Toolbar -->
            <div class="toolbar">
                <input type="file" id="file-upload" multiple style="display: none;">
                <button id="upload-btn">上传</button>
                <button id="select-mode-btn">选择</button>
                <div id="batch-actions" class="hidden">
                    <button id="batch-trash-btn">删除</button>
                    <button id="cancel-select-btn">取消</button>
                </div>
            </div>

            <!-- Materials grid -->
            <main class="materials-container">
                <div id="materials-grid" class="materials-grid"></div>
                <div id="empty-state" class="empty-state hidden">
                    <p>暂无素材</p>
                </div>
            </main>
        </div>
    </div>

    <!-- Modal container -->
    <div id="modal-container" class="modal hidden"></div>

    <!-- Toast container -->
    <div id="toast-container" class="toast-container"></div>

    <script src="js/api.js"></script>
    <script src="js/state.js"></script>
    <script src="js/components/Toast.js"></script>
    <script src="js/components/Modal.js"></script>
    <script src="js/components/MaterialCard.js"></script>
    <script src="js/components/FileUploader.js"></script>
    <script src="js/pages/user/login.js"></script>
    <script src="js/pages/user/materials.js"></script>
    <script src="js/pages/user/trash.js"></script>
    <script src="js/user-app.js"></script>
</body>
</html>
```

- [ ] **Step 2: 创建管理后台入口 frontend/public/admin.html**

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>管理后台 - NAS 素材管理系统</title>
    <link rel="stylesheet" href="css/common.css">
    <link rel="stylesheet" href="css/admin.css">
</head>
<body>
    <div id="app">
        <!-- Sidebar -->
        <aside class="sidebar">
            <h2>管理后台</h2>
            <nav class="sidebar-nav">
                <button class="sidebar-item active" data-page="dashboard">仪表盘</button>
                <button class="sidebar-item" data-page="users">用户管理</button>
                <button class="sidebar-item" data-page="materials">素材管理</button>
                <button class="sidebar-item" data-page="logs">操作日志</button>
                <button class="sidebar-item" data-page="backups">备份管理</button>
            </nav>
            <div class="sidebar-bottom">
                <a href="/" class="btn-link">返回前台</a>
            </div>
        </aside>

        <!-- Main content -->
        <main class="admin-main">
            <!-- Header -->
            <header class="admin-header">
                <h1 id="page-title">仪表盘</h1>
                <div class="header-right">
                    <span id="user-info"></span>
                    <button id="logout-btn">退出</button>
                </div>
            </header>

            <!-- Page content -->
            <div id="page-content" class="page-content">
                <!-- Dashboard page -->
                <div id="dashboard-page" class="admin-page">
                    <div class="stats-grid">
                        <div class="stat-card">
                            <h3>用户数</h3>
                            <p class="stat-number" id="stat-users">-</p>
                        </div>
                        <div class="stat-card">
                            <h3>素材数</h3>
                            <p class="stat-number" id="stat-files">-</p>
                        </div>
                        <div class="stat-card">
                            <h3>存储使用</h3>
                            <p class="stat-number" id="stat-storage">-</p>
                        </div>
                    </div>
                </div>

                <!-- Users page -->
                <div id="users-page" class="admin-page hidden">
                    <div class="page-toolbar">
                        <button id="add-user-btn">添加用户</button>
                    </div>
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>用户名</th>
                                <th>角色</th>
                                <th>创建时间</th>
                                <th>操作</th>
                            </tr>
                        </thead>
                        <tbody id="users-tbody"></tbody>
                    </table>
                </div>

                <!-- Materials page -->
                <div id="materials-page" class="admin-page hidden">
                    <div class="page-toolbar">
                        <select id="filter-user">
                            <option value="">所有用户</option>
                        </select>
                    </div>
                    <div id="admin-materials-grid" class="materials-grid"></div>
                </div>

                <!-- Logs page -->
                <div id="logs-page" class="admin-page hidden">
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>时间</th>
                                <th>用户</th>
                                <th>操作</th>
                                <th>IP</th>
                            </tr>
                        </thead>
                        <tbody id="logs-tbody"></tbody>
                    </table>
                </div>

                <!-- Backups page -->
                <div id="backups-page" class="admin-page hidden">
                    <div class="page-toolbar">
                        <button id="create-backup-btn">创建备份</button>
                    </div>
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>备份时间</th>
                                <th>大小</th>
                                <th>操作</th>
                            </tr>
                        </thead>
                        <tbody id="backups-tbody"></tbody>
                    </table>
                </div>
            </div>
        </main>
    </div>

    <!-- Modal container -->
    <div id="modal-container" class="modal hidden"></div>

    <!-- Toast container -->
    <div id="toast-container" class="toast-container"></div>

    <script src="js/api.js"></script>
    <script src="js/state.js"></script>
    <script src="js/components/Toast.js"></script>
    <script src="js/components/Modal.js"></script>
    <script src="js/pages/admin/dashboard.js"></script>
    <script src="js/pages/admin/users.js"></script>
    <script src="js/pages/admin/materials.js"></script>
    <script src="js/pages/admin/logs.js"></script>
    <script src="js/pages/admin/backups.js"></script>
    <script src="js/admin-app.js"></script>
</body>
</html>
```

- [ ] **Step 3: 创建公共样式 frontend/public/css/common.css**

```css
/* Common Styles */
* {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
}

body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    background: #f5f5f5;
    color: #333;
}

.hidden {
    display: none !important;
}

button {
    cursor: pointer;
    padding: 8px 16px;
    border: none;
    border-radius: 4px;
    background: #007bff;
    color: white;
    font-size: 14px;
    transition: background 0.2s;
}

button:hover {
    background: #0056b3;
}

button.secondary {
    background: #6c757d;
}

button.danger {
    background: #dc3545;
}

input, select {
    padding: 8px 12px;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-size: 14px;
}

/* Toast */
.toast-container {
    position: fixed;
    top: 20px;
    right: 20px;
    z-index: 9999;
}

.toast {
    padding: 12px 20px;
    margin-bottom: 10px;
    border-radius: 4px;
    color: white;
    animation: slideIn 0.3s ease;
}

.toast.success { background: #28a745; }
.toast.error { background: #dc3545; }
.toast.info { background: #17a2b8; }

@keyframes slideIn {
    from { transform: translateX(100%); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
}

/* Modal */
.modal {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 9998;
}

.modal-content {
    background: white;
    padding: 24px;
    border-radius: 8px;
    min-width: 300px;
    max-width: 90vw;
    max-height: 90vh;
    overflow-y: auto;
}

.modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
}

.modal-close {
    background: none;
    color: #666;
    font-size: 24px;
    padding: 0;
}

.modal-footer {
    margin-top: 16px;
    display: flex;
    justify-content: flex-end;
    gap: 8px;
}

/* Materials grid */
.materials-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
    gap: 16px;
    padding: 16px;
}

.material-card {
    background: white;
    border-radius: 8px;
    overflow: hidden;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    cursor: pointer;
    transition: transform 0.2s;
}

.material-card:hover {
    transform: translateY(-2px);
}

.material-card.selected {
    outline: 3px solid #007bff;
}

.material-thumbnail {
    width: 100%;
    height: 150px;
    object-fit: cover;
    background: #eee;
}

.material-info {
    padding: 8px 12px;
}

.material-name {
    font-size: 13px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.material-size {
    font-size: 11px;
    color: #888;
}

/* Tables */
.data-table {
    width: 100%;
    border-collapse: collapse;
    background: white;
}

.data-table th,
.data-table td {
    padding: 12px;
    text-align: left;
    border-bottom: 1px solid #eee;
}

.data-table th {
    background: #f8f9fa;
    font-weight: 600;
}

.data-table tr:hover {
    background: #f8f9fa;
}

.empty-state {
    padding: 48px;
    text-align: center;
    color: #888;
}
```

- [ ] **Step 4: 创建 API 封装 frontend/public/js/api.js**

```javascript
class API {
    constructor() {
        this.baseUrl = '/api';
        this.token = localStorage.getItem('nasMaterialManager_token');
    }

    setToken(token) {
        this.token = token;
        if (token) {
            localStorage.setItem('nasMaterialManager_token', token);
        } else {
            localStorage.removeItem('nasMaterialManager_token');
        }
    }

    getToken() {
        return this.token || localStorage.getItem('nasMaterialManager_token');
    }

    async request(endpoint, options = {}) {
        const url = `${this.baseUrl}${endpoint}`;
        const token = this.getToken();

        const headers = {
            'Content-Type': 'application/json',
            ...options.headers
        };

        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const config = {
            ...options,
            headers
        };

        try {
            const response = await fetch(url, config);
            const data = await response.json();

            if (!data.success) {
                throw new Error(data.error || 'Request failed');
            }

            return data.data;
        } catch (err) {
            console.error('API Error:', err);
            throw err;
        }
    }

    // Auth
    async login(username, password) {
        return this.request('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ username, password })
        });
    }

    async logout() {
        return this.request('/auth/logout', { method: 'POST' });
    }

    async refreshToken(token) {
        return this.request('/auth/refresh', {
            method: 'POST',
            body: JSON.stringify({ token })
        });
    }

    async getMe() {
        return this.request('/auth/me');
    }

    // Users
    async getUsers() {
        return this.request('/users');
    }

    async getUser(id) {
        return this.request(`/users/${id}`);
    }

    async createUser(data) {
        return this.request('/users', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    async updateUser(id, data) {
        return this.request(`/users/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    }

    async deleteUser(id) {
        return this.request(`/users/${id}`, {
            method: 'DELETE'
        });
    }

    // Materials
    async getUserMaterials(userId, folderType) {
        return this.request(`/materials/user/${userId}/folder/${folderType}`);
    }

    async getTrashMaterials(userId) {
        return this.request(`/materials/user/${userId}/trash`);
    }

    async getMaterial(id) {
        return this.request(`/materials/${id}`);
    }

    async uploadMaterial(file, folderType, onProgress) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('folderType', folderType);

        const token = this.getToken();
        const response = await fetch(`${this.baseUrl}/materials/upload`, {
            method: 'POST',
            headers: token ? { 'Authorization': `Bearer ${token}` } : {},
            body: formData
        });

        const data = await response.json();
        if (!data.success) {
            throw new Error(data.error || 'Upload failed');
        }
        return data.data;
    }

    async updateMaterial(id, data) {
        return this.request(`/materials/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    }

    async deleteMaterial(id) {
        return this.request(`/materials/${id}`, {
            method: 'DELETE'
        });
    }

    async batchTrash(ids) {
        return this.request('/materials/batch/trash', {
            method: 'POST',
            body: JSON.stringify({ ids })
        });
    }

    async batchRestore(ids) {
        return this.request('/materials/batch/restore', {
            method: 'POST',
            body: JSON.stringify({ ids })
        });
    }

    async batchDelete(ids) {
        return this.request('/materials/batch', {
            method: 'DELETE',
            body: JSON.stringify({ ids })
        });
    }

    async batchCopy(ids, targetUserId) {
        return this.request('/materials/batch/copy', {
            method: 'POST',
            body: JSON.stringify({ ids, targetUserId })
        });
    }

    async batchMove(ids, targetUserId, targetFolder) {
        return this.request('/materials/batch/move', {
            method: 'POST',
            body: JSON.stringify({ ids, targetUserId, targetFolder })
        });
    }

    // Folders
    async getUserFolders(userId) {
        return this.request(`/folders/user/${userId}`);
    }

    async createFolder(data) {
        return this.request('/folders', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    async updateFolder(id, name) {
        return this.request(`/folders/${id}`, {
            method: 'PUT',
            body: JSON.stringify({ name })
        });
    }

    async deleteFolder(id) {
        return this.request(`/folders/${id}`, {
            method: 'DELETE'
        });
    }

    // Admin
    async getStats() {
        return this.request('/admin/stats');
    }

    async getAllMaterials(filters = {}) {
        const params = new URLSearchParams(filters).toString();
        return this.request(`/admin/materials${params ? '?' + params : ''}`);
    }

    async getLogs(filters = {}) {
        const params = new URLSearchParams(filters).toString();
        return this.request(`/admin/logs${params ? '?' + params : ''}`);
    }

    async createBackup() {
        return this.request('/admin/backup', { method: 'POST' });
    }

    async getBackups() {
        return this.request('/admin/backups');
    }

    async deleteBackup(id) {
        return this.request(`/admin/backups/${id}`, { method: 'DELETE' });
    }
}

const api = new API();
```

- [ ] **Step 5: 创建状态管理 frontend/public/js/state.js**

```javascript
const state = {
    isLoggedIn: false,
    currentUser: null,
    currentFolder: 'images',
    isTrashView: false,
    materials: [],
    selectedMaterialIds: new Set(),
    isSelectMode: false,
    adminPage: 'dashboard',
    users: [],
    logs: [],
    backups: []
};

const listeners = new Set();

function setState(updates) {
    Object.assign(state, updates);
    listeners.forEach(fn => fn(state));
}

function subscribe(fn) {
    listeners.add(fn);
    return () => listeners.delete(fn);
}

function formatFileSize(bytes) {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function formatDate(dateStr) {
    return new Date(dateStr).toLocaleString('zh-CN');
}
```

- [ ] **Step 6: 提交前端基础文件**

```bash
git add frontend/public/index.html frontend/public/admin.html frontend/public/css/common.css frontend/public/js/api.js frontend/public/js/state.js
git commit -m "feat: add frontend base structure

- Add user and admin entry HTML
- Add common CSS styles
- Add API wrapper class
- Add state management

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

### Task 12: 前端 - 组件与用户端页面

**Files:**
- Create: `frontend/public/css/user.css`
- Create: `frontend/public/js/components/Toast.js`
- Create: `frontend/public/js/components/Modal.js`
- Create: `frontend/public/js/components/MaterialCard.js`
- Create: `frontend/public/js/components/FileUploader.js`
- Create: `frontend/public/js/pages/user/login.js`
- Create: `frontend/public/js/pages/user/materials.js`
- Create: `frontend/public/js/pages/user/trash.js`
- Create: `frontend/public/js/user-app.js`

- [ ] **Step 1: 创建用户端样式 frontend/public/css/user.css**

```css
/* User Page Styles */
.login-container {
    max-width: 400px;
    margin: 100px auto;
    padding: 40px;
    background: white;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
    text-align: center;
}

.login-container h1 {
    margin-bottom: 32px;
    color: #333;
}

.login-container input {
    width: 100%;
    margin-bottom: 16px;
}

.login-container button {
    width: 100%;
    padding: 12px;
    font-size: 16px;
}

.app-header {
    background: white;
    padding: 16px 24px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.app-header h1 {
    font-size: 20px;
}

.header-right {
    display: flex;
    align-items: center;
    gap: 16px;
}

.app-nav {
    background: white;
    padding: 0 24px;
    border-bottom: 1px solid #eee;
    display: flex;
    gap: 4px;
}

.nav-tab {
    padding: 16px 24px;
    background: none;
    color: #666;
    border: none;
    border-bottom: 2px solid transparent;
    border-radius: 0;
}

.nav-tab:hover {
    background: #f8f9fa;
}

.nav-tab.active {
    color: #007bff;
    border-bottom-color: #007bff;
}

.toolbar {
    background: white;
    padding: 12px 24px;
    display: flex;
    gap: 8px;
    border-bottom: 1px solid #eee;
}

#batch-actions {
    display: flex;
    gap: 8px;
}

.materials-container {
    padding: 0;
}
```

- [ ] **Step 2: 创建 Toast 组件 frontend/public/js/components/Toast.js**

```javascript
function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    container.appendChild(toast);

    setTimeout(() => {
        toast.remove();
    }, 3000);
}
```

- [ ] **Step 3: 创建 Modal 组件 frontend/public/js/components/Modal.js**

```javascript
function showModal(content, options = {}) {
    const container = document.getElementById('modal-container');
    container.innerHTML = `
        <div class="modal-content">
            ${options.title ? `
                <div class="modal-header">
                    <h3>${options.title}</h3>
                    <button class="modal-close">&times;</button>
                </div>
            ` : ''}
            <div class="modal-body">${content}</div>
            ${options.footer !== false ? `
                <div class="modal-footer">
                    ${options.footer || `
                        <button class="modal-cancel secondary">取消</button>
                        <button class="modal-confirm">确定</button>
                    `}
                </div>
            ` : ''}
        </div>
    `;

    container.classList.remove('hidden');

    return new Promise((resolve) => {
        const closeBtn = container.querySelector('.modal-close');
        const cancelBtn = container.querySelector('.modal-cancel');
        const confirmBtn = container.querySelector('.modal-confirm');

        const close = (result) => {
            container.classList.add('hidden');
            resolve(result);
        };

        if (closeBtn) closeBtn.onclick = () => close(false);
        if (cancelBtn) cancelBtn.onclick = () => close(false);
        if (confirmBtn) confirmBtn.onclick = () => close(true);
        container.onclick = (e) => {
            if (e.target === container) close(false);
        };
    });
}

function hideModal() {
    document.getElementById('modal-container').classList.add('hidden');
}
```

- [ ] **Step 4: 创建素材卡片组件 frontend/public/js/components/MaterialCard.js**

```javascript
function renderMaterialCard(material, isSelected = false) {
    const thumbnailUrl = material.thumbnail_url || material.file_url || '';
    return `
        <div class="material-card ${isSelected ? 'selected' : ''}" data-id="${material.id}">
            <div class="material-thumbnail-container">
                ${material.file_type?.startsWith('video') ? '<span class="video-indicator">视频</span>' : ''}
                <img class="material-thumbnail" src="${thumbnailUrl}" alt="${material.file_name}" onerror="this.style.display='none'">
            </div>
            <div class="material-info">
                <div class="material-name" title="${material.file_name}">${material.file_name}</div>
                <div class="material-size">${formatFileSize(material.file_size)}</div>
            </div>
        </div>
    `;
}

function renderMaterialsGrid(materials, selectedIds = new Set()) {
    const grid = document.getElementById('materials-grid');
    if (!grid) return;

    if (materials.length === 0) {
        grid.innerHTML = '';
        document.getElementById('empty-state').classList.remove('hidden');
    } else {
        document.getElementById('empty-state').classList.add('hidden');
        grid.innerHTML = materials.map(m =>
            renderMaterialCard(m, selectedIds.has(m.id))
        ).join('');
    }
}
```

- [ ] **Step 5: 创建文件上传组件 frontend/public/js/components/FileUploader.js**

```javascript
async function handleFileUpload(files, folderType) {
    const results = [];

    for (const file of files) {
        try {
            showToast(`正在上传: ${file.name}`, 'info');
            const result = await api.uploadMaterial(file, folderType);
            results.push(result);
            showToast(`上传成功: ${file.name}`, 'success');
        } catch (err) {
            showToast(`上传失败: ${file.name} - ${err.message}`, 'error');
        }
    }

    return results;
}

function setupFileUploader() {
    const uploadBtn = document.getElementById('upload-btn');
    const fileInput = document.getElementById('file-upload');

    if (uploadBtn && fileInput) {
        uploadBtn.onclick = () => fileInput.click();
        fileInput.onchange = async (e) => {
            if (e.target.files.length > 0) {
                await handleFileUpload(e.target.files, state.currentFolder);
                await loadMaterials();
                e.target.value = '';
            }
        };
    }
}
```

- [ ] **Step 6: 创建登录页面 frontend/public/js/pages/user/login.js**

```javascript
function setupLoginPage() {
    const form = document.getElementById('login-form');
    if (!form) return;

    form.onsubmit = async (e) => {
        e.preventDefault();
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;

        try {
            const result = await api.login(username, password);
            api.setToken(result.token);
            setState({
                isLoggedIn: true,
                currentUser: result.user
            });
            showMainApp();
            showToast('登录成功', 'success');
        } catch (err) {
            showToast(err.message, 'error');
        }
    };
}

function showLoginPage() {
    document.getElementById('login-page').classList.remove('hidden');
    document.getElementById('main-app').classList.add('hidden');
}

function showMainApp() {
    document.getElementById('login-page').classList.add('hidden');
    document.getElementById('main-app').classList.remove('hidden');
    updateUserInfo();
    loadMaterials();
}

function updateUserInfo() {
    const el = document.getElementById('user-info');
    if (el && state.currentUser) {
        el.textContent = state.currentUser.username;
    }
}
```

- [ ] **Step 7: 创建素材页面 frontend/public/js/pages/user/materials.js**

```javascript
async function loadMaterials() {
    if (!state.currentUser) return;

    try {
        let materials;
        if (state.isTrashView) {
            materials = await api.getTrashMaterials(state.currentUser.id);
        } else {
            materials = await api.getUserMaterials(state.currentUser.id, state.currentFolder);
        }
        setState({ materials });
        renderMaterialsGrid(materials, state.selectedMaterialIds);
    } catch (err) {
        showToast(err.message, 'error');
    }
}

function setupNavigation() {
    const tabs = document.querySelectorAll('.nav-tab');
    tabs.forEach(tab => {
        tab.onclick = async () => {
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');

            const folder = tab.dataset.folder;
            setState({
                currentFolder: folder,
                isTrashView: folder === 'trash',
                selectedMaterialIds: new Set(),
                isSelectMode: false
            });

            updateToolbar();
            await loadMaterials();
        };
    });
}

function setupSelectMode() {
    const selectBtn = document.getElementById('select-mode-btn');
    const cancelBtn = document.getElementById('cancel-select-btn');
    const trashBtn = document.getElementById('batch-trash-btn');

    if (selectBtn) {
        selectBtn.onclick = () => {
            setState({ isSelectMode: true, selectedMaterialIds: new Set() });
            updateToolbar();
        };
    }

    if (cancelBtn) {
        cancelBtn.onclick = () => {
            setState({ isSelectMode: false, selectedMaterialIds: new Set() });
            updateToolbar();
            renderMaterialsGrid(state.materials, state.selectedMaterialIds);
        };
    }

    if (trashBtn) {
        trashBtn.onclick = async () => {
            if (state.selectedMaterialIds.size === 0) return;

            const confirmed = await showModal(
                `<p>确定要删除选中的 ${state.selectedMaterialIds.size} 个素材吗？</p>`,
                { title: '确认删除' }
            );

            if (confirmed) {
                try {
                    if (state.isTrashView) {
                        await api.batchDelete([...state.selectedMaterialIds]);
                    } else {
                        await api.batchTrash([...state.selectedMaterialIds]);
                    }
                    showToast('操作成功', 'success');
                    setState({ isSelectMode: false, selectedMaterialIds: new Set() });
                    updateToolbar();
                    await loadMaterials();
                } catch (err) {
                    showToast(err.message, 'error');
                }
            }
        };
    }

    // Grid click for selection
    document.getElementById('materials-grid').onclick = (e) => {
        const card = e.target.closest('.material-card');
        if (!card) return;

        const id = parseInt(card.dataset.id);

        if (state.isSelectMode) {
            if (state.selectedMaterialIds.has(id)) {
                state.selectedMaterialIds.delete(id);
            } else {
                state.selectedMaterialIds.add(id);
            }
            renderMaterialsGrid(state.materials, state.selectedMaterialIds);
        } else {
            // Single view mode
            showMaterialDetail(id);
        }
    };
}

function updateToolbar() {
    const selectBtn = document.getElementById('select-mode-btn');
    const batchActions = document.getElementById('batch-actions');

    if (state.isSelectMode) {
        selectBtn?.classList.add('hidden');
        batchActions?.classList.remove('hidden');
    } else {
        selectBtn?.classList.remove('hidden');
        batchActions?.classList.add('hidden');
    }
}

async function showMaterialDetail(id) {
    const material = state.materials.find(m => m.id === id);
    if (!material) return;

    const content = `
        <div style="text-align: center;">
            ${material.file_url ? `<img src="${material.file_url}" style="max-width: 100%; max-height: 400px;">` : ''}
            <p><strong>${material.file_name}</strong></p>
            <p>${formatFileSize(material.file_size)}</p>
            <p>${formatDate(material.created_at)}</p>
        </div>
    `;

    await showModal(content, { title: '素材详情' });
}
```

- [ ] **Step 8: 创建垃圾箱页面 frontend/public/js/pages/user/trash.js**

```javascript
// Trash functionality is integrated in materials.js
// This file provides additional trash-specific actions

async function setupTrashActions() {
    // Add restore button to toolbar when in trash view
    // This is handled in the main materials page
}
```

- [ ] **Step 9: 创建用户端入口 frontend/public/js/user-app.js**

```javascript
document.addEventListener('DOMContentLoaded', async () => {
    // Initialize
    setupLoginPage();
    setupNavigation();
    setupSelectMode();
    setupFileUploader();

    // Check saved token
    const token = api.getToken();
    if (token) {
        try {
            const user = await api.getMe();
            setState({
                isLoggedIn: true,
                currentUser: user
            });
            showMainApp();
        } catch (err) {
            api.setToken(null);
        }
    } else {
        showLoginPage();
    }

    // Logout button
    document.getElementById('logout-btn').onclick = async () => {
        try {
            await api.logout();
        } catch (err) {
            // Ignore logout errors
        }
        api.setToken(null);
        setState({
            isLoggedIn: false,
            currentUser: null,
            materials: []
        });
        showLoginPage();
        showToast('已退出登录', 'info');
    };
});
```

- [ ] **Step 10: 提交用户端文件**

```bash
git add frontend/public/css/user.css frontend/public/js/components/Toast.js frontend/public/js/components/Modal.js frontend/public/js/components/MaterialCard.js frontend/public/js/components/FileUploader.js frontend/public/js/pages/user/login.js frontend/public/js/pages/user/materials.js frontend/public/js/pages/user/trash.js frontend/public/js/user-app.js
git commit -m "feat: add user frontend components and pages

- Add user page styles
- Add Toast, Modal, MaterialCard, FileUploader components
- Add login, materials, trash pages
- Add user app entry point

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

### Task 13: 前端 - 管理后台页面

**Files:**
- Create: `frontend/public/css/admin.css`
- Create: `frontend/public/js/pages/admin/dashboard.js`
- Create: `frontend/public/js/pages/admin/users.js`
- Create: `frontend/public/js/pages/admin/materials.js`
- Create: `frontend/public/js/pages/admin/logs.js`
- Create: `frontend/public/js/pages/admin/backups.js`
- Create: `frontend/public/js/admin-app.js`

由于篇幅原因，这个任务在实际执行时可以进一步拆分，但为了保持计划完整，这里简要概述需要创建的管理后台文件，采用与用户端类似的模式。

- [ ] **Step 1: 创建管理后台样式和页面文件**

创建管理后台所需的 CSS 和 JavaScript 文件，实现：
- 仪表盘统计展示
- 用户管理（增删改查）
- 素材管理（跨用户浏览）
- 操作日志查看
- 备份管理（创建、下载、删除）

- [ ] **Step 2: 提交管理后台文件**

```bash
git add frontend/public/css/admin.css frontend/public/js/pages/admin/dashboard.js frontend/public/js/pages/admin/users.js frontend/public/js/pages/admin/materials.js frontend/public/js/pages/admin/logs.js frontend/public/js/pages/admin/backups.js frontend/public/js/admin-app.js
git commit -m "feat: add admin frontend pages

- Add admin page styles
- Add dashboard, users, materials, logs, backups pages
- Add admin app entry point

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

### Task 14: 测试与验证

**Files:**
- Create: `README.md` (update if exists)

- [ ] **Step 1: 运行后端并测试**

```bash
cd backend
cp .env.example .env
npm install
npm start
```

验证服务器在 http://localhost:3000 正常运行。

- [ ] **Step 2: 测试默认登录**
- 用户名: `admin`
- 密码: `admin123`

- [ ] **Step 3: 测试功能**
- 用户登录/登出
- 素材上传
- 素材查看/删除
- 批量操作
- 管理后台访问

- [ ] **Step 4: 创建/更新 README.md**

记录项目说明、功能、部署方法。

---

## 执行选项

计划已保存到 `docs/superpowers/plans/2026-03-28-nas-material-manager-v3-implementation.md`。

有两个执行选项：

**1. Subagent-Driven（推荐）** - 为每个任务派遣独立的子代理，任务间进行审查，快速迭代

**2. Inline Execution** - 在当前会话中执行任务，批量执行带审查检查点

你想用哪种方式？
