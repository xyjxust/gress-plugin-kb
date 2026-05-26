<template>
  <div class="sr-preview-page" :class="{ 'sr-preview-page--embedded': !showDemoControls }">
    <div v-if="accessBlocked" class="sr-access-block" :class="{ 'sr-access-block--dark': isDarkUi }">
      <div class="sr-access-minimal">
        <h1 class="sr-access-block__title">页面暂未开放</h1>
        <button type="button" class="sr-access-link" @click="refreshPage">重新加载</button>
      </div>
    </div>

    <!-- 渲染器主体：可被站点构建器传入同一份 siteConfig 复用 -->
    <KbSiteRenderer
      v-if="!accessBlocked"
      class="sr-preview-renderer"
      :config="effectiveSiteConfig"
      :active-page-id="effectiveActivePage"
      :active-nav-id="effectiveActiveNav"
      @brand-click="onBrandClick"
      @page-select="onPageSelect"
      @nav-click="onNavClick"
      @toc-click="onTocClick"
      @sidebar-unbound-click="onSidebarUnboundClick"
    />

    <div v-if="sidebarHint.show" class="sr-inline-hint">
      {{ sidebarHint.text }}
    </div>


  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, reactive, ref, shallowRef, watch } from 'vue'
import type { SiteRendererConfig, ThemeLayoutId } from '../types/siteRenderer'
import {
  COLOR_PRESETS,
  firstPageIdInSidebarTree,
  pickSidebarTreeForActiveNav,
  sidebarTreeContainsPageId,
  sidebarTreeMapKeysForLookup,
} from '../utils/siteRenderer'
import { getBuiltinManifests } from '../components/site-renderer/rendererRegistry'
import KbSiteRenderer from '../components/site-renderer/KbSiteRenderer.vue'
import { kbApi } from '../api/kb'
import type { KbDoc, KbNavNode, KbSite } from '../types/kb'
import { markdownToHtml } from '../editor/mdHtml'
import { injectHeadingIdsIntoHtml } from '../utils/kbHeadingAnchors'
import { enhanceKbDocCodeBlocks, enhanceKbTabbedPanels } from '../utils/kbDocCodeBlocks'

const UNBOUND_PAGE_ID = 'kb-unbound'

const props = withDefaults(
  defineProps<{
    /** 传入时与内部演示数据解耦，用于站点构建器嵌入同一渲染数据模型 */
    siteConfig?: SiteRendererConfig
    /** 构建器模式下用于拉取 kb 文档（否则将无法 hydrate 文档内容） */
    siteKey?: string
    activePageId?: string | null
    activeNavId?: string | null
    /** 为 false 时隐藏右下角演示面板（构建器画布内） */
    showDemoControls?: boolean
  }>(),
  {
    siteConfig: undefined,
    siteKey: undefined,
    activePageId: null,
    activeNavId: null,
    showDemoControls: true,
  }
)

const emit = defineEmits<{
  'update:activePageId': [id: string]
  'update:activeNavId': [id: string]
}>()

/* ── 演示数据（仅独立预览 / 未传入 siteConfig 时使用） ───────────────── */
const demoPages: SiteRendererConfig['pages'] = {
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
    html: `
      <div class="container-info">
        <div class="container-title">💡 提示</div>
        确保你的 Node.js 版本 &gt;= 18，并已安装 Java 21+。
      </div>
      <h2 id="install">安装</h2>
      <p>通过 npm 安装 Gress CLI，然后初始化项目：</p>
      <div class="code-block">
        <div class="code-header">
          <span class="code-lang">bash</span>
          <button class="code-copy">复制</button>
        </div>
        <div class="code-content">npm install -g @gress/cli
gress init my-wiki
cd my-wiki && gress dev</div>
      </div>
      <h2 id="config">基础配置</h2>
      <p>项目根目录下的 <code>gress.config.ts</code> 是主配置文件。所有站点级设置都在这里定义，包括主题选择、导航结构和插件列表。</p>
      <div class="container-tip">
        <div class="container-title">✅ 最佳实践</div>
        建议将配置文件提交到版本控制系统，这样团队成员可以共享同一份站点配置。
      </div>
      <h3 id="theme">选择主题</h3>
      <p>Gress 内置三套主题：<code>docs</code>（文档站）、<code>blog</code>（博客）和 <code>landing</code>（落地页）。你也可以从插件市场安装第三方主题。</p>
      <h2 id="deploy">部署</h2>
      <p>执行构建命令生成静态文件，然后部署到任意静态托管服务：</p>
      <div class="code-block">
        <div class="code-header"><span class="code-lang">bash</span><button class="code-copy">复制</button></div>
        <div class="code-content">gress build
# 输出目录: .gress/dist/</div>
      </div>
    `,
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
    html: `
      <h2 id="arch">插件架构</h2>
      <p>Gress 的插件系统基于 ClassLoader 隔离机制，每个插件运行在独立的类加载器上下文中，插件间通过标准接口通信。</p>
      <div class="container-warning">
        <div class="container-title">⚠️ 注意</div>
        插件的 Bean 不会自动暴露给宿主应用，需要通过 <code>@PluginExport</code> 显式声明导出接口。
      </div>
      <h2 id="lifecycle">生命周期</h2>
      <p>插件有明确的生命周期钩子：<code>onLoad</code>、<code>onEnable</code>、<code>onDisable</code> 和 <code>onUnload</code>。</p>
      <div class="code-block">
        <div class="code-header"><span class="code-lang">java</span><button class="code-copy">复制</button></div>
        <div class="code-content">@GressPlugin(id = "my-plugin", version = "1.0.0")
public class MyPlugin implements Plugin {
    @Override
    public void onEnable() {
        // 插件启动逻辑
    }
}</div>
      </div>
    `,
  },
  home: {
    id: 'home',
    title: 'Gress — 企业级插件平台',
    description:
      '用可视化方式构建、发布和管理企业插件生态，开箱即用的主题系统让每个站点都与众不同。',
    updatedAt: '2025-04-01',
    readTime: 2,
    heroEmoji: '🌟',
    category: '产品介绍',
  },
}

const demoSiteConfig = reactive<SiteRendererConfig>({
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
      { id: 'docs', label: '文档', type: 'link' },
      { id: 'plugins', label: '插件市场', type: 'link' },
      { id: 'blog', label: '博客', type: 'link' },
      { id: 'start', label: '开始使用', type: 'link' },
    ],
  },
  sidebar: {
    width: 260,
    collapsible: true,
    tree: [
      {
        id: 'guide',
        groupLabel: '指南',
        children: [
          { id: 'getting-started', label: '快速开始', icon: '🚀', badge: 'NEW' },
          { id: 'installation', label: '安装配置', icon: '⚙️' },
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
            children: [
              { id: 'lifecycle', label: '生命周期' },
              { id: 'classloader', label: 'ClassLoader 隔离' },
              { id: 'export', label: '@PluginExport', badge: 'Beta' },
            ],
          },
          { id: 'theme-system', label: '主题系统', icon: '🎨' },
        ],
      },
      {
        id: 'api',
        groupLabel: 'API 参考',
        children: [
          { id: 'rest-api', label: 'REST API', icon: '🔌' },
          { id: 'sdk', label: 'Java SDK', icon: '☕' },
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
    links: [{ label: 'GitHub' }, { label: '文档' }, { label: '隐私政策' }],
  },
  landingConfig: {
    badgeText: 'v2.0 正式发布 🎉',
    actions: [
      { id: 'start', label: '🚀 快速开始', type: 'primary' },
      { id: 'github', label: '⭐ GitHub', type: 'secondary' },
    ],
    features: [
      { icon: '🧩', name: '插件市场', desc: '丰富的企业级插件生态，开箱即用，一键安装。', color: '#f0fdf4' },
      { icon: '🎨', name: '可视化构建', desc: '无需代码，拖拽配置导航、菜单和全局组件。', color: '#eff6ff' },
      { icon: '🤖', name: 'AI 代码生成', desc: '描述需求，AI 自动生成符合规范的插件代码。', color: '#fdf4ff' },
      { icon: '⚡', name: '热更新部署', desc: '插件无需重启服务器，秒级热加载到生产环境。', color: '#fff7ed' },
      { icon: '🔒', name: '企业级权限', desc: '细粒度的 Bean 级权限控制，插件间安全隔离。', color: '#fef2f2' },
      { icon: '📊', name: '监控与分析', desc: '实时监控插件状态，内置性能分析和错误追踪。', color: '#f0fdf4' },
    ],
  },
  slots: {
    'sidebar-top': {
      instanceId: 'slot-1',
      componentKey: 'AdBanner',
      props: {
        icon: '🎉',
        text: 'Gress v2.0 正式发布',
        subtext: '· 查看新特性',
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
        badgeBg: '#2563eb',
        title: '主题系统已上线',
        text: '现在可以在可视化构建器中一键切换主题',
        linkText: '了解更多',
        bg: '#eff6ff',
        color: '#1d4ed8',
        closable: true,
      },
    },
  },
  pages: demoPages,
})

const internalActivePage = ref('getting-started')
const internalActiveNav = ref('docs')

/* ── KB 真实站点预览（独立预览路由：未传入 siteConfig 时启用） ───────── */
const resolvedSite = ref<KbSite | null>(null)
const resolvedSiteKey = computed(() => resolvedSite.value?.spaceKey || '')
const effectiveSiteKey = computed(() => resolvedSiteKey.value || String(props.siteKey || '').trim())
const kbLoading = ref(false)
const accessBlocked = ref(false)
const sidebarHint = reactive({ show: false, text: '' })
let sidebarHintTimer: ReturnType<typeof setTimeout> | null = null
const isDarkUi = ref(false)
let darkMediaQuery: MediaQueryList | null = null
let onThemeChangeHandler: (() => void) | null = null

function detectDarkUi() {
  if (typeof window === 'undefined') return false
  const root = document.documentElement
  const body = document.body
  const hasThemeDarkClass =
    root.classList.contains('dark') ||
    root.classList.contains('theme-dark') ||
    body.classList.contains('dark') ||
    body.classList.contains('theme-dark')
  if (hasThemeDarkClass) return true
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false
}

type KbPageMeta = { kbDocId?: number; kbDocLoading?: boolean; kbDocListSource?: boolean; kbDoc?: any }
const kbDocIdByPageId = reactive<Record<string, number>>({})
const kbSiteConfig = reactive<SiteRendererConfig>({
  themeId: 'docs',
  theme: {
    primary: '#2563eb',
    darkMode: false,
    fontSans: 'Outfit',
  },
  navbar: {
    brand: 'KB Site',
    style: 'solid',
    showSearch: true,
    links: [],
  },
  sidebar: {
    width: 260,
    collapsible: true,
    tree: [],
  },
  content: {
    maxWidth: '760px',
    showToc: true,
  },
  footer: {
    visible: true,
    copyright: '',
    links: [],
  },
  landingConfig: {
    actions: [],
    features: [],
  },
  slots: {},
  pages: {},
})

// 构建器预览：props.siteConfig 可能是 computed 的只读引用，这里克隆一份用于 runtime hydration（kbDoc、toc 等）
const builderConfig = shallowRef<SiteRendererConfig | null>(null)
watch(
  () => props.siteConfig,
  (cfg) => {
    if (!cfg) {
      builderConfig.value = null
      return
    }
    try {
      builderConfig.value = structuredClone(cfg)
    } catch {
      builderConfig.value = JSON.parse(JSON.stringify(cfg)) as SiteRendererConfig
    }
  },
  { immediate: true, deep: true }
)

function getHydrateConfig(): SiteRendererConfig {
  return props.siteConfig ? (builderConfig.value || (props.siteConfig as SiteRendererConfig)) : kbSiteConfig
}

function resolveCurrentPath(): string {
  if (typeof window === 'undefined') return '/'
  const { pathname, hash } = window.location
  // history 路由：/sites/... 需要映射为站点真实路径
  if (pathname.startsWith('/sites/')) return pathname.slice('/sites'.length) || '/'
  if (pathname === '/sites') return '/'
  // 兼容 hash 路由：#/sites/... 或 #/sites/...?... 形式
  if (hash.startsWith('#/')) {
    const h = hash.slice(1) // 去掉前导 #
    const idx = h.indexOf('?')
    const full = idx >= 0 ? h.slice(0, idx) : h
    // 前端路由基于 /sites 挂载，后端 siteResolve 只关心真实业务前缀（routePrefix）
    // 因此需要去掉前缀 /sites，传给后端的 urlPath 才能与 routePrefix=/xxx 匹配
    if (full.startsWith('/sites/')) return full.slice('/sites'.length) || '/'
    if (full === '/sites') return '/'
    return full
  }
  return pathname || '/'
}

function pageIdForDocId(docId: number) {
  return `kb-doc-${docId}`
}

function tocFromHtml(html: string) {
  try {
    const el = document.createElement('div')
    el.innerHTML = html || ''
    const hs = Array.from(el.querySelectorAll('h2,h3,h4')) as HTMLElement[]
    return hs
      .map((h) => {
        const level = (h.tagName || '').toLowerCase() as 'h2' | 'h3' | 'h4'
        const text = (h.textContent || '').trim()
        if (!text) return null
        const id = h.id || text.toLowerCase().replace(/[^\w\u4e00-\u9fa5]+/g, '-').replace(/^-+|-+$/g, '')
        if (!h.id && id) h.id = id
        return { id: h.id || id, text, level }
      })
      .filter(Boolean) as any
  } catch {
    return []
  }
}

function ensureKbPage(docId: number, title?: string) {
  const pid = pageIdForDocId(docId)
  kbDocIdByPageId[pid] = docId
  if (!kbSiteConfig.pages[pid]) {
    kbSiteConfig.pages[pid] = {
      id: pid,
      title: title || `Doc #${docId}`,
      meta: { kbDocId: docId, kbDocLoading: false } satisfies KbPageMeta,
      html: '',
      toc: [],
    }
  }
  return pid
}

async function hydratePageDoc(pageId: string) {
  const cfg = getHydrateConfig()
  const pages = (cfg.pages || {}) as any
  const p = pages[pageId] as any
  if (!p) return
  const meta = (p.meta || {}) as any
  const docId = kbDocIdByPageId[pageId] || meta.kbDocId
  if (!docId) return
  // 回填映射，兼容“发布 JSON 直接带 pages”场景
  kbDocIdByPageId[pageId] = docId
  if (meta.kbDocLoading) return
  if (meta.kbDoc) return
  meta.kbDocLoading = true
  p.meta = meta
  try {
    const d: KbDoc = await kbApi.getDoc(docId, effectiveSiteKey.value || undefined, 'public')
    p.title = d.title || p.title
    p.updatedAt = d.updatedAt || p.updatedAt
    const dt = String((d as any).docType || 'EDITOR').toUpperCase()
    if (dt === 'COMPONENT') {
      // 组件文档：渲染由 KbRendererContent 从 meta.kbDoc 派生
      p.html = ''
      p.toc = []
      p.meta = { ...(p.meta as any), kbDocListSource: true, kbDoc: d } as any
    } else {
      // 编辑器文档：用 KbDocBody 渲染正文；TOC 必须与 KbDocBody 最终 v-html 的标题 id 一致
      let inner =
        d.status === 'PUBLISHED' && (d as any).bodyHtml
          ? String((d as any).bodyHtml)
          : markdownToHtml(d.bodyMd || '')
      inner = enhanceKbTabbedPanels(enhanceKbDocCodeBlocks(inner))
      inner = injectHeadingIdsIntoHtml(inner)
      p.html = '' // 避免重复存 html（KbDocBody 自己渲染）
      p.toc = tocFromHtml(inner || '')
      p.meta = { ...(p.meta as any), kbDocListSource: true, kbDoc: d } as any
    }
  } catch {
    p.html = `<div style="padding:16px;color:#64748b">文档加载失败（docId=${docId}）</div>`
    p.toc = []
  } finally {
    const cur = (p.meta || {}) as any
    cur.kbDocLoading = false
    p.meta = cur
  }
}

function mapHeaderNavToNavbarLinks(nodes: KbNavNode[]) {
  const links: any[] = []
  for (const n of nodes || []) {
    const id = String(n.id)
    const label = n.title
    if (n.nodeType === 'DOC' && n.docId) {
      const pageId = ensureKbPage(n.docId, label)
      links.push({ id, label, type: 'link', pageId })
      continue
    }
    if (n.nodeType === 'LINK' && n.linkUrl) {
      links.push({ id, label, type: 'external', href: n.linkUrl, externalOpen: 'blank' })
      continue
    }
    if (n.children?.length) {
      const children: any[] = []
      for (const c of n.children) {
        const cid = String(c.id)
        const clabel = c.title
        if (c.nodeType === 'DOC' && c.docId) {
          const pageId = ensureKbPage(c.docId, clabel)
          children.push({ id: cid, label: clabel, type: 'link', pageId })
        } else if (c.nodeType === 'LINK' && c.linkUrl) {
          children.push({ id: cid, label: clabel, type: 'external', href: c.linkUrl, externalOpen: 'blank' })
        }
      }
      links.push({ id, label, type: 'dropdown', children })
      continue
    }
    links.push({ id, label, type: 'link' })
  }
  return links
}

/**
 * 根据当前 pageId 对齐顶栏高亮。
 * 多宿主 + treesByNavId 时：侧栏点进某页后不得回退到「首个顶栏项」（常为绑 pageId 的项），否则侧栏会被 pickSidebar 判空而隐藏。
 */
function syncActiveNavForPage(pageId: string) {
  if (!pageId) return
  // 占位页不参与顶栏对齐：否则会回退到 links[0]，导致当前侧栏上下文被切走而隐藏菜单树
  if (pageId === UNBOUND_PAGE_ID) return
  const cfg = effectiveSiteConfig.value
  const pages = cfg.pages
  // 非站点页面 id（例如侧栏结构节点 id）不参与顶栏对齐，避免落到 links[0] 误切到「文档」
  if (pages != null && !Object.prototype.hasOwnProperty.call(pages, pageId)) return

  const links = cfg.navbar?.links || []
  const byNav = cfg.sidebar?.treesByNavId

  if (byNav && Object.keys(byNav).length > 0) {
    const cur = internalActiveNav.value
    for (const ck of sidebarTreeMapKeysForLookup(links, cur)) {
      if (Object.prototype.hasOwnProperty.call(byNav, ck)) {
        const t = byNav[ck]
        if (t?.length && sidebarTreeContainsPageId(t, pageId)) return
      }
    }

    for (const l of links) {
      if (!l.pageId && Object.prototype.hasOwnProperty.call(byNav, l.id)) {
        const t = byNav[l.id]
        if (t?.length && sidebarTreeContainsPageId(t, pageId)) {
          internalActiveNav.value = l.id
          return
        }
      }
      if (l.type === 'dropdown' && l.children?.length) {
        for (const c of l.children) {
          if (!c.pageId && Object.prototype.hasOwnProperty.call(byNav, c.id)) {
            const t = byNav[c.id]
            if (t?.length && sidebarTreeContainsPageId(t, pageId)) {
              internalActiveNav.value = c.id
              return
            }
          }
        }
      }
    }
  }

  for (const l of links) {
    if (l.pageId === pageId) {
      internalActiveNav.value = l.id
      return
    }
    for (const ch of l.children || []) {
      if (ch.pageId === pageId) {
        internalActiveNav.value = ch.id
        return
      }
    }
  }

  const first = links[0]
  if (first) internalActiveNav.value = first.id
}

function mapSidebarNavToSidebarTree(nodes: KbNavNode[]) {
  const secs: any[] = []
  for (const n of nodes || []) {
    const children: any[] = []
    // section node itself may be a doc
    if (n.nodeType === 'DOC' && n.docId) {
      const pageId = ensureKbPage(n.docId, n.title)
      children.push({ id: String(n.id), label: n.title, pageId })
    }
    for (const c of n.children || []) {
      if (c.nodeType === 'DOC' && c.docId) {
        const pageId = ensureKbPage(c.docId, c.title)
        children.push({ id: String(c.id), label: c.title, pageId, children: [] })
      } else if (c.children?.length) {
        const walk = (x: KbNavNode): any => {
          const node: any = { id: String(x.id), label: x.title }
          if (x.nodeType === 'DOC' && x.docId) node.pageId = ensureKbPage(x.docId, x.title)
          if (x.nodeType === 'LINK' && x.linkUrl) node.href = x.linkUrl
          if (x.children?.length) node.children = x.children.map(walk)
          return node
        }
        children.push(walk(c))
      } else if (c.nodeType === 'LINK' && c.linkUrl) {
        children.push({ id: String(c.id), label: c.title, href: c.linkUrl })
      } else {
        children.push({ id: String(c.id), label: c.title })
      }
    }
    secs.push({ id: String(n.id), groupLabel: n.title, children })
  }
  return secs
}

const canUseKbPreview = computed(() => props.siteConfig == null)

onMounted(async () => {
  isDarkUi.value = detectDarkUi()
  if (typeof window !== 'undefined') {
    darkMediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    onThemeChangeHandler = () => {
      isDarkUi.value = detectDarkUi()
    }
    darkMediaQuery.addEventListener?.('change', onThemeChangeHandler)
    window.addEventListener('focus', onThemeChangeHandler)
  }

  // 构建器嵌入：预拉 anon/tree、anon/sites，避免未登录时误请求 /kb/tree、/admin/sites
  if (!canUseKbPreview.value) {
    const sk = String(props.siteKey || '').trim()
    if (sk) {
      try {
        await Promise.all([kbApi.listSites(), kbApi.tree(sk)])
      } catch {
        /* 不阻断画布：目录拉取失败时由构建器其它逻辑兜底 */
      }
    }
    return
  }
  kbLoading.value = true
  try {
    const requestedPath = resolveCurrentPath()
    resolvedSite.value = await kbApi.resolveSiteByUrl(requestedPath)
    // 站点未命中或已停用：不要回退到默认站点配置
    if (!resolvedSite.value || (resolvedSite.value as any).enabled === 0) {
      accessBlocked.value = true
      return
    }
    // 防止后端在未命中时回退到默认空间（routePrefix=/）导致误显示默认站点
    const rp = String((resolvedSite.value as any).routePrefix || '/').trim() || '/'
    if (requestedPath !== '/' && rp === '/') {
      accessBlocked.value = true
      resolvedSite.value = null
      return
    }
    kbSiteConfig.navbar.brand = resolvedSite.value?.name || 'KB Site'
    // 若已发布站点渲染配置：优先用 DB 配置覆盖（主题/布局/视觉等）
    try {
      const json = await kbApi.getSiteRendererConfig(resolvedSiteKey.value || undefined, 'published')
      if (json && String(json).trim()) {
        const parsed = JSON.parse(String(json)) as SiteRendererConfig
        Object.assign(kbSiteConfig, parsed)
      } else {
        // 未发布：禁止访问站点渲染页
        accessBlocked.value = true
        return
      }
    } catch {
      accessBlocked.value = true
      return
    }
    // 已发布 JSON 里的 navbar / sidebar 来自可视化构建器时，必须与 kb_nav_node 解耦：
    // 若这里仍用 siteNavTree 覆盖，会把多链接顶栏替换成后台里仅有的一条（例如只有「首页」）。
    const publishedLinks = kbSiteConfig.navbar?.links?.length ?? 0
    const publishedSidebar = kbSiteConfig.sidebar?.tree?.length ?? 0
    const [head, side] = await Promise.all([
      kbApi.siteNavTree('header', resolvedSiteKey.value || undefined),
      kbApi.siteNavTree('sidebar', resolvedSiteKey.value || undefined),
      kbApi.listSites(),
      kbApi.tree(resolvedSiteKey.value || undefined),
    ])
    if (publishedLinks === 0) {
      kbSiteConfig.navbar.links = mapHeaderNavToNavbarLinks(head || [])
    }
    if (publishedSidebar === 0) {
      kbSiteConfig.sidebar.tree = mapSidebarNavToSidebarTree(side || [])
    }

    // 初始页选择规则（不再使用“默认页”）：
    // - 优先 URL 中的 slug（若命中 pages）
    // - 再取顶栏首个带 pageId 的项
    // - 再尝试进入该导航上下文侧栏的首个页面（或全局侧栏的首个页面）
    // - 最后落到占位页（未绑定内容）
    const pageIds = kbSiteConfig.pages || {}
    const slugFromUrl = extractSlugFromUrl()
    let startPage = slugFromUrl ? findPageIdBySlug(kbSiteConfig, slugFromUrl) || '' : ''
    if (!startPage) {
      for (const link of kbSiteConfig.navbar?.links || []) {
        if (link.pageId) {
          startPage = link.pageId
          break
        }
        for (const ch of link.children || []) {
          if (ch.pageId) {
            startPage = ch.pageId
            break
          }
        }
        if (startPage) break
      }
    }
    if (!startPage) {
      const firstNavId = String(kbSiteConfig.navbar?.links?.[0]?.id ?? '')
      const tree = firstNavId ? pickSidebarTreeForActiveNav(kbSiteConfig, firstNavId) : kbSiteConfig.sidebar?.tree || []
      startPage = firstPageIdInSidebarTree(tree) || UNBOUND_PAGE_ID
    }
    internalActivePage.value = startPage
    syncActiveNavForPage(startPage)
    updateUrlForPage(startPage)
    await hydratePageDoc(internalActivePage.value)
  } catch {
    accessBlocked.value = true
    resolvedSite.value = null
  } finally {
    kbLoading.value = false
  }
})

onBeforeUnmount(() => {
  if (sidebarHintTimer) {
    clearTimeout(sidebarHintTimer)
    sidebarHintTimer = null
  }
  if (typeof window === 'undefined') return
  if (onThemeChangeHandler) {
    darkMediaQuery?.removeEventListener?.('change', onThemeChangeHandler)
    window.removeEventListener('focus', onThemeChangeHandler)
    onThemeChangeHandler = null
  }
})

const effectiveSiteConfig = computed(() => {
  const base = props.siteConfig ? (builderConfig.value || props.siteConfig) : resolvedSite.value ? kbSiteConfig : demoSiteConfig
  const pages = (base.pages || {}) as any
  if (Object.prototype.hasOwnProperty.call(pages, UNBOUND_PAGE_ID)) return base
  // 注入一个占位页：用于「未绑定侧栏叶子」时切换到一个可渲染的页面
  const placeholder = {
    id: UNBOUND_PAGE_ID,
    title: '内容正在整理中',
    description: '',
    slug: '/__unbound__',
    html: markdownToHtml('当前内容正在整理中，请查看其他章节')
  }
  return {
    ...base,
    pages: {
      ...pages,
      [UNBOUND_PAGE_ID]: placeholder
    }
  } as SiteRendererConfig
})

function collectBoundPageIds(cfg: SiteRendererConfig): Set<string> {
  const out = new Set<string>()
  const pages = cfg.pages || {}
  const hasPage = (pid: any) => typeof pid === 'string' && pid && Object.prototype.hasOwnProperty.call(pages, pid)

  for (const link of cfg.navbar?.links || []) {
    if (hasPage((link as any).pageId)) out.add(String((link as any).pageId))
    for (const ch of (link as any).children || []) {
      if (hasPage((ch as any).pageId)) out.add(String((ch as any).pageId))
    }
  }

  const walkSidebar = (nodes: any[]) => {
    for (const n of nodes || []) {
      if (hasPage((n as any).pageId)) out.add(String((n as any).pageId))
      if ((n as any).children?.length) walkSidebar((n as any).children)
    }
  }

  walkSidebar((cfg.sidebar as any)?.tree || [])
  const map = (cfg.sidebar as any)?.treesByNavId as Record<string, any[]> | undefined
  if (map) {
    for (const tree of Object.values(map)) walkSidebar(tree || [])
  }

  return out
}

const boundPageIds = computed(() => collectBoundPageIds(effectiveSiteConfig.value))

const effectiveActivePage = computed(() => {
  const candidate =
    props.activePageId != null && props.activePageId !== '' ? String(props.activePageId) : internalActivePage.value

  // 构建器预览场景：如果当前 activePageId 不在任何导航/侧栏绑定中，则不渲染“默认模板页”，直接进入占位页
  if (props.siteConfig) {
    if (candidate === UNBOUND_PAGE_ID) return candidate
    if (!boundPageIds.value.has(candidate)) return UNBOUND_PAGE_ID
  }
  return candidate
})

const effectiveActiveNav = computed(() =>
  props.activeNavId != null && props.activeNavId !== '' ? props.activeNavId : internalActiveNav.value
)

// 构建器预览：activePage 初始化/切换时也需要 hydrate 文档内容（meta 里通常只有 kbDocId）
watch(
  () => [props.siteConfig, effectiveActivePage.value, effectiveSiteKey.value] as const,
  ([cfg, pageId, sk]) => {
    if (!cfg) return
    if (!sk) return
    if (!pageId || pageId === UNBOUND_PAGE_ID) return
    void hydratePageDoc(String(pageId))
  },
  { immediate: true }
)

const themes = getBuiltinManifests()
const colorPresets = COLOR_PRESETS

function findPageIdBySlug(cfg: SiteRendererConfig, slug: string): string | null {
  if (!slug) return null
  const trimmed = slug.trim()
  if (!trimmed) return null
  const pages = cfg.pages || {}
  for (const [id, p] of Object.entries(pages)) {
    const ps = (p as any).slug as string | undefined
    if (ps && ps.trim() === trimmed) return id
  }
  return null
}

function extractSlugFromUrl(): string {
  if (typeof window === 'undefined') return ''
  const url = new URL(window.location.href)
  const fromSearch = url.searchParams.get('p') || url.searchParams.get('page') || ''
  let fromHash = ''
  const hash = url.hash || ''
  if (hash.includes('?')) {
    const qs = hash.split('?')[1] || ''
    const params = new URLSearchParams(qs)
    fromHash = params.get('p') || params.get('page') || ''
  }
  return (fromHash || fromSearch || '').trim()
}

function updateUrlForPage(pageId: string) {
  if (typeof window === 'undefined' || !pageId) return
  const cfg = effectiveSiteConfig.value
  const page = cfg.pages?.[pageId] as any
  const slug = (page && (page.slug as string | undefined)) || ''
  if (!slug) return
  const url = new URL(window.location.href)
  const hash = url.hash || ''
  if (hash.startsWith('#')) {
    const base = hash.split('?')[0] || '#/sites'
    const qs = hash.includes('?') ? hash.split('?')[1] : ''
    const params = new URLSearchParams(qs)
    params.set('p', slug)
    url.hash = `${base}?${params.toString()}`
  } else {
    url.searchParams.set('p', slug)
  }
  history.replaceState(null, '', url.toString())
}

function switchTheme(id: ThemeLayoutId) {
  demoSiteConfig.themeId = id
  if (id !== 'docs') internalActivePage.value = 'home'
  else internalActivePage.value = 'getting-started'
}

function onPageSelect(id: string) {
  const cfg = effectiveSiteConfig.value
  const pages = cfg.pages
  if (pages != null && id && !Object.prototype.hasOwnProperty.call(pages, id)) return

  if (props.activePageId == null) internalActivePage.value = id
  emit('update:activePageId', id)
  if (resolvedSite.value) syncActiveNavForPage(id)
  if (resolvedSite.value || props.siteConfig) void hydratePageDoc(id)
  if (resolvedSite.value) updateUrlForPage(id)
}

function onNavClick(item: any) {
  if (props.activeNavId == null) internalActiveNav.value = item.id
  emit('update:activeNavId', item.id)
  const pid = item.pageId as string | undefined
  if (pid) {
    if (props.activePageId == null) internalActivePage.value = pid
    emit('update:activePageId', pid)
    if (resolvedSite.value || props.siteConfig) void hydratePageDoc(pid)
    if (resolvedSite.value) updateUrlForPage(pid)
    return
  }
  // 与构建器一致：顶栏项未绑 pageId 时，进入该导航上下文侧栏的首个页面
  const cfg = effectiveSiteConfig.value
  const map = cfg.sidebar?.treesByNavId
  if (map && Object.keys(map).length > 0) {
    const tree = pickSidebarTreeForActiveNav(cfg, String(item.id ?? ''))
    const first = firstPageIdInSidebarTree(tree)
    if (first) {
      if (props.activePageId == null) internalActivePage.value = first
      emit('update:activePageId', first)
      if (resolvedSite.value || props.siteConfig) void hydratePageDoc(first)
      if (resolvedSite.value) updateUrlForPage(first)
      return
    }
  }

  // 顶栏/菜单未绑定且侧栏也找不到可进入的页面：进入占位页
  onPageSelect(UNBOUND_PAGE_ID)
}

function pickHomePageId(cfg: SiteRendererConfig): string {
  const pages = cfg.pages || {}
  // 不使用“默认页”：仅当存在导航/菜单绑定时才返回对应页面，否则返回占位页
  for (const link of cfg.navbar?.links || []) {
    if (link.pageId && Object.prototype.hasOwnProperty.call(pages, link.pageId)) return link.pageId
    for (const ch of link.children || []) {
      if (ch.pageId && Object.prototype.hasOwnProperty.call(pages, ch.pageId)) return ch.pageId
    }
  }
  const firstNavId = String(cfg.navbar?.links?.[0]?.id ?? '')
  const tree = firstNavId ? pickSidebarTreeForActiveNav(cfg, firstNavId) : cfg.sidebar?.tree || []
  const first = firstPageIdInSidebarTree(tree)
  return first || UNBOUND_PAGE_ID
}

function onBrandClick() {
  const cfg = effectiveSiteConfig.value
  const homeId = pickHomePageId(cfg)
  onPageSelect(homeId)
}

function onSidebarUnboundClick(label: string) {
  const name = label || '该内容'
  sidebarHint.text = `「${name}」内容正在整理中，敬请期待。你可以先查看其他章节。`
  sidebarHint.show = true
  if (sidebarHintTimer) clearTimeout(sidebarHintTimer)
  sidebarHintTimer = setTimeout(() => {
    sidebarHint.show = false
    sidebarHintTimer = null
  }, 1800)

  // 切换到占位页，让内容区有明确的“无内容”落点，而不是停留在上一个页面
  onPageSelect(UNBOUND_PAGE_ID)
}

function scrollToAnchor(id: string) {
  if (typeof window === 'undefined' || typeof document === 'undefined') return
  const safeId = String(id || '').trim().replace(/^#/, '')
  if (!safeId) return

  // 标题一般在正文区域（docs 主题为滚动容器 .sr-docs-content-scroll）
  const root = document.querySelector('.sr-preview-renderer') as HTMLElement | null
  const container =
    (root?.querySelector('.sr-docs-content-scroll') as HTMLElement | null) ||
    (document.scrollingElement as HTMLElement | null) ||
    (document.documentElement as HTMLElement)

  const target =
    (root?.querySelector(`#${CSS.escape(safeId)}`) as HTMLElement | null) ||
    (document.getElementById(safeId) as HTMLElement | null)
  if (!target) return

  // 计算目标相对滚动容器的 top，再减去 navbar 高度
  const navbarH = Number(getComputedStyle(document.documentElement).getPropertyValue('--navbar-h').replace('px', '')) || 60
  const cRect = container.getBoundingClientRect()
  const tRect = target.getBoundingClientRect()
  const delta = tRect.top - cRect.top
  const top = Math.max(0, container.scrollTop + delta - navbarH - 16)

  container.scrollTo({ top, behavior: 'smooth' })

  // 与 Vue hash 路由兼容：不能把 location.hash 设成「#标题」，否则会冲掉 #/sites?p=... 等父路由。
  // 在「#」后的路径段上追加查询参数 h=锚点 id，便于复制链接且不丢当前页。
  try {
    const raw = window.location.hash
    if (raw.startsWith('#/')) {
      const inner = raw.slice(1)
      const q = inner.indexOf('?')
      const path = q >= 0 ? inner.slice(0, q) : inner
      const search = q >= 0 ? inner.slice(q + 1) : ''
      const params = new URLSearchParams(search)
      params.set('h', safeId)
      const nextHash = `#${path}?${params.toString()}`
      history.replaceState(null, '', `${window.location.pathname}${window.location.search}${nextHash}`)
    }
  } catch {
    // ignore
  }
}

function onTocClick(item: any) {
  const id = String(item?.id || '').trim()
  if (!id) return
  scrollToAnchor(id)
}

function refreshPage() {
  if (typeof window === 'undefined') return
  window.location.reload()
}

function goHome() {
  if (typeof window === 'undefined') return
  window.location.href = '/'
}
</script>

<style scoped>
.sr-preview-page {
  width: 100%;
  position: relative;
  display: flex;
  flex-direction: column;
  /* 视口内铺满，正文滚动交给文档布局内部，避免整页（顶栏/侧栏）一起滚 */
  height: 100vh;
  max-height: 100dvh;
  min-height: 0;
  overflow: hidden;
}

.sr-preview-page--embedded {
  flex: 1;
  min-height: 0;
  height: 100%;
  max-height: 100%;
}

.sr-inline-hint {
  position: fixed;
  left: 50%;
  bottom: 24px;
  transform: translateX(-50%);
  z-index: 1200;
  background: rgba(15, 23, 42, 0.92);
  color: #fff;
  border-radius: 8px;
  padding: 9px 14px;
  font-size: 12px;
  line-height: 1.35;
  box-shadow: 0 8px 24px rgba(2, 6, 23, 0.28);
  pointer-events: none;
}

/* 合并到站点渲染器根节点：docs 主题由 KbDocsLayout 内部滚动；其他主题整区可滚避免裁切 */
.sr-preview-renderer {
  flex: 1 1 auto;
  min-height: 0;
  min-width: 0;
  display: flex;
  flex-direction: column;
  overflow-x: hidden;
  overflow-y: auto;
}

/* 未发布访问拦截 */
.sr-access-block {
  flex: 1;
  min-height: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 64px 20px;
  background:
    radial-gradient(980px 360px at 20% -10%, rgba(37, 99, 235, 0.1), transparent 60%),
    var(--bg, #f8fafc);
  color: var(--text, #0f172a);
}
.sr-access-minimal {
  width: min(560px, 100%);
  text-align: center;
}
.sr-access-minimal__meta {
  display: inline-block;
  margin-bottom: 12px;
  font-size: 12px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: #64748b;
}
.sr-access-block__title {
  font-size: clamp(30px, 5vw, 42px);
  font-weight: 700;
  margin: 0 0 10px;
  text-align: center;
  letter-spacing: 0.01em;
  line-height: 1.12;
}
.sr-access-block__desc {
  max-width: 420px;
  margin: 0 auto;
  text-align: center;
  color: var(--text2, #475569);
  line-height: 1.75;
  font-size: 16px;
}
.sr-access-link {
  margin-top: 18px;
  padding: 0;
  border: none;
  background: transparent;
  color: #2563eb;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  text-underline-offset: 3px;
  transition: color 0.2s ease;
}
.sr-access-link:hover {
  color: #1d4ed8;
  text-decoration: underline;
}

.sr-access-block--dark {
  background:
    radial-gradient(980px 360px at 20% -10%, rgba(59, 130, 246, 0.2), transparent 60%),
    #0b1220;
  color: #e2e8f0;
}
.sr-access-block--dark .sr-access-minimal__meta {
  color: #94a3b8;
}
.sr-access-block--dark .sr-access-block__title {
  color: #f8fafc;
}
.sr-access-block--dark .sr-access-block__desc {
  color: #cbd5e1;
}
.sr-access-block--dark .sr-access-link {
  color: #93c5fd;
}
.sr-access-block--dark .sr-access-link:hover {
  color: #bfdbfe;
}

/* ── 演示控制面板 ──────────────────────────────────────────────── */
.sr-demo-bar {
  position: fixed;
  bottom: 20px;
  right: 20px;
  z-index: 9999;
  background: var(--surface, #fff);
  border: 1px solid var(--border2, #cbd5e1);
  border-radius: 12px;
  padding: 14px 16px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
  display: flex;
  flex-direction: column;
  gap: 10px;
  min-width: 220px;
  font-family: 'Outfit', system-ui, sans-serif;
}
.sr-demo-bar__title {
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.8px;
  text-transform: uppercase;
  color: var(--text3, #94a3b8);
  font-family: 'DM Mono', monospace;
  margin-bottom: 2px;
}
.sr-demo-btns {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.sr-demo-btn {
  padding: 5px 11px;
  border-radius: 6px;
  border: 1px solid var(--border, #e2e8f0);
  background: var(--bg2, #f8fafc);
  color: var(--text2, #475569);
  font-family: 'Outfit', system-ui, sans-serif;
  font-size: 11px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s;
}
.sr-demo-btn:hover {
  border-color: var(--primary, #2563eb);
  color: var(--primary, #2563eb);
}
.sr-demo-btn.active {
  background: var(--primary, #2563eb);
  border-color: var(--primary, #2563eb);
  color: white;
}

/* 平板：演示面板改为底部居中，减少对内容遮挡 */
@media (max-width: 1024px) {
  .sr-demo-bar {
    right: 50%;
    bottom: 14px;
    transform: translateX(50%);
    min-width: min(680px, calc(100vw - 24px));
    max-width: calc(100vw - 24px);
    padding: 12px;
    border-radius: 10px;
  }
}

/* 手机：面板横向滚动，按钮更易点按 */
@media (max-width: 768px) {
  .sr-preview-page {
    min-height: 100dvh;
  }

  .sr-demo-bar {
    left: 8px;
    right: 8px;
    bottom: 8px;
    transform: none;
    min-width: 0;
    max-width: none;
    gap: 8px;
    padding: 10px;
  }

  .sr-demo-btns {
    flex-wrap: nowrap;
    overflow-x: auto;
    scrollbar-width: thin;
    padding-bottom: 2px;
  }

  .sr-demo-btn {
    flex: 0 0 auto;
    min-height: 30px;
    padding: 6px 10px;
    font-size: 12px;
  }

  .sr-access-block__title {
    font-size: 30px;
  }
  .sr-access-block__desc {
    font-size: 14px;
  }
}
</style>
