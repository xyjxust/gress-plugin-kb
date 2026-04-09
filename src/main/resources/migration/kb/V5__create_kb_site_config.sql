CREATE TABLE IF NOT EXISTS kb_site_config (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  space_id BIGINT NOT NULL,
  draft_json MEDIUMTEXT NULL,
  published_json MEDIUMTEXT NULL,
  version INT NOT NULL DEFAULT 1,
  published_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uk_kb_site_config_space (space_id),
  INDEX idx_kb_site_config_space (space_id)
);

