import 'package:flutter/cupertino.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:provider/provider.dart';
import '../models/material.dart';
import '../constants/theme_constants.dart';
import '../providers/settings_provider.dart';

class MaterialCard extends StatelessWidget {
  final Material material;
  final VoidCallback? onTap;
  final VoidCallback? onLongPress;
  final bool isSelected;

  const MaterialCard({
    super.key,
    required this.material,
    this.onTap,
    this.onLongPress,
    this.isSelected = false,
  });

  String? _getThumbnailUrl(String baseUrl) {
    // 1. 优先使用后端提供的完整 thumbnail_url
    if (material.thumbnailUrl != null && material.thumbnailUrl!.isNotEmpty) {
      return _buildFullUrl(baseUrl, material.thumbnailUrl!);
    }
    // 2. 其次使用 thumbnailPath
    if (material.thumbnailPath != null && material.thumbnailPath!.isNotEmpty) {
      return _buildFullUrl(baseUrl, material.thumbnailPath!);
    }
    // 3. 只有图片才使用 file_url 或 filePath 作为预览
    if (material.isImage) {
      if (material.fileUrl != null && material.fileUrl!.isNotEmpty) {
        return _buildFullUrl(baseUrl, material.fileUrl!);
      }
      if (material.filePath.isNotEmpty) {
        return _buildFullUrl(baseUrl, material.filePath);
      }
    }
    // 视频没有缩略图，返回null显示占位图标
    return null;
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

  @override
  Widget build(BuildContext context) {
    final settingsProvider = context.watch<SettingsProvider>();
    final thumbnailUrl = _getThumbnailUrl(settingsProvider.baseUrl);

    return GestureDetector(
      onTap: onTap,
      onLongPress: onLongPress,
      child: Container(
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(ThemeConstants.borderRadiusMd),
          border: isSelected
              ? Border.all(
                  color: CupertinoTheme.of(context).primaryColor,
                  width: 3,
                )
              : null,
          color: CupertinoColors.systemGrey6,
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // Thumbnail
            Expanded(
              flex: 3,
              child: ClipRRect(
                borderRadius: const BorderRadius.vertical(
                  top: Radius.circular(ThemeConstants.borderRadiusMd),
                ),
                child: Stack(
                  fit: StackFit.expand,
                  children: [
                    if (thumbnailUrl != null)
                      CachedNetworkImage(
                        imageUrl: thumbnailUrl,
                        fit: BoxFit.cover,
                        placeholder: (context, url) => Container(
                          color: CupertinoColors.systemGrey5,
                          child: const Center(
                            child: CupertinoActivityIndicator(),
                          ),
                        ),
                        errorWidget: (context, url, error) => _PlaceholderIcon(
                          isVideo: material.isVideo,
                        ),
                      )
                    else
                      _PlaceholderIcon(isVideo: material.isVideo),
                    // Video indicator overlay
                    if (material.isVideo)
                      Positioned(
                        top: 8,
                        right: 8,
                        child: Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 6,
                            vertical: 3,
                          ),
                          decoration: BoxDecoration(
                            color: CupertinoColors.black.withOpacity(0.7),
                            borderRadius: BorderRadius.circular(4),
                          ),
                          child: const Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Icon(
                                CupertinoIcons.play_circle_fill,
                                size: 12,
                                color: CupertinoColors.white,
                              ),
                              SizedBox(width: 3),
                              Text(
                                '视频',
                                style: TextStyle(
                                  fontSize: 10,
                                  color: CupertinoColors.white,
                                  fontWeight: FontWeight.w500,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                  ],
                ),
              ),
            ),

            // Info
            Expanded(
              flex: 1,
              child: Padding(
                padding: const EdgeInsets.all(ThemeConstants.spacingSm),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Text(
                      material.displayTitle,
                      style: const TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.w500,
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                    const SizedBox(height: 2),
                    Text(
                      material.fileSizeFormatted,
                      style: const TextStyle(
                        fontSize: 10,
                        color: CupertinoColors.secondaryLabel,
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _PlaceholderIcon extends StatelessWidget {
  final bool isVideo;

  const _PlaceholderIcon({required this.isVideo});

  @override
  Widget build(BuildContext context) {
    return Container(
      color: isVideo
          ? CupertinoColors.systemGrey6
          : CupertinoColors.systemGrey5,
      child: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              isVideo ? CupertinoIcons.video_camera : CupertinoIcons.photo,
              size: isVideo ? 50 : 40,
              color: isVideo
                  ? CupertinoColors.systemGrey
                  : CupertinoColors.systemGrey3,
            ),
            if (isVideo) ...[
              const SizedBox(height: 8),
              Text(
                '视频素材',
                style: TextStyle(
                  fontSize: 12,
                  color: CupertinoColors.systemGrey,
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}
