CREATE TABLE IF NOT EXISTS rent_users (
  id VARCHAR(36) PRIMARY KEY,
  username VARCHAR(50),
  nickname VARCHAR(50),
  phone VARCHAR(20),
  avatar VARCHAR(255),
  auth_code VARCHAR(100),
  token VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_login TIMESTAMP NULL,
  INDEX idx_auth_code (auth_code),
  INDEX idx_token (token)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='小程序用户表';
