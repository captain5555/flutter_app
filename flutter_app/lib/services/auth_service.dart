import '../constants/api_constants.dart';
import '../models/user.dart';
import '../utils/token_storage.dart';
import 'api_service.dart';

class AuthService {
  final ApiService _apiService = ApiService();

  Future<User> login(String username, String password) async {
    print('AuthService.login 被调用');
    print('请求 API: ${_apiService.dio.options.baseUrl}${ApiConstants.loginSimple}');

    final response = await _apiService.dio.post(
      ApiConstants.loginSimple,
      data: {
        'username': username,
        'password': password,
      },
    );

    print('响应状态码: ${response.statusCode}');
    print('响应数据: ${response.data}');

    if (response.statusCode == 200) {
      // 后端返回格式: {success: true, data: {token: ..., user: ...}}
      final responseData = response.data;
      final data = responseData['data'] ?? responseData;

      await TokenStorage.saveToken(data['token']);
      if (data['refreshToken'] != null) {
        await TokenStorage.saveRefreshToken(data['refreshToken']);
      }

      final user = User.fromJson(data['user']);
      await TokenStorage.saveUser(user.id, user.username, user.role);

      return user;
    }

    throw Exception('Login failed');
  }

  Future<User?> getCurrentUser() async {
    try {
      final response = await _apiService.dio.get(ApiConstants.me);

      if (response.statusCode == 200) {
        return User.fromJson(response.data);
      }
      return null;
    } catch (e) {
      return null;
    }
  }

  Future<void> logout() async {
    try {
      await _apiService.dio.post(ApiConstants.logout);
    } catch (e) {
      // Ignore logout errors
    } finally {
      await TokenStorage.clearAuth();
    }
  }

  Future<bool> isAuthenticated() async {
    final token = TokenStorage.getToken();
    return token != null;
  }
}
