-- Users table
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username VARCHAR(50) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(20) DEFAULT 'user',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Materials table
CREATE TABLE IF NOT EXISTS materials (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  folder_type VARCHAR(50) DEFAULT 'images',
  file_name VARCHAR(255) NOT NULL,
  title VARCHAR(255),
  description TEXT,
  file_path VARCHAR(500) NOT NULL,
  file_size BIGINT DEFAULT 0,
  file_type VARCHAR(50),
  thumbnail_path VARCHAR(500),
  usage_tag VARCHAR(20) DEFAULT 'unused',
  viral_tag VARCHAR(20) DEFAULT 'not_viral',
  is_deleted BOOLEAN DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  deleted_at DATETIME,
  used_at DATETIME,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Folders table
CREATE TABLE IF NOT EXISTS folders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  folder_type VARCHAR(50) NOT NULL,
  name VARCHAR(100) NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  UNIQUE(user_id, folder_type)
);

-- Operation logs table
CREATE TABLE IF NOT EXISTS operation_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  action VARCHAR(50) NOT NULL,
  target_type VARCHAR(50),
  target_id INTEGER,
  details TEXT,
  ip_address VARCHAR(50),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- AI settings table
CREATE TABLE IF NOT EXISTS ai_settings (
  id VARCHAR(50) PRIMARY KEY DEFAULT 'global',
  api_url TEXT,
  api_key TEXT,
  model TEXT,
  title_prompt TEXT,
  description_prompt TEXT,
  safety_rules TEXT,
  replacement_words TEXT,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Insert default AI settings
INSERT OR IGNORE INTO ai_settings (id, api_url, api_key, model, title_prompt, description_prompt, safety_rules, replacement_words) VALUES (
  'global',
  '',
  '',
  '',
  '你是一个短视频标题专家。请根据这张图片内容，生成一个吸引人的短视频标题。
要求：
- 15-20个字
- 有吸引力，能引起好奇心
- 适合短视频平台
- 输出只需标题，不需要其他内容',
  '你是一个疗愈文案专家。请根据这张图片内容，生成一段疗愈文案。
要求：
- 80-120个字
- 温馨治愈，能引起共鸣
- 适合短视频配文
- 输出只需文案，不需要其他内容',
  '',
  ''
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_materials_user_id ON materials(user_id);
CREATE INDEX IF NOT EXISTS idx_materials_is_deleted ON materials(is_deleted);
CREATE INDEX IF NOT EXISTS idx_operation_logs_user_id ON operation_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_operation_logs_created_at ON operation_logs(created_at);

-- Insert default admin user (password: admin123)
-- Password hash generated with bcrypt
INSERT OR IGNORE INTO users (id, username, password_hash, role) VALUES
  (1, 'admin', '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhW', 'admin'),
  (2, 'user1', '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhW', 'user'),
  (3, 'user2', '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhW', 'user'),
  (4, 'user3', '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhW', 'user');
