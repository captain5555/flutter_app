import 'package:flutter/cupertino.dart';
import 'package:provider/provider.dart';
import '../../providers/auth_provider.dart';
import '../../constants/theme_constants.dart';
import '../home/home_screen.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _usernameController = TextEditingController();
  final _passwordController = TextEditingController();
  bool _obscurePassword = true;

  @override
  void initState() {
    super.initState();
    _usernameController.text = 'admin';
    _passwordController.text = 'admin123';
  }

  @override
  void dispose() {
    _usernameController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    final username = _usernameController.text.trim();
    final password = _passwordController.text.trim();

    if (username.isEmpty) {
      _showError('请输入用户名');
      return;
    }
    if (password.isEmpty) {
      _showError('请输入密码');
      return;
    }

    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    final success = await authProvider.login(username, password);

    if (success && mounted) {
      Navigator.of(context).pushReplacement(
        CupertinoPageRoute(builder: (_) => const HomeScreen()),
      );
    } else if (mounted) {
      _showError(authProvider.error ?? '登录失败');
    }
  }

  void _showError(String message) {
    if (!mounted) return;
    showCupertinoDialog(
      context: context,
      builder: (context) => CupertinoAlertDialog(
        title: const Text('提示'),
        content: Text(message),
        actions: [
          CupertinoDialogAction(
            child: const Text('确定'),
            onPressed: () => Navigator.of(context).pop(),
          ),
        ],
      ),
    );
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
            if (authProvider.isLoading) {
              return const Center(child: CupertinoActivityIndicator());
            }

            return SingleChildScrollView(
              padding: const EdgeInsets.all(ThemeConstants.spacingLg),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  const SizedBox(height: ThemeConstants.spacingXl),
                  Icon(
                    CupertinoIcons.photo_on_rectangle,
                    size: 80,
                    color: CupertinoTheme.of(context).primaryColor,
                  ),
                  const SizedBox(height: ThemeConstants.spacingMd),
                  const Text(
                    'NAS 素材管理',
                    style: ThemeConstants.titleStyle,
                    textAlign: TextAlign.center,
                  ),
                  const SizedBox(height: ThemeConstants.spacingXl * 2),

                  // 用户名
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: ThemeConstants.spacingSm),
                    child: CupertinoTextField(
                      controller: _usernameController,
                      placeholder: '用户名',
                      prefix: const Padding(
                        padding: EdgeInsets.all(8.0),
                        child: Icon(CupertinoIcons.person, size: 20),
                      ),
                    ),
                  ),
                  const SizedBox(height: ThemeConstants.spacingMd),

                  // 密码
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: ThemeConstants.spacingSm),
                    child: CupertinoTextField(
                      controller: _passwordController,
                      placeholder: '密码',
                      obscureText: _obscurePassword,
                      prefix: const Padding(
                        padding: EdgeInsets.all(8.0),
                        child: Icon(CupertinoIcons.lock, size: 20),
                      ),
                      suffix: CupertinoButton(
                        padding: const EdgeInsets.all(8.0),
                        child: Icon(
                          _obscurePassword
                              ? CupertinoIcons.eye_slash
                              : CupertinoIcons.eye,
                          size: 20,
                        ),
                        onPressed: () {
                          setState(() {
                            _obscurePassword = !_obscurePassword;
                          });
                        },
                      ),
                    ),
                  ),
                  const SizedBox(height: ThemeConstants.spacingXl),

                  // 登录按钮
                  CupertinoButton.filled(
                    onPressed: _submit,
                    child: const Text('登录'),
                  ),

                  const SizedBox(height: ThemeConstants.spacingMd),
                  const Text(
                    '测试账户: admin / admin123',
                    style: ThemeConstants.captionStyle,
                    textAlign: TextAlign.center,
                  ),
                ],
              ),
            );
          },
        ),
      ),
    );
  }
}
