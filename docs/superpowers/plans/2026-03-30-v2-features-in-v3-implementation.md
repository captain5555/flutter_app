# V2功能迁移到V3实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在V3现有架构基础上，完整实现V2的所有功能，包括AI功能、视频下载、主题切换、响应式设计等。

**Architecture:** 保持V3的模块化架构（数据库抽象层、存储抽象层、中间件、模块化前端），补充实现V2的功能特性。

**Tech Stack:** Node.js + Express + SQLite + Vanilla JS (模块化) + Docker

---

## 阶段一：数据库层完善

### Task 1: 更新数据库Schema

**Files:**
- Modify: `backend/src/db/schema.sql`

- [ ] **Step 1: 更新materials表添加title和description字段**

```sql
-- Materials table (updated)
CREATE TABLE IF NOT EXISTS materials (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  folder_type VARCHAR(50) DEFAULT 'images',
  file_name VARCHAR(255) NOT NULL,
  title VARCHAR(255),
  description TEXT,
  file_path VARCHAR(500) NOT NULL,
  file_size BIGINT DEFAULT 0,
  file_type VARCHAR(50),
  thumbnail_path VARCHAR(500),
  usage_tag VARCHAR(20) DEFAULT 'unused',
  viral_tag VARCHAR(20) DEFAULT 'not_viral',
  is_deleted BOOLEAN DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  deleted_at DATETIME,
  FOREIGN KEY (user_id) REFERENCES users(id)
);
```

- [ ] **Step 2: 添加默认用户（user1, user2, user3）**

```sql
-- Insert default users (V2 compatibility - no password)
INSERT OR IGNORE INTO users (id, username, password_hash, role) VALUES
  ('user1', 'user1', '', 'user'),
  ('user2', 'user2', '', 'user'),
  ('user3', 'user3', '', 'user');
```

- [ ] **Step 3: 确保ai_settings表有默认值**

```sql
-- Insert default AI settings if not exists
INSERT OR IGNORE INTO ai_settings (id, api_url, api_key, model, title_prompt, description_prompt, safety_rules, replacement_words) VALUES (
  'global',
  '',
  '',
  '',
  '你是一个短视频标题专家。请根据这张图片内容，生成一个吸引人的短视频标题。
要求：
- 15-20个字
- 有吸引力，能引起好奇心
- 适合短视频平台
- 输出只需标题，不需要其他内容',
  '你是一个疗愈文案专家。请根据这张图片内容，生成一段疗愈文案。
要求：
- 80-120个字
- 温馨治愈，能引起共鸣
- 适合短视频配文
- 输出只需文案，不需要其他内容',
  '',
  ''
);
```

- [ ] **Step 4: 提交更改**

```bash
cd .claude/worktrees/nas-material-manager-v3
git add backend/src/db/schema.sql
git commit -m "feat: update schema with title/description and default users"
```

---

### Task 2: 更新数据库抽象接口

**Files:**
- Modify: `backend/src/db/abstract.js`

- [ ] **Step 1: 添加新方法到AbstractDatabase**

```javascript
  // 获取所有用户的垃圾箱素材（管理员用）
  async getAllTrashMaterials() { throw new Error('Not implemented'); }

  // 删除用户并转移素材
  async deleteUserAndTransferMaterials(userId, targetUserId = 1) { throw new Error('Not implemented'); }
```

- [ ] **Step 2: 提交更改**

```bash
git add backend/src/db/abstract.js
git commit -m "feat: add abstract methods for getAllTrashMaterials and deleteUserAndTransferMaterials"
```

---

### Task 3: 完善SQLite实现

**Files:**
- Modify: `backend/src/db/sqlite.js`

- [ ] **Step 1: 更新updateMaterial支持title和description**

找到现有的`updateMaterial`方法，更新fields数组：

```javascript
['file_name', 'folder_type', 'usage_tag', 'viral_tag', 'title', 'description'].forEach(key => {
```

- [ ] **Step 2: 添加getAllTrashMaterials方法**

```javascript
async getAllTrashMaterials() {
  return new Promise((resolve, reject) => {
    this.db.all(
      'SELECT m.*, u.username FROM materials m LEFT JOIN users u ON m.user_id = u.id WHERE m.is_deleted = 1 ORDER BY m.deleted_at DESC',
      [],
      (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      }
    );
  });
}
```

- [ ] **Step 3: 添加deleteUserAndTransferMaterials方法**

```javascript
async deleteUserAndTransferMaterials(userId, targetUserId = 1) {
  return new Promise((resolve, reject) => {
    this.db.serialize(() => {
      // 1. 统计要转移的素材数量
      this.db.get('SELECT COUNT(*) as count FROM materials WHERE user_id = ?', [userId], (err, row) => {
        if (err) { reject(err); return; }
        const count = row ? row.count : 0;

        // 2. 转移素材给目标用户
        this.db.run('UPDATE materials SET user_id = ? WHERE user_id = ?', [targetUserId, userId], (err) => {
          if (err) { reject(err); return; }

          // 3. 删除用户
          this.db.run('DELETE FROM users WHERE id = ?', [userId], function(err) {
            if (err) reject(err);
            else resolve({ deleted: this.changes > 0, transferredMaterials: count });
          });
        });
      });
    });
  });
}
```

- [ ] **Step 4: 确保getMaterials返回title和description**

检查`getMaterials`方法的SELECT语句，确保包含`title`和`description`字段（应该已经包含在SELECT *中）。

- [ ] **Step 5: 提交更改**

```bash
git add backend/src/db/sqlite.js
git commit -m "feat: implement title/description support, getAllTrashMaterials, and deleteUserAndTransferMaterials"
```

---

## 阶段二：后端API完善

### Task 4: 添加简化登录接口

**Files:**
- Modify: `backend/src/routes/auth.js`

- [ ] **Step 1: 添加login-simple接口**

在文件末尾添加：

```javascript
// Simplified login (V2 compatibility - no password)
router.post('/login-simple', asyncHandler(async (req, res) => {
  const { username } = req.body;

  if (!username) {
    return sendError(res, 'Username is required');
  }

  const user = await db.getUserByUsername(username);
  if (!user) {
    return sendError(res, 'User not found', 401);
  }

  // Generate token
  const jwt = require('jsonwebtoken');
  const config = require('../config');
  const token = jwt.sign(
    { id: user.id, username: user.username, role: user.role },
    config.jwtSecret,
    { expiresIn: config.jwtExpiresIn }
  );

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
```

- [ ] **Step 2: 提交更改**

```bash
git add backend/src/routes/auth.js
git commit -m "feat: add simplified login endpoint for V2 compatibility"
```

---

### Task 5: 完善素材API

**Files:**
- Modify: `backend/src/routes/materials.js`

- [ ] **Step 1: 添加视频下载接口**

在文件末尾添加：

```javascript
const fs = require('fs');
const path = require('path');

// Download material (video)
router.get('/:id/download', authenticateToken, asyncHandler(async (req, res) => {
  const materialId = parseInt(req.params.id);
  const material = await db.getMaterial(materialId);

  if (!material) {
    return sendError(res, 'Material not found', 404);
  }

  if (!canAccessMaterial(req, material)) {
    return sendError(res, 'Permission denied', 403);
  }

  const uploadsPath = path.join(__dirname, '../../data/uploads');
  const filePath = path.join(uploadsPath, material.file_path);

  if (!fs.existsSync(filePath)) {
    return sendError(res, 'File not found', 404);
  }

  res.download(filePath, material.file_name);
}));
```

- [ ] **Step 2: 更新垃圾箱接口支持管理员查看所有**

找到现有的`/user/:userId/trash`路由，替换为：

```javascript
// Get user trash (or all trash for admin)
router.get('/user/:userId/trash', authenticateToken, asyncHandler(async (req, res) => {
  const userId = parseInt(req.params.userId);
  const { all } = req.query;

  if (all === 'true' && isAdmin(req)) {
    const materials = await db.getAllTrashMaterials();
    for (const mat of materials) {
      if (mat.file_path) {
        mat.file_url = await storage.getFileUrl(mat.file_path);
      }
    }
    sendSuccess(res, materials);
    return;
  }

  if (!canAccessUser(req, userId)) {
    return sendError(res, 'Permission denied', 403);
  }

  const materials = await db.getTrashMaterials(userId);
  for (const mat of materials) {
    if (mat.file_path) {
      mat.file_url = await storage.getFileUrl(mat.file_path);
    }
  }
  sendSuccess(res, materials);
}));
```

- [ ] **Step 3: 添加canAccessUser辅助函数**

在文件末尾添加（如果不存在）：

```javascript
function canAccessUser(req, userId) {
  if (isAdmin(req)) return true;
  return req.user.id === userId;
}
```

- [ ] **Step 4: 提交更改**

```bash
git add backend/src/routes/materials.js
git commit -m "feat: add video download and admin trash viewing"
```

---

### Task 6: 完善用户API

**Files:**
- Modify: `backend/src/routes/users.js`

- [ ] **Step 1: 更新删除用户接口**

找到delete路由，替换为：

```javascript
// Delete user (admin only)
router.delete('/:id', authenticateToken, asyncHandler(async (req, res) => {
  if (!isAdmin(req)) {
    return sendError(res, 'Permission denied', 403);
  }

  const userId = parseInt(req.params.id);

  if (userId === req.user.id) {
    return sendError(res, 'Cannot delete yourself', 400);
  }

  const result = await db.deleteUserAndTransferMaterials(userId, 1); // admin id = 1

  await logOperation(
    req.user,
    'delete_user',
    'user',
    userId,
    `Transferred ${result.transferredMaterials} materials`,
    getClientIp(req)
  );

  sendSuccess(res, result);
}));
```

- [ ] **Step 2: 提交更改**

```bash
git add backend/src/routes/users.js
git commit -m "feat: update user delete to transfer materials"
```

---

### Task 7: 确保AI API完整

**Files:**
- Read: `backend/src/routes/ai.js`

检查AI路由是否完整（应该已经有了），如果有缺失则补充。

- [ ] **Step 1: 验证AI功能完整**
  - GET /settings - 已存在
  - PUT /settings - 已存在
  - POST /generate-title - 已存在
  - POST /generate-description - 已存在
  - POST /translate - 已存在

无需修改，已经完整。

---

## 阶段三：前端用户端 - 基础架构

### Task 8: 更新公共样式支持主题

**Files:**
- Modify: `frontend/public/css/common.css`

- [ ] **Step 1: 添加CSS变量和主题支持**

替换文件开头为：

```css
/* Common Styles */
:root {
  --primary: #007AFF;
  --primary-light: rgba(0, 122, 255, 0.1);
  --green: #34C759;
  --green-light: rgba(52, 199, 89, 0.15);
  --orange: #FF9500;
  --orange-light: rgba(255, 149, 0, 0.15);
  --red: #FF3B30;
  --red-light: rgba(255, 59, 48, 0.15);
  --bg: #F5F5F7;
  --card-bg: #FFFFFF;
  --sidebar-bg: #EBEBED;
  --text: #1D1D1F;
  --text-secondary: #86868B;
  --border: #D2D2D7;
}

[data-theme="dark"] {
  --bg: #000000;
  --card-bg: #1C1C1E;
  --sidebar-bg: #121214;
  --text: #FFFFFF;
  --text-secondary: #98989D;
  --border: #38383A;
}

* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  background: var(--bg);
  color: var(--text);
}
```

- [ ] **Step 2: 更新其他样式使用CSS变量**

更新`.material-card`、`.modal-content`等样式使用`var(--card-bg)`等变量。

- [ ] **Step 3: 提交更改**

```bash
git add frontend/public/css/common.css
git commit -m "feat: add theme support with CSS variables"
```

---

### Task 9: 更新状态管理

**Files:**
- Modify: `frontend/public/js/state.js`

- [ ] **Step 1: 替换为完整的状态管理**

```javascript
const State = {
  user: null,
  token: null,
  currentFolder: 'images',
  materials: [],
  selectedIds: new Set(),
  theme: 'light',
  isTrashView: false,
  isSelectMode: false,
  users: [],

  init() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    this.setTheme(savedTheme);

    const savedToken = localStorage.getItem('nasMaterialManager_token');
    const savedUser = localStorage.getItem('nasMaterialManager_user');
    if (savedToken && savedUser) {
      this.token = savedToken;
      this.user = JSON.parse(savedUser);
      api.setToken(savedToken);
    }
  },

  setTheme(theme) {
    this.theme = theme;
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  },

  toggleTheme() {
    this.setTheme(this.theme === 'light' ? 'dark' : 'light');
  },

  setUser(user, token) {
    this.user = user;
    this.token = token;
    if (user && token) {
      localStorage.setItem('nasMaterialManager_user', JSON.stringify(user));
      localStorage.setItem('nasMaterialManager_token', token);
      api.setToken(token);
    } else {
      localStorage.removeItem('nasMaterialManager_user');
      localStorage.removeItem('nasMaterialManager_token');
      api.setToken(null);
    }
  },

  formatFileSize(bytes) {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  },

  formatDate(dateStr) {
    return new Date(dateStr).toLocaleString('zh-CN');
  }
};
```

- [ ] **Step 2: 提交更改**

```bash
git add frontend/public/js/state.js
git commit -m "feat: update state management with theme support"
```

---

### Task 10: 更新API封装

**Files:**
- Modify: `frontend/public/js/api.js`

- [ ] **Step 1: 添加V2功能的API方法**

在API类中添加：

```javascript
    // Auth - simplified login
    async loginSimple(username) {
        return this.request('/auth/login-simple', {
            method: 'POST',
            body: JSON.stringify({ username })
        });
    }

    // Materials - download
    downloadMaterial(id) {
        const token = this.getToken();
        window.location.href = `${this.baseUrl}/materials/${id}/download?token=${encodeURIComponent(token)}`;
    }

    // AI
    async getAISettings() {
        return this.request('/ai/settings');
    }

    async saveAISettings(settings) {
        return this.request('/ai/settings', {
            method: 'PUT',
            body: JSON.stringify(settings)
        });
    }

    async generateTitle(image, currentTitle) {
        return this.request('/ai/generate-title', {
            method: 'POST',
            body: JSON.stringify({ image, current_title: currentTitle })
        });
    }

    async generateDescription(image, currentDescription) {
        return this.request('/ai/generate-description', {
            method: 'POST',
            body: JSON.stringify({ image, current_description: currentDescription })
        });
    }

    async translate(text) {
        return this.request('/ai/translate', {
            method: 'POST',
            body: JSON.stringify({ text })
        });
    }
```

- [ ] **Step 2: 提交更改**

```bash
git add frontend/public/js/api.js
git commit -m "feat: add API methods for V2 features (download, AI)"
```

---

### Task 11: 创建用户端主HTML

**Files:**
- Modify: `frontend/public/index.html`

参考V2的布局，创建完整的用户端页面。

- [ ] **Step 1: 替换为完整的HTML结构**

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
    <!-- Login Screen -->
    <div id="login-screen" class="login-screen">
      <div class="login-container">
        <h1>NAS 素材管理系统</h1>
        <div class="login-form">
          <label>选择用户</label>
          <select id="user-select">
            <option value="admin">admin (管理员)</option>
            <option value="user1">user1</option>
            <option value="user2">user2</option>
            <option value="user3">user3</option>
          </select>
          <button id="login-btn" class="btn primary">登录</button>
        </div>
      </div>
    </div>

    <!-- Main App Layout -->
    <div id="main-app" class="app-layout hidden">
      <!-- Mobile Menu Button -->
      <button id="menu-btn" class="hamburger-btn">☰</button>

      <!-- Sidebar Overlay (mobile) -->
      <div id="sidebar-overlay" class="sidebar-overlay"></div>

      <!-- Sidebar -->
      <aside id="sidebar" class="sidebar">
        <div class="sidebar-header">
          <h2>素材管理</h2>
          <button id="sidebar-close" class="sidebar-close">×</button>
        </div>
        <div class="user-info">
          <span id="user-name"></span>
          <span id="user-role" class="role-badge"></span>
        </div>
        <nav class="sidebar-nav">
          <button class="nav-item active" data-folder="images">📷 图片</button>
          <button class="nav-item" data-folder="videos">🎬 视频</button>
          <button class="nav-item" data-folder="trash">🗑️ 垃圾箱</button>
        </nav>
        <div class="sidebar-footer">
          <button id="theme-btn">🌙 主题</button>
          <button id="logout-btn">退出</button>
        </div>
      </aside>

      <!-- Main Content -->
      <main class="main-content">
        <!-- Toolbar -->
        <div class="toolbar">
          <div class="toolbar-left">
            <button id="upload-btn">上传</button>
            <button id="select-mode-btn">选择</button>
            <button id="ai-btn">✨ AI助手</button>
          </div>
          <div class="toolbar-right">
            <span id="selected-count" class="hidden"></span>
            <div id="batch-actions" class="hidden">
              <button id="batch-trash-btn">删除</button>
              <button id="batch-copy-btn">复制给</button>
              <button id="batch-move-btn">移动给</button>
              <button id="cancel-select-btn">取消</button>
            </div>
          </div>
        </div>

        <!-- Materials Grid -->
        <div id="materials-grid" class="materials-grid"></div>

        <!-- Empty State -->
        <div id="empty-state" class="empty-state hidden">
          <p>暂无素材</p>
        </div>
      </main>
    </div>
  </div>

  <!-- Modal Container -->
  <div id="modal-container" class="modal hidden"></div>

  <!-- Toast Container -->
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
  <script src="js/pages/user/material-detail.js"></script>
  <script src="js/pages/user/ai-panel.js"></script>
  <script src="js/pages/user/batch-actions.js"></script>
  <script src="js/user-app.js"></script>
</body>
</html>
```

- [ ] **Step 2: 提交更改**

```bash
git add frontend/public/index.html
git commit -m "feat: update user index.html with V2 layout"
```

---

### Task 12: 创建用户端CSS

**Files:**
- Create/Modify: `frontend/public/css/user.css`

- [ ] **Step 1: 添加完整的用户端样式**

参考V2的样式，创建响应式的用户端CSS，包括：
- 登录页面样式
- 侧边栏样式（支持手机端）
- 工具栏样式
- 素材网格样式（手机端4个卡片）
- 响应式媒体查询

- [ ] **Step 2: 提交更改**

```bash
git add frontend/public/css/user.css
git commit -m "feat: add complete user.css with responsive design"
```

---

## 阶段四：前端用户端 - 页面组件

### Task 13: 创建登录页面逻辑

**Files:**
- Create: `frontend/public/js/pages/user/login.js`

- [ ] **Step 1: 实现登录逻辑**

```javascript
const LoginPage = {
  init() {
    this.bindEvents();
    this.checkAuth();
  },

  checkAuth() {
    if (State.user && State.token) {
      this.showMainApp();
    }
  },

  bindEvents() {
    document.getElementById('login-btn').onclick = () => this.handleLogin();
    document.getElementById('logout-btn').onclick = () => this.handleLogout();
    document.getElementById('theme-btn').onclick = () => this.toggleTheme();
  },

  async handleLogin() {
    const username = document.getElementById('user-select').value;
    try {
      const result = await api.loginSimple(username);
      State.setUser(result.user, result.token);
      Toast.show('登录成功');
      this.showMainApp();
      await UserApp.loadMaterials();
    } catch (err) {
      Toast.show(err.message, 'error');
    }
  },

  handleLogout() {
    State.setUser(null, null);
    this.showLogin();
    Toast.show('已退出登录');
  },

  toggleTheme() {
    State.toggleTheme();
    const themeBtn = document.getElementById('theme-btn');
    themeBtn.textContent = State.theme === 'light' ? '🌙 主题' : '☀️ 主题';
  },

  showLogin() {
    document.getElementById('login-screen').classList.remove('hidden');
    document.getElementById('main-app').classList.add('hidden');
  },

  showMainApp() {
    document.getElementById('login-screen').classList.add('hidden');
    document.getElementById('main-app').classList.remove('hidden');
    if (State.user) {
      document.getElementById('user-name').textContent = State.user.username;
      document.getElementById('user-role').textContent = State.user.role === 'admin' ? '管理员' : '用户';
    }
  }
};
```

- [ ] **Step 2: 提交更改**

```bash
git add frontend/public/js/pages/user/login.js
git commit -m "feat: add login page logic"
```

---

### Task 14: 创建素材详情弹窗

**Files:**
- Create: `frontend/public/js/pages/user/material-detail.js`

- [ ] **Step 1: 实现素材详情编辑**

```javascript
const MaterialDetail = {
  async show(materialId) {
    const material = await api.getMaterial(materialId);
    this.material = material;

    Modal.show({
      title: '素材详情',
      content: this.renderContent(material),
      onMount: () => this.bindEvents(material)
    });
  },

  renderContent(material) {
    const isVideo = material.folder_type === 'videos' || material.file_type?.startsWith('video/');
    return `
      <div class="material-detail">
        <div class="material-preview">
          ${isVideo
            ? `<video src="${material.file_url}" controls></video>`
            : `<img src="${material.file_url}" alt="${material.title || material.file_name}">`
          }
        </div>

        <div class="material-form">
          <div class="form-group">
            <label>文件名</label>
            <input type="text" id="detail-filename" value="${material.file_name || ''}" disabled>
          </div>

          <div class="form-group">
            <label>标题</label>
            <div class="input-with-btn">
              <input type="text" id="detail-title" value="${material.title || ''}" placeholder="输入标题">
              <button id="ai-title-btn" class="ai-btn">✨</button>
            </div>
          </div>

          <div class="form-group">
            <label>描述</label>
            <div class="input-with-btn">
              <textarea id="detail-description" placeholder="输入描述">${material.description || ''}</textarea>
              <button id="ai-desc-btn" class="ai-btn">✨</button>
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label>使用标签</label>
              <select id="detail-usage-tag">
                <option value="unused" ${material.usage_tag === 'unused' ? 'selected' : ''}>未使用</option>
                <option value="used" ${material.usage_tag === 'used' ? 'selected' : ''}>已使用</option>
              </select>
            </div>

            <div class="form-group">
              <label>爆款标签</label>
              <select id="detail-viral-tag">
                <option value="not_viral" ${material.viral_tag === 'not_viral' ? 'selected' : ''}>非爆款</option>
                <option value="viral" ${material.viral_tag === 'viral' ? 'selected' : ''}>爆款</option>
              </select>
            </div>
          </div>

          <div class="form-actions">
            ${isVideo ? '<button id="download-btn" class="btn secondary">下载视频</button>' : ''}
            <button id="save-btn" class="btn primary">保存</button>
          </div>
        </div>
      </div>
    `;
  },

  async bindEvents(material) {
    // 保存
    document.getElementById('save-btn').onclick = async () => {
      try {
        await api.updateMaterial(material.id, {
          title: document.getElementById('detail-title').value,
          description: document.getElementById('detail-description').value,
          usage_tag: document.getElementById('detail-usage-tag').value,
          viral_tag: document.getElementById('detail-viral-tag').value
        });
        Toast.show('保存成功');
        Modal.hide();
        UserApp.loadMaterials();
      } catch (err) {
        Toast.show(err.message, 'error');
      }
    };

    // 下载
    const downloadBtn = document.getElementById('download-btn');
    if (downloadBtn) {
      downloadBtn.onclick = () => api.downloadMaterial(material.id);
    }

    // AI生成标题
    document.getElementById('ai-title-btn').onclick = async () => {
      try {
        const image = material.file_type?.startsWith('image/') ? material.file_url : null;
        const currentTitle = document.getElementById('detail-title').value;
        const result = await api.generateTitle(image, currentTitle);
        document.getElementById('detail-title').value = result.title;
      } catch (err) {
        Toast.show(err.message, 'error');
      }
    };

    // AI生成文案
    document.getElementById('ai-desc-btn').onclick = async () => {
      try {
        const image = material.file_type?.startsWith('image/') ? material.file_url : null;
        const currentDesc = document.getElementById('detail-description').value;
        const result = await api.generateDescription(image, currentDesc);
        document.getElementById('detail-description').value = result.description;
      } catch (err) {
        Toast.show(err.message, 'error');
      }
    };
  }
};
```

- [ ] **Step 2: 提交更改**

```bash
git add frontend/public/js/pages/user/material-detail.js
git commit -m "feat: add material detail modal with AI support"
```

---

### Task 15: 创建AI功能面板

**Files:**
- Create: `frontend/public/js/pages/user/ai-panel.js`

- [ ] **Step 1: 实现AI面板**

```javascript
const AIPanel = {
  show() {
    Modal.show({
      title: 'AI助手',
      content: this.renderContent(),
      onMount: () => this.bindEvents()
    });
  },

  renderContent() {
    return `
      <div class="ai-panel">
        <div class="ai-tabs">
          <button class="ai-tab active" data-tab="title">生成标题</button>
          <button class="ai-tab" data-tab="description">生成文案</button>
          <button class="ai-tab" data-tab="translate">翻译</button>
        </div>

        <div class="ai-tab-content" id="tab-title">
          <div class="form-group">
            <label>上传图片（可选）</label>
            <input type="file" id="ai-title-image" accept="image/*">
          </div>
          <div class="form-group">
            <label>参考标题（可选）</label>
            <input type="text" id="ai-title-reference" placeholder="输入参考标题">
          </div>
          <button id="ai-title-generate" class="btn primary">生成标题</button>
          <div class="form-group">
            <label>生成结果</label>
            <textarea id="ai-title-result" readonly></textarea>
          </div>
        </div>

        <div class="ai-tab-content hidden" id="tab-description">
          <div class="form-group">
            <label>上传图片（可选）</label>
            <input type="file" id="ai-desc-image" accept="image/*">
          </div>
          <div class="form-group">
            <label>参考文案（可选）</label>
            <textarea id="ai-desc-reference" placeholder="输入参考文案"></textarea>
          </div>
          <button id="ai-desc-generate" class="btn primary">生成文案</button>
          <div class="form-group">
            <label>生成结果</label>
            <textarea id="ai-desc-result" readonly></textarea>
          </div>
        </div>

        <div class="ai-tab-content hidden" id="tab-translate">
          <div class="form-group">
            <label>输入文本</label>
            <textarea id="ai-translate-input" placeholder="输入要翻译的中文"></textarea>
          </div>
          <button id="ai-translate-generate" class="btn primary">翻译成英文</button>
          <div class="form-group">
            <label>翻译结果</label>
            <textarea id="ai-translate-result" readonly></textarea>
          </div>
        </div>
      </div>
    `;
  },

  bindEvents() {
    // Tab切换
    document.querySelectorAll('.ai-tab').forEach(btn => {
      btn.onclick = () => {
        document.querySelectorAll('.ai-tab').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.ai-tab-content').forEach(c => c.classList.add('hidden'));
        btn.classList.add('active');
        document.getElementById(`tab-${btn.dataset.tab}`).classList.remove('hidden');
      };
    });

    // 生成标题
    document.getElementById('ai-title-generate').onclick = async () => {
      try {
        const imageInput = document.getElementById('ai-title-image');
        const reference = document.getElementById('ai-title-reference').value;
        let image = null;

        if (imageInput.files[0]) {
          image = await this.fileToBase64(imageInput.files[0]);
        }

        const result = await api.generateTitle(image, reference);
        document.getElementById('ai-title-result').value = result.title;
      } catch (err) {
        Toast.show(err.message, 'error');
      }
    };

    // 生成文案
    document.getElementById('ai-desc-generate').onclick = async () => {
      try {
        const imageInput = document.getElementById('ai-desc-image');
        const reference = document.getElementById('ai-desc-reference').value;
        let image = null;

        if (imageInput.files[0]) {
          image = await this.fileToBase64(imageInput.files[0]);
        }

        const result = await api.generateDescription(image, reference);
        document.getElementById('ai-desc-result').value = result.description;
      } catch (err) {
        Toast.show(err.message, 'error');
      }
    };

    // 翻译
    document.getElementById('ai-translate-generate').onclick = async () => {
      try {
        const text = document.getElementById('ai-translate-input').value;
        const result = await api.translate(text);
        document.getElementById('ai-translate-result').value = result.translated;
      } catch (err) {
        Toast.show(err.message, 'error');
      }
    };
  },

  fileToBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }
};
```

- [ ] **Step 2: 提交更改**

```bash
git add frontend/public/js/pages/user/ai-panel.js
git commit -m "feat: add AI panel for standalone AI functions"
```

---

### Task 16: 创建批量操作组件

**Files:**
- Create: `frontend/public/js/pages/user/batch-actions.js`

- [ ] **Step 1: 实现批量操作逻辑**

```javascript
const BatchActions = {
  async showCopyDialog(ids) {
    const users = await api.getUsers();
    const userOptions = users
      .filter(u => u.id !== State.user.id)
      .map(u => `<option value="${u.id}">${u.username}</option>`)
      .join('');

    Modal.show({
      title: '复制素材',
      content: `
        <div class="batch-dialog">
          <p>将 ${ids.length} 个素材复制给：</p>
          <select id="copy-target-user">
            ${userOptions}
          </select>
        </div>
      `,
      onConfirm: async () => {
        const targetUserId = document.getElementById('copy-target-user').value;
        await api.batchCopy(ids, targetUserId);
        Toast.show('复制成功');
        UserApp.loadMaterials();
      }
    });
  },

  async showMoveDialog(ids) {
    const users = await api.getUsers();
    const userOptions = users
      .filter(u => u.id !== State.user.id)
      .map(u => `<option value="${u.id}">${u.username}</option>`)
      .join('');

    Modal.show({
      title: '移动素材',
      content: `
        <div class="batch-dialog">
          <p>将 ${ids.length} 个素材移动给：</p>
          <select id="move-target-user">
            ${userOptions}
          </select>
          <p>目标文件夹：</p>
          <select id="move-target-folder">
            <option value="images">图片</option>
            <option value="videos">视频</option>
          </select>
        </div>
      `,
      onConfirm: async () => {
        const targetUserId = document.getElementById('move-target-user').value;
        const targetFolder = document.getElementById('move-target-folder').value;
        await api.batchMove(ids, targetUserId, targetFolder);
        Toast.show('移动成功');
        UserApp.loadMaterials();
      }
    });
  }
};
```

- [ ] **Step 2: 提交更改**

```bash
git add frontend/public/js/pages/user/batch-actions.js
git commit -m "feat: add batch actions (copy/move)"
```

---

### Task 17: 创建素材页面逻辑

**Files:**
- Modify: `frontend/public/js/pages/user/materials.js`
- Create: `frontend/public/js/pages/user/trash.js`

- [ ] **Step 1: 完善素材页面逻辑**

包括：
- 加载素材
- 渲染网格
- 选择模式
- 批量操作
- 上传功能
- 手机端侧边栏

- [ ] **Step 2: 创建垃圾箱页面逻辑**

- [ ] **Step 3: 提交更改**

```bash
git add frontend/public/js/pages/user/materials.js
git add frontend/public/js/pages/user/trash.js
git commit -m "feat: complete materials and trash page logic"
```

---

### Task 18: 创建主应用入口

**Files:**
- Create/Modify: `frontend/public/js/user-app.js`

- [ ] **Step 1: 实现主应用逻辑**

整合所有组件，实现完整的用户端应用逻辑。

- [ ] **Step 2: 提交更改**

```bash
git add frontend/public/js/user-app.js
git commit -m "feat: add main user app entry point"
```

---

## 阶段五：前端管理后台

### Task 19: 完善管理后台

**Files:**
- Modify: `frontend/public/admin.html`
- Modify: `frontend/public/css/admin.css`
- Modify: `frontend/public/js/admin-app.js`
- Create/Modify: `frontend/public/js/pages/admin/*.js`

- [ ] **Step 1: 完善管理后台各页面**
  - 仪表盘
  - 用户管理
  - 素材管理
  - 操作日志
  - 备份管理
  - AI设置页面

- [ ] **Step 2: 提交更改**

```bash
git add frontend/public/admin.html
git add frontend/public/css/admin.css
git add frontend/public/js/admin-app.js
git add frontend/public/js/pages/admin/*.js
git commit -m "feat: complete admin backend"
```

---

## 阶段六：测试与部署

### Task 20: 测试后端

**Files:**
- Test: backend functionality

- [ ] **Step 1: 启动后端服务**

```bash
cd backend
npm install
npm start
```

- [ ] **Step 2: 测试API端点**
  - 登录
  - 素材CRUD
  - 批量操作
  - AI功能
  - 视频下载

---

### Task 21: 测试前端

**Files:**
- Test: frontend functionality

- [ ] **Step 1: 测试用户端功能**
  - 登录
  - 素材浏览
  - 素材编辑
  - AI功能
  - 批量操作
  - 主题切换
  - 响应式设计

- [ ] **Step 2: 测试管理后台**

---

### Task 22: 创建启动脚本

**Files:**
- Create: `start.sh`
- Create: `启动.bat`
- Create: `docker-compose.yml` (if needed)

- [ ] **Step 1: 创建启动脚本**

- [ ] **Step 2: 提交更改**

```bash
git add start.sh
git add 启动.bat
git commit -m "feat: add startup scripts"
```

---

### Task 23: 最终测试与验证

- [ ] **Step 1: 端到端测试**
- [ ] **Step 2: 手机端测试**
- [ ] **Step 3: 文档更新**

---

## 总结

本实现计划分6个阶段，共23个任务，完整实现V2的所有功能到V3架构中：

1. **数据库层完善** - Schema更新、抽象接口、SQLite实现
2. **后端API完善** - 登录、素材、用户、AI接口
3. **前端用户端基础** - 样式、状态、API、HTML
4. **前端用户端组件** - 登录、详情、AI面板、批量操作
5. **前端管理后台** - 管理后台各页面
6. **测试与部署** - 测试、脚本、文档

每个任务都是独立可提交的小步骤，确保开发过程安全可控。

