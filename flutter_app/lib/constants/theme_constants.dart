import 'package:flutter/cupertino.dart';

class ThemeConstants {
  // Colors
  static const Color primaryColor = CupertinoColors.systemBlue;
  static const Color successColor = CupertinoColors.systemGreen;
  static const Color warningColor = CupertinoColors.systemOrange;
  static const Color errorColor = CupertinoColors.systemRed;

  // Text Styles
  static const TextStyle titleStyle = TextStyle(
    fontSize: 24,
    fontWeight: FontWeight.bold,
  );

  static const TextStyle subtitleStyle = TextStyle(
    fontSize: 18,
    fontWeight: FontWeight.w600,
  );

  static const TextStyle bodyStyle = TextStyle(
    fontSize: 16,
  );

  static const TextStyle captionStyle = TextStyle(
    fontSize: 14,
    color: CupertinoColors.secondaryLabel,
  );

  // Spacing
  static const double spacingXs = 4.0;
  static const double spacingSm = 8.0;
  static const double spacingMd = 16.0;
  static const double spacingLg = 24.0;
  static const double spacingXl = 32.0;

  // Border Radius
  static const double borderRadiusSm = 8.0;
  static const double borderRadiusMd = 12.0;
  static const double borderRadiusLg = 16.0;
}
