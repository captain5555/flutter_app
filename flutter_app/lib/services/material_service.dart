import 'dart:io';
import '../constants/api_constants.dart';
import '../models/material.dart';
import 'api_service.dart';
import 'package:dio/dio.dart';

class MaterialService {
  final ApiService _apiService = ApiService();

  // 解析响应数据的通用方法
  dynamic _parseResponse(Response response) {
    final data = response.data;
    if (data is Map && data.containsKey('data')) {
      return data['data'];
    }
    return data;
  }

  Future<List<Material>> getUserMaterials(int userId, String folderType) async {
    try {
      final response = await _apiService.dio.get(
        ApiConstants.materialsByUser(userId, folderType),
      );

      final parsed = _parseResponse(response);

      if (parsed is List) {
        return parsed.map((json) => Material.fromJson(json as Map<String, dynamic>)).toList();
      }

      return [];
    } catch (e) {
      print('getUserMaterials 错误: $e');
      return [];
    }
  }

  Future<List<Material>> getTrashMaterials(int userId) async {
    try {
      final response = await _apiService.dio.get(
        ApiConstants.trashByUser(userId),
      );

      final parsed = _parseResponse(response);

      if (parsed is List) {
        return parsed.map((json) => Material.fromJson(json as Map<String, dynamic>)).toList();
      }

      return [];
    } catch (e) {
      print('getTrashMaterials 错误: $e');
      return [];
    }
  }

  Future<Material> getMaterial(int id) async {
    final response = await _apiService.dio.get(
      ApiConstants.materialById(id),
    );

    final parsed = _parseResponse(response);
    return Material.fromJson(parsed as Map<String, dynamic>);
  }

  Future<Material> uploadMaterial({
    required int userId,
    required List<int> bytes,
    required String fileName,
    required String folderType,
    String? title,
    String? description,
  }) async {
    FormData formData = FormData.fromMap({
      'userId': userId,
      'folderType': folderType,
      'title': title,
      'description': description,
      'file': MultipartFile.fromBytes(bytes, filename: fileName),
    });

    final response = await _apiService.dio.post(
      ApiConstants.uploadMaterial,
      data: formData,
    );

    final parsed = _parseResponse(response);
    return Material.fromJson(parsed as Map<String, dynamic>);
  }

  Future<Material> updateMaterial(int id, {
    String? title,
    String? description,
    String? usageTag,
    String? viralTag,
  }) async {
    final data = <String, dynamic>{};
    if (title != null) data['title'] = title;
    if (description != null) data['description'] = description;
    if (usageTag != null) data['usageTag'] = usageTag;
    if (viralTag != null) data['viralTag'] = viralTag;

    final response = await _apiService.dio.put(
      ApiConstants.materialById(id),
      data: data,
    );

    final parsed = _parseResponse(response);
    return Material.fromJson(parsed as Map<String, dynamic>);
  }

  Future<void> moveToTrash(int id) async {
    final response = await _apiService.dio.delete(
      ApiConstants.materialById(id),
    );

    if (response.statusCode != 204) {
      throw Exception('Failed to move to trash');
    }
  }

  Future<void> batchTrash(List<int> ids) async {
    final response = await _apiService.dio.post(
      ApiConstants.batchTrash,
      data: {'ids': ids},
    );

    if (response.statusCode != 200) {
      throw Exception('Failed to batch trash');
    }
  }

  Future<void> batchRestore(List<int> ids) async {
    final response = await _apiService.dio.post(
      ApiConstants.batchRestore,
      data: {'ids': ids},
    );

    if (response.statusCode != 200) {
      throw Exception('Failed to batch restore');
    }
  }

  Future<void> batchDelete(List<int> ids) async {
    final response = await _apiService.dio.delete(
      ApiConstants.batchDeletePermanent,
      data: {'ids': ids},
    );

    if (response.statusCode != 204) {
      throw Exception('Failed to batch delete');
    }
  }

  Future<void> batchCopy(List<int> ids, String targetFolder) async {
    final response = await _apiService.dio.post(
      ApiConstants.batchCopy,
      data: {'ids': ids, 'targetFolder': targetFolder},
    );

    if (response.statusCode != 200) {
      throw Exception('Failed to batch copy');
    }
  }

  Future<void> batchMove(List<int> ids, String targetFolder) async {
    final response = await _apiService.dio.post(
      ApiConstants.batchMove,
      data: {'ids': ids, 'targetFolder': targetFolder},
    );

    if (response.statusCode != 200) {
      throw Exception('Failed to batch move');
    }
  }
}
