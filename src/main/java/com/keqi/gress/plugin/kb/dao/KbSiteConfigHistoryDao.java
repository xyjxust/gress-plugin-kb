package com.keqi.gress.plugin.kb.dao;

import com.keqi.gress.plugin.api.service.PluginLambdaDataSource;
import com.keqi.gress.plugin.kb.domain.entity.KbSiteConfigHistory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class KbSiteConfigHistoryDao {
    @Autowired
    private PluginLambdaDataSource dataSource;

    public int insert(KbSiteConfigHistory row) {
        return dataSource.insert(row);
    }

    public KbSiteConfigHistory findByIdOrNull(Long id) {
        return dataSource.lambdaQuery(KbSiteConfigHistory.class)
                .eq(KbSiteConfigHistory::getId, id)
                .one();
    }

    public List<KbSiteConfigHistory> listBySpaceIdDesc(Long spaceId, int limit) {
        List<KbSiteConfigHistory> rows = dataSource.lambdaQuery(KbSiteConfigHistory.class)
                .select(
                        KbSiteConfigHistory::getId,
                        KbSiteConfigHistory::getSpaceId,
                        KbSiteConfigHistory::getAction,
                        KbSiteConfigHistory::getStage,
                        KbSiteConfigHistory::getSuccess,
                        KbSiteConfigHistory::getErrorMessage,
                        KbSiteConfigHistory::getCreatedAt
                )
                .eq(KbSiteConfigHistory::getSpaceId, spaceId)
                .orderByDesc(KbSiteConfigHistory::getId)
                .list();
        if (rows == null || rows.size() <= limit) return rows;
        return rows.subList(0, limit);
    }
}

