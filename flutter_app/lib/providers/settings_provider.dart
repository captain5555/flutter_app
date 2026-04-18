import 'package:flutter/foundation.dart';
import '../config/app_config.dart';
import '../services/api_service.dart';

class SettingsProvider with ChangeNotifier {
  String _baseUrl = AppConfig.defaultBaseUrl;
  bool _isLoading = false;
  String? _error;

  String get baseUrl => _baseUrl;
  bool get isLoading => _isLoading;
  String? get error => _error;

  Future<void> loadSettings() async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      _baseUrl = await AppConfig.getBaseUrl();
    } catch (e) {
      _error = e.toString();
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> updateBaseUrl(String url) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      await AppConfig.saveBaseUrl(url);
      // 使用单例实例而不是创建新实例
      final apiService = ApiService();
      if (apiService.isInitialized) {
        await apiService.updateBaseUrl(url);
      }
      _baseUrl = url;
    } catch (e) {
      _error = e.toString();
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  void clearError() {
    _error = null;
    notifyListeners();
  }

  Future<void> clearCache() async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      // 清除Hive缓存等
      await AppConfig.clearCache();
    } catch (e) {
      _error = e.toString();
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }
}
