package com.keqi.gress.plugin.kb.dto;

import lombok.Data;

@Data
public class UpsertKbDocRequest {
    private Long parentId;
    private String slug;
    private String title;
    private String bodyMd;
    /** EDITOR / COMPONENT */
    private String docType;
    /** COMPONENT 类型时：由共享 registry 渲染的组件引用 */
    private String componentCategory;
    private String componentName;
    /** JSON 字符串 */
    private String componentPropsJson;
}

