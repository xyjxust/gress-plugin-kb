package com.keqi.gress.plugin.kb.dto;

import lombok.Data;

import java.util.List;

@Data
public class MoveKbNavNodeRequest {
    private String menuCode;
    private Long nodeId;
    private Long newParentId;
    /**
     * 同一父节点下的排序（包含 nodeId 在内的完整顺序列表）。
     */
    private List<Long> siblingOrder;
}

