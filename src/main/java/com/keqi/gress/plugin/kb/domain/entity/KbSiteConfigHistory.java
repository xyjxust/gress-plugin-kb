package com.keqi.gress.plugin.kb.domain.entity;

import com.keqi.gress.plugin.api.database.annotation.IdType;
import com.keqi.gress.plugin.api.database.annotation.TableId;
import com.keqi.gress.plugin.api.database.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@TableName("kb_site_config_history")
public class KbSiteConfigHistory {
    @TableId(value = "id", type = IdType.AUTO)
    private Long id;
    private Long spaceId;
    private String action;
    private String stage;
    private String jsonSnapshot;
    private Integer success;
    private String errorMessage;
    private LocalDateTime createdAt;
}

