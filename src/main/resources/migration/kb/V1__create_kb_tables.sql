CREATE TABLE IF NOT EXISTS kb_space (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  space_key VARCHAR(64) NOT NULL UNIQUE,
  name VARCHAR(128) NOT NULL,
  description VARCHAR(512) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS kb_doc (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  space_id BIGINT NOT NULL,
  parent_id BIGINT NULL,
  slug VARCHAR(256) NOT NULL,
  title VARCHAR(256) NOT NULL,
  body_md MEDIUMTEXT NOT NULL,
  body_html MEDIUMTEXT NULL,
  status VARCHAR(16) NOT NULL DEFAULT 'DRAFT',
  version INT NOT NULL DEFAULT 1,
  static_version INT NOT NULL DEFAULT 0,
  static_html_url VARCHAR(1024) NULL,
  published_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uk_kb_doc_space_slug (space_id, slug),
  INDEX idx_kb_doc_space_parent (space_id, parent_id),
  INDEX idx_kb_doc_space_status (space_id, status)
);

