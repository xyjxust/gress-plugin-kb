package com.keqi.gress.plugin.kb.dao;

import com.keqi.gress.plugin.api.service.PluginLambdaDataSource;
import com.keqi.gress.plugin.kb.domain.entity.KbDoc;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class KbDocDao {
    @Autowired
    private PluginLambdaDataSource dataSource;

    public List<KbDoc> listBySpaceId(Long spaceId) {
        return dataSource.lambdaQuery(KbDoc.class)
                .eq(KbDoc::getSpaceId, spaceId)
                .orderByAsc(KbDoc::getId)
                .list();
    }

    /**
     * 仅用于目录树：不查 body_md / body_html 等大字段，避免全量文档时内存与 IO 暴涨。
     */
    public List<KbDoc> listTreeMetaBySpaceId(Long spaceId) {
        return dataSource.lambdaQuery(KbDoc.class)
                .select(
                        KbDoc::getId,
                        KbDoc::getSpaceId,
                        KbDoc::getParentId,
                        KbDoc::getSlug,
                        KbDoc::getTitle,
                        KbDoc::getStatus,
                        KbDoc::getDocType)
                .eq(KbDoc::getSpaceId, spaceId)
                .orderByAsc(KbDoc::getId)
                .list();
    }

    public KbDoc findByIdOrNull(Long docId) {
        return dataSource.lambdaQuery(KbDoc.class)
                .eq(KbDoc::getId, docId)
                .one();
    }

    public int insert(KbDoc doc) {
        doc.setUpdatedAt(LocalDateTime.now());
        return dataSource.insert(doc);
    }

    /**
     * 插入后兜底查回主键：某些数据源实现不会回填 AUTO ID。
     */
    public KbDoc findLatestBySpaceIdAndSlug(Long spaceId, String slug) {
        if (spaceId == null || slug == null || slug.isBlank()) return null;
        return dataSource.lambdaQuery(KbDoc.class)
                .eq(KbDoc::getSpaceId, spaceId)
                .eq(KbDoc::getSlug, slug)
                .orderByDesc(KbDoc::getId)
                .one();
    }

    public int updateById(KbDoc doc) {
        doc.setUpdatedAt(LocalDateTime.now());
        return dataSource.updateById(doc);
    }

    public int deleteById(Long docId) {
        return dataSource.lambdaUpdate(KbDoc.class)
                .eq(KbDoc::getId, docId)
                .delete();
    }
}

