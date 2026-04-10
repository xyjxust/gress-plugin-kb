package com.keqi.gress.plugin.kb.dto;

import lombok.Data;

import java.util.ArrayList;
import java.util.List;

@Data
public class KbTreeNodeDTO {
    private Long id;
    private Long parentId;
    private String title;
    private String slug;
    private String status;
    /** EDITOR / COMPONENT */
    private String docType;
    private List<KbTreeNodeDTO> children = new ArrayList<>();
}

