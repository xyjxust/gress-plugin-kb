package com.keqi.gress.plugin.kb.domain.entity;

import com.keqi.gress.plugin.api.database.annotation.IdType;
import com.keqi.gress.plugin.api.database.annotation.TableId;
import com.keqi.gress.plugin.api.database.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@TableName("kb_space")
public class KbSpace {
    @TableId(type = IdType.AUTO)
    private Long id;
    private String spaceKey;
    private String name;
    private String description;
    /** 站点 URL 前缀，如 /docs、/handbook/java */
    private String routePrefix;
    /** 1=启用，0=停用 */
    private Integer enabled;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}

