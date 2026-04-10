package com.keqi.gress.plugin.kb.service;

import com.keqi.gress.common.model.Result;
import com.keqi.gress.common.storage.FileStorageService;
import com.keqi.gress.plugin.kb.dao.KbDocDao;
import com.keqi.gress.plugin.kb.dao.KbNavNodeDao;
import com.keqi.gress.plugin.kb.dao.KbSiteConfigDao;
import com.keqi.gress.plugin.kb.dao.KbSiteConfigHistoryDao;
import com.keqi.gress.plugin.kb.dao.KbSpaceDao;
import com.keqi.gress.plugin.kb.domain.entity.KbDoc;
import com.keqi.gress.plugin.kb.domain.entity.KbSpace;
import com.keqi.gress.plugin.kb.domain.entity.KbNavNode;
import com.keqi.gress.plugin.kb.domain.entity.KbSiteConfig;
import com.keqi.gress.plugin.kb.domain.entity.KbSiteConfigHistory;
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
import lombok.extern.slf4j.Slf4j;
import org.commonmark.parser.Parser;
import org.commonmark.renderer.html.HtmlRenderer;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.*;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Slf4j
@Service
public class KbService {
    private static final String DEFAULT_SPACE_KEY = "default";
    private static final Parser MD_PARSER = Parser.builder().build();
    private static final HtmlRenderer HTML_RENDERER = HtmlRenderer.builder().build();
    private static final Pattern SCRIPT_TAG = Pattern.compile("(?is)<script\\b[^>]*>.*?</script>");
    private static final Pattern STYLE_TAG = Pattern.compile("(?is)<style\\b[^>]*>.*?</style>");
    private static final Pattern EVENT_ATTR = Pattern.compile("(?i)\\s+on[a-z]+\\s*=\\s*(['\"]).*?\\1");
    private static final Pattern JS_URL_ATTR = Pattern.compile("(?i)\\s+(href|src)\\s*=\\s*(['\"])\\s*javascript:.*?\\2");

    /** 有 href 且尚未带 target 的 <a>，补新窗口打开（与前端阅读态一致） */
    private static final Pattern ANCHOR_WITH_HREF_NO_TARGET = Pattern.compile(
            "<a(?=[^>]*\\bhref\\s*=)(?![^>]*\\btarget\\s*=)([^>]*)>",
            Pattern.CASE_INSENSITIVE);

    @Autowired
    private KbSpaceDao spaceDao;

    @Autowired
    private KbDocDao docDao;

    @Autowired
    private KbNavNodeDao navNodeDao;

    @Autowired
    private KbSiteConfigDao siteConfigDao;
    @Autowired
    private KbSiteConfigHistoryDao siteConfigHistoryDao;

    @Autowired
    private FileStorageService fileStorageService;

    /** 文档树：仅元数据列，不加载正文（见 {@link KbDocDao#listTreeMetaBySpaceId}）。 */
    public Result<List<KbTreeNodeDTO>> getTree(String siteKey) {
        Long spaceId = ensureSpace(siteKey);
        List<KbDoc> docs = docDao.listTreeMetaBySpaceId(spaceId);
        Map<Long, KbTreeNodeDTO> map = new LinkedHashMap<>();
        for (KbDoc d : docs) {
            KbTreeNodeDTO n = new KbTreeNodeDTO();
            n.setId(d.getId());
            n.setParentId(d.getParentId());
            n.setTitle(d.getTitle());
            n.setSlug(d.getSlug());
            n.setStatus(d.getStatus());
            n.setDocType(d.getDocType());
            map.put(n.getId(), n);
        }
        List<KbTreeNodeDTO> roots = new ArrayList<>();
        for (KbTreeNodeDTO n : map.values()) {
            if (n.getParentId() != null && map.containsKey(n.getParentId())) {
                map.get(n.getParentId()).getChildren().add(n);
            } else {
                roots.add(n);
            }
        }
        return Result.success(roots);
    }

    public Result<KbDocDTO> getDoc(Long docId, String siteKey) {
        KbDoc doc = docDao.findByIdOrNull(docId);
        if (doc == null) {
            return Result.error("文档不存在");
        }
        if (!Objects.equals(doc.getSpaceId(), ensureSpace(siteKey))) {
            return Result.error("文档不属于当前站点");
        }
        return Result.success(toDto(doc));
    }

    public Result<KbDocDTO> createDoc(UpsertKbDocRequest req, String siteKey) {
        Long spaceId = ensureSpace(siteKey);
        if (req.getTitle() == null || req.getTitle().trim().isEmpty()) {
            return Result.error("标题不能为空");
        }
        String slug = (req.getSlug() == null || req.getSlug().trim().isEmpty())
                ? normalizeSlug(req.getTitle())
                : normalizeSlug(req.getSlug());

        KbDoc doc = new KbDoc();
        doc.setSpaceId(spaceId);
        doc.setParentId(req.getParentId());
        doc.setSlug(slug);
        doc.setTitle(req.getTitle().trim());
        String dt = (req.getDocType() == null || req.getDocType().isBlank()) ? "EDITOR" : req.getDocType().trim().toUpperCase();
        if (!dt.equals("EDITOR") && !dt.equals("COMPONENT")) dt = "EDITOR";
        doc.setDocType(dt);
        doc.setComponentCategory(req.getComponentCategory());
        doc.setComponentName(req.getComponentName());
        doc.setComponentPropsJson(req.getComponentPropsJson());
        doc.setBodyMd(req.getBodyMd() == null ? "" : req.getBodyMd());
        doc.setBodyHtml(null);
        doc.setStaticHtmlUrl(null);
        doc.setStatus("DRAFT");
        doc.setVersion(1);
        doc.setStaticVersion(0);
        doc.setCreatedAt(LocalDateTime.now());
        doc.setUpdatedAt(LocalDateTime.now());
        docDao.insert(doc);
        // 兼容：部分底层实现不会把自增主键回填到实体，导致前端拿不到 id
        if (doc.getId() == null) {
            KbDoc inserted = docDao.findLatestBySpaceIdAndSlug(spaceId, slug);
            if (inserted != null && inserted.getId() != null) {
                doc = inserted;
            }
        }
        return Result.success(toDto(doc));
    }

    public Result<KbDocDTO> updateDoc(Long docId, UpsertKbDocRequest req, String siteKey) {
        KbDoc doc = docDao.findByIdOrNull(docId);
        if (doc == null) {
            return Result.error("文档不存在");
        }
        if (!Objects.equals(doc.getSpaceId(), ensureSpace(siteKey))) {
            return Result.error("文档不属于当前站点");
        }
        if (req.getTitle() != null && !req.getTitle().trim().isEmpty()) {
            doc.setTitle(req.getTitle().trim());
        }
        if (req.getSlug() != null && !req.getSlug().trim().isEmpty()) {
            doc.setSlug(normalizeSlug(req.getSlug()));
        }
        if (req.getParentId() != null) {
            doc.setParentId(req.getParentId());
        }
        if (req.getBodyMd() != null) {
            doc.setBodyMd(req.getBodyMd());
        }
        if (req.getDocType() != null && !req.getDocType().isBlank()) {
            String dt = req.getDocType().trim().toUpperCase();
            if (dt.equals("EDITOR") || dt.equals("COMPONENT")) doc.setDocType(dt);
        }
        if (req.getComponentCategory() != null) doc.setComponentCategory(req.getComponentCategory());
        if (req.getComponentName() != null) doc.setComponentName(req.getComponentName());
        if (req.getComponentPropsJson() != null) doc.setComponentPropsJson(req.getComponentPropsJson());
        doc.setVersion((doc.getVersion() == null ? 1 : doc.getVersion()) + 1);
        docDao.updateById(doc);
        return Result.success(toDto(doc));
    }

    public Result<KbDocDTO> publish(Long docId, String siteKey) {
        KbDoc doc = docDao.findByIdOrNull(docId);
        if (doc == null) {
            return Result.error("文档不存在");
        }
        if (!Objects.equals(doc.getSpaceId(), ensureSpace(siteKey))) {
            return Result.error("文档不属于当前站点");
        }
        // COMPONENT 类型：不生成静态 HTML，仅标记发布（渲染时由组件驱动）
        if ("COMPONENT".equalsIgnoreCase(doc.getDocType())) {
            doc.setStatus("PUBLISHED");
            doc.setPublishedAt(LocalDateTime.now());
            docDao.updateById(doc);
            return Result.success(toDto(doc));
        }

        String oldStaticUrl = doc.getStaticHtmlUrl();
        int nextStaticVersion = (doc.getStaticVersion() == null ? 0 : doc.getStaticVersion()) + 1;
        String bodyHtml = renderAndSanitizeHtml(doc.getBodyMd());
        String staticHtml = buildStaticHtmlPage(doc.getTitle(), bodyHtml);
        String staticFileName = String.format("kb-doc-%d-v%d.html", doc.getId(), nextStaticVersion);
        Result<String> uploadResult = fileStorageService
                .upload(staticFileName, staticHtml.getBytes(StandardCharsets.UTF_8))
                .withMetadata("pluginId", "kb")
                .withMetadata("docId", doc.getId())
                .withMetadata("staticVersion", nextStaticVersion)
                .withMetadata("contentType", "text/html")
                .execute();
        if (uploadResult == null || !uploadResult.isSuccess() || uploadResult.getData() == null || uploadResult.getData().isBlank()) {
            return Result.error(uploadResult != null ? uploadResult.getErrorMessage() : "上传静态文件失败");
        }
        doc.setStatus("PUBLISHED");
        doc.setBodyHtml(bodyHtml);
        doc.setStaticVersion(nextStaticVersion);
        doc.setStaticHtmlUrl(uploadResult.getData());
        doc.setPublishedAt(LocalDateTime.now());
        docDao.updateById(doc);

        // 清理上一个静态文件（失败不影响发布）
        if (oldStaticUrl != null && !oldStaticUrl.isBlank() && !oldStaticUrl.equals(doc.getStaticHtmlUrl())) {
            try {
                fileStorageService.delete(oldStaticUrl).execute();
            } catch (Exception e) {
                log.warn("删除旧静态文件失败: url={}", oldStaticUrl, e);
            }
        }
        return Result.success(toDto(doc));
    }

    public Result<Void> delete(Long docId, String siteKey) {
        KbDoc doc = docDao.findByIdOrNull(docId);
        if (doc == null) return Result.error("删除失败或文档不存在");
        if (!Objects.equals(doc.getSpaceId(), ensureSpace(siteKey))) {
            return Result.error("文档不属于当前站点");
        }
        int rows = docDao.deleteById(docId);
        if (rows <= 0) {
            return Result.error("删除失败或文档不存在");
        }
        return Result.success();
    }

    // ==================== 站点导航（kb_nav_node） ====================

    /** 管理端导航树：仅 kb_nav_node 行，不关联 kb_doc 正文。 */
    public Result<List<KbNavNodeDTO>> adminGetNavTree(String menuCode, String siteKey) {
        Long spaceId = ensureSpace(siteKey);
        return Result.success(buildNavTree(navNodeDao.listByMenu(spaceId, menuCode, "DRAFT")));
    }

    /** 站点端导航树：同上，仅导航节点元数据。 */
    public Result<List<KbNavNodeDTO>> siteGetNavTree(String menuCode, String siteKey) {
        Long spaceId = ensureSpace(siteKey);
        List<KbNavNode> nodes = navNodeDao.listByMenu(spaceId, menuCode, "PUBLISHED");
        return Result.success(buildNavTree(filterByVisibility(nodes)));
    }

    public Result<KbSiteDTO> siteResolve(String urlPath) {
        String path = normalizeRoutePrefix(urlPath);
        List<KbSpace> all = spaceDao.listAll().stream()
                .filter(s -> s.getEnabled() == null || s.getEnabled() == 1)
                .toList();
        if (all.isEmpty()) {
            Long id = ensureDefaultSpace();
            KbSpace fallback = spaceDao.findByIdOrNull(id);
            return Result.success(toSiteDto(fallback));
        }
        KbSpace matched = all.stream()
                .filter(s -> routePrefixMatches(path, normalizeRoutePrefix(s.getRoutePrefix())))
                .max(Comparator.comparingInt(s -> normalizeRoutePrefix(s.getRoutePrefix()).length()))
                .orElseGet(() -> all.stream().findFirst().orElse(null));
        return Result.success(toSiteDto(matched));
    }

    // ==================== 站点构建器配置（SiteRendererConfig JSON） ====================

    /**
     * 读取站点构建器配置（默认返回 published；管理端可取 draft）。
     * 前端直接存/取 renderer 所需 JSON，不做强校验以便迭代。
     */
    public Result<String> getSiteRendererConfig(String siteKey, String stage) {
        Long spaceId = ensureSpace(siteKey);
        KbSiteConfig cfg = siteConfigDao.findBySpaceIdOrNull(spaceId);
        if (cfg == null) return Result.success("");
        String s = (stage != null && stage.equalsIgnoreCase("draft")) ? cfg.getDraftJson() : cfg.getPublishedJson();
        return Result.success(s == null ? "" : s);
    }

    public Result<Void> saveSiteRendererDraft(String siteKey, String json) {
        Long spaceId = ensureSpace(siteKey);
        try {
            KbSiteConfig cfg = siteConfigDao.findBySpaceIdOrNull(spaceId);
            if (cfg == null) {
                cfg = new KbSiteConfig();
                cfg.setSpaceId(spaceId);
                cfg.setDraftJson(json);
                cfg.setPublishedJson(null);
                cfg.setVersion(1);
                cfg.setCreatedAt(LocalDateTime.now());
                cfg.setUpdatedAt(LocalDateTime.now());
                siteConfigDao.insert(cfg);
            } else {
                cfg.setDraftJson(json);
                cfg.setVersion((cfg.getVersion() == null ? 1 : cfg.getVersion()) + 1);
                siteConfigDao.updateById(cfg);
            }
            appendSiteConfigHistory(spaceId, "SAVE_DRAFT", "draft", json, true, null);
            return Result.success();
        } catch (Exception ex) {
            appendSiteConfigHistory(spaceId, "SAVE_DRAFT", "draft", json, false, ex.getMessage());
            throw ex;
        }
    }

    public Result<Void> publishSiteRendererConfig(String siteKey) {
        Long spaceId = ensureSpace(siteKey);
        KbSiteConfig cfg = siteConfigDao.findBySpaceIdOrNull(spaceId);
        if (cfg == null || cfg.getDraftJson() == null || cfg.getDraftJson().isBlank()) {
            appendSiteConfigHistory(spaceId, "PUBLISH", "published", null, false, "没有可发布的草稿配置");
            return Result.error("没有可发布的草稿配置");
        }
        try {
            cfg.setPublishedJson(cfg.getDraftJson());
            cfg.setPublishedAt(LocalDateTime.now());
            cfg.setVersion((cfg.getVersion() == null ? 1 : cfg.getVersion()) + 1);
            siteConfigDao.updateById(cfg);
            appendSiteConfigHistory(spaceId, "PUBLISH", "published", cfg.getPublishedJson(), true, null);
            return Result.success();
        } catch (Exception ex) {
            appendSiteConfigHistory(spaceId, "PUBLISH", "published", cfg.getDraftJson(), false, ex.getMessage());
            throw ex;
        }
    }

    public Result<Void> unpublishSiteRendererConfig(String siteKey) {
        Long spaceId = ensureSpace(siteKey);
        KbSiteConfig cfg = siteConfigDao.findBySpaceIdOrNull(spaceId);
        if (cfg == null || cfg.getPublishedJson() == null || cfg.getPublishedJson().isBlank()) {
            appendSiteConfigHistory(spaceId, "UNPUBLISH", "published", null, false, "当前没有已发布版本");
            return Result.error("当前没有已发布版本");
        }
        try {
            cfg.setPublishedJson(null);
            cfg.setPublishedAt(null);
            cfg.setVersion((cfg.getVersion() == null ? 1 : cfg.getVersion()) + 1);
            siteConfigDao.updateById(cfg);
            appendSiteConfigHistory(spaceId, "UNPUBLISH", "published", null, true, null);
            return Result.success();
        } catch (Exception ex) {
            appendSiteConfigHistory(spaceId, "UNPUBLISH", "published", null, false, ex.getMessage());
            throw ex;
        }
    }

    public Result<KbSiteConfigStatusDTO> getSiteRendererConfigStatus(String siteKey) {
        Long spaceId = ensureSpace(siteKey);
        KbSiteConfig cfg = siteConfigDao.findBySpaceIdOrNull(spaceId);
        KbSiteConfigStatusDTO dto = new KbSiteConfigStatusDTO();
        if (cfg == null) {
            dto.setVersion(0);
            dto.setHasDraft(false);
            dto.setHasPublished(false);
            return Result.success(dto);
        }
        dto.setVersion(cfg.getVersion() == null ? 0 : cfg.getVersion());
        dto.setHasDraft(cfg.getDraftJson() != null && !cfg.getDraftJson().isBlank());
        dto.setHasPublished(cfg.getPublishedJson() != null && !cfg.getPublishedJson().isBlank());
        dto.setPublishedAt(cfg.getPublishedAt());
        dto.setUpdatedAt(cfg.getUpdatedAt());
        return Result.success(dto);
    }

    public Result<List<KbSiteConfigHistoryDTO>> listSiteRendererConfigHistory(String siteKey, Integer limit) {
        Long spaceId = ensureSpace(siteKey);
        int n = (limit == null || limit <= 0 || limit > 200) ? 50 : limit;
        List<KbSiteConfigHistory> rows = siteConfigHistoryDao.listBySpaceIdDesc(spaceId, n);
        List<KbSiteConfigHistoryDTO> out = new ArrayList<>();
        for (KbSiteConfigHistory row : rows) {
            KbSiteConfigHistoryDTO dto = new KbSiteConfigHistoryDTO();
            dto.setId(row.getId());
            dto.setAction(row.getAction());
            dto.setStage(row.getStage());
            dto.setSuccess(row.getSuccess());
            dto.setErrorMessage(row.getErrorMessage());
            dto.setCreatedAt(row.getCreatedAt());
            out.add(dto);
        }
        return Result.success(out);
    }

    public Result<Void> rollbackSiteRendererConfigByHistory(String siteKey, Long historyId, String stage) {
        Long spaceId = ensureSpace(siteKey);
        if (historyId == null) return Result.error("historyId 不能为空");
        String targetStage = (stage != null && stage.equalsIgnoreCase("published")) ? "published" : "draft";
        KbSiteConfigHistory h = siteConfigHistoryDao.findByIdOrNull(historyId);
        if (h == null || !Objects.equals(h.getSpaceId(), spaceId)) return Result.error("历史记录不存在");
        if (h.getJsonSnapshot() == null || h.getJsonSnapshot().isBlank()) return Result.error("该历史记录无可回滚快照");
        KbSiteConfig cfg = siteConfigDao.findBySpaceIdOrNull(spaceId);
        if (cfg == null) {
            cfg = new KbSiteConfig();
            cfg.setSpaceId(spaceId);
            cfg.setVersion(1);
            cfg.setCreatedAt(LocalDateTime.now());
        }
        try {
            if ("published".equals(targetStage)) {
                cfg.setPublishedJson(h.getJsonSnapshot());
                cfg.setPublishedAt(LocalDateTime.now());
            } else {
                cfg.setDraftJson(h.getJsonSnapshot());
            }
            cfg.setVersion((cfg.getVersion() == null ? 1 : cfg.getVersion()) + 1);
            if (cfg.getId() == null) siteConfigDao.insert(cfg);
            else siteConfigDao.updateById(cfg);
            appendSiteConfigHistory(spaceId, "ROLLBACK", targetStage, h.getJsonSnapshot(), true, null);
            return Result.success();
        } catch (Exception ex) {
            appendSiteConfigHistory(spaceId, "ROLLBACK", targetStage, h.getJsonSnapshot(), false, ex.getMessage());
            throw ex;
        }
    }

    public Result<List<KbSiteDTO>> adminListSites() {
        ensureDefaultSpace();
        return Result.success(spaceDao.listAll().stream().map(KbService::toSiteDto).toList());
    }

    public Result<KbSiteDTO> adminCreateSite(UpsertKbSiteRequest req) {
        if (req == null) return Result.error("请求不能为空");
        String key = normalizeSiteKey(req.getSpaceKey());
        if (key.isEmpty()) return Result.error("siteKey 不能为空");
        if (spaceDao.findBySpaceKeyOrNull(key) != null) return Result.error("siteKey 已存在");
        String routePrefix = normalizeRoutePrefix(req.getRoutePrefix());
        KbSpace byRoute = spaceDao.findByRoutePrefixOrNull(routePrefix);
        if (byRoute != null) return Result.error("URL 前缀已被占用");
        KbSpace s = new KbSpace();
        s.setSpaceKey(key);
        s.setName((req.getName() == null || req.getName().isBlank()) ? key : req.getName().trim());
        s.setDescription(req.getDescription());
        s.setRoutePrefix(routePrefix);
        s.setEnabled((req.getEnabled() != null && req.getEnabled() == 0) ? 0 : 1);
        s.setCreatedAt(LocalDateTime.now());
        s.setUpdatedAt(LocalDateTime.now());
        spaceDao.insert(s);
        return Result.success(toSiteDto(s));
    }

    public Result<KbSiteDTO> adminUpdateSite(Long siteId, UpsertKbSiteRequest req) {
        KbSpace s = spaceDao.findByIdOrNull(siteId);
        if (s == null) return Result.error("站点不存在");
        if (req.getName() != null && !req.getName().isBlank()) s.setName(req.getName().trim());
        if (req.getDescription() != null) s.setDescription(req.getDescription());
        if (req.getEnabled() != null) s.setEnabled(req.getEnabled() == 0 ? 0 : 1);
        if (req.getRoutePrefix() != null) {
            String routePrefix = normalizeRoutePrefix(req.getRoutePrefix());
            KbSpace existed = spaceDao.findByRoutePrefixOrNull(routePrefix);
            if (existed != null && !Objects.equals(existed.getId(), s.getId())) {
                return Result.error("URL 前缀已被占用");
            }
            s.setRoutePrefix(routePrefix);
        }
        s.setUpdatedAt(LocalDateTime.now());
        spaceDao.updateById(s);
        return Result.success(toSiteDto(s));
    }

    public Result<Void> adminDeleteSite(Long siteId) {
        KbSpace s = spaceDao.findByIdOrNull(siteId);
        if (s == null) return Result.error("站点不存在");
        if (DEFAULT_SPACE_KEY.equalsIgnoreCase(s.getSpaceKey())) {
            return Result.error("默认站点不可删除");
        }
        int rows = spaceDao.deleteById(siteId);
        return rows > 0 ? Result.success() : Result.error("删除失败");
    }

    public Result<KbNavNodeDTO> adminCreateNavNode(UpsertKbNavNodeRequest req, String siteKey) {
        Long spaceId = ensureSpace(siteKey);
        String menuCode = normalizeMenuCode(req.getMenuCode());
        KbNavNode n = new KbNavNode();
        n.setSpaceId(spaceId);
        n.setMenuCode(menuCode);
        n.setParentId(req.getParentId());
        n.setTitle(req.getTitle() == null ? "" : req.getTitle().trim());
        n.setNodeType(normalizeNodeType(req.getNodeType()));
        n.setDocId(req.getDocId());
        n.setLinkUrl(req.getLinkUrl());
        n.setSortOrder(req.getSortOrder() == null ? 0 : req.getSortOrder());
        n.setStatus("DRAFT");
        n.setVisibility(normalizeVisibility(req.getVisibility()));
        n.setRoles(rolesToString(req.getRoles()));
        n.setVersion(1);
        n.setCreatedAt(LocalDateTime.now());
        n.setUpdatedAt(LocalDateTime.now());
        navNodeDao.insert(n);
        return Result.success(toNavDto(n));
    }

    public Result<KbNavNodeDTO> adminUpdateNavNode(Long nodeId, UpsertKbNavNodeRequest req, String siteKey) {
        KbNavNode n = navNodeDao.findByIdOrNull(nodeId);
        if (n == null) return Result.error("节点不存在");
        if (!Objects.equals(n.getSpaceId(), ensureSpace(siteKey))) return Result.error("节点不属于当前站点");
        if (req.getTitle() != null) n.setTitle(req.getTitle().trim());
        if (req.getParentId() != null) n.setParentId(req.getParentId());
        if (req.getNodeType() != null) n.setNodeType(normalizeNodeType(req.getNodeType()));
        if (req.getDocId() != null) n.setDocId(req.getDocId());
        if (req.getLinkUrl() != null) n.setLinkUrl(req.getLinkUrl());
        if (req.getSortOrder() != null) n.setSortOrder(req.getSortOrder());
        if (req.getVisibility() != null) n.setVisibility(normalizeVisibility(req.getVisibility()));
        if (req.getRoles() != null) n.setRoles(rolesToString(req.getRoles()));
        n.setVersion((n.getVersion() == null ? 1 : n.getVersion()) + 1);
        navNodeDao.updateById(n);
        return Result.success(toNavDto(n));
    }

    public Result<Void> adminDeleteNavNode(Long nodeId, String siteKey) {
        KbNavNode n = navNodeDao.findByIdOrNull(nodeId);
        if (n == null) return Result.error("删除失败或节点不存在");
        if (!Objects.equals(n.getSpaceId(), ensureSpace(siteKey))) return Result.error("节点不属于当前站点");
        int rows = navNodeDao.deleteById(nodeId);
        return rows > 0 ? Result.success() : Result.error("删除失败或节点不存在");
    }

    public Result<Void> adminMoveNavNode(MoveKbNavNodeRequest req, String siteKey) {
        if (req.getNodeId() == null) return Result.error("nodeId 不能为空");
        Long targetSpaceId = ensureSpace(siteKey);
        KbNavNode n = navNodeDao.findByIdOrNull(req.getNodeId());
        if (n == null) return Result.error("节点不存在");
        if (!Objects.equals(n.getSpaceId(), targetSpaceId)) return Result.error("节点不属于当前站点");
        if (req.getNewParentId() != null) {
            n.setParentId(req.getNewParentId());
        }
        navNodeDao.updateById(n);

        // 同级顺序（可选）
        if (req.getSiblingOrder() != null && !req.getSiblingOrder().isEmpty()) {
            int i = 0;
            for (Long id : req.getSiblingOrder()) {
                KbNavNode sib = navNodeDao.findByIdOrNull(id);
                if (sib == null) continue;
                if (!Objects.equals(sib.getSpaceId(), targetSpaceId)) continue;
                sib.setSortOrder(i++);
                navNodeDao.updateById(sib);
            }
        }
        return Result.success();
    }

    public Result<Void> adminPublishNav(String menuCode, String siteKey) {
        Long spaceId = ensureSpace(siteKey);
        List<KbNavNode> draft = navNodeDao.listByMenu(spaceId, normalizeMenuCode(menuCode), "DRAFT");
        LocalDateTime now = LocalDateTime.now();
        for (KbNavNode n : draft) {
            n.setStatus("PUBLISHED");
            n.setPublishedAt(now);
            n.setVersion((n.getVersion() == null ? 1 : n.getVersion()) + 1);
            navNodeDao.updateById(n);
        }
        return Result.success();
    }

    private static String normalizeMenuCode(String s) {
        String v = s == null ? "" : s.trim().toLowerCase(Locale.ROOT);
        if (v.isEmpty()) return "sidebar";
        return v;
    }

    private static String normalizeNodeType(String s) {
        String v = s == null ? "DOC" : s.trim().toUpperCase(Locale.ROOT);
        if (!Set.of("GROUP", "DOC", "LINK").contains(v)) return "DOC";
        return v;
    }

    private static String normalizeVisibility(String s) {
        String v = s == null ? "PUBLIC" : s.trim().toUpperCase(Locale.ROOT);
        if (!Set.of("PUBLIC", "LOGIN", "ROLE").contains(v)) return "PUBLIC";
        return v;
    }

    private static String rolesToString(List<String> roles) {
        if (roles == null) return null;
        return roles.stream().filter(Objects::nonNull).map(String::trim).filter(r -> !r.isEmpty()).distinct().collect(Collectors.joining(","));
    }

    private static List<String> rolesFromString(String s) {
        if (s == null || s.isBlank()) return List.of();
        return Arrays.stream(s.split(",")).map(String::trim).filter(x -> !x.isEmpty()).distinct().toList();
    }

    private static List<KbNavNode> filterByVisibility(List<KbNavNode> nodes) {
        // 现阶段用 AppContext 是否登录做基础过滤；ROLE 进一步过滤需要角色上下文，暂按登录处理
        boolean authed = com.keqi.gress.common.context.AppContext.isAuthenticated();
        return nodes.stream().filter(n -> {
            String v = n.getVisibility();
            if (v == null || v.isBlank() || "PUBLIC".equalsIgnoreCase(v)) return true;
            if ("LOGIN".equalsIgnoreCase(v)) return authed;
            if ("ROLE".equalsIgnoreCase(v)) return authed;
            return true;
        }).toList();
    }

    private static List<KbNavNodeDTO> buildNavTree(List<KbNavNode> nodes) {
        Map<Long, KbNavNodeDTO> map = new LinkedHashMap<>();
        for (KbNavNode n : nodes) {
            map.put(n.getId(), toNavDto(n));
        }
        List<KbNavNodeDTO> roots = new ArrayList<>();
        for (KbNavNodeDTO n : map.values()) {
            if (n.getParentId() != null && map.containsKey(n.getParentId())) {
                map.get(n.getParentId()).getChildren().add(n);
            } else {
                roots.add(n);
            }
        }
        return roots;
    }

    private static KbNavNodeDTO toNavDto(KbNavNode n) {
        KbNavNodeDTO dto = new KbNavNodeDTO();
        dto.setId(n.getId());
        dto.setParentId(n.getParentId());
        dto.setMenuCode(n.getMenuCode());
        dto.setTitle(n.getTitle());
        dto.setNodeType(n.getNodeType());
        dto.setDocId(n.getDocId());
        dto.setLinkUrl(n.getLinkUrl());
        dto.setSortOrder(n.getSortOrder());
        dto.setStatus(n.getStatus());
        dto.setVisibility(n.getVisibility());
        dto.setRoles(rolesFromString(n.getRoles()));
        dto.setVersion(n.getVersion());
        dto.setPublishedAt(n.getPublishedAt());
        dto.setUpdatedAt(n.getUpdatedAt());
        return dto;
    }

    private Long ensureDefaultSpace() {
        return ensureSpace(DEFAULT_SPACE_KEY);
    }

    private Long ensureSpace(String siteKey) {
        String key = (siteKey == null || siteKey.isBlank()) ? DEFAULT_SPACE_KEY : normalizeSiteKey(siteKey);
        KbSpace s = spaceDao.findBySpaceKeyOrNull(key);
        if (s != null) {
            return s.getId();
        }
        KbSpace ns = new KbSpace();
        ns.setSpaceKey(key);
        ns.setName(DEFAULT_SPACE_KEY.equals(key) ? "默认空间" : key);
        ns.setDescription("系统默认知识库空间");
        ns.setRoutePrefix(DEFAULT_SPACE_KEY.equals(key) ? "/" : "/sites/" + key);
        ns.setEnabled(1);
        ns.setCreatedAt(LocalDateTime.now());
        ns.setUpdatedAt(LocalDateTime.now());
        return spaceDao.insert(ns);
    }

    private static KbSiteDTO toSiteDto(KbSpace s) {
        if (s == null) return null;
        KbSiteDTO dto = new KbSiteDTO();
        dto.setId(s.getId());
        dto.setSpaceKey(s.getSpaceKey());
        dto.setName(s.getName());
        dto.setDescription(s.getDescription());
        dto.setRoutePrefix(normalizeRoutePrefix(s.getRoutePrefix()));
        dto.setEnabled(s.getEnabled() == null ? 1 : s.getEnabled());
        dto.setUpdatedAt(s.getUpdatedAt());
        return dto;
    }

    private static String normalizeSiteKey(String raw) {
        String s = raw == null ? "" : raw.trim().toLowerCase(Locale.ROOT);
        s = s.replaceAll("[^a-z0-9\\-_]+", "-");
        s = s.replaceAll("-{2,}", "-");
        s = s.replaceAll("(^[-_]+|[-_]+$)", "");
        return s;
    }

    private static String normalizeRoutePrefix(String raw) {
        String s = raw == null ? "/" : raw.trim();
        if (s.isEmpty()) return "/";
        if (!s.startsWith("/")) s = "/" + s;
        s = s.replaceAll("/{2,}", "/");
        if (s.length() > 1 && s.endsWith("/")) s = s.substring(0, s.length() - 1);
        return s;
    }

    private static boolean routePrefixMatches(String path, String prefix) {
        if ("/".equals(prefix)) return true;
        return path.equals(prefix) || path.startsWith(prefix + "/");
    }

    private void appendSiteConfigHistory(
            Long spaceId,
            String action,
            String stage,
            String jsonSnapshot,
            boolean success,
            String errorMessage
    ) {
        try {
            KbSiteConfigHistory row = new KbSiteConfigHistory();
            row.setSpaceId(spaceId);
            row.setAction(action);
            row.setStage(stage);
            row.setJsonSnapshot(jsonSnapshot);
            row.setSuccess(success ? 1 : 0);
            row.setErrorMessage(errorMessage == null ? null : errorMessage.substring(0, Math.min(errorMessage.length(), 1000)));
            row.setCreatedAt(LocalDateTime.now());
            siteConfigHistoryDao.insert(row);
        } catch (Exception ex) {
            log.warn("写入站点配置历史失败: spaceId={}, action={}, success={}", spaceId, action, success, ex);
        }
    }

    private static KbDocDTO toDto(KbDoc doc) {
        KbDocDTO dto = new KbDocDTO();
        dto.setId(doc.getId());
        dto.setSpaceId(doc.getSpaceId());
        dto.setParentId(doc.getParentId());
        dto.setSlug(doc.getSlug());
        dto.setTitle(doc.getTitle());
        dto.setDocType(doc.getDocType());
        dto.setComponentCategory(doc.getComponentCategory());
        dto.setComponentName(doc.getComponentName());
        dto.setComponentPropsJson(doc.getComponentPropsJson());
        dto.setBodyMd(doc.getBodyMd());
        dto.setBodyHtml(doc.getBodyHtml());
        dto.setStatus(doc.getStatus());
        dto.setVersion(doc.getVersion());
        dto.setStaticVersion(doc.getStaticVersion());
        dto.setStaticHtmlUrl(doc.getStaticHtmlUrl());
        dto.setPublishedAt(doc.getPublishedAt());
        dto.setUpdatedAt(doc.getUpdatedAt());
        return dto;
    }

    private static String renderAndSanitizeHtml(String bodyMd) {
        String raw = bodyMd == null ? "" : bodyMd;
        String html = HTML_RENDERER.render(MD_PARSER.parse(raw));
        return ensureAnchorsOpenInNewTab(sanitizeHtml(html));
    }

    private static String ensureAnchorsOpenInNewTab(String html) {
        if (html == null || html.isEmpty()) {
            return html == null ? "" : html;
        }
        return ANCHOR_WITH_HREF_NO_TARGET
                .matcher(html)
                .replaceAll(mr -> "<a target=\"_blank\" rel=\"noopener noreferrer\"" + mr.group(1) + ">");
    }

    /** 轻量 sanitize：移除 script/style、内联事件和 javascript: URL */
    private static String sanitizeHtml(String html) {
        String s = html == null ? "" : html;
        s = SCRIPT_TAG.matcher(s).replaceAll("");
        s = STYLE_TAG.matcher(s).replaceAll("");
        s = EVENT_ATTR.matcher(s).replaceAll("");
        s = JS_URL_ATTR.matcher(s).replaceAll("");
        return s;
    }

    private static String buildStaticHtmlPage(String title, String bodyHtml) {
        String safeTitle = title == null ? "文档" : title;
        String css = """
                :root{color-scheme:light;}
                body{margin:0;background:#f8f7f4;color:#1f2937;font-family:ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Arial;}
                .kb-shell{padding:20px 14px 36px;}
                .kb-prose{max-width:860px;margin:0 auto;background:#fff;border:1px solid #e5e7eb;border-radius:12px;padding:24px 26px;line-height:1.7;word-break:break-word;overflow-wrap:anywhere;}
                .kb-prose h1,.kb-prose h2,.kb-prose h3,.kb-prose h4,.kb-prose h5,.kb-prose h6{color:#0f172a;line-height:1.35;margin:1.1em 0 .55em;}
                .kb-prose h1{font-size:2rem}.kb-prose h2{font-size:1.55rem}.kb-prose h3{font-size:1.25rem}
                .kb-prose p{margin:.7em 0}
                .kb-prose ul,.kb-prose ol{margin:.75em 0;padding-left:1.4em}
                .kb-prose li{margin:.25em 0}
                .kb-prose a{color:#2563eb;text-decoration:underline}
                .kb-prose pre{background:#f1f5f9;border-radius:8px;padding:12px 14px;overflow-x:auto;font-size:13px}
                .kb-prose code{font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,"Liberation Mono","Courier New",monospace}
                .kb-prose blockquote{border-left:3px solid #cbd5e1;margin:.5rem 0;padding-left:12px;color:#475569}
                .kb-prose hr{border:none;border-top:1px solid #e5e7eb;margin:1rem 0}
                .kb-prose p[data-kb-paragraph-spacer]:has(+ hr){margin-bottom:.35em}
                .kb-prose p[data-kb-paragraph-spacer]+hr{margin-top:0}
                .kb-prose img{max-width:100%!important;height:auto!important;border-radius:8px;display:block;margin:.6rem 0}
                .kb-prose img[data-kb-align='center']{margin-left:auto;margin-right:auto}
                .kb-prose img[data-kb-align='right']{margin-left:auto;margin-right:0}
                .kb-prose iframe{max-width:100%;display:block;margin:.75rem 0;border:0;border-radius:8px;background:#f8fafc}
                .kb-prose iframe[data-kb-align='center'],.kb-prose .kb-image-gallery[data-kb-align='center']{margin-left:auto;margin-right:auto}
                .kb-prose iframe[data-kb-align='right'],.kb-prose .kb-image-gallery[data-kb-align='right']{margin-left:auto;margin-right:0}
                .kb-prose .kb-layout-section{border-radius:10px;margin:.75rem 0;padding:14px 18px}
                .kb-prose .kb-layout-section[data-kb-variant='default']{background:transparent}
                .kb-prose .kb-layout-section[data-kb-variant='muted']{background:#f8fafc}
                .kb-prose .kb-layout-section[data-kb-variant='emphasis']{background:#eff6ff}
                .kb-prose .kb-layout-section[data-kb-variant='tip']{position:relative;margin:.75rem 0;padding:14px 18px 14px 20px;background:#f0f7ff;border-radius:10px;box-shadow:inset 4px 0 0 #1d4ed8;color:#1e3a5f}
                .kb-prose .kb-layout-section[data-kb-variant='tip']>p:first-child{margin-top:0;color:var(--kb-tip-title,#1d4ed8);font-weight:600}
                .kb-prose .kb-layout-section[data-kb-variant='tip']>p:first-child strong{color:var(--kb-tip-title,#1d4ed8);font-weight:700}
                .kb-prose .kb-layout-section[data-kb-variant='tip']>p+p{margin-top:.5rem;color:#1e3a5f;font-weight:400}
                .kb-prose .kb-image-gallery{display:flex;align-items:flex-start;flex-wrap:nowrap;gap:8px;margin:.75rem 0;overflow-x:auto;padding-bottom:4px}
                .kb-prose .kb-image-gallery__img{flex:1 1 0;min-width:120px;max-width:min(320px,45vw);height:auto;max-height:280px;object-fit:cover;border-radius:8px}
                @media (max-width:960px){
                  .kb-shell{padding:12px 8px 24px}
                  .kb-prose{padding:14px 12px 18px;border-radius:10px}
                  .kb-prose .kb-image-gallery{flex-wrap:wrap;overflow-x:hidden;gap:6px}
                  .kb-prose .kb-image-gallery__img{flex:1 1 calc(50% - 6px);min-width:min(180px,44%);max-width:100%;height:auto!important;max-height:220px}
                }
                """;
        return String.format("""
                        <!doctype html>
                        <html lang="zh-CN">
                          <head>
                            <meta charset="utf-8" />
                            <meta name="viewport" content="width=device-width, initial-scale=1" />
                            <title>%s</title>
                            <style>%s</style>
                          </head>
                          <body>
                            <div class="kb-shell">
                              <div class="kb-prose">%s</div>
                            </div>
                          </body>
                        </html>
                        """,
                escapeHtml(safeTitle),
                css,
                bodyHtml == null ? "" : bodyHtml
        );
    }

    private static String escapeHtml(String s) {
        if (s == null) return "";
        return s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;").replace("\"", "&quot;");
    }

    private static String normalizeSlug(String raw) {
        String s = raw.trim().toLowerCase(Locale.ROOT);
        s = s.replaceAll("[^a-z0-9\\u4e00-\\u9fa5\\-_/]+", "-");
        s = s.replaceAll("-{2,}", "-");
        s = s.replaceAll("^[-/]+", "");
        s = s.replaceAll("[-/]+$", "");
        return s.isEmpty() ? "doc" : s;
    }
}

