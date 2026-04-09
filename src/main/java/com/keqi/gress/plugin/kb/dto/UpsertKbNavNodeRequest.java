package com.keqi.gress.plugin.kb.dto;

import lombok.Data;

import java.util.List;

@Data
public class UpsertKbNavNodeRequest {
    private String menuCode; // sidebar / header
    private Long parentId;
    private String title;
    private String nodeType; // GROUP / DOC / LINK
    private Long docId;
    private String linkUrl;
    private Integer sortOrder;
    private String visibility; // PUBLIC / LOGIN / ROLE
    private List<String> roles; // ROLE 时生效
}

