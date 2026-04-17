---
name: Flutter iOS App Design
description: NAS 素材管理系统 v3 Flutter iOS App 设计文档
type: spec
---

# NAS 素材管理系统 v3 - Flutter iOS App 设计文档

## 概述

基于 NAS 素材管理系统 v3 后端 API，使用 Flutter 开发原生 iOS App，完全复刻 Web 端功能，提供流畅的移动端体验。

## 技术选型

- **框架**: Flutter (Dart)
- **状态管理**: Provider
- **网络请求**: Dio
- **本地存储**: Hive
- **图片缓存**: cached_network_image
- **视频播放**: video_player
- **文件选择**: file_picker

## 项目结构

```
flutter_app/
├── lib/
│   ├── main.dart                 # 应用入口
│   ├── config/                   # 配置
│   │   └── app_config.dart       # 应用配置（API地址等）
│   ├── providers/                # 状态管理
│   │   ├── auth_provider.dart    # 认证状态
│   │   ├── material_provider.dart # 素材状态
│   │   ├── theme_provider.dart   # 主题状态
│   │   └── settings_provider.dart # 设置状态
│   ├── services/                 # API 服务层
│   │   ├── api_service.dart      # 基础 API 封装
│   │   ├── auth_service.dart     # 认证接口
│   │   ├── material_service.dart # 素材接口
│   │   ├── user_service.dart     # 用户接口
│   │   └── ai_service.dart       # AI 接口
│   ├── models/                   # 数据模型
│   │   ├── user.dart
│   │   ├── material.dart
│   │   └── ai_settings.dart
│   ├── screens/                  # 页面
│   │   ├── login/
│   │   │   └── login_screen.dart
│   │   ├── home/
│   │   │   └── home_screen.dart
│   │   ├── material/
│   │   │   ├── material_detail_screen.dart
│   │   │   └── material_edit_screen.dart
│   │   ├── trash/
│   │   │   └── trash_screen.dart
│   │   ├── admin/
│   │   │   ├── user_management_screen.dart
│   │   │   └── ai_settings_screen.dart
│   │   └── settings/
│   │       └── settings_screen.dart
│   ├── widgets/                  # 通用组件
│   │   ├── material_card.dart
│   │   ├── material_grid.dart
│   │   ├── batch_action_bar.dart
│   │   └── ai_panel.dart
│   ├── utils/                    # 工具函数
│   │   ├── api_interceptor.dart
│   │   ├── token_storage.dart
│   │   └── file_helper.dart
│   └── constants/                # 常量
│       ├── api_constants.dart
│       └── theme_constants.dart
├── ios/                          # iOS 原生配置
├── android/                      # Android 原生配置
└── pubspec.yaml
```

## 功能模块

### 1. 认证模块

**功能:**
- 用户列表选择登录（无密码）
- JWT Token 自动管理
- 自动登录（App 重启后恢复）
- 退出登录

**API 接口:**
- `GET /api/users` - 获取用户列表
- `POST /api/auth/login-simple` - 登录
- `POST /api/auth/refresh` - 刷新 Token
- `POST /api/auth/logout` - 退出登录

### 2. 素材浏览模块

**功能:**
- 图片/视频文件夹切换
- GridView 网格布局
- 下拉刷新
- 上拉加载更多
- 素材搜索

**API 接口:**
- `GET /api/materials/user/:userId/folder/:folderType`

### 3. 素材操作模块

**功能:**
- 查看大图/播放视频
- 编辑标题、描述、标签
- 文件上传（相册选择）
- 视频下载到相册

**API 接口:**
- `GET /api/materials/:id`
- `PUT /api/materials/:id`
- `POST /api/materials/upload`
- `GET /api/materials/:id/download`

### 4. 批量操作模块

**功能:**
- 长按进入多选模式
- 批量删除（移到垃圾箱）
- 批量恢复
- 批量复制给用户
- 批量移动给用户

**API 接口:**
- `POST /api/materials/batch/trash`
- `POST /api/materials/batch/restore`
- `POST /api/materials/batch/copy`
- `POST /api/materials/batch/move`
- `DELETE /api/materials/batch`

### 5. 垃圾箱模块

**功能:**
- 查看已删除素材
- 单个/批量恢复
- 永久删除（管理员）

**API 接口:**
- `GET /api/materials/user/:userId/trash`

### 6. 用户管理模块（管理员）

**功能:**
- 用户列表
- 创建用户
- 删除用户（素材转移给 admin）

**API 接口:**
- `GET /api/users`
- `POST /api/users`
- `DELETE /api/users/:id`

### 7. AI 助手模块

**功能:**
- AI 生成标题
- AI 生成描述
- AI 翻译
- AI 设置（管理员）

**API 接口:**
- `POST /api/ai/generate-title`
- `POST /api/ai/generate-description`
- `POST /api/ai/translate`
- `GET /api/ai/settings`
- `PUT /api/ai/settings`

### 8. 设置模块

**功能:**
- 亮色/深色主题切换
- API 服务器地址配置
- 清除缓存
- 退出登录

## 状态管理

### AuthProvider
```dart
- user: User?
- token: String?
- isLoading: bool
- isAuthenticated: bool

+ login(username)
+ logout()
+ refreshToken()
```

### MaterialProvider
```dart
- materials: List<Material>
- isLoading: bool
- error: String?
- selectedIds: Set<int>

+ fetchMaterials(userId, folderType)
+ updateMaterial(id, data)
+ trashMaterials(ids)
+ restoreMaterials(ids)
+ selectMaterial(id)
+ clearSelection()
```

### ThemeProvider
```dart
- themeMode: ThemeMode

+ toggleTheme()
+ setThemeMode(mode)
```

### SettingsProvider
```dart
- apiBaseUrl: String

+ setApiBaseUrl(url)
+ clearCache()
```

## API 对接设计

### 响应格式
```json
{
  "success": true,
  "data": { ... }
}
```

```json
{
  "success": false,
  "error": "错误信息"
}
```

### 请求头
```
Authorization: Bearer <token>
Content-Type: application/json
```

### 错误处理
- 401: 清除 Token，跳转登录页
- 网络错误: 显示"网络连接失败"，支持重试
- 其他错误: 显示后端返回的 error 信息

## UI 设计

### 页面导航
```
LoginScreen
  ↓
HomeScreen → MaterialDetailScreen
  ├── TrashScreen
  ├── UserManagementScreen (admin)
  ├── AISettingsScreen (admin)
  └── SettingsScreen
```

### 设计风格
- iOS Human Interface Guidelines
- Cupertino widgets
- 亮色/深色主题支持
- 响应式布局

## 本地存储

使用 Hive 存储:
- JWT Token
- 用户信息
- 主题设置
- API 地址
- 素材列表缓存

## 实施计划

1. 初始化 Flutter 项目
2. 配置依赖和基础架构
3. 实现 API 服务层
4. 实现状态管理 Providers
5. 实现登录页面
6. 实现首页（素材列表）
7. 实现素材详情/编辑页
8. 实现批量操作
9. 实现垃圾箱
10. 实现管理后台功能
11. 实现 AI 功能
12. 实现设置页
13. 测试和优化
14. iOS 打包构建
