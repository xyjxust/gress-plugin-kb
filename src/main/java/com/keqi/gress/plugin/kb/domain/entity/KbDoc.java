package com.keqi.gress.plugin.kb.domain.entity;

import com.keqi.gress.plugin.api.database.annotation.IdType;
import com.keqi.gress.plugin.api.database.annotation.TableId;
import com.keqi.gress.plugin.api.database.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@TableName("kb_doc")
public class KbDoc {
    @TableId(type = IdType.AUTO)
    private Long id;
    private Long spaceId;
    private Long parentId;
    private String slug;
    private String title;
    /**
     * 文档类型：
     * - EDITOR：正文由编辑器（bodyMd/bodyHtml）驱动
     * - COMPONENT：正文由页面组件驱动（componentCategory/componentName/componentPropsJson）
     */
    private String docType; // EDITOR / COMPONENT
    private String componentCategory;
    private String componentName;
    private String componentPropsJson;
    private String bodyMd;
    private String bodyHtml;
    private String status; // DRAFT / PUBLISHED
    private Integer version;
    private Integer staticVersion;
    private String staticHtmlUrl;
    private LocalDateTime publishedAt;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}

