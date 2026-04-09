package com.keqi.gress.plugin.kb.dto;

import lombok.Data;

@Data
public class UpsertKbSiteRequest {
    private String spaceKey;
    private String name;
    private String description;
    private String routePrefix;
    /** 1=启用，0=停用 */
    private Integer enabled;
}

