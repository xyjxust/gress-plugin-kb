ALTER TABLE kb_space
  ADD COLUMN route_prefix VARCHAR(256) NULL AFTER description,
  ADD COLUMN enabled TINYINT NOT NULL DEFAULT 1 AFTER route_prefix;

UPDATE kb_space
SET route_prefix = CASE
  WHEN space_key = 'default' THEN '/'
  ELSE CONCAT('/sites/', space_key)
END
WHERE route_prefix IS NULL OR route_prefix = '';

ALTER TABLE kb_space
  MODIFY COLUMN route_prefix VARCHAR(256) NOT NULL;

CREATE UNIQUE INDEX uk_kb_space_route_prefix ON kb_space (route_prefix);

