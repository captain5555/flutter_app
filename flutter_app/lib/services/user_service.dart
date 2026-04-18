import '../constants/api_constants.dart';
import '../models/user.dart';
import 'api_service.dart';
import 'package:dio/dio.dart';

class UserService {
  final ApiService _apiService = ApiService();

  dynamic _parseResponse(Response response) {
    final data = response.data;
    if (data is Map && data.containsKey('data')) {
      return data['data'];
    }
    return data;
  }

  Future<List<User>> getUsers() async {
    final response = await _apiService.dio.get(ApiConstants.users);
    final parsed = _parseResponse(response);

    if (parsed is List) {
      return parsed.map((json) => User.fromJson(json as Map<String, dynamic>)).toList();
    }

    return [];
  }

  Future<User> getUser(int id) async {
    final response = await _apiService.dio.get('${ApiConstants.users}/$id');
    final parsed = _parseResponse(response);
    return User.fromJson(parsed as Map<String, dynamic>);
  }

  Future<User> createUser(String username, {String role = 'user'}) async {
    final response = await _apiService.dio.post(
      ApiConstants.users,
      data: {
        'username': username,
        'role': role,
      },
    );
    final parsed = _parseResponse(response);
    return User.fromJson(parsed as Map<String, dynamic>);
  }

  Future<User> updateUser(
    int id, {
    String? username,
    String? password,
    String? role,
  }) async {
    final data = <String, dynamic>{};
    if (username != null) data['username'] = username;
    if (password != null) data['password'] = password;
    if (role != null) data['role'] = role;

    final response = await _apiService.dio.put(
      '${ApiConstants.users}/$id',
      data: data,
    );
    final parsed = _parseResponse(response);
    return User.fromJson(parsed as Map<String, dynamic>);
  }

  Future<void> deleteUser(int id) async {
    final response = await _apiService.dio.delete('${ApiConstants.users}/$id');
    if (response.statusCode != 200 && response.statusCode != 204) {
      throw Exception('Failed to delete user');
    }
  }
}
