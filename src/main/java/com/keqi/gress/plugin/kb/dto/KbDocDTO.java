package com.keqi.gress.plugin.kb.dto;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class KbDocDTO {
    private Long id;
    private Long spaceId;
    private Long parentId;
    private String slug;
    private String title;
    private String bodyMd;
    private String bodyHtml;
    private String status;
    private Integer version;
    private Integer staticVersion;
    private String staticHtmlUrl;
    private LocalDateTime publishedAt;
    private LocalDateTime updatedAt;
}

