package com.keqi.gress.plugin.kb.dao;

import com.keqi.gress.plugin.api.service.PluginLambdaDataSource;
import com.keqi.gress.plugin.kb.domain.entity.KbSpace;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class KbSpaceDao {
    @Autowired
    private PluginLambdaDataSource dataSource;

    public KbSpace findBySpaceKeyOrNull(String spaceKey) {
        return dataSource.lambdaQuery(KbSpace.class)
                .eq(KbSpace::getSpaceKey, spaceKey)
                .one();
    }

    public KbSpace findByIdOrNull(Long id) {
        return dataSource.lambdaQuery(KbSpace.class)
                .eq(KbSpace::getId, id)
                .one();
    }

    public KbSpace findByRoutePrefixOrNull(String routePrefix) {
        return dataSource.lambdaQuery(KbSpace.class)
                .eq(KbSpace::getRoutePrefix, routePrefix)
                .one();
    }

    public List<KbSpace> listAll() {
        return dataSource.lambdaQuery(KbSpace.class)
                .orderByAsc(KbSpace::getId)
                .list();
    }

    public Long insert(KbSpace space) {
        dataSource.insert(space);
        return space.getId();
    }

    public int updateById(KbSpace space) {
        return dataSource.updateById(space);
    }

    public int deleteById(Long id) {
        return dataSource.lambdaUpdate(KbSpace.class)
                .eq(KbSpace::getId, id)
                .delete();
    }
}

