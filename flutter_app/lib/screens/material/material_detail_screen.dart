import 'package:flutter/cupertino.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:video_player/video_player.dart';
import 'package:provider/provider.dart';
import '../../models/material.dart';
import '../../providers/settings_provider.dart';
import '../../providers/material_provider.dart';
import '../../providers/auth_provider.dart';
import '../../services/ai_service.dart';
import '../../constants/theme_constants.dart';

class MaterialDetailScreen extends StatefulWidget {
  final Material material;

  const MaterialDetailScreen({super.key, required this.material});

  @override
  State<MaterialDetailScreen> createState() => _MaterialDetailScreenState();
}

class _MaterialDetailScreenState extends State<MaterialDetailScreen> {
  late TextEditingController _titleController;
  late TextEditingController _descriptionController;
  late String _usageTag;
  late String _viralTag;
  bool _isLoading = false;
  bool _isEdited = false;
  bool _isAiGenerating = false;

  VideoPlayerController? _videoController;
  bool _isVideoInitialized = false;
  bool _isVideoError = false;

  final AiService _aiService = AiService();

  final List<String> _usageTags = ['unused', 'used', 'viral_candidate'];
  final List<String> _viralTags = ['not_viral', 'monitoring', 'viral'];

  String _getUsageTagLabel(String tag) {
    switch (tag) {
      case 'unused':
        return '未使用';
      case 'used':
        return '已使用';
      case 'viral_candidate':
        return '爆款备选';
      default:
        return tag;
    }
  }

  String _getViralTagLabel(String tag) {
    switch (tag) {
      case 'not_viral':
        return '非爆款';
      case 'monitoring':
        return '待观察';
      case 'viral':
        return '爆款';
      default:
        return tag;
    }
  }

  @override
  void initState() {
    super.initState();
    _titleController = TextEditingController(text: widget.material.title ?? '');
    _descriptionController = TextEditingController(text: widget.material.description ?? '');
    _usageTag = widget.material.usageTag;
    _viralTag = widget.material.viralTag;

    _titleController.addListener(_onChanged);
    _descriptionController.addListener(_onChanged);

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
  }

  void _onChanged() {
    setState(() {
      _isEdited = _titleController.text != (widget.material.title ?? '') ||
          _descriptionController.text != (widget.material.description ?? '') ||
          _usageTag != widget.material.usageTag ||
          _viralTag != widget.material.viralTag;
    });
  }

  @override
  void dispose() {
    _titleController.dispose();
    _descriptionController.dispose();
    _videoController?.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    if (!_isEdited) return;

    setState(() => _isLoading = true);

    try {
      await context.read<MaterialProvider>().updateMaterial(
        widget.material.id,
        {
          'title': _titleController.text.trim().isEmpty ? null : _titleController.text.trim(),
          'description': _descriptionController.text.trim().isEmpty ? null : _descriptionController.text.trim(),
          'usage_tag': _usageTag,
          'viral_tag': _viralTag,
        },
      );

      if (mounted) {
        Navigator.pop(context, true);
      }
    } catch (e) {
      if (mounted) {
        showCupertinoDialog(
          context: context,
          builder: (ctx) => CupertinoAlertDialog(
            title: const Text('保存失败'),
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
    } finally {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  Future<void> _generateTitle() async {
    setState(() => _isAiGenerating = true);
    try {
      final authProvider = Provider.of<AuthProvider>(context, listen: false);
      final title = await _aiService.generateTitle(
        currentUserId: authProvider.user?.id,
        currentTitle: _titleController.text.trim().isEmpty ? null : _titleController.text.trim(),
      );
      setState(() {
        _titleController.text = title;
      });
      _onChanged();
    } catch (e) {
      if (mounted) {
        showCupertinoDialog(
          context: context,
          builder: (ctx) => CupertinoAlertDialog(
            title: const Text('生成失败'),
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
    } finally {
      if (mounted) {
        setState(() => _isAiGenerating = false);
      }
    }
  }

  Future<void> _generateDescription() async {
    setState(() => _isAiGenerating = true);
    try {
      final authProvider = Provider.of<AuthProvider>(context, listen: false);
      final description = await _aiService.generateDescription(
        currentUserId: authProvider.user?.id,
        currentDescription: _descriptionController.text.trim().isEmpty ? null : _descriptionController.text.trim(),
      );
      setState(() {
        _descriptionController.text = description;
      });
      _onChanged();
    } catch (e) {
      if (mounted) {
        showCupertinoDialog(
          context: context,
          builder: (ctx) => CupertinoAlertDialog(
            title: const Text('生成失败'),
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
    } finally {
      if (mounted) {
        setState(() => _isAiGenerating = false);
      }
    }
  }

  Future<void> _translateTitle() async {
    final text = _titleController.text.trim();
    if (text.isEmpty) return;

    setState(() => _isAiGenerating = true);
    try {
      final translated = await _aiService.translate(text);
      setState(() {
        _titleController.text = translated;
      });
      _onChanged();
    } catch (e) {
      if (mounted) {
        showCupertinoDialog(
          context: context,
          builder: (ctx) => CupertinoAlertDialog(
            title: const Text('翻译失败'),
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
    } finally {
      if (mounted) {
        setState(() => _isAiGenerating = false);
      }
    }
  }

  Future<void> _translateDescription() async {
    final text = _descriptionController.text.trim();
    if (text.isEmpty) return;

    setState(() => _isAiGenerating = true);
    try {
      final translated = await _aiService.translate(text);
      setState(() {
        _descriptionController.text = translated;
      });
      _onChanged();
    } catch (e) {
      if (mounted) {
        showCupertinoDialog(
          context: context,
          builder: (ctx) => CupertinoAlertDialog(
            title: const Text('翻译失败'),
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
    } finally {
      if (mounted) {
        setState(() => _isAiGenerating = false);
      }
    }
  }

  Future<void> _downloadVideo() async {
    setState(() => _isLoading = true);
    try {
      // 在Web端，我们直接打开下载链接
      final settingsProvider = Provider.of<SettingsProvider>(context, listen: false);
      final mediaUrl = _getMediaUrl(settingsProvider.baseUrl);

      if (mediaUrl != null && mounted) {
        showCupertinoDialog(
          context: context,
          builder: (ctx) => CupertinoAlertDialog(
            title: const Text('下载视频'),
            content: const Text('请在新标签页中下载'),
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
            title: const Text('下载失败'),
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
    } finally {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  String? _getMediaUrl(String baseUrl) {
    // 优先使用后端提供的完整 file_url
    if (widget.material.fileUrl != null && widget.material.fileUrl!.isNotEmpty) {
      return _buildFullUrl(baseUrl, widget.material.fileUrl!);
    }
    if (widget.material.filePath.isEmpty) return null;
    return _buildFullUrl(baseUrl, widget.material.filePath);
  }

  String _buildFullUrl(String baseUrl, String path) {
    // 如果已经是完整URL，直接返回
    if (path.startsWith('http://') || path.startsWith('https://')) {
      return path;
    }
    // 如果是以 / 开头，拼接到 baseUrl
    if (path.startsWith('/')) {
      return '$baseUrl$path';
    }
    // 其他情况，加上 /uploads/
    return '$baseUrl/uploads/$path';
  }

  String _formatDate(DateTime date) {
    return '${date.year}-${date.month.toString().padLeft(2, '0')}-${date.day.toString().padLeft(2, '0')} '
        '${date.hour.toString().padLeft(2, '0')}:${date.minute.toString().padLeft(2, '0')}';
  }

  @override
  Widget build(BuildContext context) {
    final settingsProvider = context.watch<SettingsProvider>();
    final mediaUrl = _getMediaUrl(settingsProvider.baseUrl);

    return CupertinoPageScaffold(
      navigationBar: CupertinoNavigationBar(
        middle: Text(widget.material.displayTitle),
        trailing: _isLoading
            ? const CupertinoActivityIndicator()
            : CupertinoButton(
                padding: EdgeInsets.zero,
                onPressed: _isEdited ? _save : null,
                child: Text(
                  '保存',
                  style: TextStyle(
                    color: _isEdited ? CupertinoTheme.of(context).primaryColor : CupertinoColors.inactiveGray,
                  ),
                ),
              ),
      ),
      child: SafeArea(
        child: ListView(
          padding: const EdgeInsets.all(ThemeConstants.spacingMd),
          children: [
            // Media Preview
            if (mediaUrl != null)
              ClipRRect(
                borderRadius: BorderRadius.circular(ThemeConstants.borderRadiusMd),
                child: widget.material.isImage
                    ? CachedNetworkImage(
                        imageUrl: mediaUrl,
                        fit: BoxFit.contain,
                        placeholder: (context, url) => Container(
                          height: 300,
                          color: CupertinoColors.systemGrey5,
                          child: const Center(child: CupertinoActivityIndicator()),
                        ),
                        errorWidget: (context, url, error) => Container(
                          height: 300,
                          color: CupertinoColors.systemGrey5,
                          child: const Center(
                            child: Icon(
                              CupertinoIcons.photo,
                              size: 60,
                              color: CupertinoColors.systemGrey3,
                            ),
                          ),
                        ),
                      )
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
              ),
            const SizedBox(height: ThemeConstants.spacingLg),

            // Title
            _buildSection(
              title: '基本信息',
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  _buildTextFieldWithActions(
                    controller: _titleController,
                    placeholder: '标题',
                    minLines: 1,
                    maxLines: 3,
                    onGenerate: _generateTitle,
                    onTranslate: _translateTitle,
                  ),
                  const SizedBox(height: ThemeConstants.spacingMd),
                  _buildTextFieldWithActions(
                    controller: _descriptionController,
                    placeholder: '描述',
                    minLines: 3,
                    maxLines: 10,
                    onGenerate: _generateDescription,
                    onTranslate: _translateDescription,
                  ),
                ],
              ),
            ),
            const SizedBox(height: ThemeConstants.spacingLg),

            // Usage Tag
            _buildSection(
              title: '使用状态',
              child: _buildSegmentedControl(
                value: _usageTag,
                options: _usageTags,
                labels: _usageTags.map(_getUsageTagLabel).toList(),
                onChanged: (value) {
                  setState(() {
                    _usageTag = value;
                    _onChanged();
                  });
                },
              ),
            ),
            const SizedBox(height: ThemeConstants.spacingLg),

            // Viral Tag
            _buildSection(
              title: '爆款状态',
              child: _buildSegmentedControl(
                value: _viralTag,
                options: _viralTags,
                labels: _viralTags.map(_getViralTagLabel).toList(),
                onChanged: (value) {
                  setState(() {
                    _viralTag = value;
                    _onChanged();
                  });
                },
              ),
            ),
            const SizedBox(height: ThemeConstants.spacingLg),

            // File Info
            _buildSection(
              title: '文件信息',
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  _buildInfoRow('文件名', widget.material.fileName),
                  const SizedBox(height: ThemeConstants.spacingSm),
                  _buildInfoRow('大小', widget.material.fileSizeFormatted),
                  const SizedBox(height: ThemeConstants.spacingSm),
                  _buildInfoRow('类型', widget.material.folderType),
                  if (widget.material.createdAt != null) ...[
                    const SizedBox(height: ThemeConstants.spacingSm),
                    _buildInfoRow('上传时间', _formatDate(widget.material.createdAt!)),
                  ],
                  const SizedBox(height: ThemeConstants.spacingMd),
                  if (widget.material.isVideo)
                    CupertinoButton.filled(
                      onPressed: _isLoading ? null : _downloadVideo,
                      child: _isLoading
                          ? const CupertinoActivityIndicator()
                          : const Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                Icon(CupertinoIcons.arrow_down_doc, size: 18),
                                SizedBox(width: 8),
                                Text('下载视频'),
                              ],
                            ),
                    ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSection({required String title, required Widget child}) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          title,
          style: const TextStyle(
            fontSize: 13,
            fontWeight: FontWeight.w600,
            color: CupertinoColors.secondaryLabel,
          ),
        ),
        const SizedBox(height: ThemeConstants.spacingSm),
        child,
      ],
    );
  }

  Widget _buildTextFieldWithActions({
    required TextEditingController controller,
    required String placeholder,
    int minLines = 1,
    int maxLines = 1,
    required VoidCallback onGenerate,
    required VoidCallback onTranslate,
  }) {
    return Container(
      padding: const EdgeInsets.symmetric(
        horizontal: ThemeConstants.spacingMd,
        vertical: ThemeConstants.spacingSm,
      ),
      decoration: BoxDecoration(
        color: CupertinoColors.systemGrey6,
        borderRadius: BorderRadius.circular(ThemeConstants.borderRadiusMd),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          CupertinoTextField(
            controller: controller,
            placeholder: placeholder,
            minLines: minLines,
            maxLines: maxLines,
            decoration: null,
            style: const TextStyle(fontSize: 16),
          ),
          const SizedBox(height: ThemeConstants.spacingSm),
          Row(
            children: [
              CupertinoButton(
                padding: const EdgeInsets.symmetric(
                  horizontal: ThemeConstants.spacingMd,
                  vertical: ThemeConstants.spacingSm,
                ),
                color: CupertinoColors.systemBlue.withOpacity(0.1),
                onPressed: _isAiGenerating ? null : onGenerate,
                child: _isAiGenerating
                    ? const CupertinoActivityIndicator()
                    : const Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(CupertinoIcons.sparkles, size: 16),
                          SizedBox(width: 4),
                          Text('AI生成', style: TextStyle(fontSize: 14)),
                        ],
                      ),
              ),
              const SizedBox(width: ThemeConstants.spacingSm),
              CupertinoButton(
                padding: const EdgeInsets.symmetric(
                  horizontal: ThemeConstants.spacingMd,
                  vertical: ThemeConstants.spacingSm,
                ),
                color: CupertinoColors.systemGrey5,
                onPressed: _isAiGenerating ? null : onTranslate,
                child: const Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(CupertinoIcons.globe, size: 16),
                    SizedBox(width: 4),
                    Text('翻译', style: TextStyle(fontSize: 14)),
                  ],
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildSegmentedControl({
    required String value,
    required List<String> options,
    required List<String> labels,
    required ValueChanged<String> onChanged,
  }) {
    return Row(
      children: options.asMap().entries.map((entry) {
        final index = entry.key;
        final option = entry.value;
        final isSelected = value == option;
        final isFirst = index == 0;
        final isLast = index == options.length - 1;

        return Expanded(
          child: GestureDetector(
            onTap: () => onChanged(option),
            child: Container(
              padding: const EdgeInsets.symmetric(vertical: ThemeConstants.spacingMd),
              decoration: BoxDecoration(
                color: isSelected
                    ? CupertinoTheme.of(context).primaryColor
                    : CupertinoColors.systemGrey6,
                borderRadius: BorderRadius.horizontal(
                  left: isFirst ? const Radius.circular(ThemeConstants.borderRadiusMd) : Radius.zero,
                  right: isLast ? const Radius.circular(ThemeConstants.borderRadiusMd) : Radius.zero,
                ),
                border: Border.all(
                  color: isSelected
                      ? CupertinoTheme.of(context).primaryColor
                      : CupertinoColors.systemGrey5,
                  width: 1,
                ),
              ),
              child: Text(
                labels[index],
                textAlign: TextAlign.center,
                style: TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.w500,
                  color: isSelected ? CupertinoColors.white : CupertinoColors.label,
                ),
              ),
            ),
          ),
        );
      }).toList(),
    );
  }

  Widget _buildInfoRow(String label, String value) {
    return Row(
      children: [
        Text(
          '$label: ',
          style: const TextStyle(
            fontSize: 14,
            color: CupertinoColors.secondaryLabel,
          ),
        ),
        Expanded(
          child: Text(
            value,
            style: const TextStyle(fontSize: 14),
            maxLines: 2,
            overflow: TextOverflow.ellipsis,
          ),
        ),
      ],
    );
  }
}
