package com.keqi.gress.plugin.kb.controller;

import com.keqi.gress.common.model.Result;
import com.keqi.gress.plugin.kb.dto.KbDocDTO;
import com.keqi.gress.plugin.kb.dto.KbNavNodeDTO;
import com.keqi.gress.plugin.kb.dto.KbSiteDTO;
import com.keqi.gress.plugin.kb.dto.KbSiteConfigStatusDTO;
import com.keqi.gress.plugin.kb.dto.KbSiteConfigHistoryDTO;
import com.keqi.gress.plugin.kb.dto.KbTreeNodeDTO;
import com.keqi.gress.plugin.kb.dto.MoveKbNavNodeRequest;
import com.keqi.gress.plugin.kb.dto.UpsertKbDocRequest;
import com.keqi.gress.plugin.kb.dto.UpsertKbNavNodeRequest;
import com.keqi.gress.plugin.kb.dto.UpsertKbSiteRequest;
import com.keqi.gress.plugin.kb.service.KbService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@Service
@RestController
@RequestMapping("/kb")
@Valid
public class KbController {
    @Autowired
    private KbService kbService;

    /** 文档目录树（仅元数据，不含正文） */
    @GetMapping("/tree")
    public Result<List<KbTreeNodeDTO>> tree(@RequestParam(required = false) String siteKey) {
        return kbService.getTree(siteKey);
    }

    @GetMapping("/docs/{docId}")
    public Result<KbDocDTO> getDoc(@PathVariable Long docId, @RequestParam(required = false) String siteKey) {
        return kbService.getDoc(docId, siteKey);
    }

    @PostMapping("/docs")
    public Result<KbDocDTO> create(@RequestBody UpsertKbDocRequest req, @RequestParam(required = false) String siteKey) {
        return kbService.createDoc(req, siteKey);
    }

    @PutMapping("/docs/{docId}")
    public Result<KbDocDTO> update(
            @PathVariable Long docId,
            @RequestBody UpsertKbDocRequest req,
            @RequestParam(required = false) String siteKey
    ) {
        return kbService.updateDoc(docId, req, siteKey);
    }

    @PostMapping("/docs/{docId}/publish")
    public Result<KbDocDTO> publish(@PathVariable Long docId, @RequestParam(required = false) String siteKey) {
        return kbService.publish(docId, siteKey);
    }

    @PostMapping("/docs/{docId}/unpublish")
    public Result<KbDocDTO> unpublish(@PathVariable Long docId, @RequestParam(required = false) String siteKey) {
        return kbService.unpublish(docId, siteKey);
    }

    @DeleteMapping("/docs/{docId}")
    public Result<Void> delete(@PathVariable Long docId, @RequestParam(required = false) String siteKey) {
        return kbService.delete(docId, siteKey);
    }

    // ==================== 站点导航（管理端） ====================

    /** 管理端导航树（kb_nav_node，无文档正文） */
    @GetMapping("/admin/nav/tree")
    public Result<List<KbNavNodeDTO>> adminNavTree(
            @RequestParam(defaultValue = "sidebar") String menuCode,
            @RequestParam(required = false) String siteKey
    ) {
        return kbService.adminGetNavTree(menuCode, siteKey);
    }

    @PostMapping("/admin/nav/node")
    public Result<KbNavNodeDTO> adminCreateNavNode(
            @RequestBody UpsertKbNavNodeRequest req,
            @RequestParam(required = false) String siteKey
    ) {
        return kbService.adminCreateNavNode(req, siteKey);
    }

    @PutMapping("/admin/nav/node/{nodeId}")
    public Result<KbNavNodeDTO> adminUpdateNavNode(
            @PathVariable Long nodeId,
            @RequestBody UpsertKbNavNodeRequest req,
            @RequestParam(required = false) String siteKey
    ) {
        return kbService.adminUpdateNavNode(nodeId, req, siteKey);
    }

    @DeleteMapping("/admin/nav/node/{nodeId}")
    public Result<Void> adminDeleteNavNode(@PathVariable Long nodeId, @RequestParam(required = false) String siteKey) {
        return kbService.adminDeleteNavNode(nodeId, siteKey);
    }

    @PostMapping("/admin/nav/move")
    public Result<Void> adminMoveNavNode(@RequestBody MoveKbNavNodeRequest req, @RequestParam(required = false) String siteKey) {
        return kbService.adminMoveNavNode(req, siteKey);
    }

    @PostMapping("/admin/nav/publish")
    public Result<Void> adminPublishNav(
            @RequestParam(defaultValue = "sidebar") String menuCode,
            @RequestParam(required = false) String siteKey
    ) {
        return kbService.adminPublishNav(menuCode, siteKey);
    }

    // ==================== 站点管理（多站点） ====================

    @GetMapping("/admin/sites")
    public Result<List<KbSiteDTO>> adminListSites() {
        return kbService.adminListSites();
    }

    @PostMapping("/admin/sites")
    public Result<KbSiteDTO> adminCreateSite(@RequestBody UpsertKbSiteRequest req) {
        return kbService.adminCreateSite(req);
    }

    @PutMapping("/admin/sites/{siteId}")
    public Result<KbSiteDTO> adminUpdateSite(@PathVariable Long siteId, @RequestBody UpsertKbSiteRequest req) {
        return kbService.adminUpdateSite(siteId, req);
    }

    @DeleteMapping("/admin/sites/{siteId}")
    public Result<Void> adminDeleteSite(@PathVariable Long siteId) {
        return kbService.adminDeleteSite(siteId);
    }

    // ==================== 站点导航（站点端） ====================
    // 站点端匿名接口已迁至 {@link KbAnonController}（/plugins/kb/anon/site/...）

    // ==================== 站点构建器配置（SiteRendererConfig JSON） ====================

    /** 读取站点渲染配置（stage=published|draft，默认 published） */
    @GetMapping("/site/config")
    public Result<String> siteRendererConfig(
            @RequestParam(required = false) String siteKey,
            @RequestParam(required = false, defaultValue = "published") String stage
    ) {
        return kbService.getSiteRendererConfig(siteKey, stage);
    }

    /** 保存草稿：body={ json: "..." } */
    @PostMapping("/admin/site/config/draft")
    public Result<Void> saveSiteRendererDraft(
            @RequestParam(required = false) String siteKey,
            @RequestBody Map<String, String> body
    ) {
        return kbService.saveSiteRendererDraft(siteKey, body == null ? "" : body.getOrDefault("json", ""));
    }

    /** 发布草稿为 published */
    @PostMapping("/admin/site/config/publish")
    public Result<Void> publishSiteRendererConfig(@RequestParam(required = false) String siteKey) {
        return kbService.publishSiteRendererConfig(siteKey);
    }

    /** 取消发布（仅移除 published，不影响 draft） */
    @PostMapping("/admin/site/config/unpublish")
    public Result<Void> unpublishSiteRendererConfig(@RequestParam(required = false) String siteKey) {
        return kbService.unpublishSiteRendererConfig(siteKey);
    }

    /** 读取当前站点配置状态（草稿/发布/版本） */
    @GetMapping("/admin/site/config/status")
    public Result<KbSiteConfigStatusDTO> siteRendererConfigStatus(@RequestParam(required = false) String siteKey) {
        return kbService.getSiteRendererConfigStatus(siteKey);
    }

    /** 历史记录（保存/发布/取消发布/回滚，含失败） */
    @GetMapping("/admin/site/config/history")
    public Result<List<KbSiteConfigHistoryDTO>> siteRendererConfigHistory(
            @RequestParam(required = false) String siteKey,
            @RequestParam(required = false, defaultValue = "50") Integer limit
    ) {
        return kbService.listSiteRendererConfigHistory(siteKey, limit);
    }

    /** 从历史回滚到 draft/published，默认 draft */
    @PostMapping("/admin/site/config/rollback")
    public Result<Void> rollbackSiteRendererConfig(
            @RequestParam(required = false) String siteKey,
            @RequestBody Map<String, Object> body
    ) {
        Long historyId = null;
        if (body != null && body.get("historyId") != null) {
            try {
                historyId = Long.parseLong(String.valueOf(body.get("historyId")));
            } catch (Exception ignore) {
                historyId = null;
            }
        }
        String stage = body == null ? null : String.valueOf(body.getOrDefault("stage", "draft"));
        return kbService.rollbackSiteRendererConfigByHistory(siteKey, historyId, stage);
    }
}

