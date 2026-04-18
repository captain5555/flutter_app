import 'package:flutter/cupertino.dart';
import 'package:provider/provider.dart';
import '../../providers/auth_provider.dart';
import '../../providers/material_provider.dart';
import '../../widgets/material_card.dart';
import '../../models/material.dart';
import '../../constants/theme_constants.dart';
import '../material/material_detail_screen.dart';

class TrashScreen extends StatefulWidget {
  const TrashScreen({super.key});

  @override
  State<TrashScreen> createState() => _TrashScreenState();
}

class _TrashScreenState extends State<TrashScreen> {
  final Set<int> _selectedIds = {};
  bool _isSelectionMode = false;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _loadTrash();
    });
  }

  Future<void> _loadTrash() async {
    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    if (authProvider.user != null) {
      await context.read<MaterialProvider>().loadTrash(authProvider.user!);
    }
  }

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

  Future<void> _handleBatchRestore() async {
    if (_selectedIds.isEmpty) return;

    final confirmed = await showCupertinoDialog<bool>(
      context: context,
      builder: (ctx) => CupertinoAlertDialog(
        title: Text('确认恢复 ${_selectedIds.length} 项？'),
        actions: [
          CupertinoDialogAction(
            child: const Text('取消'),
            onPressed: () => Navigator.pop(ctx, false),
          ),
          CupertinoDialogAction(
            child: const Text('恢复'),
            onPressed: () => Navigator.pop(ctx, true),
          ),
        ],
      ),
    );

    if (confirmed == true && mounted) {
      final authProvider = Provider.of<AuthProvider>(context, listen: false);
      if (authProvider.user != null) {
        await context.read<MaterialProvider>().batchRestore(
          _selectedIds.toList(),
          authProvider.user!,
        );
      }
      _exitSelectionMode();
    }
  }

  Future<void> _handleBatchDelete() async {
    if (_selectedIds.isEmpty) return;

    final confirmed = await showCupertinoDialog<bool>(
      context: context,
      builder: (ctx) => CupertinoAlertDialog(
        title: Text('永久删除 ${_selectedIds.length} 项？'),
        content: const Text('此操作不可恢复！'),
        actions: [
          CupertinoDialogAction(
            child: const Text('取消'),
            onPressed: () => Navigator.pop(ctx, false),
          ),
          CupertinoDialogAction(
            isDestructiveAction: true,
            child: const Text('永久删除'),
            onPressed: () => Navigator.pop(ctx, true),
          ),
        ],
      ),
    );

    if (confirmed == true && mounted) {
      final authProvider = Provider.of<AuthProvider>(context, listen: false);
      if (authProvider.user != null) {
        await context.read<MaterialProvider>().batchDelete(
          _selectedIds.toList(),
          authProvider.user!,
        );
      }
      _exitSelectionMode();
    }
  }

  @override
  Widget build(BuildContext context) {
    return CupertinoPageScaffold(
      navigationBar: CupertinoNavigationBar(
        middle: _isSelectionMode
            ? Text('已选择 ${_selectedIds.length} 项')
            : const Text('垃圾箱'),
        leading: _isSelectionMode
            ? CupertinoButton(
                padding: EdgeInsets.zero,
                child: const Text('取消'),
                onPressed: _exitSelectionMode,
              )
            : null,
        trailing: _isSelectionMode
            ? Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  CupertinoButton(
                    padding: EdgeInsets.zero,
                    onPressed: _handleBatchRestore,
                    child: const Text('恢复'),
                  ),
                  const SizedBox(width: 8),
                  CupertinoButton(
                    padding: EdgeInsets.zero,
                    onPressed: _handleBatchDelete,
                    child: const Text(
                      '永久删除',
                      style: TextStyle(color: CupertinoColors.systemRed),
                    ),
                  ),
                ],
              )
            : null,
      ),
      child: SafeArea(
        child: Column(
          children: [
            Expanded(
              child: Consumer<MaterialProvider>(
                builder: (context, provider, child) {
                  if (provider.isLoading && provider.trashMaterials.isEmpty) {
                    return const Center(child: CupertinoActivityIndicator());
                  }

                  if (provider.error != null && provider.trashMaterials.isEmpty) {
                    return Center(
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Text(
                            '加载失败',
                            style: const TextStyle(
                              color: CupertinoColors.systemRed,
                              fontSize: 18,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                          const SizedBox(height: 16),
                          CupertinoButton.filled(
                            onPressed: _loadTrash,
                            child: const Text('重试'),
                          ),
                        ],
                      ),
                    );
                  }

                  if (provider.trashMaterials.isEmpty) {
                    return Center(
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(
                            CupertinoIcons.trash,
                            size: 60,
                            color: CupertinoColors.systemGrey3,
                          ),
                          const SizedBox(height: ThemeConstants.spacingMd),
                          const Text(
                            '垃圾箱为空',
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
                    gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                      crossAxisCount: 2,
                      childAspectRatio: 0.9,
                      crossAxisSpacing: ThemeConstants.spacingMd,
                      mainAxisSpacing: ThemeConstants.spacingMd,
                    ),
                    itemCount: provider.trashMaterials.length,
                    itemBuilder: (context, index) {
                      final material = provider.trashMaterials[index];
                      return MaterialCard(
                        material: material,
                        isSelected: _selectedIds.contains(material.id),
                        onTap: () {
                          if (_isSelectionMode) {
                            _toggleSelection(material.id);
                          } else {
                            Navigator.of(context).push(
                              CupertinoPageRoute(
                                builder: (ctx) => MaterialDetailScreen(material: material),
                              ),
                            );
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
