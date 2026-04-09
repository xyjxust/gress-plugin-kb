// ── Site Renderer 独立类型系统 ──────────────────────────────────
// 与 builder 的 AreaConfigMap / SiteThemeConfig 解耦，渲染器可独立工作

/* ── 主题 & 布局标识 ───────────────────────────────────────────── */
export type ThemeLayoutId = 'docs' | 'blog' | 'landing' | (string & {})
export type NavbarStyle = 'solid' | 'blur' | 'transparent'
export type ThemeMode = 'light' | 'dark'
export type CTAType = 'primary' | 'secondary' | 'link'

/* ── 颜色令牌 ──────────────────────────────────────────────────── */
export interface ColorTokens {
  primary: string
  primaryLight: string
  primaryText: string
  bg: string
  bg2: string
  bg3: string
  surface: string
  border: string
  border2: string
  text: string
  text2: string
  text3: string
}

/* ── 主题配置 ──────────────────────────────────────────────────── */
export interface RendererThemeTokens extends ColorTokens {
  navbarHeight: string
  sidebarWidth: string
  fontSans: string
  fontMono: string
  fontSerif: string
  radius: string
  radius2: string
  shadow: string
  shadow2: string
  [key: string]: string
}

/* ── Navbar ─────────────────────────────────────────────────────── */
/** 下拉菜单内的子项：仅普通链接或外部链接，不再嵌套下拉 */
export interface NavbarSubLinkItem {
  id: string
  label: string
  icon?: string
  href?: string
  pageId?: string
  type?: 'link' | 'external'
  /** 外部链接：same=当前窗口，blank=新标签页 */
  externalOpen?: 'same' | 'blank'
}

export type NavbarExternalOpen = 'same' | 'blank'

export interface NavbarLinkItem {
  id: string
  label: string
  icon?: string
  href?: string
  /** 构建器：绑定的页面 id，用于预览联动 */
  pageId?: string
  type?: 'link' | 'dropdown' | 'external'
  active?: boolean
  children?: NavbarSubLinkItem[]
  /** 顶层外部链接打开方式 */
  externalOpen?: NavbarExternalOpen
}

export interface NavbarConfig {
  brand: string
  brandLogo?: string
  brandHref?: string
  style: NavbarStyle
  showSearch: boolean
  links: NavbarLinkItem[]
}

/* ── Sidebar ───────────────────────────────────────────────────── */
/** 侧栏菜单节点（无限层级：有 children 时可折叠，叶子可带 pageId） */
export interface SidebarMenuNode {
  id: string
  label: string
  icon?: string
  badge?: string
  pageId?: string
  href?: string
  expanded?: boolean
  children?: SidebarMenuNode[]
}

/** @deprecated 与 SidebarMenuNode 相同，保留别名以兼容旧代码 */
export type SidebarTreeNode = SidebarMenuNode
/** @deprecated 与 SidebarMenuNode 相同 */
export type SidebarChildNode = SidebarMenuNode

export interface SidebarSection {
  id: string
  groupLabel?: string
  children: SidebarMenuNode[]
}

export interface SidebarConfig {
  width: number
  collapsible: boolean
  defaultCollapsed?: boolean
  tree: SidebarSection[]
  /**
   * 顶栏「侧栏宿主」导航 id（与 NavbarLinkItem.id 一致；下拉子项会解析为父级 id）→ 侧栏分组树。
   * 由可视化构建器在发布时写入；存在时渲染器按 activeNavId 切换 tree，与搭建器行为一致。
   */
  treesByNavId?: Record<string, SidebarSection[]>
}

/* ── SEO（站点 / 页面，供宿主注入 <head> 或 SSR）────────────────── */
export interface SiteSeoConfig {
  /** 用于 title 模板占位 {siteName}；不填时可回退为 navbar.brand */
  siteName?: string
  /**
   * 标题模板，占位：`{title}` 页面标题，`{siteName}` 站点名。
   * 例：`{title} · {siteName}`、`{title} | Docs`
   */
  titleTemplate?: string
  /** 全站默认 meta description */
  defaultDescription?: string
  /** 默认 og:image / twitter:image（建议绝对 URL） */
  defaultOgImage?: string
  /** favicon 地址 */
  faviconUrl?: string
  /** Twitter @site 或展示用 */
  twitterSite?: string
}

export interface PageSeoConfig {
  /** 覆盖 <title>；不填则用页面 title + 站点 titleTemplate */
  metaTitle?: string
  /** 覆盖 meta description；不填则用页面 description 或站点 defaultDescription */
  metaDescription?: string
  /** 本页 og:image（建议绝对 URL） */
  ogImage?: string
  /** canonical URL（绝对 URL 或路径） */
  canonical?: string
  /** 为 true 时输出 noindex */
  noindex?: boolean
}

/* ── Content ───────────────────────────────────────────────────── */
export interface ContentConfig {
  maxWidth: string
  showToc: boolean
}

/* ── Footer ────────────────────────────────────────────────────── */
export interface FooterLink {
  label: string
  href?: string
}

export interface FooterConfig {
  visible: boolean
  copyright: string
  links: FooterLink[]
}

/* ── Landing 专用 ──────────────────────────────────────────────── */
export interface CTAAction {
  id: string
  label: string
  type: CTAType
  icon?: string
  href?: string
}

export interface FeatureItem {
  icon: string
  name: string
  desc: string
  color?: string
}

export interface LandingConfig {
  badgeText?: string
  heroTitle?: string
  heroSubtitle?: string
  actions: CTAAction[]
  featuresLabel?: string
  featuresTitle?: string
  features: FeatureItem[]
}

/* ── 插槽组件 ──────────────────────────────────────────────────── */
export interface SlotComponentInstance {
  instanceId: string
  componentKey: string
  visible?: boolean
  props: Record<string, any>
}

/* ── 页面数据 ──────────────────────────────────────────────────── */
export interface TocItem {
  id: string
  text: string
  level: 'h2' | 'h3' | 'h4'
}

export interface PageData {
  id: string
  title: string
  /** 站点内唯一的路径片段，用于生成可分享 URL，例如 getting-started */
  slug?: string
  description?: string
  html?: string
  toc?: TocItem[]
  category?: string
  author?: string
  heroEmoji?: string
  updatedAt?: string
  readTime?: number
  /** 页面级 SEO；与 meta 并存，宿主应优先读 seo 再回退 description */
  seo?: PageSeoConfig
  /**
   * 扩展字段示例（与文档列表 KbDocList / kbApi 同源时）：
   * - meta.kbDocListSource — 由站点搭建器写入，正文由 KbRendererContent + KbDocBody 渲染
   * - meta.kbDoc — getDoc 返回的正文快照
   * - meta.kbDocLoading — 拉取中文档详情
   */
  meta?: Record<string, any>
}

/* ── 站点渲染器总配置 ─────────────────────────────────────────── */
export interface SiteRendererConfig {
  themeId: ThemeLayoutId
  theme: {
    primary: string
    darkMode: boolean
    fontSans?: string
  }
  /** 站点级 SEO；可选，由搭建器或后端合并 */
  seo?: SiteSeoConfig
  navbar: NavbarConfig
  sidebar: SidebarConfig
  content: ContentConfig
  footer: FooterConfig
  landingConfig?: LandingConfig
  slots: Record<string, SlotComponentInstance>
  pages: Record<string, PageData>
}

/* ── 主题清单（注册表用） ─────────────────────────────────────── */
export interface ThemeManifest {
  id: ThemeLayoutId
  name: string
  icon: string
  regions: string[]
  slots: string[]
  defaultPageId?: string
}

/* ── 颜色预设 ──────────────────────────────────────────────────── */
export interface ColorPreset {
  name: string
  value: string
  light: string
  text: string
}
