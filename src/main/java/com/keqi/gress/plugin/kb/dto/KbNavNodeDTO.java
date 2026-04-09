package com.keqi.gress.plugin.kb.dto;

import lombok.Data;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Data
public class KbNavNodeDTO {
    private Long id;
    private Long parentId;
    private String menuCode;
    private String title;
    private String nodeType; // GROUP / DOC / LINK
    private Long docId;
    private String linkUrl;
    private Integer sortOrder;
    private String status;
    private String visibility;
    private List<String> roles;
    private Integer version;
    private LocalDateTime publishedAt;
    private LocalDateTime updatedAt;

    private List<KbNavNodeDTO> children = new ArrayList<>();
}

