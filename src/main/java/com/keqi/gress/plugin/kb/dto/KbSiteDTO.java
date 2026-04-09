package com.keqi.gress.plugin.kb.dto;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class KbSiteDTO {
    private Long id;
    private String spaceKey;
    private String name;
    private String description;
    private String routePrefix;
    private Integer enabled;
    private LocalDateTime updatedAt;
}

