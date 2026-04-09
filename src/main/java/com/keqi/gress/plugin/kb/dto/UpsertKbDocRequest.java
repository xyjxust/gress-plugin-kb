package com.keqi.gress.plugin.kb.dto;

import lombok.Data;

@Data
public class UpsertKbDocRequest {
    private Long parentId;
    private String slug;
    private String title;
    private String bodyMd;
}

