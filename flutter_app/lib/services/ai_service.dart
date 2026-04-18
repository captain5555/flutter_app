import '../constants/api_constants.dart';
import 'api_service.dart';
import 'package:dio/dio.dart';

class AiService {
  final ApiService _apiService = ApiService();

  dynamic _parseResponse(Response response) {
    final data = response.data;
    if (data is Map && data.containsKey('data')) {
      return data['data'];
    }
    return data;
  }

  Future<Map<String, dynamic>> getAiSettings() async {
    final response = await _apiService.dio.get(ApiConstants.aiSettings);
    final parsed = _parseResponse(response);
    return parsed as Map<String, dynamic>;
  }

  Future<Map<String, dynamic>> updateAiSettings({
    required String provider,
    required String model,
    required String apiKey,
    required String baseUrl,
  }) async {
    final response = await _apiService.dio.put(
      ApiConstants.aiSettings,
      data: {
        'provider': provider,
        'model': model,
        'apiKey': apiKey,
        'baseUrl': baseUrl,
      },
    );
    final parsed = _parseResponse(response);
    return parsed as Map<String, dynamic>;
  }

  Future<String> generateTitle({
    String? image,
    int? currentUserId,
    String? currentTitle,
  }) async {
    final response = await _apiService.dio.post(
      ApiConstants.generateTitle,
      data: {
        if (image != null) 'image': image,
        if (currentUserId != null) 'current_user_id': currentUserId,
        if (currentTitle != null) 'current_title': currentTitle,
      },
    );
    final parsed = _parseResponse(response);
    if (parsed is Map && parsed.containsKey('title')) {
      return parsed['title'] as String;
    }
    throw Exception('Failed to generate title');
  }

  Future<String> generateDescription({
    String? image,
    int? currentUserId,
    String? currentDescription,
  }) async {
    final response = await _apiService.dio.post(
      ApiConstants.generateDescription,
      data: {
        if (image != null) 'image': image,
        if (currentUserId != null) 'current_user_id': currentUserId,
        if (currentDescription != null) 'current_description': currentDescription,
      },
    );
    final parsed = _parseResponse(response);
    if (parsed is Map && parsed.containsKey('description')) {
      return parsed['description'] as String;
    }
    throw Exception('Failed to generate description');
  }

  Future<String> translate(String text) async {
    final response = await _apiService.dio.post(
      ApiConstants.translate,
      data: {'text': text},
    );
    final parsed = _parseResponse(response);
    if (parsed is Map && parsed.containsKey('translatedText')) {
      return parsed['translatedText'] as String;
    }
    if (parsed is String) {
      return parsed;
    }
    throw Exception('Failed to translate');
  }
}
