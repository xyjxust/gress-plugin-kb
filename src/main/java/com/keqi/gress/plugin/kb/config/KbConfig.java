package com.keqi.gress.plugin.kb.config;

import com.keqi.gress.common.plugin.annotion.FormField;
import com.keqi.gress.common.plugin.dto.Input;
import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;

@Data
@ConfigurationProperties(prefix = "kb")
public class KbConfig implements Input {
    @FormField(label = "站点名称", required = true, order = 1)
    private String siteName = "知识库";

    @FormField(label = "允许匿名阅读", order = 2)
    private boolean allowAnonymousRead = false;
}

