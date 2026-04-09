package com.keqi.gress.plugin.kb.dto;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class KbSiteConfigStatusDTO {
    private Integer version;
    private boolean hasDraft;
    private boolean hasPublished;
    private LocalDateTime publishedAt;
    private LocalDateTime updatedAt;
}

