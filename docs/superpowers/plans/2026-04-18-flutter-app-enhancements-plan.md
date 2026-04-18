# Flutter App 功能增强实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为 Flutter NAS 素材管理应用添加视频播放、用户管理入口和复制/移动素材功能

**Architecture:** 分三个阶段实施，每个阶段独立测试并提交，遵循现有代码架构和模式

**Tech Stack:** Flutter, Provider, video_player, Dio

---

## 阶段一：视频播放功能

### Task 1.1: 读取当前 MaterialDetailScreen 代码

**Files:**
- Read: `flutter_app/lib/screens/material/material_detail_screen.dart`

- [ ] **Step 1: 读取完整的 material_detail_screen.dart 文件**

使用 Read 工具读取文件内容，了解当前实现。

---

### Task 1.2: 添加视频播放器状态管理

**Files:**
- Modify: `flutter_app/lib/screens/material/material_detail_screen.dart`

- [ ] **Step 1: 导入 video_player 包**

在文件顶部添加：
```dart
import 'package:video_player/video_player.dart';
```

- [ ] **Step 2: 在 _MaterialDetailScreenState 中添加状态变量**

在类开头添加：
```dart
  VideoPlayerController? _videoController;
  bool _isVideoInitialized = false;
  bool _isVideoError = false;
```

---

### Task 1.3: 初始化视频播放器

**Files:**
- Modify: `flutter_app/lib/screens/material/material_detail_screen.dart`

- [ ] **Step 1: 在 initState 中初始化视频播放器**

在 `initState` 方法中，添加以下代码（在现有控制器初始化之后）：
```dart
    // 初始化视频播放器
    if (widget.material.isVideo) {
      final settingsProvider = Provider.of<SettingsProvider>(context, listen: false);
      final mediaUrl = _getMediaUrl(settingsProvider.baseUrl);
      if (mediaUrl != null) {
        _videoController = VideoPlayerController.networkUrl(Uri.parse(mediaUrl));
        _videoController!.initialize().then((_) {
          if (mounted) {
            setState(() {
              _isVideoInitialized = true;
            });
          }
        }).catchError((error) {
          if (mounted) {
            setState(() {
              _isVideoError = true;
            });
          }
        });
      }
    }
```

- [ ] **Step 2: 在 dispose 中释放资源**

在 `dispose` 方法中添加：
```dart
    _videoController?.dispose();
```

---

### Task 1.4: 更新视频预览区域 UI

**Files:**
- Modify: `flutter_app/lib/screens/material/material_detail_screen.dart`

- [ ] **Step 1: 替换视频预览区域**

找到 Media Preview 部分（约第 364-401 行），将视频部分的 Container 替换为：
```dart
                    : _isVideoError
                        ? Container(
                            height: 300,
                            color: CupertinoColors.systemGrey5,
                            child: const Center(
                              child: Icon(
                                CupertinoIcons.exclamationmark_triangle,
                                size: 60,
                                color: CupertinoColors.systemGrey3,
                              ),
                            ),
                          )
                        : _isVideoInitialized
                            ? AspectRatio(
                                aspectRatio: _videoController!.value.aspectRatio,
                                child: VideoPlayer(_videoController!),
                              )
                            : Container(
                                height: 300,
                                color: CupertinoColors.systemGrey5,
                                child: const Center(
                                  child: CupertinoActivityIndicator(),
                                ),
                              ),
```

---

### Task 1.5: 添加播放控制覆盖层

**Files:**
- Modify: `flutter_app/lib/screens/material/material_detail_screen.dart`

- [ ] **Step 1: 添加播放/暂停按钮**

在 VideoPlayer 外层包裹一个 Stack，添加播放控制：
```dart
                    : _isVideoError
                        ? Container(
                            height: 300,
                            color: CupertinoColors.systemGrey5,
                            child: const Center(
                              child: Icon(
                                CupertinoIcons.exclamationmark_triangle,
                                size: 60,
                                color: CupertinoColors.systemGrey3,
                              ),
                            ),
                          )
                        : _isVideoInitialized
                            ? Stack(
                                alignment: Alignment.center,
                                children: [
                                  AspectRatio(
                                    aspectRatio: _videoController!.value.aspectRatio,
                                    child: VideoPlayer(_videoController!),
                                  ),
                                  GestureDetector(
                                    onTap: () {
                                      setState(() {
                                        if (_videoController!.value.isPlaying) {
                                          _videoController!.pause();
                                        } else {
                                          _videoController!.play();
                                        }
                                      });
                                    },
                                    child: Container(
                                      color: CupertinoColors.black.withOpacity(0.3),
                                      child: Icon(
                                        _videoController!.value.isPlaying
                                            ? CupertinoIcons.pause_circle_fill
                                            : CupertinoIcons.play_circle_fill,
                                        size: 60,
                                        color: CupertinoColors.white,
                                      ),
                                    ),
                                  ),
                                ],
                              )
                            : Container(
                                height: 300,
                                color: CupertinoColors.systemGrey5,
                                child: const Center(
                                  child: CupertinoActivityIndicator(),
                                ),
                              ),
```

---

### Task 1.6: 测试视频播放功能

**Files:**
- Test: 运行 Flutter 应用测试

- [ ] **Step 1: 运行 flutter pub get（如有需要）**

```bash
cd flutter_app
flutter pub get
```

- [ ] **Step 2: 运行应用并测试**

启动应用，登录后上传或选择一个视频素材，点击进入详情页，确认：
- 视频能正常加载
- 点击可以播放/暂停
- 显示视频画面

- [ ] **Step 3: 提交代码**

```bash
git add flutter_app/lib/screens/material/material_detail_screen.dart
git commit -m "feat: add video player to material detail screen"
```

---

## 阶段二：用户管理入口

### Task 2.1: 读取当前 SettingsScreen 代码

**Files:**
- Read: `flutter_app/lib/screens/settings/settings_screen.dart`

- [ ] **Step 1: 读取完整的 settings_screen.dart 文件**

使用 Read 工具读取文件内容，了解当前实现。

---

### Task 2.2: 添加管理后台入口

**Files:**
- Modify: `flutter_app/lib/screens/settings/settings_screen.dart`

- [ ] **Step 1: 导入 UserManagementScreen**

在文件顶部添加：
```dart
import '../admin/user_management_screen.dart';
```

- [ ] **Step 2: 在设置列表中添加管理后台入口**

在 build 方法的 ListView 中，在最顶部（第一个 child）添加：
```dart
            if (context.watch<AuthProvider>().user?.role == 'admin') ...[
              _buildSettingsItem(
                icon: CupertinoIcons.person_2_fill,
                title: '管理后台',
                onTap: () {
                  Navigator.of(context).push(
                    CupertinoPageRoute(
                      builder: (_) => const UserManagementScreen(),
                    ),
                  );
                },
              ),
              const SizedBox(height: ThemeConstants.spacingMd),
            ],
```

---

### Task 2.3: 测试用户管理入口

**Files:**
- Test: 运行 Flutter 应用测试

- [ ] **Step 1: 运行应用并测试**

使用 admin 账户登录，进入设置页面，确认：
- 能看到"管理后台"入口
- 点击能进入用户管理页面
- 能正常返回

- [ ] **Step 2: 用普通用户测试**

使用非 admin 账户登录，进入设置页面，确认：
- 不显示"管理后台"入口

- [ ] **Step 3: 提交代码**

```bash
git add flutter_app/lib/screens/settings/settings_screen.dart
git commit -m "feat: add admin screen entry in settings"
```

---

## 阶段三：复制/移动素材功能

### Task 3.1: 读取相关文件

**Files:**
- Read: `flutter_app/lib/services/material_service.dart`
- Read: `flutter_app/lib/providers/material_provider.dart`
- Read: `flutter_app/lib/screens/home/home_screen.dart`

- [ ] **Step 1: 读取 material_service.dart**

- [ ] **Step 2: 读取 material_provider.dart**

- [ ] **Step 3: 读取 home_screen.dart**

---

### Task 3.2: 在 MaterialService 中添加批量复制/移动方法

**Files:**
- Modify: `flutter_app/lib/services/material_service.dart`

- [ ] **Step 1: 添加 batchCopy 方法**

在 MaterialService 类中添加：
```dart
  Future<Map<String, dynamic>> batchCopy(List<int> ids, int targetUserId) async {
    final apiService = ApiService();
    final response = await apiService.post('/materials/batch/copy', {
      'ids': ids,
      'targetUserId': targetUserId,
    });
    return response as Map<String, dynamic>;
  }
```

- [ ] **Step 2: 添加 batchMove 方法**

在 MaterialService 类中添加：
```dart
  Future<Map<String, dynamic>> batchMove(List<int> ids, int targetUserId, String targetFolder) async {
    final apiService = ApiService();
    final response = await apiService.post('/materials/batch/move', {
      'ids': ids,
      'targetUserId': targetUserId,
      'targetFolder': targetFolder,
    });
    return response as Map<String, dynamic>;
  }
```

---

### Task 3.3: 在 MaterialProvider 中添加批量复制/移动方法

**Files:**
- Modify: `flutter_app/lib/providers/material_provider.dart`

- [ ] **Step 1: 添加 batchCopy 方法**

在 MaterialProvider 类中添加：
```dart
  Future<void> batchCopy(List<int> ids, int targetUserId, String targetFolder) async {
    if (_isLoading) return;

    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      await _materialService.batchCopy(ids, targetUserId);
      // 如果目标文件夹与当前文件夹相同，刷新列表
      if (targetFolder == _currentFolder && _currentUser != null) {
        await loadMaterials(_currentUser!);
      }
    } catch (e) {
      _error = e.toString();
    } finally {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }
```

- [ ] **Step 2: 添加 batchMove 方法**

在 MaterialProvider 类中添加：
```dart
  Future<void> batchMove(List<int> ids, int targetUserId, String targetFolder) async {
    if (_isLoading) return;

    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      await _materialService.batchMove(ids, targetUserId, targetFolder);
      // 从当前列表中移除移动的素材
      for (final id in ids) {
        _materials.removeWhere((m) => m.id == id);
      }
      notifyListeners();
    } catch (e) {
      _error = e.toString();
    } finally {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }
```

---

### Task 3.4: 在 HomeScreen 中添加复制/移动对话框

**Files:**
- Modify: `flutter_app/lib/screens/home/home_screen.dart`

- [ ] **Step 1: 实现 _showBatchCopyDialog 方法**

在 `_MaterialsTabState` 类中，替换 `_showCopyDialog` 方法：
```dart
  Future<void> _showBatchCopyDialog() async {
    if (_selectedIds.isEmpty) return;

    String? selectedFolder = _currentFolder;

    final confirmed = await showCupertinoDialog<bool>(
      context: context,
      builder: (ctx) => CupertinoAlertDialog(
        title: const Text('复制到'),
        content: StatefulBuilder(
          builder: (dialogCtx, setDialogState) => Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              _buildFolderOption(
                'images',
                '图片文件夹',
                selectedFolder == 'images',
                () => setDialogState(() => selectedFolder = 'images'),
              ),
              const SizedBox(height: 8),
              _buildFolderOption(
                'videos',
                '视频文件夹',
                selectedFolder == 'videos',
                () => setDialogState(() => selectedFolder = 'videos'),
              ),
            ],
          ),
        ),
        actions: [
          CupertinoDialogAction(
            child: const Text('取消'),
            onPressed: () => Navigator.pop(ctx, false),
          ),
          CupertinoDialogAction(
            child: const Text('复制'),
            onPressed: () => Navigator.pop(ctx, true),
          ),
        ],
      ),
    );

    if (confirmed == true && selectedFolder != null && mounted) {
      await _handleBatchCopy(selectedFolder!);
    }
  }

  Widget _buildFolderOption(
    String value,
    String label,
    bool isSelected,
    VoidCallback onTap,
  ) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        decoration: BoxDecoration(
          color: isSelected
              ? CupertinoTheme.of(context).primaryColor.withOpacity(0.1)
              : CupertinoColors.systemGrey6,
          borderRadius: BorderRadius.circular(ThemeConstants.borderRadiusMd),
          border: Border.all(
            color: isSelected
                ? CupertinoTheme.of(context).primaryColor
                : CupertinoColors.systemGrey5,
            width: 1,
          ),
        ),
        child: Row(
          children: [
            Icon(
              isSelected
                  ? CupertinoIcons.checkmark_circle_fill
                  : CupertinoIcons.circle,
              color: isSelected
                  ? CupertinoTheme.of(context).primaryColor
                  : CupertinoColors.systemGrey3,
              size: 20,
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Text(
                label,
                style: TextStyle(
                  fontSize: 16,
                  color: isSelected
                      ? CupertinoTheme.of(context).primaryColor
                      : null,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _handleBatchCopy(String targetFolder) async {
    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    if (authProvider.user == null) return;

    // Show loading
    if (mounted) {
      showCupertinoDialog(
        context: context,
        barrierDismissible: false,
        builder: (ctx) => const CupertinoAlertDialog(
          title: Text('复制中...'),
          content: Center(
            child: Padding(
              padding: EdgeInsets.only(top: 16),
              child: CupertinoActivityIndicator(),
            ),
          ),
        ),
      );
    }

    try {
      await Provider.of<MaterialProvider>(context, listen: false).batchCopy(
        _selectedIds.toList(),
        authProvider.user!.id,
        targetFolder,
      );

      if (mounted) {
        Navigator.pop(context); // Dismiss loading
        _exitSelectionMode();
        // 如果目标文件夹与当前相同，刷新
        if (targetFolder == _currentFolder) {
          widget.onRefresh();
        }
        showCupertinoDialog(
          context: context,
          builder: (ctx) => CupertinoAlertDialog(
            title: const Text('复制成功'),
            actions: [
              CupertinoDialogAction(
                child: const Text('确定'),
                onPressed: () => Navigator.pop(ctx),
              ),
            ],
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        Navigator.pop(context); // Dismiss loading
        showCupertinoDialog(
          context: context,
          builder: (ctx) => CupertinoAlertDialog(
            title: const Text('复制失败'),
            content: Text(e.toString()),
            actions: [
              CupertinoDialogAction(
                child: const Text('确定'),
                onPressed: () => Navigator.pop(ctx),
              ),
            ],
          ),
        );
      }
    }
  }
```

- [ ] **Step 2: 实现 _showBatchMoveDialog 方法**

替换 `_showMoveDialog` 方法：
```dart
  Future<void> _showBatchMoveDialog() async {
    if (_selectedIds.isEmpty) return;

    String? selectedFolder = _currentFolder == 'images' ? 'videos' : 'images';

    final confirmed = await showCupertinoDialog<bool>(
      context: context,
      builder: (ctx) => CupertinoAlertDialog(
        title: const Text('移动到'),
        content: StatefulBuilder(
          builder: (dialogCtx, setDialogState) => Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              _buildFolderOption(
                'images',
                '图片文件夹',
                selectedFolder == 'images',
                () => setDialogState(() => selectedFolder = 'images'),
              ),
              const SizedBox(height: 8),
              _buildFolderOption(
                'videos',
                '视频文件夹',
                selectedFolder == 'videos',
                () => setDialogState(() => selectedFolder = 'videos'),
              ),
            ],
          ),
        ),
        actions: [
          CupertinoDialogAction(
            child: const Text('取消'),
            onPressed: () => Navigator.pop(ctx, false),
          ),
          CupertinoDialogAction(
            isDestructiveAction: true,
            child: const Text('移动'),
            onPressed: () => Navigator.pop(ctx, true),
          ),
        ],
      ),
    );

    if (confirmed == true && selectedFolder != null && mounted) {
      await _handleBatchMove(selectedFolder!);
    }
  }

  Future<void> _handleBatchMove(String targetFolder) async {
    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    if (authProvider.user == null) return;

    // Show loading
    if (mounted) {
      showCupertinoDialog(
        context: context,
        barrierDismissible: false,
        builder: (ctx) => const CupertinoAlertDialog(
          title: Text('移动中...'),
          content: Center(
            child: Padding(
              padding: EdgeInsets.only(top: 16),
              child: CupertinoActivityIndicator(),
            ),
          ),
        ),
      );
    }

    try {
      await Provider.of<MaterialProvider>(context, listen: false).batchMove(
        _selectedIds.toList(),
        authProvider.user!.id,
        targetFolder,
      );

      if (mounted) {
        Navigator.pop(context); // Dismiss loading
        _exitSelectionMode();
        showCupertinoDialog(
          context: context,
          builder: (ctx) => CupertinoAlertDialog(
            title: const Text('移动成功'),
            actions: [
              CupertinoDialogAction(
                child: const Text('确定'),
                onPressed: () => Navigator.pop(ctx),
              ),
            ],
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        Navigator.pop(context); // Dismiss loading
        showCupertinoDialog(
          context: context,
          builder: (ctx) => CupertinoAlertDialog(
            title: const Text('移动失败'),
            content: Text(e.toString()),
            actions: [
              CupertinoDialogAction(
                child: const Text('确定'),
                onPressed: () => Navigator.pop(ctx),
              ),
            ],
          ),
        );
      }
    }
  }
```

- [ ] **Step 3: 更新按钮点击事件**

找到 `_showCopyDialog` 和 `_showMoveDialog` 的调用处，改为：
```dart
  void _showCopyDialog() {
    _showBatchCopyDialog();
  }

  void _showMoveDialog() {
    _showBatchMoveDialog();
  }
```

---

### Task 3.5: 测试复制/移动功能

**Files:**
- Test: 运行 Flutter 应用测试

- [ ] **Step 1: 运行应用并测试复制功能**

1. 选择一些素材
2. 点击"复制"按钮
3. 选择目标文件夹
4. 确认复制成功
5. 切换到目标文件夹，确认素材已复制

- [ ] **Step 2: 测试移动功能**

1. 选择一些素材
2. 点击"移动"按钮
3. 选择目标文件夹
4. 确认移动成功
5. 确认素材从当前文件夹消失，出现在目标文件夹

- [ ] **Step 3: 提交代码**

```bash
git add flutter_app/lib/services/material_service.dart
git add flutter_app/lib/providers/material_provider.dart
git add flutter_app/lib/screens/home/home_screen.dart
git commit -m "feat: add batch copy and move functionality"
```

---

## 最终确认

### 所有阶段完成后

- [ ] **Step 1: 运行完整测试**

测试所有新功能：
- 视频播放
- 用户管理入口（admin/普通用户）
- 复制素材
- 移动素材

- [ ] **Step 2: 更新 PROGRESS.md（可选）**

如有需要，更新 flutter_app/PROGRESS.md

---

## 备注

- 所有代码遵循现有代码风格和模式
- 每个任务完成后独立提交，便于回滚
- 使用 Cupertino 风格的组件，保持 iOS 体验一致性
