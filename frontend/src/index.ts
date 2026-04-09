import KbDocList from './views/KbDocList.vue'
import KbDocEditor from './views/KbDocEditor.vue'
import KbDocPreview from './views/KbDocPreview.vue'
import KbSiteManage from './views/KbSiteManage.vue'
import KbSiteWorkspaceManage from './views/KbSiteWorkspaceManage.vue'
import KbSiteConfigManage from './views/KbSiteConfigManage.vue'
import KbSitePreview from './views/KbSitePreview.vue'
import KbSiteVisualBuilder from './views/KbSiteVisualBuilder.vue'

export interface KbFrontendConfig {
  siteName?: string
}

const defaults: Required<KbFrontendConfig> = {
  siteName: '知识库'
}

/** 宿主菜单 plugin-ui.yml 中 component: KnowledgeBase 时仍指向列表页 */
export default (bridge: any, properties?: KbFrontendConfig) => {
  const config = { ...defaults, ...(properties || {}) }

  return {
    id: 'kb',
    name: '知识库',
    version: '1.0.0',
    description: '文档 + 知识库（可编辑、可发布）',
    author: { name: 'Gress Team' },
    icon: 'book-outline',
    permissions: ['ROUTER_REGISTER', 'ROUTER_NAVIGATE', 'COMPONENT_REGISTER', 'UI_MENU', 'DATA_READ', 'DATA_WRITE'],
    loadStrategy: 'lazy',
    components: {
      /** 兼容旧菜单配置 */
      KnowledgeBase: KbDocList,
      KbDocList,
      KbDocEditor,
      KbDocPreview,
      KbSiteManage,
      KbSiteWorkspaceManage,
      KbSiteConfigManage,
      KbSitePreview,
      KbSiteVisualBuilder
    },
    extensions: {
      routes: [
        // 独立站点访问（standalone）：/sites + 任意子路径
        {
          path: '/sites/:pathMatch(.*)*',
          name: 'kb-site-access',
          component: KbSitePreview,
          type: 'standalone',
          meta: { title: '站点访问', pluginId: 'kb' }
        },
        {
          path: '/plugins/kb/docs',
          name: 'kb-doc-list',
          component: KbDocList,
          meta: { title: '文档列表', pluginId: 'kb' }
        },
        {
          path: '/plugins/kb/docs/:siteKey',
          name: 'kb-doc-list-by-site',
          component: KbDocList,
          meta: { title: '文档列表', pluginId: 'kb' }
        },
        {
          path: '/plugins/kb/docs/edit/:docId',
          name: 'kb-doc-edit',
          component: KbDocEditor,
          meta: { title: '编辑文档', pluginId: 'kb' }
        },
        {
          path: '/plugins/kb/docs/:siteKey/edit/:docId',
          name: 'kb-doc-edit-by-site',
          component: KbDocEditor,
          meta: { title: '编辑文档', pluginId: 'kb' }
        },
        {
          path: '/plugins/kb/docs/preview/:docId',
          name: 'kb-doc-preview',
          component: KbDocPreview,
          meta: { title: '预览文档', pluginId: 'kb' }
        },
        {
          path: '/plugins/kb/docs/:siteKey/preview/:docId',
          name: 'kb-doc-preview-by-site',
          component: KbDocPreview,
          meta: { title: '预览文档', pluginId: 'kb' }
        },
        {
          path: '/plugins/kb/sites',
          name: 'kb-sites-manage',
          component: KbSiteWorkspaceManage,
          meta: { title: '站点管理', pluginId: 'kb' }
        },
        {
          path: '/plugins/kb/site-config',
          name: 'kb-site-config',
          component: KbSiteConfigManage,
          meta: { title: '站点配置构建器', pluginId: 'kb' }
        },
        {
          path: '/plugins/kb/site-preview',
          name: 'kb-site-preview',
          component: KbSitePreview,
          meta: { title: '站点预览', pluginId: 'kb' }
        },
        {
          path: '/plugins/kb/site-visual-builder',
          name: 'kb-site-visual-builder',
          component: KbSiteVisualBuilder,
          meta: { title: '站点可视化构建器', pluginId: 'kb' }
        },
        {
          path: '/plugins/kb/site-visual-builder/:siteKey',
          name: 'kb-site-visual-builder-by-site',
          component: KbSiteVisualBuilder,
          meta: { title: '站点可视化构建器', pluginId: 'kb' }
        }
      ],
      components: [],
      menus: [],
      widgets: []
    },
    lifecycle: {
      async install(context: any) {
        context.logger.info('Installing kb plugin')
        const { ui, app } = bridge
        if (ui?.components && app) {
          ;[
            'NButton',
            'NButtonGroup',
            'NCard',
            'NIcon',
            'NInput',
            'NSelect',
            'NPopover',
            'NDynamicInput',
            'NSwitch',
            'NSlider',
            'NColorPicker',
            'NCheckbox',
            'NAlert',
            'NLayout',
            'NLayoutSider',
            'NLayoutContent',
            'NTree',
            'NSpin',
            'NTag',
            'NDivider',
            'NSpace',
            'NScrollbar',
            'NModal',
            'NTabs',
            'NTabPane',
            'NTag',
            'NDataTable',
            'NTabs',
            'NTabPane',
            'NTooltip',
            'NDescriptions',
            'NDescriptionsItem'
          ].forEach((name) => {
            const component = ui.components[name]
            if (component) app.component(name, component)
          })
        }
      }
    },
    config: { default: config }
  }
}
