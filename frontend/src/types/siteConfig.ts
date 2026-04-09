export type SiteType = 'docs' | 'blog' | 'landing' | string
export type SiteStatus = 'draft' | 'published'
export type ThemeMode = 'light' | 'dark' | 'system'
export type LayoutId = 'docs' | 'blog' | 'landing' | string

export interface SiteDocument {
  id: string
  siteId: string
  title: string
  slug: string
  status: SiteStatus
  version: number
  config: PersistedSiteConfig
  createdAt: string
  updatedAt: string
}

export interface PersistedSiteConfig {
  meta: SiteMeta
  theme: SiteThemeConfig
  layout: SiteLayoutConfig
  navigation: SiteNavigationConfig
  content: SiteContentConfig
  slots: SlotInstance[]
  bindings: SiteBinding[]
}

export interface SiteMeta {
  siteName: string
  siteType: SiteType
  description?: string
  defaultRoute?: string
  locales?: string[]
}

export interface SiteThemeConfig {
  themeId: string
  mode: ThemeMode
  tokens: Record<string, string | number | boolean>
  customTokens?: Record<string, string | number | boolean>
}

export interface LayoutRegionConfig {
  regionId: string
  regionType: string
  label: string
  visible: boolean
  order: number
  props?: Record<string, any>
}

export interface DocsLayoutConfig {
  layoutId: 'docs'
  regions: LayoutRegionConfig[]
  navbar: {
    style: 'solid' | 'blur' | 'transparent'
    showSearch: boolean
    sticky: boolean
  }
  sidebar: {
    width: number
    collapsible: boolean
    defaultCollapsed?: boolean
  }
  content: {
    maxWidth: string
    showToc: boolean
  }
  footer: {
    visible: boolean
  }
}

export interface BlogLayoutConfig {
  layoutId: 'blog'
  regions: LayoutRegionConfig[]
  navbar: {
    style: 'solid' | 'transparent'
    sticky: boolean
  }
  content: {
    maxWidth: string
    showHero: boolean
    showAuthor: boolean
  }
  footer: {
    visible: boolean
  }
}

export interface LandingLayoutConfig {
  layoutId: 'landing'
  regions: LayoutRegionConfig[]
  navbar: {
    style: 'solid' | 'transparent'
    sticky: boolean
  }
  hero: {
    badgeText?: string
    title?: string
    subtitle?: string
    actions?: CTAAction[]
  }
  features: {
    items: FeatureItem[]
  }
  footer: {
    visible: boolean
  }
}

export type SiteLayoutConfig = DocsLayoutConfig | BlogLayoutConfig | LandingLayoutConfig

export interface CTAAction {
  id: string
  label: string
  type: 'primary' | 'secondary' | 'link'
  href?: string
  action?: string
}

export interface FeatureItem {
  id: string
  icon?: string
  name: string
  desc?: string
  color?: string
}

export interface SiteNavigationConfig {
  navbar: NavbarConfig
  sidebar?: SidebarConfig
}

export interface NavbarConfig {
  brand: BrandConfig
  items: NavItem[]
}

export interface BrandConfig {
  name: string
  logoText?: string
  logoImage?: string
  href?: string
}

export type NavItem = NavbarLinkItem | NavbarGroupItem

export interface NavbarLinkItem {
  id: string
  kind: 'link'
  label: string
  icon?: string
  href?: string
  routeKey?: string
  activeRule?: string
  type?: 'link' | 'cta'
}

export interface NavbarGroupItem {
  id: string
  kind: 'group'
  label: string
  icon?: string
  children: NavbarLinkItem[]
}

export interface SidebarConfig {
  mode: 'tree'
  sections: SidebarSection[]
}

export interface SidebarSection {
  id: string
  groupLabel?: string
  navbarItemId?: string
  items: SidebarNode[]
}

export type SidebarNode = SidebarLeafNode | SidebarBranchNode

export interface SidebarLeafNode {
  id: string
  kind: 'item'
  label: string
  icon?: string
  badge?: string
  pageId?: string
  href?: string
}

export interface SidebarBranchNode {
  id: string
  kind: 'group'
  label: string
  icon?: string
  badge?: string
  children: SidebarLeafNode[]
}

export interface SiteContentConfig {
  pages: SitePage[]
}

export interface SitePage {
  id: string
  routeKey: string
  title: string
  description?: string
  body?: string
  bodyHtml?: string
  toc?: TocItem[]
  category?: string
  author?: string
  heroEmoji?: string
  updatedAt?: string
  readTime?: number
  meta?: Record<string, any>
}

export interface TocItem {
  id: string
  text: string
  level: 'h2' | 'h3' | 'h4'
}

export interface SlotInstance {
  id: string
  slotKey: string
  componentKey: string
  visible: boolean
  order: number
  props: Record<string, any>
  style?: Record<string, any>
  bindings?: ComponentBinding[]
}

export interface ComponentBinding {
  key: string
  source: BindingSource
}

export interface BindingSource {
  type: 'siteMeta' | 'theme' | 'navbar' | 'sidebar' | 'page' | 'slot' | 'custom'
  path: string
  fallback?: any
}

export interface SiteBinding {
  id: string
  target: {
    scope: 'layout' | 'navigation' | 'content' | 'slot'
    id?: string
    path: string
  }
  source: BindingSource
}

export interface SlotDefinition {
  slotKey: string
  label: string
  layoutIds: LayoutId[]
  multiple: boolean
  allowedComponents: string[]
}

export type SchemaFieldType = 'text' | 'textarea' | 'number' | 'switch' | 'select' | 'color' | 'json'

export interface SchemaField {
  key: string
  label: string
  type: SchemaFieldType
  description?: string
  placeholder?: string
  options?: Array<{ label: string; value: string | number | boolean }>
}

export interface SlotComponentSchema {
  componentKey: string
  label: string
  propsSchema: SchemaField[]
  defaultProps: Record<string, any>
}

export interface SiteRuntimeState {
  activeNavbarItemId?: string
  activeSidebarItemId?: string
  activePageId?: string
  expandedSidebarGroupIds: string[]
  sidebarOpen: boolean
  slotVisibility: Record<string, boolean>
  resolvedThemeMode: 'light' | 'dark'
}

export type BuilderPaneId =
  | 'site'
  | 'theme'
  | 'layout'
  | 'navbar'
  | 'sidebar'
  | 'pages'
  | 'slots'
  | 'bindings'

export interface BuilderTreeNode {
  id: string
  paneId: BuilderPaneId
  label: string
  targetPath?: string
  children?: BuilderTreeNode[]
}

export interface LayoutManifest {
  id: LayoutId
  label: string
  description: string
  regionTypes: string[]
  slotKeys: string[]
}

export interface SiteConfigValidationIssue {
  id: string
  level: 'error' | 'warning'
  message: string
  path: string
}

export type InspectorFieldType =
  | 'text'
  | 'textarea'
  | 'select'
  | 'switch'
  | 'slider'
  | 'color'
  | 'readonly'
  | 'custom'

export interface InspectorFieldOption {
  label: string
  value: string | number | boolean
}

export interface InspectorFieldSchema {
  key: string
  label: string
  type: InspectorFieldType
  path?: string
  placeholder?: string
  description?: string
  min?: number
  max?: number
  step?: number
  options?: InspectorFieldOption[]
  customEditorId?: string
}

export interface InspectorSectionSchema {
  id: string
  title: string
  fields: InspectorFieldSchema[]
}
