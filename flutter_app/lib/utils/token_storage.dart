import 'package:hive_flutter/hive_flutter.dart';

class TokenStorage {
  static const String _boxName = 'app_box';
  static const String _keyToken = 'auth_token';
  static const String _keyRefreshToken = 'refresh_token';
  static const String _keyUserId = 'user_id';
  static const String _keyUsername = 'username';
  static const String _keyUserRole = 'user_role';
  static const String _keyApiUrl = 'api_url';
  static const String _keyThemeMode = 'theme_mode';

  static Box? _box;

  static Box get box => _box!;

  static Future<void> init() async {
    await Hive.initFlutter();
    _box = await Hive.openBox(_boxName);
  }

  static Future<void> saveToken(String token) async {
    await _box?.put(_keyToken, token);
  }

  static String? getToken() {
    return _box?.get(_keyToken) as String?;
  }

  static Future<void> saveRefreshToken(String token) async {
    await _box?.put(_keyRefreshToken, token);
  }

  static String? getRefreshToken() {
    return _box?.get(_keyRefreshToken) as String?;
  }

  static Future<void> clearTokens() async {
    await _box?.delete(_keyToken);
    await _box?.delete(_keyRefreshToken);
  }

  static Future<void> saveUser(int id, String username, String role) async {
    await _box?.put(_keyUserId, id);
    await _box?.put(_keyUsername, username);
    await _box?.put(_keyUserRole, role);
  }

  static Map<String, dynamic>? getUser() {
    final id = _box?.get(_keyUserId);
    final username = _box?.get(_keyUsername);
    final role = _box?.get(_keyUserRole);
    if (id == null || username == null) return null;
    return {
      'id': id,
      'username': username,
      'role': role ?? 'user',
    };
  }

  static Future<void> saveApiUrl(String url) async {
    await _box?.put(_keyApiUrl, url);
  }

  static String? getApiUrl() {
    return _box?.get(_keyApiUrl) as String?;
  }

  static Future<void> saveThemeMode(String mode) async {
    await _box?.put(_keyThemeMode, mode);
  }

  static String? getThemeMode() {
    return _box?.get(_keyThemeMode) as String?;
  }

  static Future<void> clearAuth() async {
    await _box?.delete(_keyToken);
    await _box?.delete(_keyRefreshToken);
    await _box?.delete(_keyUserId);
    await _box?.delete(_keyUsername);
    await _box?.delete(_keyUserRole);
  }

  static Future<void> clearAll() async {
    await _box?.clear();
  }
}
