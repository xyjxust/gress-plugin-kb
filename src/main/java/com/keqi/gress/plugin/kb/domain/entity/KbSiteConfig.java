package com.keqi.gress.plugin.kb.domain.entity;

import com.keqi.gress.plugin.api.database.annotation.IdType;
import com.keqi.gress.plugin.api.database.annotation.TableId;
import com.keqi.gress.plugin.api.database.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@TableName("kb_site_config")
public class KbSiteConfig {
    @TableId(value = "id", type = IdType.AUTO)
    private Long id;
    private Long spaceId;
    private String draftJson;
    private String publishedJson;
    private Integer version;
    private LocalDateTime publishedAt;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}

