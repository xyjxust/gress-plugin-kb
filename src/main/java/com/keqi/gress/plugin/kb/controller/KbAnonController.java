package com.keqi.gress.plugin.kb.controller;

import com.keqi.gress.common.model.Result;
import com.keqi.gress.plugin.kb.dto.KbDocDTO;
import com.keqi.gress.plugin.kb.dto.KbNavNodeDTO;
import com.keqi.gress.plugin.kb.dto.KbSiteDTO;
import com.keqi.gress.plugin.kb.dto.KbTreeNodeDTO;
import com.keqi.gress.plugin.kb.service.KbService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

/**
 * 免登录接口：路径含 {@code /plugins/{pluginId}/anon/}，由 IAM 按约定放行。
 */
@RestController
@RequestMapping("/anon")
public class KbAnonController {

    @Autowired
    private KbService kbService;

    /**
     * 文档目录树（与 {@link com.keqi.gress.plugin.kb.controller.KbController} {@code GET /kb/tree} 同源逻辑，免登录）。
     * <p><b>安全提示</b>：会包含草稿节点元数据，仅应在可信网络或对访客公开整棵目录时使用。</p>
     */
    @GetMapping("/tree")
    public Result<List<KbTreeNodeDTO>> anonTree(@RequestParam(required = false) String siteKey) {
        return kbService.getTree(siteKey);
    }

    /**
     * 站点列表（与 {@code GET /kb/admin/sites} 同源逻辑，免登录）。
     * <p><b>安全提示</b>：含停用站点等全量信息，与后台管理列表一致。</p>
     */
    @GetMapping("/sites")
    public Result<List<KbSiteDTO>> anonSites() {
        return kbService.adminListSites();
    }

    /** 站点端导航树（kb_nav_node，无文档正文） */
    @GetMapping("/site/nav/tree")
    public Result<List<KbNavNodeDTO>> siteNavTree(
            @RequestParam(defaultValue = "sidebar") String menuCode,
            @RequestParam(required = false) String siteKey
    ) {
        return kbService.siteGetNavTree(menuCode, siteKey);
    }

    /** 根据 URL（路径）匹配站点，如 /docs/java/getting-started => routePrefix=/docs/java 的站点 */
    @GetMapping("/site/resolve")
    public Result<KbSiteDTO> siteResolve(@RequestParam String urlPath) {
        return kbService.siteResolve(urlPath);
    }

    /** 读取已发布文档（免登录；草稿请走 {@link KbController}） */
    @GetMapping("/docs/{docId}")
    public Result<KbDocDTO> getDocPublished(
            @PathVariable Long docId,
            @RequestParam(required = false) String siteKey
    ) {
        return kbService.getDocPublished(docId, siteKey);
    }

    /**
     * 读取已发布的站点渲染配置 JSON（仅 published，免登录；草稿请走 {@link KbController} 管理端接口）。
     */
    @GetMapping("/site/config")
    public Result<String> siteRendererConfigPublished(@RequestParam(required = false) String siteKey) {
        return kbService.getSiteRendererConfig(siteKey, "published");
    }

    @GetMapping("/health")
    public Result<Map<String, String>> health() {
        return Result.success(Map.of("status", "UP"));
    }
}
