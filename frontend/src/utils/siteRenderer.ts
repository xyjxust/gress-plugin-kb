import type { CSSProperties } from 'vue'
import type {
  ColorPreset,
  SiteRendererConfig,
  RendererThemeTokens,
  ThemeMode,
  SlotComponentInstance,
  PageData,
  NavbarLinkItem,
  NavbarSubLinkItem,
  SidebarSection,
  SidebarMenuNode,
} from '../types/siteRenderer'
import type { PersistedSiteConfig, DocsLayoutConfig, LandingLayoutConfig, SitePage, SlotInstance, SidebarSection as PSSidebarSection, SidebarNode, NavItem } from '../types/siteConfig'

/* ── 颜色预设映射（主色 → light / text 变体） ──────────────────── */
export const COLOR_PRESETS: ColorPreset[] = [
  { name: '蓝色', value: '#2563eb', light: '#eff6ff', text: '#1d4ed8' },
  { name: '紫色', value: '#7c3aed', light: '#f5f3ff', text: '#6d28d9' },
  { name: '绿色', value: '#059669', light: '#ecfdf5', text: '#047857' },
  { name: '红色', value: '#dc2626', light: '#fef2f2', text: '#b91c1c' },
  { name: '橙色', value: '#d97706', light: '#fffbeb', text: '#b45309' },
  { name: '青色', value: '#0891b2', light: '#ecfeff', text: '#0e7490' },
  { name: '粉色', value: '#db2777', light: '#fdf2f8', text: '#be185d' },
]

const presetMap = new Map(COLOR_PRESETS.map((c) => [c.value, c]))

/**
 * 根据主色派生 primaryLight / primaryText
 */
export function derivePrimaryVariants(primary: string): { light: string; text: string } {
  const found = presetMap.get(primary)
  if (found) return { light: found.light, text: found.text }
  // fallback: 简单计算（生产中可用 chroma.js）
  return { light: '#eff6ff', text: primary }
}

/* ── 亮色 / 暗色基础令牌 ─────────────────────────────────────── */
const LIGHT_TOKENS: Omit<RendererThemeTokens, 'primary' | 'primaryLight' | 'primaryText'> = {
  // 亮色层次：页面底色略灰，surface 纯白，避免导航/侧栏/内容区“全白一片”
  bg: '#f7f8fa',
  bg2: '#ffffff',
  bg3: '#f1f5f9',
  surface: '#ffffff',
  border: '#e2e8f0',
  border2: '#cbd5e1',
  text: '#0f172a',
  text2: '#475569',
  text3: '#94a3b8',
  navbarHeight: '60px',
  sidebarWidth: '260px',
  fontSans: "'Outfit', system-ui, sans-serif",
  fontMono: "'DM Mono', ui-monospace, monospace",
  fontSerif: "'Instrument Serif', Georgia, serif",
  radius: '8px',
  radius2: '12px',
  shadow: '0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04)',
  shadow2: '0 4px 16px rgba(0,0,0,0.08)',
}

const DARK_TOKENS: Partial<RendererThemeTokens> = {
  bg: '#0c0e14',
  bg2: '#131520',
  bg3: '#1a1d2e',
  surface: '#151824',
  border: '#242840',
  border2: '#2d3250',
  text: '#e8ecf8',
  text2: '#8892b0',
  text3: '#4a5278',
  shadow: '0 1px 3px rgba(0,0,0,0.3)',
  shadow2: '0 4px 20px rgba(0,0,0,0.4)',
}

/**
 * 获取暗色模式覆盖变量
 */
export function getRendererDarkVars(): Record<string, string> {
  const vars: Record<string, string> = {}
  for (const [k, v] of Object.entries(DARK_TOKENS)) {
    vars[`--${camelToKebab(k)}`] = v as string
  }
  return vars
}

/**
 * 构建渲染器 CSS 变量对象
 */
export function buildRendererCssVars(
  config: SiteRendererConfig,
  mode: ThemeMode = 'light'
): CSSProperties {
  const primary = config.theme.primary
  const { light, text } = derivePrimaryVariants(primary)

  const base: Record<string, string> = {
    '--primary': primary,
    '--primary-light': light,
    '--primary-text': text,
    '--navbar-h': '60px',
    '--sidebar-w': config.sidebar.width + 'px',
    '--font-sans': config.theme.fontSans
      ? `'${config.theme.fontSans}', system-ui, sans-serif`
      : LIGHT_TOKENS.fontSans,
    '--font-mono': LIGHT_TOKENS.fontMono,
    '--font-serif': LIGHT_TOKENS.fontSerif,
    '--r': LIGHT_TOKENS.radius,
    '--r2': LIGHT_TOKENS.radius2,
  }

  // 注入基础色彩
  const tokens = mode === 'dark' ? { ...LIGHT_TOKENS, ...DARK_TOKENS } : LIGHT_TOKENS
  for (const [k, v] of Object.entries(tokens)) {
    const varName = `--${camelToKebab(k)}`
    if (!base[varName]) base[varName] = v
  }

  return base as CSSProperties
}

/**
 * 与可视化构建器一致：下拉子项高亮时用父级 id 取侧栏树。
 */
export function resolveSidebarTreeNavId(links: NavbarLinkItem[], rawNavId: string): string {
  if (!rawNavId) return links[0]?.id || ''
  for (const l of links) {
    if (l.id === rawNavId) return rawNavId
    if (l.type === 'dropdown' && l.children?.length) {
      if (l.children.some((c) => c.id === rawNavId)) return l.id
    }
  }
  return rawNavId
}

/**
 * 在 treesByNavId 中查找侧栏时的 key 顺序：
 * 先用当前顶栏高亮 id（下拉子项可单独作为宿主），再用 resolveSidebarTreeNavId 得到的父级 id。
 * 否则会出现：子项未绑页、树挂在子 id 上，但只查父 id → 映射未命中 → 侧栏被清空。
 */
export function sidebarTreeMapKeysForLookup(links: NavbarLinkItem[], rawNavId: string): string[] {
  const raw = rawNavId || (links[0]?.id ?? '')
  if (!raw) return []
  const resolved = resolveSidebarTreeNavId(links, raw)
  return raw !== resolved ? [raw, resolved] : [resolved]
}

/** 顶栏高亮项（顶层或下拉子项） */
export function findNavbarItemByNavId(
  links: NavbarLinkItem[],
  rawNavId: string
): NavbarLinkItem | NavbarSubLinkItem | null {
  if (!rawNavId) return null
  for (const l of links) {
    if (l.id === rawNavId) return l
    const ch = l.children?.find((c) => c.id === rawNavId)
    if (ch) return ch
  }
  return null
}

function walkSidebarMenuForFirstPageId(nodes: SidebarMenuNode[] | undefined): string | null {
  if (!nodes?.length) return null
  for (const n of nodes) {
    if (n.pageId) return n.pageId
    const d = walkSidebarMenuForFirstPageId(n.children)
    if (d) return d
  }
  return null
}

/** 侧栏分组树中第一个可导航的 pageId */
export function firstPageIdInSidebarTree(tree: SidebarSection[]): string | null {
  for (const sec of tree) {
    const d = walkSidebarMenuForFirstPageId(sec.children)
    if (d) return d
  }
  return null
}

export function sidebarTreeContainsPageId(tree: SidebarSection[], pageId: string): boolean {
  if (!pageId) return false
  function walk(nodes: SidebarMenuNode[] | undefined): boolean {
    if (!nodes?.length) return false
    for (const n of nodes) {
      if (n.pageId === pageId) return true
      if (walk(n.children)) return true
    }
    return false
  }
  for (const sec of tree) {
    if (walk(sec.children)) return true
  }
  return false
}

/**
 * 根据当前顶栏项解析展示用的侧栏 tree（与 KbSiteVisualBuilder 中 per-nav 菜单一致）。
 * - 有 treesByNavId：按「当前高亮 id → 父级 id」顺序匹配宿主键（与搭建器下拉子项宿主一致）。
 * - 键不在映射中且当前高亮顶栏项绑了 `pageId`：不是侧栏宿主，返回 []（避免用「含当前页的别套树」导致换顶栏侧栏不变）。
 * - 其余无键情况：再用 activePageId 反查所在树，最后回退 `sidebar.tree`（旧数据 / 异常兜底）。
 * - 无 treesByNavId：回退 sidebar.tree（旧版单树发布）。
 */
export function pickSidebarTreeForActiveNav(
  config: SiteRendererConfig,
  rawNavId: string,
  activePageId?: string
): SidebarSection[] {
  const byNav = config.sidebar.treesByNavId
  const links = config.navbar.links
  const raw = rawNavId || (links[0]?.id ?? '')
  if (byNav && Object.keys(byNav).length > 0) {
    for (const k of sidebarTreeMapKeysForLookup(links, raw)) {
      if (Object.prototype.hasOwnProperty.call(byNav, k)) return byNav[k] || []
    }

    const navItem = findNavbarItemByNavId(links, raw)
    if (navItem && navItem.pageId) return []

    const pid = activePageId?.trim() || ''
    if (pid) {
      for (const t of Object.values(byNav)) {
        if (t?.length && sidebarTreeContainsPageId(t, pid)) return t
      }
    }
    const fallback = config.sidebar.tree || []
    if (fallback.length) return fallback
    return []
  }
  return config.sidebar.tree || []
}

/**
 * 从 builder 的 AreaConfigMap + SiteThemeConfig 转换为 SiteRendererConfig
 * 适配器层，使渲染器可以消费 builder 数据
 */
export function buildRendererConfig(builderData: {
  areaConfig?: any
  siteTheme?: any
  navTree?: any[]
  pages?: Record<string, any>
  slots?: Record<string, any>
}): SiteRendererConfig {
  const { areaConfig, siteTheme, navTree, pages, slots } = builderData

  const header = areaConfig?.header || {}
  const sidebar = areaConfig?.sidebar || {}
  const content = areaConfig?.content || {}
  const footer = areaConfig?.footer || {}

  return {
    themeId: 'docs',
    theme: {
      primary: siteTheme?.blockBase?.accentColor || '#2563eb',
      darkMode: false,
    },
    navbar: {
      brand: header.title || 'Site',
      style: 'solid',
      showSearch: header.showSearch ?? true,
      links: [],
    },
    sidebar: {
      width: sidebar.width || 260,
      collapsible: true,
      tree: navTree ? convertNavTreeToSidebarTree(navTree) : [],
    },
    content: {
      maxWidth: content.maxWidth ? `${content.maxWidth}px` : '760px',
      showToc: true,
    },
    footer: {
      visible: footer.visible ?? true,
      copyright: footer.note || '',
      links: [],
    },
    slots: slots || {},
    pages: pages || {},
  }
}

/**
 * 将扁平 NavNode 树转为渲染器 SidebarSection 格式
 */
export function convertNavTreeToSidebarTree(
  navNodes: any[]
): SiteRendererConfig['sidebar']['tree'] {
  if (!navNodes?.length) return []

  return [
    {
      id: 'default',
      children: navNodes.map((node) => ({
        id: String(node.id || node.navId),
        label: node.title || node.label || '',
        icon: node.icon,
        badge: node.badge,
        expanded: false,
        children: node.children?.length
          ? node.children.map((child: any) => ({
              id: String(child.id || child.navId),
              label: child.title || child.label || '',
              icon: child.icon,
              badge: child.badge,
            }))
          : undefined,
      })),
    },
  ]
}

/* ── 内部工具 ──────────────────────────────────────────────────── */
function camelToKebab(str: string): string {
  return str.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase()
}

/* ══════════════════════════════════════════════════════════════════
 * PersistedSiteConfig → SiteRendererConfig 适配器
 * 将 builder 的持久化配置转换为渲染器可消费的扁平模型
 * ══════════════════════════════════════════════════════════════════ */

/**
 * 核心适配器：PersistedSiteConfig → SiteRendererConfig
 */
export function persistedConfigToRendererConfig(
  psc: PersistedSiteConfig,
  overrides?: { darkMode?: boolean }
): SiteRendererConfig {
  const layoutId = psc.layout.layoutId
  const docsLayout = layoutId === 'docs' ? (psc.layout as DocsLayoutConfig) : null
  const landingLayout = layoutId === 'landing' ? (psc.layout as LandingLayoutConfig) : null

  return {
    themeId: layoutId,
    theme: {
      primary: String(psc.theme.tokens.primary || '#2563eb'),
      darkMode: overrides?.darkMode ?? psc.theme.mode === 'dark',
      fontSans: String(psc.theme.tokens.fontSans || ''),
    },
    navbar: convertNavbar(psc),
    sidebar: convertSidebar(psc, docsLayout),
    content: {
      maxWidth: docsLayout?.content.maxWidth || '760px',
      showToc: docsLayout?.content.showToc ?? true,
    },
    footer: {
      visible: layoutId === 'docs'
        ? (docsLayout?.footer.visible ?? true)
        : layoutId === 'landing'
          ? (landingLayout?.footer.visible ?? true)
          : true,
      copyright: `© ${new Date().getFullYear()} ${psc.navigation.navbar.brand.name}`,
      links: psc.navigation.navbar.items
        .filter((item): item is Extract<NavItem, { kind: 'link' }> => item.kind === 'link')
        .slice(0, 3)
        .map((item) => ({ label: item.label, href: item.href })),
    },
    landingConfig: landingLayout
      ? {
          badgeText: landingLayout.hero.badgeText,
          heroTitle: landingLayout.hero.title,
          heroSubtitle: landingLayout.hero.subtitle,
          actions: (landingLayout.hero.actions || []).map((a) => ({
            id: a.id,
            label: a.label,
            type: a.type,
            href: a.href,
          })),
          features: (landingLayout.features?.items || []).map((f) => ({
            icon: f.icon || '📦',
            name: f.name,
            desc: f.desc || '',
            color: f.color,
          })),
        }
      : undefined,
    slots: convertSlots(psc.slots),
    pages: convertPages(psc.content.pages),
  }
}

function convertNavbar(psc: PersistedSiteConfig): SiteRendererConfig['navbar'] {
  const docsLayout = psc.layout.layoutId === 'docs' ? (psc.layout as DocsLayoutConfig) : null
  return {
    brand: psc.navigation.navbar.brand.name,
    brandLogo: psc.navigation.navbar.brand.logoText,
    style: (docsLayout?.navbar.style as any) || 'solid',
    showSearch: docsLayout?.navbar.showSearch ?? false,
    links: psc.navigation.navbar.items.map((item) => {
      if (item.kind === 'group') {
        return {
          id: item.id,
          label: item.label,
          icon: item.icon,
          type: 'dropdown' as const,
          children: item.children.map((child) => ({
            id: child.id,
            label: child.label,
            icon: child.icon,
            href: child.href,
            type: (child.type === 'cta' ? 'link' : child.type || 'link') as 'link' | 'external' | undefined,
          })),
        }
      }
      return {
        id: item.id,
        label: item.label,
        icon: item.icon,
        href: item.href,
        type: (item.type === 'cta' ? 'link' : item.type || 'link') as 'link' | 'external' | undefined,
      }
    }),
  }
}

function convertSidebar(
  psc: PersistedSiteConfig,
  docsLayout: DocsLayoutConfig | null
): SiteRendererConfig['sidebar'] {
  const sections = psc.navigation.sidebar?.sections || []
  return {
    width: docsLayout?.sidebar.width || 260,
    collapsible: docsLayout?.sidebar.collapsible ?? true,
    defaultCollapsed: docsLayout?.sidebar.defaultCollapsed,
    tree: sections.map((section) => ({
      id: section.id,
      groupLabel: section.groupLabel,
      children: convertSidebarItems(section.items),
    })),
  }
}

function convertSidebarItems(items: SidebarNode[]): SiteRendererConfig['sidebar']['tree'][0]['children'] {
  return items.map((item) => {
    if (item.kind === 'group') {
      return {
        id: item.id,
        label: item.label,
        icon: item.icon,
        badge: item.badge,
        expanded: false,
        children: item.children.map((child) => ({
          id: child.id,
          label: child.label,
          icon: child.icon,
          badge: child.badge,
          pageId: child.pageId,
        })),
      }
    }
    return {
      id: item.id,
      label: item.label,
      icon: item.icon,
      badge: item.badge,
      pageId: item.pageId,
    }
  })
}

function convertSlots(slots: SlotInstance[]): Record<string, SlotComponentInstance> {
  const result: Record<string, SlotComponentInstance> = {}
  for (const slot of slots) {
    if (!slot.visible) continue
    // 按 slotKey 分组，取第一个可见的
    if (!result[slot.slotKey]) {
      result[slot.slotKey] = {
        instanceId: slot.id,
        componentKey: slot.componentKey,
        visible: slot.visible,
        props: { ...slot.props },
      }
    }
  }
  return result
}

function convertPages(pages: SitePage[]): Record<string, PageData> {
  const result: Record<string, PageData> = {}
  for (const page of pages) {
    result[page.id] = {
      id: page.id,
      title: page.title,
      description: page.description,
      html: page.bodyHtml || markdownToSimpleHtml(page.body),
      toc: page.toc?.map((t) => ({ id: t.id, text: t.text, level: t.level })),
      category: page.category,
      author: page.author,
      heroEmoji: page.heroEmoji,
      updatedAt: page.updatedAt,
      readTime: page.readTime,
      meta: page.meta,
    }
  }
  return result
}

/**
 * 简易 markdown → HTML（仅处理标题和段落，生产中应使用 marked）
 */
function markdownToSimpleHtml(md?: string): string | undefined {
  if (!md) return undefined
  return md
    .split(/\n\n+/)
    .map((block) => {
      const h2 = /^## (.+)$/.exec(block.trim())
      if (h2) return `<h2>${h2[1]}</h2>`
      const h3 = /^### (.+)$/.exec(block.trim())
      if (h3) return `<h3>${h3[1]}</h3>`
      return `<p>${block.trim()}</p>`
    })
    .join('\n')
}

/**
 * 根据 sidebar pageId 查找对应的 SitePage
 */
export function findPageIdFromSidebar(
  psc: PersistedSiteConfig,
  sidebarItemId: string
): string | undefined {
  for (const section of psc.navigation.sidebar?.sections || []) {
    for (const item of section.items) {
      if (item.kind === 'item' && item.id === sidebarItemId) return item.pageId
      if (item.kind === 'group') {
        const child = item.children.find((c) => c.id === sidebarItemId)
        if (child) return child.pageId
      }
    }
  }
  return undefined
}

/**
 * 根据 navbar routeKey 查找对应的 page id
 */
export function findPageIdByRouteKey(
  psc: PersistedSiteConfig,
  routeKey: string
): string | undefined {
  return psc.content.pages.find((p) => p.routeKey === routeKey)?.id
}

/**
 * 导航为外部链接时在浏览器中打开。
 * - `type === 'external'` 且 href 为 http(s) / // → 新标签页
 * - `type === 'external'` 且 mailto / tel → 当前窗口跳转
 * - 非 external 但未绑定 pageId 且 href 为绝对网址 → 新标签页（兼容配置）
 * @returns 是否已按外部链接处理（调用方仍应 preventDefault 并 emit nav-click 以更新高亮）
 */
export function tryOpenNavbarExternalLink(
  item: NavbarLinkItem | { type?: string; href?: string; pageId?: string; externalOpen?: 'same' | 'blank' }
): boolean {
  const href = (item.href || '').trim()
  if (!href) return false

  const isExternalType = item.type === 'external'
  const openTarget = item.externalOpen === 'same' ? 'same' : 'blank'
  const mailOrTel = /^mailto:/i.test(href) || /^tel:/i.test(href)
  const httpLike = /^https?:\/\//i.test(href) || href.startsWith('//')

  if (isExternalType && mailOrTel) {
    window.location.assign(href)
    return true
  }
  if (isExternalType && httpLike) {
    const url = href.startsWith('//') ? `https:${href}` : href
    if (openTarget === 'same') window.location.assign(url)
    else window.open(url, '_blank', 'noopener,noreferrer')
    return true
  }

  if (!isExternalType && !item.pageId && httpLike) {
    const url = href.startsWith('//') ? `https:${href}` : href
    window.open(url, '_blank', 'noopener,noreferrer')
    return true
  }

  return false
}
