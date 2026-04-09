CREATE TABLE IF NOT EXISTS kb_nav_node (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  space_id BIGINT NOT NULL,
  menu_code VARCHAR(32) NOT NULL, -- sidebar / header / ...
  parent_id BIGINT NULL,
  title VARCHAR(256) NOT NULL,
  node_type VARCHAR(16) NOT NULL, -- GROUP / DOC / LINK
  doc_id BIGINT NULL,
  link_url VARCHAR(1024) NULL,
  sort_order INT NOT NULL DEFAULT 0,
  status VARCHAR(16) NOT NULL DEFAULT 'DRAFT', -- DRAFT / PUBLISHED
  visibility VARCHAR(16) NOT NULL DEFAULT 'PUBLIC', -- PUBLIC / LOGIN / ROLE
  roles VARCHAR(1024) NULL, -- ROLE 时生效，逗号分隔 role code
  version INT NOT NULL DEFAULT 1,
  published_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_kb_nav_space_menu (space_id, menu_code),
  INDEX idx_kb_nav_space_parent (space_id, parent_id),
  INDEX idx_kb_nav_space_status (space_id, status),
  INDEX idx_kb_nav_doc (doc_id)
);

