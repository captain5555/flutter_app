---
name: V2功能迁移到V3架构设计
description: 在V3架构基础上实现V2的所有功能，包括AI功能、视频下载、主题切换等
type: spec
---

# V2功能迁移到V3架构设计

## 概述

本文档描述如何在V3现有架构基础上，完整实现V2版本的所有功能，同时保持V3的模块化架构和扩展性。

## 现状分析

### V3已有功能

**后端：**
- 数据库抽象层（SQLite实现 + 抽象接口）
- 存储抽象层（本地文件系统 + OSS）
- JWT认证中间件
- 权限检查中间件
- 操作日志中间件
- 自动备份服务
- AI功能基础（设置管理、标题生成、文案生成、翻译）
- 素材管理API基础
- 用户管理API基础

**前端：**
- 模块化骨架（用户端 + 管理后台分离）
- 基础组件（Toast、Modal、MaterialCard、FileUploader）
- 基础页面框架（登录、素材列表、垃圾箱）

### V2需要补充的功能

**数据库层：**
- materials表缺少title、description字段
- 缺少默认用户（user1、user2、user3）初始化
- 缺少管理员查看所有垃圾箱的方法

**后端API：**
- 视频下载接口
- 完善素材更新接口（支持title、description）
- 完善用户删除逻辑（素材转移给admin）

**前端：**
- 完整的素材详情编辑弹窗
- AI功能UI（生成标题、生成文案、翻译）
- 完整的批量操作（复制给用户、移动给用户）
- 亮色/深色主题切换
- 完整的响应式设计（手机端优化）
- 视频下载功能
- 无密码登录体验

## 数据库设计变更

### Schema更新

**文件：** `backend/src/db/schema.sql`

在materials表中添加缺失字段：

```sql
-- Materials table (updated)
CREATE TABLE IF NOT EXISTS materials (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  folder_type VARCHAR(50) DEFAULT 'images',
  file_name VARCHAR(255) NOT NULL,
  title VARCHAR(255),           -- 新增：标题
  description TEXT,             -- 新增：描述
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

添加默认用户（V2兼容，无密码）：

```sql
-- Insert default users (V2 compatibility - no password)
INSERT OR IGNORE INTO users (id, username, password_hash, role) VALUES
  ('user1', 'user1', '', 'user'),
  ('user2', 'user2', '', 'user'),
  ('user3', 'user3', '', 'user');
```

### 数据库抽象接口更新

**文件：** `backend/src/db/abstract.js`

在AbstractDatabase中补充方法：

```javascript
// 获取所有用户的垃圾箱素材（管理员用）
async getAllTrashMaterials() { throw new Error('Not implemented'); }

// 删除用户并转移素材
async deleteUserAndTransferMaterials(userId, targetUserId = 'admin') { throw new Error('Not implemented'); }
```

### SQLite实现更新

**文件：** `backend/src/db/sqlite.js`

补充以下方法：

1. **updateMaterial - 支持title和description**
```javascript
async updateMaterial(id, data) {
  return new Promise((resolve, reject) => {
    const fields = [];
    const values = [];

    ['file_name', 'folder_type', 'usage_tag', 'viral_tag', 'title', 'description'].forEach(key => {
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
```

2. **getAllTrashMaterials - 管理员查看所有垃圾箱**
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

3. **deleteUserAndTransferMaterials - 删除用户并转移素材**
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

## 后端API设计

### 素材API补充

**文件：** `backend/src/routes/materials.js`

添加视频下载接口：

```javascript
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

  const filePath = path.join(__dirname, '../../data/uploads', material.file_path);

  if (!fs.existsSync(filePath)) {
    return sendError(res, 'File not found', 404);
  }

  res.download(filePath, material.file_name);
}));
```

更新垃圾箱接口支持管理员查看所有：

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

### 用户API更新

**文件：** `backend/src/routes/users.js`

更新删除用户接口：

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

### 认证API兼容V2

**文件：** `backend/src/routes/auth.js`

添加简化登录接口（兼容V2无密码体验）：

```javascript
// Simplified login (V2 compatibility - no password)
router.post('/login-simple', asyncHandler(async (req, res) => {
  const { username } = req.body;

  const user = await db.getUserByUsername(username);
  if (!user) {
    return sendError(res, 'User not found', 401);
  }

  // Generate token
  const token = jwt.sign(
    { id: user.id, username: user.username, role: user.role },
    config.jwt.secret,
    { expiresIn: config.jwt.expiresIn }
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

## 前端设计

### 前端目录结构

```
frontend/public/
├── index.html                    # 用户端入口
├── admin.html                    # 管理后台入口
├── css/
│   ├── common.css                # 公共样式 + CSS变量（主题）
│   ├── user.css                  # 用户端样式
│   └── admin.css                 # 管理后台样式
└── js/
    ├── api.js                    # API封装（完整）
    ├── state.js                  # 状态管理（含主题）
    ├── components/
    │   ├── Toast.js
    │   ├── Modal.js
    │   ├── MaterialCard.js       # 编辑按钮、下载按钮
    │   └── FileUploader.js
    ├── pages/user/
    │   ├── login.js              # 无密码用户选择
    │   ├── materials.js          # 完整功能
    │   ├── trash.js              # 完整功能
    │   ├── settings.js           # 新增：主题切换
    │   ├── material-detail.js    # 新增：素材详情编辑
    │   └── ai-panel.js           # 新增：AI功能面板
    ├── pages/admin/
    │   ├── dashboard.js
    │   ├── users.js
    │   ├── materials.js
    │   ├── logs.js
    │   └── backups.js
    ├── user-app.js               # 用户端主入口
    └── admin-app.js              # 管理后台主入口
```

### 公共样式（主题支持）

**文件：** `frontend/public/css/common.css`

定义CSS变量支持主题切换：

```css
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
```

### API封装

**文件：** `frontend/public/js/api.js`

封装所有V2功能的API调用：

```javascript
const API = {
  // Auth
  async loginSimple(username) { return this.post('/auth/login-simple', { username }); },

  // Materials
  async getMaterials(userId, folderType) { return this.get(`/materials/user/${userId}/folder/${folderType}`); },
  async getTrash(userId, all = false) { return this.get(`/materials/user/${userId}/trash${all ? '?all=true' : ''}`); },
  async getMaterial(id) { return this.get(`/materials/${id}`); },
  async updateMaterial(id, data) { return this.put(`/materials/${id}`, data); },
  async deleteMaterial(id) { return this.delete(`/materials/${id}`); },
  async downloadMaterial(id) { window.location.href = `${this.baseUrl}/materials/${id}/download?token=${this.token}`; },
  async uploadMaterial(file, folderType, onProgress) { /* ... */ },

  // Batch operations
  async batchTrash(ids) { return this.post('/materials/batch/trash', { ids }); },
  async batchRestore(ids) { return this.post('/materials/batch/restore', { ids }); },
  async batchDelete(ids) { return this.delete('/materials/batch', { ids }); },
  async batchCopy(ids, targetUserId) { return this.post('/materials/batch/copy', { ids, targetUserId }); },
  async batchMove(ids, targetUserId, targetFolder) { return this.post('/materials/batch/move', { ids, targetUserId, targetFolder }); },

  // AI
  async getAISettings() { return this.get('/ai/settings'); },
  async saveAISettings(settings) { return this.put('/ai/settings', settings); },
  async generateTitle(image, currentTitle) { return this.post('/ai/generate-title', { image, current_title: currentTitle }); },
  async generateDescription(image, currentDescription) { return this.post('/ai/generate-description', { image, current_description: currentDescription }); },
  async translate(text) { return this.post('/ai/translate', { text }); },

  // Users
  async getUsers() { return this.get('/users'); },
  async createUser(name) { return this.post('/users', { name }); },
  async deleteUser(id) { return this.delete(`/users/${id}`); },
};
```

### 状态管理

**文件：** `frontend/public/js/state.js`

添加主题状态管理：

```javascript
const State = {
  user: null,
  token: null,
  currentFolder: 'images',
  materials: [],
  selectedIds: new Set(),
  theme: 'light', // 'light' | 'dark'

  init() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    this.setTheme(savedTheme);

    const savedToken = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    if (savedToken && savedUser) {
      this.token = savedToken;
      this.user = JSON.parse(savedUser);
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
};
```

### 用户端主页面

**文件：** `frontend/public/index.html`

参考V2的布局，保持响应式设计：

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
      <!-- 用户选择登录 -->
    </div>

    <!-- Main App Layout -->
    <div id="main-app" class="app-layout hidden">
      <!-- Mobile Menu Button -->
      <button id="menu-btn" class="hamburger-btn">☰</button>

      <!-- Sidebar -->
      <aside id="sidebar" class="sidebar">
        <div class="sidebar-header">
          <h2>素材管理</h2>
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
          </div>
          <div class="toolbar-right">
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
  <script src="js/pages/user/settings.js"></script>
  <script src="js/pages/user/material-detail.js"></script>
  <script src="js/pages/user/ai-panel.js"></script>
  <script src="js/user-app.js"></script>
</body>
</html>
```

### 素材详情弹窗

**文件：** `frontend/public/js/pages/user/material-detail.js`

实现完整的素材编辑功能：

```javascript
const MaterialDetail = {
  async show(materialId) {
    const material = await API.getMaterial(materialId);

    Modal.show({
      title: '素材详情',
      content: `
        <div class="material-detail">
          <div class="material-preview">
            ${material.file_type?.startsWith('video/')
              ? `<video src="${material.file_url}" controls></video>`
              : `<img src="${material.file_url}" alt="${material.title || material.file_name}">`
            }
          </div>

          <div class="material-form">
            <div class="form-group">
              <label>文件名</label>
              <input type="text" id="detail-filename" value="${material.file_name}" disabled>
            </div>

            <div class="form-group">
              <label>标题</label>
              <input type="text" id="detail-title" value="${material.title || ''}" placeholder="输入标题">
              <button id="ai-title-btn" class="ai-btn">✨ AI生成</button>
            </div>

            <div class="form-group">
              <label>描述</label>
              <textarea id="detail-description" placeholder="输入描述">${material.description || ''}</textarea>
              <button id="ai-desc-btn" class="ai-btn">✨ AI生成</button>
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
              ${material.folder_type === 'videos' ? '<button id="download-btn" class="btn secondary">下载视频</button>' : ''}
              <button id="save-btn" class="btn primary">保存</button>
            </div>
          </div>
        </div>
      `,
      onMount: () => this.bindEvents(material)
    });
  },

  async bindEvents(material) {
    // 保存
    document.getElementById('save-btn').onclick = async () => {
      await API.updateMaterial(material.id, {
        title: document.getElementById('detail-title').value,
        description: document.getElementById('detail-description').value,
        usage_tag: document.getElementById('detail-usage-tag').value,
        viral_tag: document.getElementById('detail-viral-tag').value
      });
      Toast.show('保存成功');
      Modal.hide();
      MaterialsPage.refresh();
    };

    // 下载
    const downloadBtn = document.getElementById('download-btn');
    if (downloadBtn) {
      downloadBtn.onclick = () => API.downloadMaterial(material.id);
    }

    // AI生成标题
    document.getElementById('ai-title-btn').onclick = async () => {
      const image = material.file_type?.startsWith('image/') ? material.file_url : null;
      const currentTitle = document.getElementById('detail-title').value;
      const result = await API.generateTitle(image, currentTitle);
      document.getElementById('detail-title').value = result.title;
    };

    // AI生成文案
    document.getElementById('ai-desc-btn').onclick = async () => {
      const image = material.file_type?.startsWith('image/') ? material.file_url : null;
      const currentDesc = document.getElementById('detail-description').value;
      const result = await API.generateDescription(image, currentDesc);
      document.getElementById('detail-description').value = result.description;
    };
  }
};
```

### AI功能面板

**文件：** `frontend/public/js/pages/user/ai-panel.js`

提供独立的AI功能面板：

```javascript
const AIPanel = {
  show() {
    Modal.show({
      title: 'AI助手',
      content: `
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
            <!-- 类似结构 -->
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
      `,
      onMount: () => this.bindEvents()
    });
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
      // 实现逻辑
    };

    // 翻译
    document.getElementById('ai-translate-generate').onclick = async () => {
      const text = document.getElementById('ai-translate-input').value;
      const result = await API.translate(text);
      document.getElementById('ai-translate-result').value = result.translated;
    };
  }
};
```

## 部署配置

### Docker配置

保持V3的Docker配置，确保与V2兼容。

### 启动脚本

**文件：** `start.sh`（Linux/Mac）和 `启动.bat`（Windows）

提供简单的启动方式，与V2保持一致体验。

### 数据迁移脚本

**文件：** `scripts/migrate-v2-to-v3.js`

提供从V2迁移到V3的脚本：

```javascript
// 迁移用户
// 迁移素材（补充title、description字段）
// 迁移AI设置
// 迁移文件到新目录结构
```

## 实现计划

### 阶段一：数据库层完善
1. 更新schema.sql添加title、description字段
2. 更新sqlite.js实现所有缺失方法
3. 添加默认用户初始化

### 阶段二：后端API完善
1. 补充视频下载接口
2. 完善素材更新接口
3. 完善用户删除逻辑
4. 添加简化登录接口

### 阶段三：前端用户端
1. 实现主题切换
2. 实现无密码登录
3. 实现素材详情编辑弹窗
4. 实现AI功能UI
5. 实现完整批量操作
6. 实现视频下载
7. 响应式优化

### 阶段四：前端管理后台
1. 完善管理后台各页面
2. 添加AI设置页面

### 阶段五：测试与部署
1. 功能测试
2. 编写迁移脚本
3. 更新部署文档

## 总结

本设计在V3现有架构基础上，补充实现V2的所有功能，同时保持V3的模块化和扩展性。核心是：

1. 数据库层补充字段和方法
2. API层保持V3架构，补充缺失端点
3. 前端按V3设计文档模块化，但实现V2的所有功能
4. 保持V2的用户体验（无密码登录等）

