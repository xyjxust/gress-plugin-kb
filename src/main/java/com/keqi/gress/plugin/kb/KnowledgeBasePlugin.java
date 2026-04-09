package com.keqi.gress.plugin.kb;

import cn.hutool.log.Log;
import cn.hutool.log.LogFactory;
import com.keqi.gress.common.plugin.ApplicationPlugin;
import com.keqi.gress.common.plugin.annotion.PluginSpec;
import com.keqi.gress.plugin.kb.config.KbConfig;
import org.pf4j.Extension;
import org.pf4j.Plugin;

@Extension
@PluginSpec(
        id = "${plugin.id}",
        name = "知识库",
        description = "${plugin.description}",
        version = "${plugin.version}",
        author = "${plugin.provider}",
        tags = {"kb", "docs", "wiki"},
        icon = "icons/kb.svg",
        // 加版本号避免浏览器/反代强缓存旧 UMD
        jsPath = "js/kb-frontend.umd.js",
        inputClass = KbConfig.class
)
public class KnowledgeBasePlugin extends Plugin implements ApplicationPlugin {
    private final Log log = LogFactory.get(KnowledgeBasePlugin.class);

    @Override
    public void start() {
        log.info("Knowledge Base 插件启动");
    }

    @Override
    public void stop() {
        log.info("Knowledge Base 插件停止");
    }
}

