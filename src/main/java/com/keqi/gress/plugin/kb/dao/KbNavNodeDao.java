package com.keqi.gress.plugin.kb.dao;

import com.keqi.gress.plugin.api.service.PluginLambdaDataSource;
import com.keqi.gress.plugin.kb.domain.entity.KbNavNode;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class KbNavNodeDao {
    @Autowired
    private PluginLambdaDataSource dataSource;

    public List<KbNavNode> listByMenu(Long spaceId, String menuCode, String status) {
        var q = dataSource.lambdaQuery(KbNavNode.class)
                .eq(KbNavNode::getSpaceId, spaceId)
                .eq(KbNavNode::getMenuCode, menuCode);
        if (status != null && !status.isBlank()) {
            q = q.eq(KbNavNode::getStatus, status);
        }
        return q.orderByAsc(KbNavNode::getSortOrder).orderByAsc(KbNavNode::getId).list();
    }

    public KbNavNode findByIdOrNull(Long id) {
        return dataSource.lambdaQuery(KbNavNode.class).eq(KbNavNode::getId, id).one();
    }

    public int insert(KbNavNode node) {
        node.setUpdatedAt(LocalDateTime.now());
        return dataSource.insert(node);
    }

    public int updateById(KbNavNode node) {
        node.setUpdatedAt(LocalDateTime.now());
        return dataSource.updateById(node);
    }

    public int deleteById(Long id) {
        return dataSource.lambdaUpdate(KbNavNode.class).eq(KbNavNode::getId, id).delete();
    }
}

