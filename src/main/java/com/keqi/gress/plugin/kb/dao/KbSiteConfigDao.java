package com.keqi.gress.plugin.kb.dao;

import com.keqi.gress.plugin.api.service.PluginLambdaDataSource;
import com.keqi.gress.plugin.kb.domain.entity.KbSiteConfig;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
public class KbSiteConfigDao {
    @Autowired
    private PluginLambdaDataSource dataSource;

    public KbSiteConfig findBySpaceIdOrNull(Long spaceId) {
        return dataSource.lambdaQuery(KbSiteConfig.class)
                .eq(KbSiteConfig::getSpaceId, spaceId)
                .one();
    }

    public int insert(KbSiteConfig cfg) {
        cfg.setUpdatedAt(LocalDateTime.now());
        return dataSource.insert(cfg);
    }

    public int updateById(KbSiteConfig cfg) {
        cfg.setUpdatedAt(LocalDateTime.now());
        // 使用 lambda 条件更新，避免 updateById 对主键元数据解析的强依赖（与 KbDocDao/KbSpaceDao 一致）
        if (cfg.getId() != null) {
            return dataSource.lambdaUpdate(KbSiteConfig.class)
                    .set(KbSiteConfig::getDraftJson, cfg.getDraftJson())
                    .set(KbSiteConfig::getPublishedJson, cfg.getPublishedJson())
                    .set(KbSiteConfig::getVersion, cfg.getVersion())
                    .set(KbSiteConfig::getPublishedAt, cfg.getPublishedAt())
                    .set(KbSiteConfig::getUpdatedAt, cfg.getUpdatedAt())
                    .eq(KbSiteConfig::getId, cfg.getId())
                    .update();
        }
        if (cfg.getSpaceId() != null) {
            return dataSource.lambdaUpdate(KbSiteConfig.class)
                    .set(KbSiteConfig::getDraftJson, cfg.getDraftJson())
                    .set(KbSiteConfig::getPublishedJson, cfg.getPublishedJson())
                    .set(KbSiteConfig::getVersion, cfg.getVersion())
                    .set(KbSiteConfig::getPublishedAt, cfg.getPublishedAt())
                    .set(KbSiteConfig::getUpdatedAt, cfg.getUpdatedAt())
                    .eq(KbSiteConfig::getSpaceId, cfg.getSpaceId())
                    .update();
        }
        return 0;
    }
}

