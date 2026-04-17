import 'package:dio/dio.dart';
import '../constants/api_constants.dart';
import '../config/app_config.dart';
import '../utils/token_storage.dart';

class ApiService {
  static final ApiService _instance = ApiService._internal();
  factory ApiService() => _instance;
  ApiService._internal();

  late final Dio _dio;
  bool _isInitialized = false;

  bool get isInitialized => _isInitialized;

  Future<void> initialize() async {
    if (_isInitialized) return;

    final baseUrl = await AppConfig.getBaseUrl();

    _dio = Dio(BaseOptions(
      baseUrl: baseUrl,
      connectTimeout: ApiConstants.connectTimeout,
      receiveTimeout: ApiConstants.receiveTimeout,
      headers: {
        'Content-Type': 'application/json',
      },
    ));

    _dio.interceptors.add(InterceptorsWrapper(
      onRequest: (options, handler) async {
        final token = TokenStorage.getToken();
        if (token != null) {
          options.headers['Authorization'] = 'Bearer $token';
        }
        return handler.next(options);
      },
      onResponse: (response, handler) {
        return handler.next(response);
      },
      onError: (error, handler) async {
        if (error.response?.statusCode == 401) {
          final refreshed = await _refreshToken();
          if (refreshed) {
            final opts = error.response!.requestOptions;
            final token = TokenStorage.getToken();
            opts.headers['Authorization'] = 'Bearer $token';
            try {
              final response = await _dio.fetch(opts);
              return handler.resolve(response);
            } catch (e) {
              return handler.next(error);
            }
          }
        }
        return handler.next(error);
      },
    ));

    _isInitialized = true;
  }

  Future<bool> _refreshToken() async {
    try {
      final refreshToken = TokenStorage.getRefreshToken();
      if (refreshToken == null) return false;

      final response = await _dio.post(
        ApiConstants.refreshToken,
        data: {'refreshToken': refreshToken},
      );

      if (response.statusCode == 200) {
        await TokenStorage.saveToken(response.data['token']);
        if (response.data['refreshToken'] != null) {
          await TokenStorage.saveRefreshToken(response.data['refreshToken']);
        }
        return true;
      }
      return false;
    } catch (e) {
      await TokenStorage.clearTokens();
      return false;
    }
  }

  Dio get dio {
    assert(_isInitialized, 'ApiService not initialized. Call initialize() first.');
    return _dio;
  }

  Future<void> updateBaseUrl(String baseUrl) async {
    await AppConfig.saveBaseUrl(baseUrl);
    _dio.options.baseUrl = baseUrl;
  }
}
