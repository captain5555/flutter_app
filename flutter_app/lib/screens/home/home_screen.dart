import 'package:flutter/cupertino.dart';
import 'package:provider/provider.dart';
import '../../providers/auth_provider.dart';
import '../../providers/material_provider.dart';
import '../../constants/theme_constants.dart';
import '../../widgets/material_card.dart';
import '../login/login_screen.dart';
import '../settings/settings_screen.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  int _selectedIndex = 0;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _loadData();
    });
  }

  Future<void> _loadData() async {
    if (!mounted) return;
    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    final materialProvider = Provider.of<MaterialProvider>(context, listen: false);

    if (authProvider.user != null) {
      await materialProvider.loadMaterials(authProvider.user!);
    }
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

  @override
  Widget build(BuildContext context) {
    return CupertinoTabScaffold(
      tabBar: CupertinoTabBar(
        items: const [
          BottomNavigationBarItem(
            icon: Icon(CupertinoIcons.photo),
            label: '素材',
          ),
          BottomNavigationBarItem(
            icon: Icon(CupertinoIcons.settings),
            label: '设置',
          ),
        ],
        currentIndex: _selectedIndex,
        onTap: (index) {
          setState(() {
            _selectedIndex = index;
          });
        },
      ),
      tabBuilder: (context, index) {
        if (index == 0) {
          return CupertinoTabView(
            builder: (context) => _MaterialsTab(onLogout: _logout),
          );
        } else {
          return CupertinoTabView(
            builder: (context) => const SettingsScreen(),
          );
        }
      },
    );
  }
}

class _MaterialsTab extends StatefulWidget {
  final VoidCallback onLogout;

  const _MaterialsTab({required this.onLogout});

  @override
  State<_MaterialsTab> createState() => _MaterialsTabState();
}

class _MaterialsTabState extends State<_MaterialsTab> {
  final Set<int> _selectedIds = {};
  bool _isSelectionMode = false;

  void _toggleSelection(int id) {
    setState(() {
      if (_selectedIds.contains(id)) {
        _selectedIds.remove(id);
        if (_selectedIds.isEmpty) {
          _isSelectionMode = false;
        }
      } else {
        _selectedIds.add(id);
        _isSelectionMode = true;
      }
    });
  }

  void _exitSelectionMode() {
    setState(() {
      _selectedIds.clear();
      _isSelectionMode = false;
    });
  }

  Future<void> _moveToTrash() async {
    if (_selectedIds.isEmpty) return;

    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    final materialProvider = Provider.of<MaterialProvider>(context, listen: false);

    await materialProvider.batchTrash(_selectedIds.toList());
    _exitSelectionMode();
  }

  @override
  Widget build(BuildContext context) {
    final authProvider = context.watch<AuthProvider>();
    final materialProvider = context.watch<MaterialProvider>();

    return CupertinoPageScaffold(
      navigationBar: CupertinoNavigationBar(
        middle: _isSelectionMode
            ? Text('已选择 ${_selectedIds.length} 项')
            : const Text('素材'),
        leading: _isSelectionMode
            ? CupertinoButton(
                padding: EdgeInsets.zero,
                child: const Text('取消'),
                onPressed: _exitSelectionMode,
              )
            : null,
        trailing: _isSelectionMode
            ? CupertinoButton(
                padding: EdgeInsets.zero,
                child: const Icon(
                  CupertinoIcons.trash,
                  color: CupertinoColors.systemRed,
                ),
                onPressed: () {
                  showCupertinoDialog(
                    context: context,
                    builder: (context) => CupertinoAlertDialog(
                      title: const Text('确认删除'),
                      content: Text('将 ${_selectedIds.length} 个文件移到回收站？'),
                      actions: [
                        CupertinoDialogAction(
                          child: const Text('取消'),
                          onPressed: () => Navigator.of(context).pop(),
                        ),
                        CupertinoDialogAction(
                          isDestructiveAction: true,
                          onPressed: () {
                            Navigator.of(context).pop();
                            _moveToTrash();
                          },
                          child: const Text('删除'),
                        ),
                      ],
                    ),
                  );
                },
              )
            : CupertinoButton(
                padding: EdgeInsets.zero,
                child: const Icon(CupertinoIcons.square_arrow_right),
                onPressed: widget.onLogout,
              ),
      ),
      child: SafeArea(
        child: Column(
          children: [
            // Folder Toggle
            Padding(
              padding: const EdgeInsets.symmetric(
                horizontal: ThemeConstants.spacingMd,
                vertical: ThemeConstants.spacingSm,
              ),
              child: CupertinoSlidingSegmentedControl<String>(
                groupValue: materialProvider.currentFolder,
                children: const {
                  'images': Text('图片'),
                  'videos': Text('视频'),
                },
                onValueChanged: (value) {
                  if (value != null) {
                    materialProvider.setFolder(value);
                    if (authProvider.user != null) {
                      materialProvider.loadMaterials(authProvider.user!);
                    }
                  }
                },
              ),
            ),

            // Materials Grid
            Expanded(
              child: Consumer<MaterialProvider>(
                builder: (context, materialProvider, child) {
                  if (materialProvider.isLoading) {
                    return const Center(child: CupertinoActivityIndicator());
                  }

                  if (materialProvider.error != null) {
                    return Center(
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Text(
                            '加载失败',
                            style: TextStyle(
                              color: CupertinoTheme.of(context).primaryColor,
                            ),
                          ),
                          const SizedBox(height: ThemeConstants.spacingMd),
                          CupertinoButton(
                            onPressed: () {
                              materialProvider.clearError();
                              if (authProvider.user != null) {
                                materialProvider.loadMaterials(authProvider.user!);
                              }
                            },
                            child: const Text('重试'),
                          ),
                        ],
                      ),
                    );
                  }

                  if (materialProvider.materials.isEmpty) {
                    return Center(
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(
                            CupertinoIcons.photo_on_rectangle,
                            size: 60,
                            color: CupertinoColors.systemGrey3,
                          ),
                          const SizedBox(height: ThemeConstants.spacingMd),
                          const Text(
                            '暂无素材',
                            style: TextStyle(
                              color: CupertinoColors.secondaryLabel,
                            ),
                          ),
                        ],
                      ),
                    );
                  }

                  return GridView.builder(
                    padding: const EdgeInsets.all(ThemeConstants.spacingMd),
                    gridDelegate:
                        const SliverGridDelegateWithFixedCrossAxisCount(
                      crossAxisCount: 2,
                      childAspectRatio: 0.9,
                      crossAxisSpacing: ThemeConstants.spacingMd,
                      mainAxisSpacing: ThemeConstants.spacingMd,
                    ),
                    itemCount: materialProvider.materials.length,
                    itemBuilder: (context, index) {
                      final material = materialProvider.materials[index];
                      return MaterialCard(
                        material: material,
                        isSelected: _selectedIds.contains(material.id),
                        onTap: () {
                          if (_isSelectionMode) {
                            _toggleSelection(material.id);
                          } else {
                            // TODO: 打开详情页
                          }
                        },
                        onLongPress: () {
                          _toggleSelection(material.id);
                        },
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
}
