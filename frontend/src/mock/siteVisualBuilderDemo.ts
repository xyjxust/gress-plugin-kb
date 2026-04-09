import type { SiteRendererConfig } from '../types/siteRenderer'
import type { BuilderNavMeta, BuilderPageMeta, SiteVisualBuilderSnapshot } from '../types/siteVisualBuilder'

export const SLOT_SCHEMAS: Record<string, Record<string, { type: 'string' | 'color' | 'boolean'; label: string; placeholder?: string }>> = {
  AdBanner: {
    icon: { type: 'string', label: '图标', placeholder: '🎉' },
    text: { type: 'string', label: '主标题' },
    subtext: { type: 'string', label: '副标题' },
    bg: { type: 'color', label: '背景色' },
    color: { type: 'color', label: '文字色' },
    closable: { type: 'boolean', label: '可关闭' },
  },
  Announcement: {
    badge: { type: 'string', label: '徽标', placeholder: 'NEW' },
    title: { type: 'string', label: '标题' },
    text: { type: 'string', label: '内容' },
    linkText: { type: 'string', label: '链接文案' },
    bg: { type: 'color', label: '背景色' },
    color: { type: 'color', label: '文字色' },
    closable: { type: 'boolean', label: '可关闭' },
  },
}

export function createSiteVisualBuilderDemo(): SiteVisualBuilderSnapshot {
  const siteConfig: SiteRendererConfig = {
    themeId: 'docs',
    theme: {
      primary: '#2563eb',
      darkMode: false,
      fontSans: 'Outfit',
    },
    navbar: {
      brand: 'Gress Wiki',
      style: 'solid',
      showSearch: true,
      links: [
        { id: 'docs', label: '开始', type: 'link', href: '/docs/getting-started', icon: '' },
        { id: 'guide', label: '教程', type: 'link', href: '/docs/plugin-system', icon: '' },
        { id: 'manual', label: '手册', type: 'link', href: '/docs/theme-system', icon: '' },
        { id: 'dev', label: '开发', type: 'link', href: '/blog/plugin-arch', icon: '' },
        { id: 'api', label: 'API', type: 'link', href: '/api/rest', icon: '🔌' },
        { id: 'start', label: '开始使用', type: 'cta', href: '/docs/getting-started', icon: '🚀' },
      ],
    },
    sidebar: {
      width: 260,
      collapsible: true,
      tree: [
        {
          id: 'guide',
          groupLabel: '快速入门',
          children: [
            { id: 'getting-started', label: '快速开始', icon: '🚀', badge: 'NEW', pageId: 'getting-started' },
            { id: 'installation', label: '安装配置', icon: '⚙️', pageId: 'installation' },
          ],
        },
        {
          id: 'core',
          groupLabel: '核心概念',
          children: [
            {
              id: 'plugin-system',
              label: '插件系统',
              icon: '🧩',
              expanded: true,
              pageId: 'plugin-system',
              children: [
                { id: 'lifecycle', label: '生命周期', pageId: 'lifecycle' },
                { id: 'classloader', label: 'ClassLoader 隔离', pageId: 'classloader' },
                { id: 'export', label: '@PluginExport', badge: 'Beta', pageId: 'export' },
              ],
            },
            { id: 'theme-system', label: '主题系统', icon: '🎨', pageId: 'theme-system' },
          ],
        },
        {
          id: 'api',
          groupLabel: 'API 参考',
          children: [
            { id: 'rest-api', label: 'REST API', icon: '🔌', pageId: 'rest-api' },
            { id: 'sdk', label: 'Java SDK', icon: '☕', pageId: 'sdk' },
          ],
        },
      ],
    },
    content: {
      maxWidth: '760px',
      showToc: true,
    },
    footer: {
      visible: true,
      copyright: '© 2025 Gress Platform · Built with ❤️',
      links: [{ label: 'GitHub', href: '#' }, { label: '文档', href: '#' }, { label: '隐私政策', href: '#' }],
    },
    landingConfig: {
      badgeText: 'v2.0 正式发布 🎉',
      heroTitle: 'Gress 企业级插件平台',
      heroSubtitle: '用可视化方式构建、发布和管理企业插件生态，开箱即用的主题系统让每个站点都与众不同。',
      actions: [
        { id: 'start', label: '🚀 快速开始', type: 'primary' },
        { id: 'github', label: '⭐ GitHub', type: 'secondary' },
      ],
      features: [
        { icon: '🧩', name: '插件市场', desc: '丰富的企业级插件生态，开箱即用，一键安装。', color: '#f0fdf4' },
        { icon: '🎨', name: '可视化构建', desc: '无需代码，拖拽配置导航、菜单和全局组件。', color: '#eff6ff' },
        { icon: '🤖', name: 'AI 代码生成', desc: '描述需求，AI 自动生成符合规范的插件代码。', color: '#fdf4ff' },
        { icon: '⚡', name: '热更新部署', desc: '插件无需重启服务器，秒级热加载到生产环境。', color: '#fff7ed' },
      ],
    },
    slots: {
      'sidebar-top': {
        instanceId: 'slot-1',
        componentKey: 'AdBanner',
        props: {
          icon: '🎉',
          text: 'Gress v2.0 正式发布',
          subtext: '查看新特性',
          bg: '#fff7ed',
          color: '#92400e',
          closable: true,
        },
      },
      'content-top': {
        instanceId: 'slot-2',
        componentKey: 'Announcement',
        props: {
          badge: 'NEW',
          title: '主题系统已上线',
          text: '现在可以在可视化构建器中一键切换主题',
          linkText: '了解更多',
          bg: '#eff6ff',
          color: '#1d4ed8',
          closable: true,
        },
      },
    },
    pages: {
      'getting-started': {
        id: 'getting-started',
        title: '快速开始',
        description: '五分钟内完成 Gress 的安装和基础配置，开始构建你的第一个插件站点。',
        updatedAt: '2025-03-28',
        readTime: 5,
        author: 'Gress Team',
        category: '入门教程',
        heroEmoji: '🚀',
        toc: [
          { id: 'install', text: '安装', level: 'h2' },
          { id: 'config', text: '基础配置', level: 'h2' },
          { id: 'theme', text: '选择主题', level: 'h3' },
          { id: 'deploy', text: '部署', level: 'h2' },
        ],
        html: '<h2>安装</h2><p>通过 npm 安装 Gress CLI，然后初始化项目。</p><h2>基础配置</h2><p>项目根目录下的 gress.config.ts 是主配置文件。</p><h3>选择主题</h3><p>Gress 内置三套主题：docs、blog 和 landing。</p>',
      },
      installation: {
        id: 'installation',
        title: '安装配置',
        description: '安装 Node.js、Java 运行时并完成首个环境配置。',
        updatedAt: '2025-03-26',
        readTime: 4,
        category: '入门教程',
        toc: [
          { id: 'runtime', text: '运行环境', level: 'h2' },
          { id: 'config', text: '项目初始化', level: 'h2' },
        ],
        html: '<h2>运行环境</h2><p>Node.js >= 18，Java >= 21。</p><h2>项目初始化</h2><p>执行 gress init my-wiki。</p>',
      },
      'plugin-system': {
        id: 'plugin-system',
        title: '插件系统',
        description: '深入了解 Gress 的插件架构，学习如何开发、发布和管理插件。',
        updatedAt: '2025-03-25',
        readTime: 12,
        author: 'Core Team',
        category: '架构设计',
        heroEmoji: '🧩',
        toc: [
          { id: 'arch', text: '插件架构', level: 'h2' },
          { id: 'lifecycle', text: '生命周期', level: 'h2' },
          { id: 'api', text: 'Plugin API', level: 'h3' },
        ],
        html: '<h2>插件架构</h2><p>Gress 的插件系统基于 ClassLoader 隔离机制。</p><h2>生命周期</h2><p>插件有明确的生命周期钩子。</p>',
      },
      lifecycle: {
        id: 'lifecycle',
        title: '生命周期',
        description: 'onLoad、onEnable、onDisable 与 onUnload 的调用时机。',
        updatedAt: '2025-03-24',
        readTime: 6,
      },
      classloader: {
        id: 'classloader',
        title: 'ClassLoader 隔离',
        description: '每个插件运行在独立类加载器上下文中。',
        updatedAt: '2025-03-24',
        readTime: 7,
      },
      export: {
        id: 'export',
        title: '@PluginExport',
        description: '显式声明插件导出接口。',
        updatedAt: '2025-03-23',
        readTime: 5,
      },
      'theme-system': {
        id: 'theme-system',
        title: '主题系统',
        description: 'ThemeManifest、主题变量与站点风格切换设计。',
        updatedAt: '2025-03-21',
        readTime: 8,
      },
      'rest-api': {
        id: 'rest-api',
        title: 'REST API',
        description: '开放 API 文档与鉴权说明。',
        updatedAt: '2025-03-20',
        readTime: 10,
      },
      sdk: {
        id: 'sdk',
        title: 'Java SDK',
        description: 'Java 插件开发 SDK 使用指南。',
        updatedAt: '2025-03-20',
        readTime: 9,
      },
      home: {
        id: 'home',
        title: 'Gress — 企业级插件平台',
        description: '用可视化方式构建、发布和管理企业插件生态。',
        updatedAt: '2025-04-01',
        readTime: 2,
        heroEmoji: '🌟',
        category: '产品介绍',
      },
      'plugin-arch': {
        id: 'plugin-arch',
        title: '插件架构深解',
        description: '深入理解 ClassLoader 隔离。',
        updatedAt: '2025-03-19',
        readTime: 11,
        category: '博客',
      },
    },
  }

  const pageMeta: Record<string, BuilderPageMeta> = {
    'getting-started': { id: 'getting-started', slug: '/docs/getting-started', type: 'doc', parentId: '', order: 1 },
    installation: { id: 'installation', slug: '/docs/installation', type: 'doc', parentId: 'getting-started', order: 2 },
    'plugin-system': { id: 'plugin-system', slug: '/docs/plugin-system', type: 'doc', parentId: '', order: 3 },
    lifecycle: { id: 'lifecycle', slug: '/docs/lifecycle', type: 'doc', parentId: 'plugin-system', order: 4 },
    classloader: { id: 'classloader', slug: '/docs/classloader', type: 'doc', parentId: 'plugin-system', order: 5 },
    export: { id: 'export', slug: '/docs/plugin-export', type: 'doc', parentId: 'plugin-system', order: 6 },
    'theme-system': { id: 'theme-system', slug: '/docs/theme-system', type: 'doc', parentId: '', order: 7 },
    'rest-api': { id: 'rest-api', slug: '/api/rest', type: 'api', parentId: '', order: 8 },
    sdk: { id: 'sdk', slug: '/api/sdk', type: 'api', parentId: 'rest-api', order: 9 },
    home: { id: 'home', slug: '/', type: 'home', parentId: '', order: 0 },
    'plugin-arch': { id: 'plugin-arch', slug: '/blog/plugin-arch', type: 'blog', parentId: '', order: 10 },
  }

  const navMeta: Record<string, BuilderNavMeta> = {
    docs: { id: 'docs', targetPageId: 'getting-started', syncLabel: true },
    guide: { id: 'guide', targetPageId: 'plugin-system', syncLabel: true },
    manual: { id: 'manual', targetPageId: 'theme-system', syncLabel: true },
    dev: { id: 'dev', targetPageId: 'plugin-arch', syncLabel: false },
    api: { id: 'api', targetPageId: 'rest-api', syncLabel: true },
    start: { id: 'start', targetPageId: 'getting-started', syncLabel: false },
  }

  return {
    siteConfig: deepClone(siteConfig),
    pageMeta: deepClone(pageMeta),
    navMeta: deepClone(navMeta),
  }
}

function deepClone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value))
}
