class ApiConstants {
  static const String defaultBaseUrl = 'http://localhost:3000';
  static const Duration connectTimeout = Duration(seconds: 30);
  static const Duration receiveTimeout = Duration(seconds: 30);

  // Auth endpoints
  static const String users = '/api/users';
  static const String loginSimple = '/api/auth/login-simple';
  static const String refreshToken = '/api/auth/refresh';
  static const String logout = '/api/auth/logout';
  static const String me = '/api/auth/me';

  // Materials endpoints
  static String materialsByUser(int userId, String folderType) =>
      '/api/materials/user/$userId/folder/$folderType';
  static String trashByUser(int userId) => '/api/materials/user/$userId/trash';
  static String materialById(int id) => '/api/materials/$id';
  static const String uploadMaterial = '/api/materials/upload';
  static String downloadMaterial(int id) => '/api/materials/$id/download';
  static const String batchTrash = '/api/materials/batch/trash';
  static const String batchRestore = '/api/materials/batch/restore';
  static const String batchCopy = '/api/materials/batch/copy';
  static const String batchMove = '/api/materials/batch/move';
  static const String batchDeletePermanent = '/api/materials/batch';

  // AI endpoints
  static const String aiSettings = '/api/ai/settings';
  static const String generateTitle = '/api/ai/generate-title';
  static const String generateDescription = '/api/ai/generate-description';
  static const String translate = '/api/ai/translate';
}
