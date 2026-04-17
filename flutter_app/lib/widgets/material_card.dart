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
    if (material.thumbnailPath != null && material.thumbnailPath!.isNotEmpty) {
      return '$baseUrl${material.thumbnailPath}';
    }
    return null;
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
                child: thumbnailUrl != null
                    ? CachedNetworkImage(
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
                    : _PlaceholderIcon(isVideo: material.isVideo),
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
      color: CupertinoColors.systemGrey5,
      child: Center(
        child: Icon(
          isVideo ? CupertinoIcons.video_camera : CupertinoIcons.photo,
          size: 40,
          color: CupertinoColors.systemGrey3,
        ),
      ),
    );
  }
}
