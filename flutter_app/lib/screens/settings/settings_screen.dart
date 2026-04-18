import 'package:flutter/cupertino.dart';
import 'package:provider/provider.dart';
import '../../providers/theme_provider.dart';
import '../../providers/settings_provider.dart';
import '../../providers/auth_provider.dart';
import '../../constants/theme_constants.dart';
import '../login/login_screen.dart';
import '../admin/user_management_screen.dart';

class SettingsScreen extends StatefulWidget {
  const SettingsScreen({super.key});

  @override
  State<SettingsScreen> createState() => _SettingsScreenState();
}

class _SettingsScreenState extends State<SettingsScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (mounted) {
        Provider.of<SettingsProvider>(context, listen: false).loadSettings();
      }
    });
  }

  Future<void> _logout() async {
    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    await authProvider.logout();

    if (mounted) {
      Navigator.of(context).pushReplacement(
        CupertinoPageRoute(builder: (_) => const LoginScreen()),
      );
    }
  }

  void _showApiUrlDialog() {
    final settingsProvider = Provider.of<SettingsProvider>(context, listen: false);
    final controller = TextEditingController(text: settingsProvider.baseUrl);

    showCupertinoDialog(
      context: context,
      builder: (context) => CupertinoAlertDialog(
        title: const Text('API 地址'),
        content: Padding(
          padding: const EdgeInsets.only(top: ThemeConstants.spacingMd),
          child: CupertinoTextField(
            controller: controller,
            placeholder: 'http://localhost:3000',
            autofocus: true,
            clearButtonMode: OverlayVisibilityMode.editing,
          ),
        ),
        actions: [
          CupertinoDialogAction(
            child: const Text('取消'),
            onPressed: () => Navigator.of(context).pop(),
          ),
          CupertinoDialogAction(
            child: const Text('保存'),
            onPressed: () async {
              final url = controller.text.trim();
              if (url.isNotEmpty) {
                await settingsProvider.updateBaseUrl(url);
              }
              if (mounted) {
                Navigator.of(context).pop();
              }
            },
          ),
        ],
      ),
    );
  }

  void _showClearCacheDialog() {
    showCupertinoDialog(
      context: context,
      builder: (ctx) => CupertinoAlertDialog(
        title: const Text('清除缓存'),
        content: const Text('确定要清除所有缓存吗？'),
        actions: [
          CupertinoDialogAction(
            child: const Text('取消'),
            onPressed: () => Navigator.pop(ctx),
          ),
          CupertinoDialogAction(
            isDestructiveAction: true,
            child: const Text('清除'),
            onPressed: () async {
              Navigator.pop(ctx);
              await _clearCache();
            },
          ),
        ],
      ),
    );
  }

  Future<void> _clearCache() async {
    try {
      final settingsProvider = Provider.of<SettingsProvider>(context, listen: false);
      await settingsProvider.clearCache();

      if (mounted) {
        showCupertinoDialog(
          context: context,
          builder: (ctx) => CupertinoAlertDialog(
            title: const Text('清除成功'),
            content: const Text('缓存已清除'),
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
        showCupertinoDialog(
          context: context,
          builder: (ctx) => CupertinoAlertDialog(
            title: const Text('清除失败'),
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

  @override
  Widget build(BuildContext context) {
    return CupertinoPageScaffold(
      navigationBar: const CupertinoNavigationBar(
        middle: Text('设置'),
      ),
      child: SafeArea(
        child: ListView(
          padding: const EdgeInsets.all(ThemeConstants.spacingMd),
          children: [
            // Theme Setting
            Consumer<ThemeProvider>(
              builder: (context, themeProvider, child) {
                return CupertinoListSection.insetGrouped(
                  header: const Text('外观'),
                  children: [
                    CupertinoListTile(
                      title: const Text('深色模式'),
                      trailing: CupertinoSwitch(
                        value: themeProvider.isDarkMode,
                        onChanged: (value) {
                          themeProvider.setTheme(value);
                        },
                      ),
                    ),
                  ],
                );
              },
            ),

            // API Setting
            Consumer<SettingsProvider>(
              builder: (context, settingsProvider, child) {
                return CupertinoListSection.insetGrouped(
                  header: const Text('服务器'),
                  children: [
                    CupertinoListTile(
                      title: const Text('API 地址'),
                      subtitle: Text(settingsProvider.baseUrl),
                      trailing: const CupertinoListTileChevron(),
                      onTap: _showApiUrlDialog,
                    ),
                  ],
                );
              },
            ),

            // Cache Section
            CupertinoListSection.insetGrouped(
              header: const Text('缓存'),
              children: [
                CupertinoListTile(
                  title: const Text('清除缓存'),
                  trailing: const CupertinoListTileChevron(),
                  onTap: _showClearCacheDialog,
                ),
              ],
            ),

            // Admin Section (only for admin)
            Consumer<AuthProvider>(
              builder: (context, authProvider, child) {
                if (authProvider.user?.role != 'admin') {
                  return const SizedBox.shrink();
                }
                return CupertinoListSection.insetGrouped(
                  header: const Text('管理'),
                  children: [
                    CupertinoListTile(
                      title: const Text('用户管理'),
                      trailing: const CupertinoListTileChevron(),
                      onTap: () {
                        Navigator.of(context).push(
                          CupertinoPageRoute(
                            builder: (_) => const UserManagementScreen(),
                          ),
                        );
                      },
                    ),
                  ],
                );
              },
            ),

            // Account Section
            CupertinoListSection.insetGrouped(
              header: const Text('账户'),
              children: [
                CupertinoListTile(
                  title: const Text(
                    '退出登录',
                    style: TextStyle(color: CupertinoColors.systemRed),
                  ),
                  onTap: _logout,
                ),
              ],
            ),

            // Info Section
            CupertinoListSection.insetGrouped(
              header: const Text('关于'),
              children: const [
                CupertinoListTile(
                  title: Text('版本'),
                  subtitle: Text('1.0.0'),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
