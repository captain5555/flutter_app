import 'package:flutter/cupertino.dart';
import 'package:provider/provider.dart';
import '../../providers/theme_provider.dart';
import '../../providers/settings_provider.dart';
import '../../providers/auth_provider.dart';
import '../../constants/theme_constants.dart';
import '../login/login_screen.dart';

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
