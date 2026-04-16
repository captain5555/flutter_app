import '../utils/token_storage.dart';

class AppConfig {
  static const String defaultBaseUrl = 'http://47.103.151.220:3001';
  static const String _baseUrlKey = 'base_url';

  static Future<String> getBaseUrl() async {
    final box = TokenStorage.box;
    return box.get(_baseUrlKey, defaultValue: defaultBaseUrl);
  }

  static Future<void> saveBaseUrl(String url) async {
    final box = TokenStorage.box;
    await box.put(_baseUrlKey, url);
  }
}
