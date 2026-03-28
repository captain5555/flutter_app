---
name: NAS 素材管理系统 v3 架构设计
description: 支持 PC 网页端、管理后台、iOS APP 的多端素材管理系统，支持本地 NAS 和云端部署
type: project
---

# NAS 素材管理系统 v3 架构设计

## 概述

本设计是对现有 NAS 素材管理系统的重构优化，主要解决：
1. 前端单文件过大（85KB）的维护性问题
2. 支持后续 iOS APP 开发
3. 数据安全与备份
4. 灵活的部署方式（阿里云测试 → NAS 本地部署）

## 架构设计

### 整体架构图

```
┌─────────────────────────────────────────────────────────────┐
│                        前端层                                 │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────────┐  ┌──────────────────┐                │
│  │  用户端 (PC网页) │  │  管理后台 (PC网页)│                │
│  │  - 素材浏览      │  │  - 用户管理       │                │
│  │  - 素材上传/管理 │  │  - 文件夹管理     │                │
│  │  - 个人设置      │  │  - 系统监控       │                │
│  └────────┬─────────┘  └────────┬─────────┘                │
│           │                       │                           │
│  ┌────────▼─────────┐  ┌────────▼─────────┐                │
│  │   iOS APP        │  │  未来其他端       │                │
│  └──────────────────┘  └──────────────────┘                │
└───────────────────────┬─────────────────────────────────────┘
                        │
              ┌─────────▼─────────┐
              │   RESTful API     │
              │   (Express 后端)   │
              └─────────┬─────────┘
    ┌───────────────────┼───────────────────┐
    ▼                   ▼                   ▼
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│  存储抽象层     │ │  数据库抽象层    │ │  认证/权限层    │
│  (本地/OSS)     │ │  (SQLite/Pg)     │ │  (JWT + 权限)   │
└────────┬────────┘ └────────┬────────┘ └────────┬────────┘
         │                   │                   │
         ▼                   ▼                   ▼
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│  实际存储       │ │  实际数据库      │ │  安全模块       │
│  - 本地文件系统 │ │  - SQLite (NAS) │ │  - 自动备份     │
│  - 阿里云 OSS   │ │  - PostgreSQL    │ │  - 操作日志     │
└─────────────────┘ └─────────────────┘ └─────────────────┘
```

## 目录结构

### 项目根目录

```
nas-material-manager-v3/
├── frontend/              # 前端代码
├── backend/               # 后端代码
├── docs/                  # 文档
├── deploy/                # 部署脚本
├── docker-compose.yml     # Docker 配置
├── Dockerfile             # Docker 镜像
├── start.sh               # Linux/Mac 启动脚本
└── 启动.bat               # Windows 启动脚本
```

### 前端目录结构

```
frontend/
├── public/
│   ├── index.html              # 用户端入口
│   ├── admin.html              # 管理后台入口
│   ├── css/
│   │   ├── common.css          # 公共样式
│   │   ├── user.css            # 用户端样式
│   │   └── admin.css           # 管理后台样式
│   ├── js/
│   │   ├── api.js              # API 封装
│   │   ├── state.js            # 状态管理
│   │   ├── components/         # UI 组件
│   │   │   ├── MaterialCard.js
│   │   │   ├── FileUploader.js
│   │   │   ├── Modal.js
│   │   │   └── Toast.js
│   │   ├── pages/
│   │   │   ├── user/           # 用户端页面
│   │   │   │   ├── login.js
│   │   │   │   ├── materials.js
│   │   │   │   ├── trash.js
│   │   │   │   └── settings.js
│   │   │   └── admin/          # 管理后台页面
│   │   │       ├── dashboard.js
│   │   │       ├── users.js
│   │   │       ├── folders.js
│   │   │       ├── materials.js
│   │   │       ├── logs.js
│   │   │       └── backups.js
│   │   ├── user-app.js         # 用户端入口脚本
│   │   └── admin-app.js        # 管理后台入口脚本
│   └── assets/                 # 静态资源
│       └── icons/
```

### 后端目录结构

```
backend/
├── src/
│   ├── server.js              # 服务器入口
│   ├── config/                # 配置
│   │   ├── index.js           # 配置加载器
│   │   ├── database.js        # 数据库配置
│   │   └── storage.js         # 存储配置
│   ├── db/                    # 数据库层
│   │   ├── abstract.js        # 数据库抽象接口
│   │   ├── sqlite.js          # SQLite 实现
│   │   ├── postgres.js        # PostgreSQL 实现
│   │   └── schema.sql         # 表结构
│   ├── storage/               # 存储层
│   │   ├── abstract.js        # 存储抽象接口
│   │   ├── local.js           # 本地文件系统实现
│   │   └── oss.js             # 阿里云 OSS 实现
│   ├── middleware/            # 中间件
│   │   ├── auth.js            # 认证中间件
│   │   ├── permission.js      # 权限检查
│   │   └── logger.js          # 操作日志
│   ├── routes/                # API 路由
│   │   ├── auth.js            # 登录/登出
│   │   ├── users.js           # 用户管理
│   │   ├── materials.js       # 素材管理
│   │   ├── folders.js         # 文件夹管理
│   │   ├── admin.js           # 管理后台 API
│   │   └── system.js          # 系统监控
│   ├── services/              # 业务逻辑
│   │   ├── backup.js          # 自动备份
│   │   └── storage.js         # 存储服务
│   └── utils/                 # 工具函数
│       ├── validators.js
│       └── helpers.js
├── data/                      # 数据目录（git 忽略）
│   ├── db/                    # 数据库文件
│   ├── uploads/               # 上传文件
│   │   ├── images/
│   │   ├── videos/
│   │   └── others/
│   └── backups/               # 备份文件
├── package.json
└── .env.example               # 环境变量示例
```

## 核心模块设计

### 1. 数据库抽象层

**文件**: `backend/src/db/abstract.js`

统一接口定义，支持 SQLite 和 PostgreSQL 切换。

```javascript
interface Database {
  // 用户操作
  getUser(id);
  getUserByUsername(username);
  createUser(data);
  updateUser(id, data);
  deleteUser(id);
  getAllUsers();

  // 素材操作
  getMaterial(id);
  getMaterials(userId, folderType, options);
  getTrashMaterials(userId);
  createMaterial(data);
  updateMaterial(id, data);
  deleteMaterial(id);
  batchMoveToTrash(ids);
  batchRestore(ids);
  batchDelete(ids);
  batchCopy(ids, targetUserId);
  batchMove(ids, targetUserId, targetFolder);

  // 文件夹操作
  getFolders(userId);
  createFolder(userId, name);
  updateFolder(id, name);
  deleteFolder(id);

  // 操作日志
  createLog(data);
  getLogs(filters);

  // 管理后台
  getAllMaterials(filters);
  getStorageStats();
}
```

### 2. 存储抽象层

**文件**: `backend/src/storage/abstract.js`

统一接口定义，支持本地文件系统和阿里云 OSS 切换。

```javascript
interface Storage {
  uploadFile(fileBuffer, filePath, options);
  deleteFile(filePath);
  getFileUrl(filePath, expiresIn);
  fileExists(filePath);
  getFileSize(filePath);
  listFiles(prefix);
}
```

### 3. 认证与权限中间件

**文件**: `backend/src/middleware/auth.js`

- JWT Token 认证
- Token 刷新机制
- 角色权限检查（user/admin）

### 4. 自动备份服务

**文件**: `backend/src/services/backup.js`

- 定时备份（每天凌晨）
- 备份文件压缩
- 保留策略（7天）
- 手动备份触发

## API 设计

### 认证 API

| 方法 | 端点 | 描述 | 权限 |
|------|------|------|------|
| POST | `/api/auth/login` | 用户登录 | 公开 |
| POST | `/api/auth/logout` | 用户登出 | 已认证 |
| GET | `/api/auth/me` | 获取当前用户信息 | 已认证 |

### 用户 API

| 方法 | 端点 | 描述 | 权限 |
|------|------|------|------|
| GET | `/api/users` | 获取用户列表 | admin |
| GET | `/api/users/:id` | 获取用户详情 | admin 或 本人 |
| POST | `/api/users` | 创建用户 | admin |
| PUT | `/api/users/:id` | 更新用户 | admin 或 本人 |
| DELETE | `/api/users/:id` | 删除用户 | admin |

### 素材 API

| 方法 | 端点 | 描述 | 权限 |
|------|------|------|------|
| GET | `/api/users/:userId/materials` | 获取用户素材列表 | admin 或 本人 |
| GET | `/api/users/:userId/trash` | 获取垃圾箱素材 | admin 或 本人 |
| GET | `/api/materials/:id` | 获取素材详情 | admin 或 所有者 |
| POST | `/api/materials/upload` | 上传素材 | 已认证 |
| PUT | `/api/materials/:id` | 更新素材 | admin 或 所有者 |
| DELETE | `/api/materials/:id` | 删除素材 | admin 或 所有者 |
| POST | `/api/materials/batch/trash` | 批量移到垃圾箱 | admin 或 所有者 |
| POST | `/api/materials/batch/restore` | 批量恢复 | admin 或 所有者 |
| DELETE | `/api/materials/batch` | 批量永久删除 | admin 或 所有者 |
| POST | `/api/materials/batch/copy` | 批量复制 | admin 或 所有者 |
| POST | `/api/materials/batch/move` | 批量移动 | admin 或 所有者 |

### 文件夹 API

| 方法 | 端点 | 描述 | 权限 |
|------|------|------|------|
| GET | `/api/users/:userId/folders` | 获取用户文件夹 | admin 或 本人 |
| POST | `/api/folders` | 创建文件夹 | 已认证 |
| PUT | `/api/folders/:id` | 更新文件夹 | admin 或 所有者 |
| DELETE | `/api/folders/:id` | 删除文件夹 | admin 或 所有者 |

### 管理后台 API

| 方法 | 端点 | 描述 | 权限 |
|------|------|------|------|
| GET | `/api/admin/stats` | 获取系统统计 | admin |
| GET | `/api/admin/logs` | 获取操作日志 | admin |
| POST | `/api/admin/backup` | 触发备份 | admin |
| GET | `/api/admin/backups` | 获取备份列表 | admin |
| GET | `/api/admin/backups/:id/download` | 下载备份 | admin |

## 数据安全设计

### 1. 认证安全
- 使用 JWT Token 认证
- Token 有效期：24 小时
- 密码使用 bcrypt 加密存储
- 登录失败次数限制（5 次锁定 15 分钟）

### 2. 权限控制
- 基于角色的访问控制（RBAC）
- user 角色：只能操作自己的资源
- admin 角色：可以操作所有资源

### 3. 数据备份
- 自动备份：每天凌晨 2 点
- 保留策略：保留最近 7 天备份
- 备份内容：数据库 + 配置文件
- 备份格式：ZIP 压缩

### 4. 操作日志
- 记录所有重要操作
- 日志内容：用户、时间、操作类型、IP、详情
- 日志保留：90 天
- 管理后台可查询和导出

### 5. 文件安全
- 文件类型白名单：图片（jpg, png, gif, webp）、视频（mp4, mov, avi）
- 文件大小限制：图片 50MB，视频 500MB
- 文件名清洗：防止路径遍历攻击
- 病毒扫描：预留接口

## 部署方案

### 配置文件

**文件**: `backend/.env`

```env
# 服务器配置
PORT=3000
NODE_ENV=production

# 数据库类型: sqlite 或 postgres
DATABASE_TYPE=sqlite

# 存储类型: local 或 oss
STORAGE_TYPE=local

# JWT 密钥（生产环境请修改）
JWT_SECRET=your-secret-key-change-in-production

# 阿里云 OSS 配置（可选）
OSS_ACCESS_KEY_ID=
OSS_ACCESS_KEY_SECRET=
OSS_BUCKET=
OSS_REGION=oss-cn-hangzhou

# 备份配置
BACKUP_ENABLED=true
BACKUP_SCHEDULE=0 2 * * *
BACKUP_RETENTION_DAYS=7

# 日志配置
LOG_RETENTION_DAYS=90
```

### Docker 部署

**文件**: `docker-compose.yml`

```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    volumes:
      - ./data:/app/data
      - ./backend/.env:/app/.env
    environment:
      - NODE_ENV=production
    restart: unless-stopped
```

### 一键启动脚本

**Windows**: `启动.bat`

**Linux/Mac**: `start.sh`

## 数据库表结构

### users 表

| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER | 主键 |
| username | VARCHAR(50) | 用户名（唯一） |
| password_hash | VARCHAR(255) | 密码哈希 |
| role | VARCHAR(20) | 角色：user/admin |
| created_at | DATETIME | 创建时间 |
| updated_at | DATETIME | 更新时间 |

### materials 表

| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER | 主键 |
| user_id | INTEGER | 用户 ID |
| folder_type | VARCHAR(50) | 文件夹类型 |
| file_name | VARCHAR(255) | 文件名 |
| file_path | VARCHAR(500) | 文件路径 |
| file_size | BIGINT | 文件大小（字节） |
| file_type | VARCHAR(50) | 文件类型 |
| thumbnail_path | VARCHAR(500) | 缩略图路径 |
| usage_tag | VARCHAR(20) | 使用状态 |
| viral_tag | VARCHAR(20) | 爆款状态 |
| is_deleted | BOOLEAN | 是否删除 |
| created_at | DATETIME | 创建时间 |
| updated_at | DATETIME | 更新时间 |
| deleted_at | DATETIME | 删除时间 |

### operation_logs 表

| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER | 主键 |
| user_id | INTEGER | 用户 ID |
| action | VARCHAR(50) | 操作类型 |
| target_type | VARCHAR(50) | 目标类型 |
| target_id | INTEGER | 目标 ID |
| details | TEXT | 详情 |
| ip_address | VARCHAR(50) | IP 地址 |
| created_at | DATETIME | 创建时间 |

## 迁移计划

### 阶段一：项目初始化
- 创建新项目目录结构
- 搭建基础后端框架
- 搭建基础前端结构

### 阶段二：后端重构
- 实现数据库抽象层
- 实现存储抽象层
- 实现认证权限系统
- 实现备份和日志系统
- API 接口实现

### 阶段三：前端重构
- 拆分原 index.html 为模块化文件
- 实现用户端页面
- 实现管理后台页面

### 阶段四：测试与部署
- 功能测试
- 编写部署文档
- Docker 配置

## iOS APP 对接指南

### API 基础信息
- Base URL: `http://your-server:3000/api`
- 认证方式: Bearer Token (JWT)
- 数据格式: JSON

### 认证流程
1. 调用 `/api/auth/login` 获取 Token
2. 后续请求 Header 中携带: `Authorization: Bearer <token>`
3. Token 过期前调用刷新接口或重新登录

### 常用 API 示例
详见「API 设计」章节。

---

**设计文档版本**: v1.0
**创建日期**: 2026-03-28
**最后更新**: 2026-03-28
