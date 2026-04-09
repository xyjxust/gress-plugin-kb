package com.keqi.gress.plugin.kb.domain.entity;

import com.keqi.gress.plugin.api.database.annotation.IdType;
import com.keqi.gress.plugin.api.database.annotation.TableId;
import com.keqi.gress.plugin.api.database.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@TableName("kb_nav_node")
public class KbNavNode {
    @TableId(type = IdType.AUTO)
    private Long id;
    private Long spaceId;
    private String menuCode; // sidebar / header / ...
    private Long parentId;
    private String title;
    private String nodeType; // GROUP / DOC / LINK
    private Long docId;
    private String linkUrl;
    private Integer sortOrder;
    private String status; // DRAFT / PUBLISHED
    private String visibility; // PUBLIC / LOGIN / ROLE
    private String roles; // ROLE 时生效，逗号分隔 role code
    private Integer version;
    private LocalDateTime publishedAt;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}

