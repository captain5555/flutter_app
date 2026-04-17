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
  final _formKey = GlobalKey<FormState>();
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
    if (_formKey.currentState!.validate()) {
      final authProvider = Provider.of<AuthProvider>(context, listen: false);

      try {
        final success = await authProvider.login(
          _usernameController.text.trim(),
          _passwordController.text.trim(),
        );

        if (success && mounted) {
          Navigator.of(context).pushReplacement(
            CupertinoPageRoute(builder: (_) => const HomeScreen()),
          );
        } else if (mounted) {
          if (!mounted) return;
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
      } catch (e) {
        if (mounted) {
          showCupertinoDialog(
            context: context,
            builder: (context) => CupertinoAlertDialog(
              title: const Text('登录异常'),
              content: Text(e.toString()),
              actions: [
                CupertinoDialogAction(
                  child: const Text('确定'),
                  onPressed: () => Navigator.of(context).pop(),
                ),
              ],
            ),
          );
        }
      }
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
            if (authProvider.isLoading) {
              return const Center(child: CupertinoActivityIndicator());
            }

            return SingleChildScrollView(
              padding: const EdgeInsets.all(ThemeConstants.spacingLg),
              child: Form(
                key: _formKey,
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
                    CupertinoTextFormFieldRow(
                      controller: _usernameController,
                      placeholder: '用户名',
                      prefix: const Icon(CupertinoIcons.person),
                      validator: (value) {
                        if (value?.trim().isEmpty ?? true) {
                          return '请输入用户名';
                        }
                        return null;
                      },
                    ),
                    const SizedBox(height: ThemeConstants.spacingMd),
                    CupertinoTextFormFieldRow(
                      controller: _passwordController,
                      placeholder: '密码',
                      obscureText: _obscurePassword,
                      prefix: const Icon(CupertinoIcons.lock),
                      validator: (value) {
                        if (value?.trim().isEmpty ?? true) {
                          return '请输入密码';
                        }
                        return null;
                      },
                    ),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.end,
                      children: [
                        CupertinoButton(
                          padding: EdgeInsets.zero,
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
                      ],
                    ),
                    const SizedBox(height: ThemeConstants.spacingXl),
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
              ),
            );
          },
        ),
      ),
    );
  }
}
