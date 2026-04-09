CREATE TABLE IF NOT EXISTS kb_site_config_history (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  space_id BIGINT NOT NULL,
  action VARCHAR(32) NOT NULL,
  stage VARCHAR(16) NULL,
  json_snapshot MEDIUMTEXT NULL,
  success TINYINT NOT NULL DEFAULT 1,
  error_message VARCHAR(1024) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_kb_site_cfg_hist_space_ct (space_id, created_at),
  INDEX idx_kb_site_cfg_hist_space_action (space_id, action)
);
