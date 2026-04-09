package com.keqi.gress.plugin.kb.dto;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class KbSiteConfigHistoryDTO {
    private Long id;
    private String action;
    private String stage;
    private Integer success;
    private String errorMessage;
    private LocalDateTime createdAt;
}

