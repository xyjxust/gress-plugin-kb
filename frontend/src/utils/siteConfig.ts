import type {
  BuilderTreeNode,
  DocsLayoutConfig,
  InspectorSectionSchema,
  LandingLayoutConfig,
  LayoutManifest,
  PersistedSiteConfig,
  SiteConfigValidationIssue,
  SiteLayoutConfig,
  SitePage,
  SiteType,
  SlotComponentSchema,
  SlotDefinition
} from '../types/siteConfig'

function createBasePages(): SitePage[] {
  return [
    {
      id: 'getting-started',
      routeKey: '/docs/getting-started',
      title: '快速开始',
      description: '从站点结构、主题与页面内容三层建立一个可扩展的知识站点。',
      body: '## 快速开始\n\n先定义站点模型，再配置导航、页面与插槽。',
      toc: [
        { id: 'toc-1', text: '快速开始', level: 'h2' },
        { id: 'toc-2', text: '站点模型', level: 'h3' }
      ],
      updatedAt: '2026-04-03',
      readTime: 6,
      author: 'Gress Team'
    },
    {
      id: 'theme-system',
      routeKey: '/docs/theme-system',
      title: '主题系统',
      description: '通过主题令牌统一控制颜色、字号、边框和布局节奏。',
      body: '## 主题系统\n\n主题令牌应只表达视觉，不承载结构。',
      updatedAt: '2026-04-03',
      readTime: 4,
      author: 'Gress Team'
    }
  ]
}

export const layoutManifests: LayoutManifest[] = [
  {
    id: 'docs',
    label: '文档站',
    description: '包含 navbar、sidebar、content、footer 的知识文档布局。',
    regionTypes: ['navbar', 'sidebar', 'content', 'footer'],
    slotKeys: ['sidebar-top', 'content-top']
  },
  {
    id: 'blog',
    label: '博客',
    description: '偏文章阅读的内容布局，突出作者、摘要与封面。',
    regionTypes: ['navbar', 'content', 'footer'],
    slotKeys: ['content-top']
  },
  {
    id: 'landing',
    label: '落地页',
    description: '偏营销展示的 landing 布局，突出 hero 和 features。',
    regionTypes: ['navbar', 'hero', 'features', 'footer'],
    slotKeys: ['content-top']
  }
]

export const slotDefinitions: SlotDefinition[] = [
  {
    slotKey: 'sidebar-top',
    label: '侧栏顶部',
    layoutIds: ['docs'],
    multiple: true,
    allowedComponents: ['Announcement', 'AdBanner']
  },
  {
    slotKey: 'content-top',
    label: '内容顶部',
    layoutIds: ['docs', 'blog', 'landing'],
    multiple: true,
    allowedComponents: ['Announcement', 'AdBanner', 'HeroBadge']
  }
]

export const slotComponentSchemas: SlotComponentSchema[] = [
  {
    componentKey: 'Announcement',
    label: '公告条',
    defaultProps: {
      badge: 'NEW',
      title: '主题系统已上线',
      text: '现在可以在可视化构建器中一键切换主题'
    },
    propsSchema: [
      { key: 'badge', label: '徽标', type: 'text' },
      { key: 'title', label: '标题', type: 'text' },
      { key: 'text', label: '正文', type: 'textarea' },
      { key: 'bg', label: '背景色', type: 'color' },
      { key: 'color', label: '文字色', type: 'color' }
    ]
  },
  {
    componentKey: 'AdBanner',
    label: '广告条',
    defaultProps: {
      icon: '🎉',
      text: 'Gress v2.0 正式发布',
      subtext: '查看新特性'
    },
    propsSchema: [
      { key: 'icon', label: '图标', type: 'text' },
      { key: 'text', label: '主文案', type: 'text' },
      { key: 'subtext', label: '辅助文案', type: 'text' },
      { key: 'bg', label: '背景色', type: 'color' },
      { key: 'color', label: '文字色', type: 'color' }
    ]
  }
]

export const builderTreeBlueprint: BuilderTreeNode[] = [
  { id: 'site-meta', paneId: 'site', label: '站点信息', targetPath: 'meta' },
  { id: 'site-theme', paneId: 'theme', label: '主题', targetPath: 'theme' },
  { id: 'site-layout', paneId: 'layout', label: '布局', targetPath: 'layout' },
  {
    id: 'site-navbar',
    paneId: 'navbar',
    label: '导航栏',
    targetPath: 'navigation.navbar',
    children: [
      { id: 'site-navbar-brand', paneId: 'navbar', label: '品牌', targetPath: 'navigation.navbar.brand' },
      { id: 'site-navbar-items', paneId: 'navbar', label: '菜单项', targetPath: 'navigation.navbar.items' }
    ]
  },
  {
    id: 'site-sidebar',
    paneId: 'sidebar',
    label: '侧栏',
    targetPath: 'navigation.sidebar',
    children: [
      { id: 'site-sidebar-sections', paneId: 'sidebar', label: '分组映射', targetPath: 'navigation.sidebar.sections' }
    ]
  },
  { id: 'site-pages', paneId: 'pages', label: '页面', targetPath: 'content.pages' },
  { id: 'site-slots', paneId: 'slots', label: '插槽', targetPath: 'slots' },
  { id: 'site-bindings', paneId: 'bindings', label: '联动规则', targetPath: 'bindings' }
]

export function createInspectorSchemas(config: PersistedSiteConfig) {
  const siteTypeOptions = [
    { label: '文档站', value: 'docs' },
    { label: '博客', value: 'blog' },
    { label: '落地页', value: 'landing' }
  ]
  const themeModeOptions = [
    { label: '浅色', value: 'light' },
    { label: '深色', value: 'dark' },
    { label: '跟随系统', value: 'system' }
  ]
  const layoutOptions = layoutManifests.map((item) => ({ label: item.label, value: item.id }))
  const navbarStyleOptions = [
    { label: '实底', value: 'solid' },
    { label: '模糊', value: 'blur' },
    { label: '透明', value: 'transparent' }
  ]

  const schemas: Record<string, InspectorSectionSchema[]> = {
    site: [
      {
        id: 'site-meta',
        title: '站点信息',
        fields: [
          { key: 'siteName', label: '站点名称', type: 'text', path: 'meta.siteName' },
          { key: 'siteType', label: '站点类型', type: 'select', path: 'meta.siteType', options: siteTypeOptions },
          { key: 'description', label: '描述', type: 'textarea', path: 'meta.description' },
          { key: 'defaultRoute', label: '默认路由', type: 'text', path: 'meta.defaultRoute' }
        ]
      }
    ],
    theme: [
      {
        id: 'theme-base',
        title: '主题基础',
        fields: [
          { key: 'themeId', label: '主题 ID', type: 'text', path: 'theme.themeId' },
          { key: 'mode', label: '主题模式', type: 'select', path: 'theme.mode', options: themeModeOptions }
        ]
      },
      {
        id: 'theme-tokens',
        title: '主题令牌',
        fields: [
          { key: 'primary', label: '主色', type: 'color', path: 'theme.tokens.primary' },
          { key: 'bg', label: '背景色', type: 'color', path: 'theme.tokens.bg' },
          { key: 'border', label: '边框色', type: 'color', path: 'theme.tokens.border' },
          { key: 'text', label: '文字色', type: 'color', path: 'theme.tokens.text' }
        ]
      }
    ],
    layout: [
      {
        id: 'layout-base',
        title: '布局配置',
        fields: [
          { key: 'layoutId', label: '布局类型', type: 'select', path: 'layout.layoutId', options: layoutOptions }
        ]
      },
      {
        id: 'layout-docs',
        title: '文档布局',
        fields: [
          { key: 'navbarStyle', label: '导航栏样式', type: 'select', path: 'layout.navbar.style', options: navbarStyleOptions },
          { key: 'sidebarWidth', label: '侧栏宽度', type: 'slider', path: 'layout.sidebar.width', min: 220, max: 360, step: 1 },
          { key: 'showToc', label: '显示目录', type: 'switch', path: 'layout.content.showToc' },
          { key: 'showSearch', label: '显示搜索', type: 'switch', path: 'layout.navbar.showSearch' }
        ]
      }
    ]
  }

  if (config.layout.layoutId === 'blog') {
    schemas.layout = [
      schemas.layout[0],
      {
        id: 'layout-blog',
        title: '博客布局',
        fields: [
          { key: 'navbarStyle', label: '导航栏样式', type: 'select', path: 'layout.navbar.style', options: navbarStyleOptions.filter((item) => item.value !== 'blur') },
          { key: 'maxWidth', label: '正文宽度', type: 'text', path: 'layout.content.maxWidth' },
          { key: 'showHero', label: '显示封面', type: 'switch', path: 'layout.content.showHero' },
          { key: 'showAuthor', label: '显示作者', type: 'switch', path: 'layout.content.showAuthor' }
        ]
      }
    ]
  }

  if (config.layout.layoutId === 'landing') {
    schemas.layout = [
      schemas.layout[0],
      {
        id: 'layout-landing',
        title: '落地页布局',
        fields: [
          { key: 'badgeText', label: 'Hero 徽标', type: 'text', path: 'layout.hero.badgeText' },
          { key: 'title', label: 'Hero 标题', type: 'textarea', path: 'layout.hero.title' },
          { key: 'subtitle', label: 'Hero 副标题', type: 'textarea', path: 'layout.hero.subtitle' }
        ]
      }
    ]
  }

  return schemas
}

export function getValueByPath(target: Record<string, any>, path: string) {
  return path.split('.').reduce<any>((acc, key) => (acc == null ? undefined : acc[key]), target)
}

export function setValueByPath(target: Record<string, any>, path: string, value: any) {
  const keys = path.split('.')
  const lastKey = keys.pop()
  if (!lastKey) return
  const parent = keys.reduce<any>((acc, key) => {
    if (acc[key] == null || typeof acc[key] !== 'object') acc[key] = {}
    return acc[key]
  }, target)
  parent[lastKey] = value
}

export function validateSiteConfig(config: PersistedSiteConfig): SiteConfigValidationIssue[] {
  const issues: SiteConfigValidationIssue[] = []
  const pageIds = new Set(config.content.pages.map((page) => page.id))
  const routeKeys = new Set(config.content.pages.map((page) => page.routeKey))
  const navbarIds = new Set(config.navigation.navbar.items.map((item) => item.id))

  config.navigation.navbar.items.forEach((item) => {
    if (item.kind === 'link' && item.routeKey && !routeKeys.has(item.routeKey)) {
      issues.push({
        id: `navbar-${item.id}-route`,
        level: 'error',
        message: `导航项“${item.label}”绑定的 routeKey 不存在`,
        path: `navigation.navbar.items.${item.id}.routeKey`
      })
    }
    if (item.kind === 'group') {
      item.children.forEach((child) => {
        if (child.routeKey && !routeKeys.has(child.routeKey)) {
          issues.push({
            id: `navbar-${child.id}-route`,
            level: 'error',
            message: `导航子项“${child.label}”绑定的 routeKey 不存在`,
            path: `navigation.navbar.items.${item.id}.children.${child.id}.routeKey`
          })
        }
      })
    }
  })

  config.navigation.sidebar?.sections.forEach((section) => {
    if (section.navbarItemId && !navbarIds.has(section.navbarItemId)) {
      issues.push({
        id: `sidebar-section-${section.id}-navbar`,
        level: 'error',
        message: `侧栏分组“${section.groupLabel || section.id}”绑定的顶部导航不存在`,
        path: `navigation.sidebar.sections.${section.id}.navbarItemId`
      })
    }
    section.items.forEach((item) => {
      if (item.kind === 'item' && item.pageId && !pageIds.has(item.pageId)) {
        issues.push({
          id: `sidebar-item-${item.id}-page`,
          level: 'error',
          message: `侧栏项“${item.label}”绑定的 pageId 不存在`,
          path: `navigation.sidebar.sections.${section.id}.items.${item.id}.pageId`
        })
      }
      if (item.kind === 'group') {
        item.children.forEach((child) => {
          if (child.pageId && !pageIds.has(child.pageId)) {
            issues.push({
              id: `sidebar-child-${child.id}-page`,
              level: 'error',
              message: `侧栏子项“${child.label}”绑定的 pageId 不存在`,
              path: `navigation.sidebar.sections.${section.id}.items.${item.id}.children.${child.id}.pageId`
            })
          }
        })
      }
    })
  })

  const validSlotKeys = new Set(
    slotDefinitions
      .filter((item) => item.layoutIds.includes(config.layout.layoutId))
      .map((item) => item.slotKey)
  )
  const validComponentKeys = new Set(slotComponentSchemas.map((item) => item.componentKey))

  config.slots.forEach((slot) => {
    if (!validSlotKeys.has(slot.slotKey)) {
      issues.push({
        id: `slot-${slot.id}-slotKey`,
        level: 'error',
        message: `插槽实例“${slot.id}”使用了当前布局不支持的 slotKey`,
        path: `slots.${slot.id}.slotKey`
      })
    }
    if (!validComponentKeys.has(slot.componentKey)) {
      issues.push({
        id: `slot-${slot.id}-component`,
        level: 'error',
        message: `插槽实例“${slot.id}”引用了未注册的组件`,
        path: `slots.${slot.id}.componentKey`
      })
    }
  })

  if (config.meta.defaultRoute && !routeKeys.has(config.meta.defaultRoute)) {
    issues.push({
      id: 'meta-default-route',
      level: 'warning',
      message: '默认路由未在页面列表中找到，将回退到第一篇页面',
      path: 'meta.defaultRoute'
    })
  }

  return issues
}

export function createDefaultLayoutConfig(siteType: SiteType = 'docs'): SiteLayoutConfig {
  if (siteType === 'blog') {
    return {
      layoutId: 'blog',
      regions: [
        { regionId: 'navbar', regionType: 'navbar', label: '顶部导航', visible: true, order: 1 },
        { regionId: 'content', regionType: 'content', label: '内容区', visible: true, order: 2 },
        { regionId: 'footer', regionType: 'footer', label: '页脚', visible: true, order: 3 }
      ],
      navbar: {
        style: 'solid',
        sticky: true
      },
      content: {
        maxWidth: '720px',
        showHero: true,
        showAuthor: true
      },
      footer: {
        visible: true
      }
    }
  }

  if (siteType === 'landing') {
    return {
      layoutId: 'landing',
      regions: [
        { regionId: 'navbar', regionType: 'navbar', label: '顶部导航', visible: true, order: 1 },
        { regionId: 'hero', regionType: 'hero', label: 'Hero 区', visible: true, order: 2 },
        { regionId: 'features', regionType: 'features', label: '特性区', visible: true, order: 3 },
        { regionId: 'footer', regionType: 'footer', label: '页脚', visible: true, order: 4 }
      ],
      navbar: {
        style: 'solid',
        sticky: true
      },
      hero: {
        badgeText: 'v2.0 正式发布',
        title: '构建真正可扩展的站点系统',
        subtitle: '以统一 siteConfig 为真源，同时兼容 docs、blog、landing 多布局。',
        actions: [
          { id: 'hero-start', label: '立即开始', type: 'primary', href: '/docs/getting-started' },
          { id: 'hero-demo', label: '查看演示', type: 'secondary', href: '/docs/theme-system' }
        ]
      },
      features: {
        items: [
          { id: 'feature-1', icon: '🧩', name: '插槽协议', desc: '组件通过 slot 模型进行扩展。', color: '#eff6ff' },
          { id: 'feature-2', icon: '🎨', name: '主题令牌', desc: '换主题不需要改结构。', color: '#f5f3ff' }
        ]
      },
      footer: {
        visible: true
      }
    }
  }

  const docsLayout: DocsLayoutConfig = {
    layoutId: 'docs',
    regions: [
      { regionId: 'navbar', regionType: 'navbar', label: '顶部导航', visible: true, order: 1 },
      { regionId: 'sidebar', regionType: 'sidebar', label: '侧栏', visible: true, order: 2 },
      { regionId: 'content', regionType: 'content', label: '内容区', visible: true, order: 3 },
      { regionId: 'footer', regionType: 'footer', label: '页脚', visible: true, order: 4 }
    ],
    navbar: {
      style: 'solid',
      showSearch: true,
      sticky: true
    },
    sidebar: {
      width: 260,
      collapsible: true,
      defaultCollapsed: false
    },
    content: {
      maxWidth: '760px',
      showToc: true
    },
    footer: {
      visible: true
    }
  }

  return docsLayout
}

export function createDefaultSiteConfig(siteType: SiteType = 'docs'): PersistedSiteConfig {
  return {
    meta: {
      siteName: 'Gress Wiki',
      siteType,
      description: '围绕统一站点配置模型构建的知识站点。',
      defaultRoute: '/docs/getting-started',
      locales: ['zh-CN']
    },
    theme: {
      themeId: 'docs-light',
      mode: 'light',
      tokens: {
        primary: '#2563eb',
        bg: '#ffffff',
        surface: '#ffffff',
        border: '#e2e8f0',
        text: '#0f172a',
        textMuted: '#475569',
        sidebarWidth: 260,
        navbarHeight: 60
      }
    },
    layout: createDefaultLayoutConfig(siteType),
    navigation: {
      navbar: {
        brand: {
          name: 'Gress Wiki',
          logoText: 'G'
        },
        items: [
          { id: 'nav-docs', kind: 'link', label: '文档', routeKey: '/docs/getting-started', type: 'link' },
          { id: 'nav-theme', kind: 'link', label: '主题系统', routeKey: '/docs/theme-system', type: 'link' },
          {
            id: 'nav-guide',
            kind: 'group',
            label: '开始',
            children: [
              { id: 'nav-guide-start', kind: 'link', label: '快速开始', routeKey: '/docs/getting-started', type: 'link' },
              { id: 'nav-guide-theme', kind: 'link', label: '主题系统', routeKey: '/docs/theme-system', type: 'link' }
            ]
          }
        ]
      },
      sidebar: {
        mode: 'tree',
        sections: [
          {
            id: 'section-guide',
            groupLabel: '指南',
            navbarItemId: 'nav-docs',
            items: [
              { id: 'sidebar-getting-started', kind: 'item', label: '快速开始', icon: '🚀', badge: 'NEW', pageId: 'getting-started' },
              {
                id: 'sidebar-theme',
                kind: 'group',
                label: '主题系统',
                icon: '🎨',
                children: [
                  { id: 'sidebar-theme-intro', kind: 'item', label: '概述', pageId: 'theme-system' }
                ]
              }
            ]
          }
        ]
      }
    },
    content: {
      pages: createBasePages()
    },
    slots: [
      {
        id: 'slot-content-top-announcement',
        slotKey: 'content-top',
        componentKey: 'Announcement',
        visible: true,
        order: 1,
        props: {
          badge: 'NEW',
          title: '站点模型已升级',
          text: 'Builder 将围绕 PersistedSiteConfig 作为唯一真源继续演进。',
          bg: '#eff6ff',
          color: '#1d4ed8'
        }
      }
    ],
    bindings: [
      {
        id: 'binding-navbar-active-page',
        target: {
          scope: 'navigation',
          path: 'navbar.items[*].routeKey'
        },
        source: {
          type: 'page',
          path: 'content.pages[*].routeKey'
        }
      }
    ]
  }
}
