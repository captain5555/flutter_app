# Flutter iOS App 实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在 nas-material-manager-v3 项目中创建 Flutter iOS App，完全复刻 Web 端功能

**Architecture:** 多层架构（UI → Provider → Service → API），使用 Provider 状态管理，Dio 网络请求

**Tech Stack:** Flutter, Dart, Provider, Dio, Hive, cached_network_image, video_player

---

## 文件结构

```
flutter_app/
├── lib/
│   ├── main.dart
│   ├── config/
│   │   └── app_config.dart
│   ├── providers/
│   │   ├── auth_provider.dart
│   │   ├── material_provider.dart
│   │   ├── theme_provider.dart
│   │   └── settings_provider.dart
│   ├── services/
│   │   ├── api_service.dart
│   │   ├── auth_service.dart
│   │   ├── material_service.dart
│   │   ├── user_service.dart
│   │   └── ai_service.dart
│   ├── models/
│   │   ├── user.dart
│   │   └── material.dart
│   ├── screens/
│   │   ├── login/
│   │   │   └── login_screen.dart
│   │   ├── home/
│   │   │   └── home_screen.dart
│   │   └── settings/
│   │       └── settings_screen.dart
│   ├── widgets/
│   │   └── material_card.dart
│   ├── utils/
│   │   ├── token_storage.dart
│   │   └── file_helper.dart
│   └── constants/
│       ├── api_constants.dart
│       └── theme_constants.dart
└── pubspec.yaml
```

---

## Task 1: 初始化 Flutter 项目

**Files:**
- Create: `flutter_app/pubspec.yaml`
- Create: `flutter_app/lib/main.dart`

- [ ] **Step 1: 在 V3 项目根目录创建 Flutter 项目**

```bash
cd "D:/Claude_Workspace/.claude/worktrees/nas-material-manager-v3"
flutter create --org com.nasmaterial flutter_app
cd flutter_app
```

- [ ] **Step 2: 配置 pubspec.yaml 依赖**

替换 `flutter_app/pubspec.yaml` 内容：

```yaml
name: nas_material_app
description: NAS 素材管理系统 Flutter App
publish_to: 'none'
version: 1.0.0+1

environment:
  sdk: '>=3.0.0 <4.0.0'

dependencies:
  flutter:
    sdk: flutter
  cupertino_icons: ^1.0.6
  provider: ^6.1.1
  dio: ^5.4.0
  hive: ^2.2.3
  hive_flutter: ^1.1.0
  cached_network_image: ^3.3.1
  video_player: ^2.8.2
  file_picker: ^6.1.1
  image_picker: ^1.0.7
  path_provider: ^2.1.2
  permission_handler: ^11.2.0
  intl: ^0.18.1

dev_dependencies:
  flutter_test:
    sdk: flutter
  flutter_lints: ^3.0.0

flutter:
  uses-material-design: true
```

- [ ] **Step 3: 安装依赖**

```bash
cd flutter_app
flutter pub get
```

- [ ] **Step 4: 验证项目初始化成功**

```bash
flutter doctor
```

Expected: Flutter 环境检查通过

- [ ] **Step 5: 初始提交**

```bash
cd "D:/Claude_Workspace/.claude/worktrees/nas-material-manager-v3"
git add flutter_app/pubspec.yaml flutter_app/.gitignore
git commit -m "feat: initialize flutter project structure"
```

---

## Task 2: 创建配置和常量

**Files:**
- Create: `flutter_app/lib/constants/api_constants.dart`
- Create: `flutter_app/lib/constants/theme_constants.dart`
- Create: `flutter_app/lib/config/app_config.dart`

- [ ] **Step 1: 创建 API 常量文件**

Write to `flutter_app/lib/constants/api_constants.dart`:

```dart
class ApiConstants {
  static const String defaultBaseUrl = 'http://localhost:3000';
  static const Duration connectTimeout = Duration(seconds: 30);
  static const Duration receiveTimeout = Duration(seconds: 30);

  // Auth endpoints
  static const String users = '/api/users';
  static const String loginSimple = '/api/auth/login-simple';
  static const String refreshToken = '/api/auth/refresh';
  static const String logout = '/api/auth/logout';
  static const String me = '/api/auth/me';

  // Materials endpoints
  static String materialsByUser(int userId, String folderType) =>
      '/api/materials/user/$userId/folder/$folderType';
  static String trashByUser(int userId) => '/api/materials/user/$userId/trash';
  static String materialById(int id) => '/api/materials/$id';
  static const String uploadMaterial = '/api/materials/upload';
  static String downloadMaterial(int id) => '/api/materials/$id/download';
  static const String batchTrash = '/api/materials/batch/trash';
  static const String batchRestore = '/api/materials/batch/restore';
  static const String batchCopy = '/api/materials/batch/copy';
  static const String batchMove = '/api/materials/batch/move';
  static const String batchDeletePermanent = '/api/materials/batch';

  // AI endpoints
  static const String aiSettings = '/api/ai/settings';
  static const String generateTitle = '/api/ai/generate-title';
  static const String generateDescription = '/api/ai/generate-description';
  static const String translate = '/api/ai/translate';
}
```

- [ ] **Step 2: 创建主题常量文件**

Write to `flutter_app/lib/constants/theme_constants.dart`:

```dart
import 'package:flutter/cupertino.dart';

class ThemeConstants {
  // Colors
  static const Color primaryColor = CupertinoColors.systemBlue;
  static const Color successColor = CupertinoColors.systemGreen;
  static const Color warningColor = CupertinoColors.systemOrange;
  static const Color errorColor = CupertinoColors.systemRed;

  // Text Styles
  static const TextStyle titleStyle = TextStyle(
    fontSize: 24,
    fontWeight: FontWeight.bold,
  );

  static const TextStyle subtitleStyle = TextStyle(
    fontSize: 18,
    fontWeight: FontWeight.w600,
  );

  static const TextStyle bodyStyle = TextStyle(
    fontSize: 16,
  );

  static const TextStyle captionStyle = TextStyle(
    fontSize: 14,
    color: CupertinoColors.secondaryLabel,
  );

  // Spacing
  static const double spacingXs = 4.0;
  static const double spacingSm = 8.0;
  static const double spacingMd = 16.0;
  static const double spacingLg = 24.0;
  static const double spacingXl = 32.0;

  // Border Radius
  static const double borderRadiusSm = 8.0;
  static const double borderRadiusMd = 12.0;
  static const double borderRadiusLg = 16.0;
}
```

- [ ] **Step 3: 创建应用配置文件**

Write to `flutter_app/lib/config/app_config.dart`:

```dart
class AppConfig {
  static String baseUrl = 'http://localhost:3000';

  static void setBaseUrl(String url) {
    baseUrl = url;
  }
}
```

- [ ] **Step 4: 提交配置文件**

```bash
cd "D:/Claude_Workspace/.claude/worktrees/nas-material-manager-v3"
git add flutter_app/lib/constants/ flutter_app/lib/config/
git commit -m "feat: add constants and config files"
```

---

## Task 3: 创建数据模型

**Files:**
- Create: `flutter_app/lib/models/user.dart`
- Create: `flutter_app/lib/models/material.dart`

- [ ] **Step 1: 创建 User 模型**

Write to `flutter_app/lib/models/user.dart`:

```dart
class User {
  final int id;
  final String username;
  final String role;

  User({
    required this.id,
    required this.username,
    required this.role,
  });

  bool get isAdmin => role == 'admin';

  factory User.fromJson(Map<String, dynamic> json) {
    return User(
      id: json['id'] is int ? json['id'] : int.parse(json['id'].toString()),
      username: json['username'] as String? ?? json['name'] as String? ?? '',
      role: json['role'] as String? ?? 'user',
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'username': username,
      'role': role,
    };
  }

  User copyWith({
    int? id,
    String? username,
    String? role,
  }) {
    return User(
      id: id ?? this.id,
      username: username ?? this.username,
      role: role ?? this.role,
    );
  }
}
```

- [ ] **Step 2: 创建 Material 模型**

Write to `flutter_app/lib/models/material.dart`:

```dart
class Material {
  final int id;
  final int userId;
  final String fileName;
  final String? title;
  final String? description;
  final String usageTag;
  final String viralTag;
  final String folderType;
  final int fileSize;
  final String filePath;
  final String? thumbnailPath;
  final bool isDeleted;
  final DateTime? createdAt;
  final DateTime? updatedAt;
  final DateTime? deletedAt;

  Material({
    required this.id,
    required this.userId,
    required this.fileName,
    this.title,
    this.description,
    required this.usageTag,
    required this.viralTag,
    required this.folderType,
    required this.fileSize,
    required this.filePath,
    this.thumbnailPath,
    this.isDeleted = false,
    this.createdAt,
    this.updatedAt,
    this.deletedAt,
  });

  String get displayTitle => title ?? fileName;

  bool get isImage => folderType == 'images';
  bool get isVideo => folderType == 'videos';

  String get fileSizeFormatted {
    if (fileSize < 1024) return '$fileSize B';
    if (fileSize < 1024 * 1024) return '${(fileSize / 1024).toStringAsFixed(1)} KB';
    if (fileSize < 1024 * 1024 * 1024) return '${(fileSize / (1024 * 1024)).toStringAsFixed(1)} MB';
    return '${(fileSize / (1024 * 1024 * 1024)).toStringAsFixed(1)} GB';
  }

  factory Material.fromJson(Map<String, dynamic> json) {
    return Material(
      id: json['id'] is int ? json['id'] : int.parse(json['id'].toString()),
      userId: json['user_id'] is int ? json['user_id'] : int.parse(json['user_id'].toString()),
      fileName: json['file_name'] as String? ?? json['filename'] as String? ?? '',
      title: json['title'] as String?,
      description: json['description'] as String?,
      usageTag: json['usage_tag'] as String? ?? 'unused',
      viralTag: json['viral_tag'] as String? ?? 'not_viral',
      folderType: json['folder_type'] as String? ?? 'images',
      fileSize: json['file_size'] is int ? json['file_size'] : int.parse(json['file_size']?.toString() ?? '0'),
      filePath: json['file_path'] as String? ?? json['oss_key'] as String? ?? '',
      thumbnailPath: json['thumbnail_path'] as String?,
      isDeleted: json['is_deleted'] as bool? ?? false,
      createdAt: json['created_at'] != null ? DateTime.tryParse(json['created_at']) : null,
      updatedAt: json['updated_at'] != null ? DateTime.tryParse(json['updated_at']) : null,
      deletedAt: json['deleted_at'] != null ? DateTime.tryParse(json['deleted_at']) : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'user_id': userId,
      'file_name': fileName,
      'title': title,
      'description': description,
      'usage_tag': usageTag,
      'viral_tag': viralTag,
      'folder_type': folderType,
      'file_size': fileSize,
      'file_path': filePath,
      'thumbnail_path': thumbnailPath,
      'is_deleted': isDeleted,
    };
  }

  Material copyWith({
    int? id,
    int? userId,
    String? fileName,
    String? title,
    String? description,
    String? usageTag,
    String? viralTag,
    String? folderType,
    int? fileSize,
    String? filePath,
    String? thumbnailPath,
    bool? isDeleted,
    DateTime? createdAt,
    DateTime? updatedAt,
    DateTime? deletedAt,
  }) {
    return Material(
      id: id ?? this.id,
      userId: userId ?? this.userId,
      fileName: fileName ?? this.fileName,
      title: title ?? this.title,
      description: description ?? this.description,
      usageTag: usageTag ?? this.usageTag,
      viralTag: viralTag ?? this.viralTag,
      folderType: folderType ?? this.folderType,
      fileSize: fileSize ?? this.fileSize,
      filePath: filePath ?? this.filePath,
      thumbnailPath: thumbnailPath ?? this.thumbnailPath,
      isDeleted: isDeleted ?? this.isDeleted,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
      deletedAt: deletedAt ?? this.deletedAt,
    );
  }
}
```

- [ ] **Step 3: 提交模型文件**

```bash
cd "D:/Claude_Workspace/.claude/worktrees/nas-material-manager-v3"
git add flutter_app/lib/models/
git commit -m "feat: add data models (User, Material)"
```

---

## Task 4: 创建工具类和 Hive 初始化

**Files:**
- Create: `flutter_app/lib/utils/token_storage.dart`
- Create: `flutter_app/lib/utils/file_helper.dart`
- Modify: `flutter_app/lib/main.dart`

- [ ] **Step 1: 创建 Token 存储工具**

Write to `flutter_app/lib/utils/token_storage.dart`:

```dart
import 'package:hive/hive.dart';
import 'package:hive_flutter/hive_flutter.dart';

class TokenStorage {
  static const String _boxName = 'app_box';
  static const String _keyToken = 'auth_token';
  static const String _keyUserId = 'user_id';
  static const String _keyUsername = 'username';
  static const String _keyUserRole = 'user_role';
  static const String _keyApiUrl = 'api_url';
  static const String _keyThemeMode = 'theme_mode';

  static Box? _box;

  static Future<void> init() async {
    await Hive.initFlutter();
    _box = await Hive.openBox(_boxName);
  }

  static Future<void> saveToken(String token) async {
    await _box?.put(_keyToken, token);
  }

  static String? getToken() {
    return _box?.get(_keyToken) as String?;
  }

  static Future<void> saveUser(int id, String username, String role) async {
    await _box?.put(_keyUserId, id);
    await _box?.put(_keyUsername, username);
    await _box?.put(_keyUserRole, role);
  }

  static Map<String, dynamic>? getUser() {
    final id = _box?.get(_keyUserId);
    final username = _box?.get(_keyUsername);
    final role = _box?.get(_keyUserRole);
    if (id == null || username == null) return null;
    return {
      'id': id,
      'username': username,
      'role': role ?? 'user',
    };
  }

  static Future<void> saveApiUrl(String url) async {
    await _box?.put(_keyApiUrl, url);
  }

  static String? getApiUrl() {
    return _box?.get(_keyApiUrl) as String?;
  }

  static Future<void> saveThemeMode(String mode) async {
    await _box?.put(_keyThemeMode, mode);
  }

  static String? getThemeMode() {
    return _box?.get(_keyThemeMode) as String?;
  }

  static Future<void> clearAuth() async {
    await _box?.delete(_keyToken);
    await _box?.delete(_keyUserId);
    await _box?.delete(_keyUsername);
    await _box?.delete(_keyUserRole);
  }

  static Future<void> clearAll() async {
    await _box?.clear();
  }
}
```

- [ ] **Step 2: 创建文件助手工具**

Write to `flutter_app/lib/utils/file_helper.dart`:

```dart
import 'dart:io';
import 'package:path_provider/path_provider.dart';

class FileHelper {
  static Future<String> getLocalPath() async {
    final directory = await getApplicationDocumentsDirectory();
    return directory.path;
  }

  static Future<File> getLocalFile(String filename) async {
    final path = await getLocalPath();
    return File('$path/$filename');
  }

  static String formatFileSize(int bytes) {
    if (bytes < 1024) return '$bytes B';
    if (bytes < 1024 * 1024) return '${(bytes / 1024).toStringAsFixed(1)} KB';
    if (bytes < 1024 * 1024 * 1024) return '${(bytes / (1024 * 1024)).toStringAsFixed(1)} MB';
    return '${(bytes / (1024 * 1024 * 1024)).toStringAsFixed(1)} GB';
  }

  static String getFileExtension(String filename) {
    return filename.split('.').last.toLowerCase();
  }

  static bool isImageFile(String filename) {
    final ext = getFileExtension(filename);
    return ['jpg', 'jpeg', 'png', 'gif', 'webp'].contains(ext);
  }

  static bool isVideoFile(String filename) {
    final ext = getFileExtension(filename);
    return ['mp4', 'mov', 'avi', 'mkv', 'webm'].contains(ext);
  }
}
```

- [ ] **Step 3: 更新 main.dart 初始化 Hive**

Write to `flutter_app/lib/main.dart`:

```dart
import 'package:flutter/cupertino.dart';
import 'package:flutter/services.dart';
import 'utils/token_storage.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  
  // Initialize Hive
  await TokenStorage.init();
  
  // Set preferred orientations
  await SystemChrome.setPreferredOrientations([
    DeviceOrientation.portraitUp,
    DeviceOrientation.portraitDown,
    DeviceOrientation.landscapeLeft,
    DeviceOrientation.landscapeRight,
  ]);
  
  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return CupertinoApp(
      title: 'NAS 素材管理',
      theme: CupertinoThemeData(
        brightness: Brightness.light,
        primaryColor: CupertinoColors.systemBlue,
      ),
      home: const CupertinoPageScaffold(
        navigationBar: CupertinoNavigationBar(
          middle: Text('NAS 素材管理'),
        ),
        child: Center(
          child: Text('App 初始化中...'),
        ),
      ),
      debugShowCheckedModeBanner: false,
    );
  }
}
```

- [ ] **Step 4: 运行应用验证初始化**

```bash
cd flutter_app
flutter run
```

Expected: App 启动，显示"App 初始化中..."

- [ ] **Step 5: 提交工具类**

```bash
cd "D:/Claude_Workspace/.claude/worktrees/nas-material-manager-v3"
git add flutter_app/lib/utils/ flutter_app/lib/main.dart
git commit -m "feat: add utility classes and Hive initialization"
```

---

## Task 5: 创建 API 服务层基础

**Files:**
- Create: `flutter_app/lib/services/api_service.dart`
- Create: `flutter_app/lib/services/auth_service.dart`
- Create: `flutter_app/lib/services/material_service.dart`
- Create: `flutter_app/lib/services/user_service.dart`
- Create: `flutter_app/lib/services/ai_service.dart`

- [ ] **Step 1: 创建基础 API 服务**

Write to `flutter_app/lib/services/api_service.dart`:

```dart
import 'package:dio/dio.dart';
import '../config/app_config.dart';
import '../constants/api_constants.dart';
import '../utils/token_storage.dart';

class ApiService {
  static final ApiService _instance = ApiService._internal();
  factory ApiService() => _instance;
  ApiService._internal();

  late Dio _dio;

  void init() {
    final baseUrl = TokenStorage.getApiUrl() ?? ApiConstants.defaultBaseUrl;
    AppConfig.setBaseUrl(baseUrl);

    _dio = Dio(BaseOptions(
      baseUrl: AppConfig.baseUrl,
      connectTimeout: ApiConstants.connectTimeout,
      receiveTimeout: ApiConstants.receiveTimeout,
      headers: {
        'Content-Type': 'application/json',
      },
    ));

    _dio.interceptors.add(InterceptorsWrapper(
      onRequest: (options, handler) async {
        final token = TokenStorage.getToken();
        if (token != null) {
          options.headers['Authorization'] = 'Bearer $token';
        }
        return handler.next(options);
      },
      onResponse: (response, handler) {
        return handler.next(response);
      },
      onError: (error, handler) async {
        if (error.response?.statusCode == 401) {
          await TokenStorage.clearAuth();
        }
        return handler.next(error);
      },
    ));
  }

  void updateBaseUrl(String url) {
    AppConfig.setBaseUrl(url);
    _dio.options.baseUrl = url;
  }

  Future<Map<String, dynamic>> get(String path, {Map<String, dynamic>? queryParameters}) async {
    try {
      final response = await _dio.get(path, queryParameters: queryParameters);
      return _handleResponse(response);
    } catch (e) {
      return _handleError(e);
    }
  }

  Future<Map<String, dynamic>> post(String path, {dynamic data}) async {
    try {
      final response = await _dio.post(path, data: data);
      return _handleResponse(response);
    } catch (e) {
      return _handleError(e);
    }
  }

  Future<Map<String, dynamic>> put(String path, {dynamic data}) async {
    try {
      final response = await _dio.put(path, data: data);
      return _handleResponse(response);
    } catch (e) {
      return _handleError(e);
    }
  }

  Future<Map<String, dynamic>> delete(String path, {dynamic data}) async {
    try {
      final response = await _dio.delete(path, data: data);
      return _handleResponse(response);
    } catch (e) {
      return _handleError(e);
    }
  }

  Future<Map<String, dynamic>> uploadFile(String path, String filePath, Map<String, dynamic> fields) async {
    try {
      final formData = FormData.fromMap({
        'file': await MultipartFile.fromFile(filePath),
        ...fields,
      });
      final response = await _dio.post(path, data: formData);
      return _handleResponse(response);
    } catch (e) {
      return _handleError(e);
    }
  }

  Map<String, dynamic> _handleResponse(Response response) {
    final data = response.data;
    if (data is Map<String, dynamic>) {
      if (data['success'] == true) {
        return {'success': true, 'data': data['data']};
      } else {
        return {'success': false, 'error': data['error'] ?? '未知错误'};
      }
    }
    return {'success': true, 'data': data};
  }

  Map<String, dynamic> _handleError(dynamic error) {
    String errorMessage = '网络连接失败';
    if (error is DioException) {
      if (error.response?.data is Map<String, dynamic>) {
        errorMessage = error.response?.data['error'] ?? errorMessage;
      } else if (error.message != null) {
        errorMessage = error.message!;
      }
    }
    return {'success': false, 'error': errorMessage};
  }
}
```

- [ ] **Step 2: 创建认证服务**

Write to `flutter_app/lib/services/auth_service.dart`:

```dart
import '../models/user.dart';
import '../constants/api_constants.dart';
import 'api_service.dart';

class AuthService {
  final ApiService _api = ApiService();

  Future<List<User>> getUsers() async {
    final result = await _api.get(ApiConstants.users);
    if (result['success'] && result['data'] != null) {
      final List<dynamic> usersJson = result['data'] is List ? result['data'] : [];
      return usersJson.map((json) => User.fromJson(json)).toList();
    }
    return [];
  }

  Future<Map<String, dynamic>> login(String username) async {
    final result = await _api.post(
      ApiConstants.loginSimple,
      data: {'username': username},
    );
    return result;
  }

  Future<Map<String, dynamic>> refreshToken(String token) async {
    final result = await _api.post(
      ApiConstants.refreshToken,
      data: {'token': token},
    );
    return result;
  }

  Future<Map<String, dynamic>> logout() async {
    final result = await _api.post(ApiConstants.logout);
    return result;
  }
}
```

- [ ] **Step 3: 创建素材服务**

Write to `flutter_app/lib/services/material_service.dart`:

```dart
import '../models/material.dart';
import '../constants/api_constants.dart';
import 'api_service.dart';

class MaterialService {
  final ApiService _api = ApiService();

  Future<List<Material>> getMaterials(int userId, String folderType) async {
    final result = await _api.get(ApiConstants.materialsByUser(userId, folderType));
    if (result['success'] && result['data'] != null) {
      final List<dynamic> materialsJson = result['data'] is List ? result['data'] : [];
      return materialsJson.map((json) => Material.fromJson(json)).toList();
    }
    return [];
  }

  Future<List<Material>> getTrash(int userId, {bool all = false}) async {
    final result = await _api.get(
      ApiConstants.trashByUser(userId),
      queryParameters: all ? {'all': 'true'} : null,
    );
    if (result['success'] && result['data'] != null) {
      final List<dynamic> materialsJson = result['data'] is List ? result['data'] : [];
      return materialsJson.map((json) => Material.fromJson(json)).toList();
    }
    return [];
  }

  Future<Material?> getMaterial(int id) async {
    final result = await _api.get(ApiConstants.materialById(id));
    if (result['success'] && result['data'] != null) {
      return Material.fromJson(result['data']);
    }
    return null;
  }

  Future<Map<String, dynamic>> updateMaterial(int id, Map<String, dynamic> data) async {
    return await _api.put(ApiConstants.materialById(id), data: data);
  }

  Future<Map<String, dynamic>> uploadMaterial(String filePath, int userId, String folderType) async {
    return await _api.uploadFile(
      ApiConstants.uploadMaterial,
      filePath,
      {'user_id': userId, 'folder_type': folderType},
    );
  }

  Future<Map<String, dynamic>> batchTrash(List<int> ids, int currentUserId) async {
    return await _api.post(
      ApiConstants.batchTrash,
      data: {'ids': ids, 'current_user_id': currentUserId},
    );
  }

  Future<Map<String, dynamic>> batchRestore(List<int> ids, int currentUserId) async {
    return await _api.post(
      ApiConstants.batchRestore,
      data: {'ids': ids, 'current_user_id': currentUserId},
    );
  }

  Future<Map<String, dynamic>> batchCopy(List<int> ids, int targetUserId, int currentUserId) async {
    return await _api.post(
      ApiConstants.batchCopy,
      data: {'ids': ids, 'target_user_id': targetUserId, 'current_user_id': currentUserId},
    );
  }

  Future<Map<String, dynamic>> batchMove(List<int> ids, int targetUserId, int currentUserId) async {
    return await _api.post(
      ApiConstants.batchMove,
      data: {'ids': ids, 'target_user_id': targetUserId, 'current_user_id': currentUserId},
    );
  }

  Future<Map<String, dynamic>> batchDeletePermanent(List<int> ids, int currentUserId) async {
    return await _api.delete(
      ApiConstants.batchDeletePermanent,
      data: {'ids': ids, 'current_user_id': currentUserId},
    );
  }
}
```

- [ ] **Step 4: 创建用户服务**

Write to `flutter_app/lib/services/user_service.dart`:

```dart
import '../models/user.dart';
import '../constants/api_constants.dart';
import 'api_service.dart';

class UserService {
  final ApiService _api = ApiService();

  Future<List<User>> getAllUsers() async {
    final result = await _api.get(ApiConstants.users);
    if (result['success'] && result['data'] != null) {
      final List<dynamic> usersJson = result['data'] is List ? result['data'] : [];
      return usersJson.map((json) => User.fromJson(json)).toList();
    }
    return [];
  }

  Future<User?> getUser(int id) async {
    final result = await _api.get('${ApiConstants.users}/$id');
    if (result['success'] && result['data'] != null) {
      return User.fromJson(result['data']);
    }
    return null;
  }

  Future<Map<String, dynamic>> createUser(String username, {String? password, String role = 'user'}) async {
    return await _api.post(
      ApiConstants.users,
      data: {'username': username, 'password': password, 'role': role},
    );
  }

  Future<Map<String, dynamic>> deleteUser(int id) async {
    return await _api.delete('${ApiConstants.users}/$id');
  }
}
```

- [ ] **Step 5: 创建 AI 服务**

Write to `flutter_app/lib/services/ai_service.dart`:

```dart
import '../constants/api_constants.dart';
import 'api_service.dart';

class AIService {
  final ApiService _api = ApiService();

  Future<Map<String, dynamic>> getAISettings() async {
    return await _api.get(ApiConstants.aiSettings);
  }

  Future<Map<String, dynamic>> saveAISettings(Map<String, dynamic> settings) async {
    return await _api.put(ApiConstants.aiSettings, data: settings);
  }

  Future<Map<String, dynamic>> generateTitle(String description) async {
    return await _api.post(
      ApiConstants.generateTitle,
      data: {'description': description},
    );
  }

  Future<Map<String, dynamic>> generateDescription(String title) async {
    return await _api.post(
      ApiConstants.generateDescription,
      data: {'title': title},
    );
  }

  Future<Map<String, dynamic>> translate(String text, String targetLang) async {
    return await _api.post(
      ApiConstants.translate,
      data: {'text': text, 'target_lang': targetLang},
    );
  }
}
```

- [ ] **Step 6: 更新 main.dart 初始化 ApiService**

修改 `flutter_app/lib/main.dart`，在 `TokenStorage.init()` 后添加：

```dart
// Initialize ApiService
ApiService().init();
```

需要添加 import:

```dart
import 'services/api_service.dart';
```

- [ ] **Step 7: 提交服务层代码**

```bash
cd "D:/Claude_Workspace/.claude/worktrees/nas-material-manager-v3"
git add flutter_app/lib/services/
git commit -m "feat: add API service layer"
```

---

## Task 6: 创建 Provider 状态管理

**Files:**
- Create: `flutter_app/lib/providers/auth_provider.dart`
- Create: `flutter_app/lib/providers/material_provider.dart`
- Create: `flutter_app/lib/providers/theme_provider.dart`
- Create: `flutter_app/lib/providers/settings_provider.dart`

- [ ] **Step 1: 创建 AuthProvider**

Write to `flutter_app/lib/providers/auth_provider.dart`:

```dart
import 'package:flutter/foundation.dart';
import '../models/user.dart';
import '../services/auth_service.dart';
import '../utils/token_storage.dart';

class AuthProvider with ChangeNotifier {
  final AuthService _authService = AuthService();

  User? _user;
  String? _token;
  bool _isLoading = false;
  String? _error;

  User? get user => _user;
  String? get token => _token;
  bool get isLoading => _isLoading;
  bool get isAuthenticated => _user != null && _token != null;
  String? get error => _error;
  bool get isAdmin => _user?.isAdmin ?? false;

  AuthProvider() {
    _loadSavedUser();
  }

  Future<void> _loadSavedUser() async {
    final userJson = TokenStorage.getUser();
    final token = TokenStorage.getToken();
    if (userJson != null && token != null) {
      _user = User(
        id: userJson['id'],
        username: userJson['username'],
        role: userJson['role'],
      );
      _token = token;
      notifyListeners();
    }
  }

  Future<List<User>> getUsers() async {
    return await _authService.getUsers();
  }

  Future<bool> login(String username) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    final result = await _authService.login(username);

    if (result['success']) {
      _token = result['data']['token'];
      _user = User.fromJson(result['data']['user']);

      await TokenStorage.saveToken(_token!);
      await TokenStorage.saveUser(_user!.id, _user!.username, _user!.role);

      _isLoading = false;
      notifyListeners();
      return true;
    } else {
      _error = result['error'];
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }

  Future<void> logout() async {
    await _authService.logout();
    await TokenStorage.clearAuth();
    _user = null;
    _token = null;
    _error = null;
    notifyListeners();
  }

  void clearError() {
    _error = null;
    notifyListeners();
  }
}
```

- [ ] **Step 2: 创建 MaterialProvider**

Write to `flutter_app/lib/providers/material_provider.dart`:

```dart
import 'package:flutter/foundation.dart';
import '../models/material.dart';
import '../models/user.dart';
import '../services/material_service.dart';

class MaterialProvider with ChangeNotifier {
  final MaterialService _materialService = MaterialService();

  List<Material> _materials = [];
  bool _isLoading = false;
  String? _error;
  final Set<int> _selectedIds = {};
  String _currentFolderType = 'images';

  List<Material> get materials => _materials;
  bool get isLoading => _isLoading;
  String? get error => _error;
  Set<int> get selectedIds => _selectedIds;
  bool get hasSelection => _selectedIds.isNotEmpty;
  String get currentFolderType => _currentFolderType;

  void setFolderType(String type) {
    _currentFolderType = type;
    notifyListeners();
  }

  Future<void> fetchMaterials(int userId, String folderType) async {
    _isLoading = true;
    _error = null;
    _currentFolderType = folderType;
    notifyListeners();

    try {
      _materials = await _materialService.getMaterials(userId, folderType);
    } catch (e) {
      _error = e.toString();
    }

    _isLoading = false;
    notifyListeners();
  }

  Future<void> fetchTrash(int userId, {bool all = false}) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      _materials = await _materialService.getTrash(userId, all: all);
    } catch (e) {
      _error = e.toString();
    }

    _isLoading = false;
    notifyListeners();
  }

  Future<Material?> getMaterial(int id) async {
    return await _materialService.getMaterial(id);
  }

  Future<bool> updateMaterial(int id, Map<String, dynamic> data) async {
    final result = await _materialService.updateMaterial(id, data);
    if (result['success']) {
      final index = _materials.indexWhere((m) => m.id == id);
      if (index != -1) {
        _materials[index] = _materials[index].copyWith(
          title: data['title'],
          description: data['description'],
          usageTag: data['usage_tag'],
          viralTag: data['viral_tag'],
        );
        notifyListeners();
      }
      return true;
    }
    _error = result['error'];
    notifyListeners();
    return false;
  }

  void toggleSelection(int id) {
    if (_selectedIds.contains(id)) {
      _selectedIds.remove(id);
    } else {
      _selectedIds.add(id);
    }
    notifyListeners();
  }

  void selectAll() {
    _selectedIds.clear();
    _selectedIds.addAll(_materials.map((m) => m.id));
    notifyListeners();
  }

  void clearSelection() {
    _selectedIds.clear();
    notifyListeners();
  }

  Future<bool> batchTrash(int currentUserId) async {
    if (_selectedIds.isEmpty) return false;

    final result = await _materialService.batchTrash(
      _selectedIds.toList(),
      currentUserId,
    );

    if (result['success']) {
      _materials.removeWhere((m) => _selectedIds.contains(m.id));
      _selectedIds.clear();
      notifyListeners();
      return true;
    }
    _error = result['error'];
    notifyListeners();
    return false;
  }

  Future<bool> batchRestore(int currentUserId) async {
    if (_selectedIds.isEmpty) return false;

    final result = await _materialService.batchRestore(
      _selectedIds.toList(),
      currentUserId,
    );

    if (result['success']) {
      _materials.removeWhere((m) => _selectedIds.contains(m.id));
      _selectedIds.clear();
      notifyListeners();
      return true;
    }
    _error = result['error'];
    notifyListeners();
    return false;
  }

  Future<bool> batchCopy(int targetUserId, int currentUserId) async {
    if (_selectedIds.isEmpty) return false;

    final result = await _materialService.batchCopy(
      _selectedIds.toList(),
      targetUserId,
      currentUserId,
    );

    if (result['success']) {
      _selectedIds.clear();
      notifyListeners();
      return true;
    }
    _error = result['error'];
    notifyListeners();
    return false;
  }

  Future<bool> batchMove(int targetUserId, int currentUserId) async {
    if (_selectedIds.isEmpty) return false;

    final result = await _materialService.batchMove(
      _selectedIds.toList(),
      targetUserId,
      currentUserId,
    );

    if (result['success']) {
      _materials.removeWhere((m) => _selectedIds.contains(m.id));
      _selectedIds.clear();
      notifyListeners();
      return true;
    }
    _error = result['error'];
    notifyListeners();
    return false;
  }

  Future<bool> batchDeletePermanent(int currentUserId) async {
    if (_selectedIds.isEmpty) return false;

    final result = await _materialService.batchDeletePermanent(
      _selectedIds.toList(),
      currentUserId,
    );

    if (result['success']) {
      _materials.removeWhere((m) => _selectedIds.contains(m.id));
      _selectedIds.clear();
      notifyListeners();
      return true;
    }
    _error = result['error'];
    notifyListeners();
    return false;
  }

  void clearError() {
    _error = null;
    notifyListeners();
  }
}
```

- [ ] **Step 3: 创建 ThemeProvider**

Write to `flutter_app/lib/providers/theme_provider.dart`:

```dart
import 'package:flutter/foundation.dart';
import 'package:flutter/cupertino.dart';
import '../utils/token_storage.dart';

class ThemeProvider with ChangeNotifier {
  Brightness _brightness = Brightness.light;

  Brightness get brightness => _brightness;

  ThemeProvider() {
    _loadTheme();
  }

  Future<void> _loadTheme() async {
    final savedMode = TokenStorage.getThemeMode();
    if (savedMode == 'dark') {
      _brightness = Brightness.dark;
    } else if (savedMode == 'light') {
      _brightness = Brightness.light;
    }
    notifyListeners();
  }

  void toggleTheme() {
    _brightness = _brightness == Brightness.light ? Brightness.dark : Brightness.light;
    _saveTheme();
    notifyListeners();
  }

  void setBrightness(Brightness brightness) {
    _brightness = brightness;
    _saveTheme();
    notifyListeners();
  }

  Future<void> _saveTheme() async {
    await TokenStorage.saveThemeMode(
      _brightness == Brightness.dark ? 'dark' : 'light',
    );
  }
}
```

- [ ] **Step 4: 创建 SettingsProvider**

Write to `flutter_app/lib/providers/settings_provider.dart`:

```dart
import 'package:flutter/foundation.dart';
import '../config/app_config.dart';
import '../services/api_service.dart';
import '../utils/token_storage.dart';

class SettingsProvider with ChangeNotifier {
  String _apiUrl = AppConfig.baseUrl;

  String get apiUrl => _apiUrl;

  SettingsProvider() {
    _loadSettings();
  }

  Future<void> _loadSettings() async {
    final savedUrl = TokenStorage.getApiUrl();
    if (savedUrl != null) {
      _apiUrl = savedUrl;
      AppConfig.setBaseUrl(savedUrl);
    }
    notifyListeners();
  }

  Future<void> setApiUrl(String url) async {
    _apiUrl = url;
    AppConfig.setBaseUrl(url);
    ApiService().updateBaseUrl(url);
    await TokenStorage.saveApiUrl(url);
    notifyListeners();
  }

  Future<void> clearCache() async {
    await TokenStorage.clearAll();
    notifyListeners();
  }
}
```

- [ ] **Step 5: 提交 Provider 代码**

```bash
cd "D:/Claude_Workspace/.claude/worktrees/nas-material-manager-v3"
git add flutter_app/lib/providers/
git commit -m "feat: add Provider state management"
```

---

## Task 7: 创建登录页面

**Files:**
- Create: `flutter_app/lib/screens/login/login_screen.dart`
- Modify: `flutter_app/lib/main.dart`

- [ ] **Step 1: 创建登录页面**

Write to `flutter_app/lib/screens/login/login_screen.dart`:

```dart
import 'package:flutter/cupertino.dart';
import 'package:provider/provider.dart';
import '../../../providers/auth_provider.dart';
import '../../../models/user.dart';
import '../../../constants/theme_constants.dart';
import '../home/home_screen.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  List<User> _users = [];
  bool _isLoadingUsers = true;

  @override
  void initState() {
    super.initState();
    _loadUsers();
  }

  Future<void> _loadUsers() async {
    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    _users = await authProvider.getUsers();
    setState(() {
      _isLoadingUsers = false;
    });
  }

  Future<void> _login(User user) async {
    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    final success = await authProvider.login(user.username);

    if (success && mounted) {
      Navigator.of(context).pushReplacement(
        CupertinoPageRoute(builder: (_) => const HomeScreen()),
      );
    } else if (mounted) {
      showCupertinoDialog(
        context: context,
        builder: (context) => CupertinoAlertDialog(
          title: const Text('登录失败'),
          content: Text(authProvider.error ?? '未知错误'),
          actions: [
            CupertinoDialogAction(
              child: const Text('确定'),
              onPressed: () {
                Navigator.of(context).pop();
                authProvider.clearError();
              },
            ),
          ],
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return CupertinoPageScaffold(
      navigationBar: const CupertinoNavigationBar(
        middle: Text('登录'),
      ),
      child: SafeArea(
        child: Consumer<AuthProvider>(
          builder: (context, authProvider, child) {
            if (_isLoadingUsers) {
              return const Center(
                child: CupertinoActivityIndicator(),
              );
            }

            return authProvider.isLoading
                ? const Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        CupertinoActivityIndicator(),
                        SizedBox(height: ThemeConstants.spacingMd),
                        Text('登录中...'),
                      ],
                    ),
                  )
                : _buildUserList();
          },
        ),
      ),
    );
  }

  Widget _buildUserList() {
    return ListView.builder(
      padding: const EdgeInsets.all(ThemeConstants.spacingMd),
      itemCount: _users.length,
      itemBuilder: (context, index) {
        final user = _users[index];
        return Padding(
          padding: const EdgeInsets.only(bottom: ThemeConstants.spacingSm),
          child: CupertinoListTile(
            title: Text(user.username),
            subtitle: Text(user.isAdmin ? '管理员' : '普通用户'),
            trailing: const Icon(CupertinoIcons.chevron_right),
            onTap: () => _login(user),
          ),
        );
      },
    );
  }
}
```

- [ ] **Step 2: 创建首页占位**

Write to `flutter_app/lib/screens/home/home_screen.dart`:

```dart
import 'package:flutter/cupertino.dart';
import 'package:provider/provider.dart';
import '../../providers/auth_provider.dart';
import '../login/login_screen.dart';

class HomeScreen extends StatelessWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final authProvider = Provider.of<AuthProvider>(context);

    return CupertinoPageScaffold(
      navigationBar: CupertinoNavigationBar(
        middle: const Text('首页'),
        trailing: CupertinoButton(
          padding: EdgeInsets.zero,
          onPressed: () async {
            await authProvider.logout();
            if (context.mounted) {
              Navigator.of(context).pushReplacement(
                CupertinoPageRoute(builder: (_) => const LoginScreen()),
              );
            }
          },
          child: const Icon(CupertinoIcons.square_arrow_right),
        ),
      ),
      child: SafeArea(
        child: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Text('欢迎, ${authProvider.user?.username ?? ''}'),
              const SizedBox(height: 16),
              const Text('首页开发中...'),
            ],
          ),
        ),
      ),
    );
  }
}
```

- [ ] **Step 3: 更新 main.dart 使用 Provider 和登录页**

完全重写 `flutter_app/lib/main.dart`:

```dart
import 'package:flutter/cupertino.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import 'utils/token_storage.dart';
import 'services/api_service.dart';
import 'providers/auth_provider.dart';
import 'providers/material_provider.dart';
import 'providers/theme_provider.dart';
import 'providers/settings_provider.dart';
import 'screens/login/login_screen.dart';
import 'screens/home/home_screen.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  
  // Initialize Hive
  await TokenStorage.init();
  
  // Initialize ApiService
  ApiService().init();
  
  // Set preferred orientations
  await SystemChrome.setPreferredOrientations([
    DeviceOrientation.portraitUp,
    DeviceOrientation.portraitDown,
    DeviceOrientation.landscapeLeft,
    DeviceOrientation.landscapeRight,
  ]);
  
  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => AuthProvider()),
        ChangeNotifierProvider(create: (_) => MaterialProvider()),
        ChangeNotifierProvider(create: (_) => ThemeProvider()),
        ChangeNotifierProvider(create: (_) => SettingsProvider()),
      ],
      child: Consumer<ThemeProvider>(
        builder: (context, themeProvider, child) {
          return CupertinoApp(
            title: 'NAS 素材管理',
            theme: CupertinoThemeData(
              brightness: themeProvider.brightness,
              primaryColor: CupertinoColors.systemBlue,
            ),
            home: const AuthWrapper(),
            debugShowCheckedModeBanner: false,
          );
        },
      ),
    );
  }
}

class AuthWrapper extends StatelessWidget {
  const AuthWrapper({super.key});

  @override
  Widget build(BuildContext context) {
    final authProvider = Provider.of<AuthProvider>(context);
    
    if (authProvider.isAuthenticated) {
      return const HomeScreen();
    } else {
      return const LoginScreen();
    }
  }
}
```

- [ ] **Step 4: 运行应用验证登录功能**

```bash
cd flutter_app
flutter run
```

Expected: 显示用户列表，点击用户后登录成功跳转到首页

- [ ] **Step 5: 提交登录页面代码**

```bash
cd "D:/Claude_Workspace/.claude/worktrees/nas-material-manager-v3"
git add flutter_app/lib/screens/
git commit -m "feat: add login screen with auth flow"
```

---

## Task 8: 创建素材卡片和首页素材列表

**Files:**
- Create: `flutter_app/lib/widgets/material_card.dart`
- Modify: `flutter_app/lib/screens/home/home_screen.dart`

- [ ] **Step 1: 创建素材卡片组件**

Write to `flutter_app/lib/widgets/material_card.dart`:

```dart
import 'package:flutter/cupertino.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../models/material.dart';
import '../config/app_config.dart';
import '../constants/theme_constants.dart';

class MaterialCard extends StatelessWidget {
  final Material material;
  final bool isSelected;
  final VoidCallback? onTap;
  final VoidCallback? onLongPress;

  const MaterialCard({
    super.key,
    required this.material,
    this.isSelected = false,
    this.onTap,
    this.onLongPress,
  });

  String _getImageUrl() {
    if (material.thumbnailPath != null && material.thumbnailPath!.isNotEmpty) {
      return '${AppConfig.baseUrl}${material.thumbnailPath}';
    }
    if (material.filePath.isNotEmpty) {
      return '${AppConfig.baseUrl}${material.filePath}';
    }
    return '';
  }

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      onLongPress: onLongPress,
      child: Container(
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(ThemeConstants.borderRadiusMd),
          border: isSelected
              ? Border.all(color: CupertinoColors.systemBlue, width: 3)
              : null,
        ),
        child: ClipRRect(
          borderRadius: BorderRadius.circular(ThemeConstants.borderRadiusMd),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Expanded(
                child: Stack(
                  fit: StackFit.expand,
                  children: [
                    if (material.isImage)
                      CachedNetworkImage(
                        imageUrl: _getImageUrl(),
                        fit: BoxFit.cover,
                        placeholder: (context, url) => Container(
                          color: CupertinoColors.systemGrey5,
                          child: const Center(
                            child: CupertinoActivityIndicator(),
                          ),
                        ),
                        errorWidget: (context, url, error) => Container(
                          color: CupertinoColors.systemGrey5,
                          child: const Center(
                            child: Icon(CupertinoIcons.photo),
                          ),
                        ),
                      )
                    else
                      Container(
                        color: CupertinoColors.systemGrey5,
                        child: const Center(
                          child: Icon(CupertinoIcons.video_camera, size: 48),
                        ),
                      ),
                    if (isSelected)
                      Container(
                        color: CupertinoColors.systemBlue.withOpacity(0.3),
                        child: const Center(
                          child: Icon(
                            CupertinoIcons.check_mark_circled_solid,
                            color: CupertinoColors.white,
                            size: 48,
                          ),
                        ),
                      ),
                  ],
                ),
              ),
              Container(
                padding: const EdgeInsets.all(ThemeConstants.spacingSm),
                color: CupertinoColors.systemBackground.resolveFrom(context),
                child: Text(
                  material.displayTitle,
                  style: ThemeConstants.captionStyle,
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
```

- [ ] **Step 2: 更新首页显示素材列表**

完全重写 `flutter_app/lib/screens/home/home_screen.dart`:

```dart
import 'package:flutter/cupertino.dart';
import 'package:provider/provider.dart';
import '../../providers/auth_provider.dart';
import '../../providers/material_provider.dart';
import '../../widgets/material_card.dart';
import '../../constants/theme_constants.dart';
import '../login/login_screen.dart';
import '../settings/settings_screen.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  final List<String> _folderTypes = ['images', 'videos'];
  int _selectedSegment = 0;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _loadMaterials();
    });
  }

  Future<void> _loadMaterials() async {
    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    final materialProvider = Provider.of<MaterialProvider>(context, listen: false);
    
    if (authProvider.user != null) {
      await materialProvider.fetchMaterials(
        authProvider.user!.id,
        _folderTypes[_selectedSegment],
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final authProvider = Provider.of<AuthProvider>(context);
    final materialProvider = Provider.of<MaterialProvider>(context);

    return CupertinoPageScaffold(
      navigationBar: CupertinoNavigationBar(
        middle: const Text('素材'),
        leading: materialProvider.hasSelection
            ? CupertinoButton(
                padding: EdgeInsets.zero,
                onPressed: () {
                  materialProvider.clearSelection();
                },
                child: const Text('取消'),
              )
            : null,
        trailing: materialProvider.hasSelection
            ? CupertinoButton(
                padding: EdgeInsets.zero,
                onPressed: () => _showBatchActions(),
                child: const Text('操作'),
              )
            : CupertinoButton(
                padding: EdgeInsets.zero,
                onPressed: () {
                  Navigator.of(context).push(
                    CupertinoPageRoute(builder: (_) => const SettingsScreen()),
                  );
                },
                child: const Icon(CupertinoIcons.settings),
              ),
      ),
      child: SafeArea(
        child: Column(
          children: [
            // Folder type selector
            Padding(
              padding: const EdgeInsets.all(ThemeConstants.spacingMd),
              child: CupertinoSlidingSegmentedControl<int>(
                groupValue: _selectedSegment,
                children: const {
                  0: Text('图片'),
                  1: Text('视频'),
                },
                onValueChanged: (value) {
                  if (value != null) {
                    setState(() {
                      _selectedSegment = value;
                    });
                    materialProvider.clearSelection();
                    _loadMaterials();
                  }
                },
              ),
            ),

            // Materials grid
            Expanded(
              child: Consumer<MaterialProvider>(
                builder: (context, provider, child) {
                  if (provider.isLoading) {
                    return const Center(child: CupertinoActivityIndicator());
                  }

                  if (provider.error != null) {
                    return Center(
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Text(provider.error!),
                          const SizedBox(height: ThemeConstants.spacingMd),
                          CupertinoButton.filled(
                            onPressed: () {
                              provider.clearError();
                              _loadMaterials();
                            },
                            child: const Text('重试'),
                          ),
                        ],
                      ),
                    );
                  }

                  if (provider.materials.isEmpty) {
                    return const Center(
                      child: Text('暂无素材'),
                    );
                  }

                  return GridView.builder(
                    padding: const EdgeInsets.symmetric(
                      horizontal: ThemeConstants.spacingMd,
                    ),
                    gridDelegate:
                        const SliverGridDelegateWithFixedCrossAxisCount(
                      crossAxisCount: 2,
                      crossAxisSpacing: ThemeConstants.spacingMd,
                      mainAxisSpacing: ThemeConstants.spacingMd,
                      childAspectRatio: 0.8,
                    ),
                    itemCount: provider.materials.length,
                    itemBuilder: (context, index) {
                      final material = provider.materials[index];
                      return MaterialCard(
                        material: material,
                        isSelected: provider.selectedIds.contains(material.id),
                        onTap: provider.hasSelection
                            ? () => provider.toggleSelection(material.id)
                            : null,
                        onLongPress: () => provider.toggleSelection(material.id),
                      );
                    },
                  );
                },
              ),
            ),
          ],
        ),
      ),
    );
  }

  void _showBatchActions() {
    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    final materialProvider = Provider.of<MaterialProvider>(context, listen: false);

    showCupertinoModalPopup(
      context: context,
      builder: (context) => CupertinoActionSheet(
        title: Text('已选择 ${materialProvider.selectedIds.length} 个素材'),
        actions: [
          CupertinoActionSheetAction(
            onPressed: () async {
              Navigator.of(context).pop();
              if (authProvider.user != null) {
                await materialProvider.batchTrash(authProvider.user!.id);
              }
            },
            child: const Text('删除', style: TextStyle(color: CupertinoColors.systemRed)),
          ),
        ],
        cancelButton: CupertinoActionSheetAction(
          onPressed: () => Navigator.of(context).pop(),
          child: const Text('取消'),
        ),
      ),
    );
  }
}
```

- [ ] **Step 3: 创建设置页占位**

Write to `flutter_app/lib/screens/settings/settings_screen.dart`:

```dart
import 'package:flutter/cupertino.dart';

class SettingsScreen extends StatelessWidget {
  const SettingsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return CupertinoPageScaffold(
      navigationBar: const CupertinoNavigationBar(
        middle: Text('设置'),
      ),
      child: SafeArea(
        child: ListView(
          children: const [
            CupertinoListSection(
              header: Text('通用'),
              children: [
                CupertinoListTile(
                  title: Text('设置开发中...'),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
```

- [ ] **Step 4: 运行应用验证素材列表**

```bash
cd flutter_app
flutter run
```

Expected: 登录后显示素材网格，支持文件夹切换

- [ ] **Step 5: 提交素材列表代码**

```bash
cd "D:/Claude_Workspace/.claude/worktrees/nas-material-manager-v3"
git add flutter_app/lib/widgets/ flutter_app/lib/screens/home/ flutter_app/lib/screens/settings/
git commit -m "feat: add material grid and home screen"
```

---

## Task 9: 创建设置页面和 iOS 打包配置

**Files:**
- Modify: `flutter_app/lib/screens/settings/settings_screen.dart`
- Modify: `flutter_app/ios/Runner/Info.plist`

- [ ] **Step 1: 完善设置页面**

完全重写 `flutter_app/lib/screens/settings/settings_screen.dart`:

```dart
import 'package:flutter/cupertino.dart';
import 'package:provider/provider.dart';
import '../../providers/auth_provider.dart';
import '../../providers/theme_provider.dart';
import '../../providers/settings_provider.dart';
import '../../constants/theme_constants.dart';
import '../login/login_screen.dart';

class SettingsScreen extends StatelessWidget {
  const SettingsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final themeProvider = Provider.of<ThemeProvider>(context);
    final settingsProvider = Provider.of<SettingsProvider>(context);
    final authProvider = Provider.of<AuthProvider>(context);

    return CupertinoPageScaffold(
      navigationBar: const CupertinoNavigationBar(
        middle: Text('设置'),
      ),
      child: SafeArea(
        child: ListView(
          children: [
            CupertinoListSection(
              header: const Text('外观'),
              children: [
                CupertinoListTile(
                  title: const Text('深色模式'),
                  trailing: CupertinoSwitch(
                    value: themeProvider.brightness == Brightness.dark,
                    onChanged: (value) {
                      themeProvider.setBrightness(
                        value ? Brightness.dark : Brightness.light,
                      );
                    },
                  ),
                ),
              ],
            ),

            CupertinoListSection(
              header: const Text('服务器'),
              children: [
                _ApiUrlTile(currentUrl: settingsProvider.apiUrl),
              ],
            ),

            CupertinoListSection(
              header: const Text('账户'),
              children: [
                CupertinoListTile(
                  title: Text('当前用户: ${authProvider.user?.username ?? ''}'),
                  subtitle: Text(authProvider.isAdmin ? '管理员' : '普通用户'),
                ),
                CupertinoListTile(
                  title: const Text('退出登录', style: TextStyle(color: CupertinoColors.systemRed)),
                  onTap: () => _showLogoutConfirm(context, authProvider),
                ),
              ],
            ),

            CupertinoListSection(
              children: [
                CupertinoListTile(
                  title: const Text('清除缓存', style: TextStyle(color: CupertinoColors.systemRed)),
                  onTap: () => _showClearCacheConfirm(context, settingsProvider),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  void _showLogoutConfirm(BuildContext context, AuthProvider authProvider) {
    showCupertinoDialog(
      context: context,
      builder: (context) => CupertinoAlertDialog(
        title: const Text('确认退出'),
        content: const Text('确定要退出登录吗？'),
        actions: [
          CupertinoDialogAction(
            child: const Text('取消'),
            onPressed: () => Navigator.of(context).pop(),
          ),
          CupertinoDialogAction(
            isDestructiveAction: true,
            child: const Text('退出'),
            onPressed: () async {
              Navigator.of(context).pop();
              await authProvider.logout();
              if (context.mounted) {
                Navigator.of(context).pushAndRemoveUntil(
                  CupertinoPageRoute(builder: (_) => const LoginScreen()),
                  (route) => false,
                );
              }
            },
          ),
        ],
      ),
    );
  }

  void _showClearCacheConfirm(BuildContext context, SettingsProvider settingsProvider) {
    showCupertinoDialog(
      context: context,
      builder: (context) => CupertinoAlertDialog(
        title: const Text('确认清除'),
        content: const Text('确定要清除所有缓存吗？这将退出登录。'),
        actions: [
          CupertinoDialogAction(
            child: const Text('取消'),
            onPressed: () => Navigator.of(context).pop(),
          ),
          CupertinoDialogAction(
            isDestructiveAction: true,
            child: const Text('清除'),
            onPressed: () async {
              Navigator.of(context).pop();
              await settingsProvider.clearCache();
              if (context.mounted) {
                Navigator.of(context).pushAndRemoveUntil(
                  CupertinoPageRoute(builder: (_) => const LoginScreen()),
                  (route) => false,
                );
              }
            },
          ),
        ],
      ),
    );
  }
}

class _ApiUrlTile extends StatefulWidget {
  final String currentUrl;

  const _ApiUrlTile({required this.currentUrl});

  @override
  State<_ApiUrlTile> createState() => _ApiUrlTileState();
}

class _ApiUrlTileState extends State<_ApiUrlTile> {
  final TextEditingController _controller = TextEditingController();
  bool _isEditing = false;

  @override
  void initState() {
    super.initState();
    _controller.text = widget.currentUrl;
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final settingsProvider = Provider.of<SettingsProvider>(context, listen: false);

    if (_isEditing) {
      return Padding(
        padding: const EdgeInsets.all(ThemeConstants.spacingMd),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            CupertinoTextField(
              controller: _controller,
              placeholder: 'http://localhost:3000',
              autofocus: true,
            ),
            const SizedBox(height: ThemeConstants.spacingMd),
            Row(
              children: [
                Expanded(
                  child: CupertinoButton(
                    onPressed: () {
                      setState(() {
                        _isEditing = false;
                        _controller.text = settingsProvider.apiUrl;
                      });
                    },
                    child: const Text('取消'),
                  ),
                ),
                const SizedBox(width: ThemeConstants.spacingMd),
                Expanded(
                  child: CupertinoButton.filled(
                    onPressed: () async {
                      await settingsProvider.setApiUrl(_controller.text);
                      setState(() {
                        _isEditing = false;
                      });
                    },
                    child: const Text('保存'),
                  ),
                ),
              ],
            ),
          ],
        ),
      );
    }

    return CupertinoListTile(
      title: const Text('服务器地址'),
      subtitle: Text(settingsProvider.apiUrl),
      trailing: const Icon(CupertinoIcons.chevron_right),
      onTap: () {
        setState(() {
          _isEditing = true;
        });
      },
    );
  }
}
```

- [ ] **Step 2: 配置 iOS Info.plist**

Add to `flutter_app/ios/Runner/Info.plist`:

```xml
<key>NSPhotoLibraryUsageDescription</key>
<string>需要访问相册以选择素材上传</string>
<key>NSCameraUsageDescription</key>
<string>需要访问相机以拍摄素材</string>
<key>NSDocumentPickerUsageDescription</key>
<string>需要访问文件以选择素材</string>
```

- [ ] **Step 3: 运行应用验证设置功能**

```bash
cd flutter_app
flutter run
```

Expected: 设置页面可以修改服务器地址、切换主题

- [ ] **Step 4: iOS 模拟器构建测试**

```bash
cd flutter_app
flutter build ios --simulator
```

Expected: 构建成功

- [ ] **Step 5: 提交设置页面和 iOS 配置**

```bash
cd "D:/Claude_Workspace/.claude/worktrees/nas-material-manager-v3"
git add flutter_app/lib/screens/settings/settings_screen.dart flutter_app/ios/Runner/Info.plist
git commit -m "feat: add settings screen and iOS configuration"
```

---

## 后续任务（待实现）

以下任务可在上述基础上继续开发：

- Task 10: 素材详情和编辑页
- Task 11: 文件上传功能
- Task 12: 垃圾箱页面
- Task 13: 用户管理页（管理员）
- Task 14: AI 功能集成
- Task 15: 完整的批量操作
- Task 16: 视频播放和下载
- Task 17: iOS 真机打包配置
- Task 18: 测试和优化
