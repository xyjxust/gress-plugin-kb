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
    private List<KbTreeNodeDTO> children = new ArrayList<>();
}

