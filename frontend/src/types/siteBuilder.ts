export type PreviewMode = 'draft' | 'published'
export type AreaKey = 'header' | 'sidebar' | 'content' | 'toc' | 'footer'
export type CanvasSlot = 'top' | 'left' | 'center' | 'right' | 'bottom'
export type BuilderComponentType = AreaKey
export type NavMenuCode = 'header' | 'sidebar'
export type FooterPagerSource = 'follow-sidebar' | NavMenuCode
export type ThemePresetId = 'docs-light' | 'docs-clean' | 'docs-enterprise'
export type ThemeSchemeKind = 'builtin' | 'custom'
export type BuilderDataSourceKind = 'nav-tree' | 'document' | 'toc' | 'pager'
export type SchemaFieldType = 'text' | 'textarea' | 'number' | 'range' | 'color' | 'switch' | 'select'

export interface TocItem {
  id: string
  text: string
  level: number
}

export interface BlockThemeTokens {
  fontFamily: string
  textColor: string
  mutedColor: string
  accentColor: string
  backgroundColor: string
  borderColor: string
  borderRadius: number
  paddingX: number
  paddingY: number
  titleSize: number
}

export type BlockThemeOverrides = Partial<BlockThemeTokens>

export interface SiteThemeConfig {
  presetId: ThemePresetId
  pageBackground: string
  canvasBackground: string
  toolbarBackground: string
  dividerColor: string
  studioPanelBg: string
  studioPanelBorder: string
  studioPanelShadow: string
  studioEyebrowBg: string
  studioEyebrowText: string
  studioChipBg: string
  studioChipText: string
  studioMutedChipText: string
  headerBrandText: string
  headerSearchBg: string
  headerSearchText: string
  headerIconBorder: string
  headerActionBg: string
  headerActionText: string
  headerKbdBg: string
  headerKbdText: string
  headerNavText: string
  headerNavActiveText: string
  headerNavActiveBg: string
  headerNavGap: number
  inlineAddBg: string
  inlineAddText: string
  inlineAddShadow: string
  placeholderBorder: string
  placeholderBg: string
  materialMenuBorder: string
  tocHoverBg: string
  tocTextColor: string
  tocActiveText: string
  tocItemRadius: number
  pageCardBg: string
  pageMetaText: string
  pageCardBorder: string
  pageCardRadius: number
  materialMenuBg: string
  materialMenuItemBg: string
  materialMenuItemBorder: string
  materialMenuItemText: string
  materialMenuItemMutedText: string
  blockSurface: string
  blockBorder: string
  blockShadow: string
  blockHoverBorder: string
  blockSelectedBorder: string
  blockSelectedRing: string
  contentProseColor: string
  contentHeadingColor: string
  contentQuoteBorder: string
  contentQuoteText: string
  sidebarGroupText: string
  sidebarItemHoverBg: string
  sidebarItemActiveBg: string
  sidebarItemActiveText: string
  sidebarRailColor: string
  emptyTextColor: string
  contentTitleLetterSpacing: number
  blockBase: BlockThemeTokens
}

export interface ThemeScheme {
  id: string
  name: string
  kind: ThemeSchemeKind
  theme: SiteThemeConfig
}

export interface BuilderDataSourceOption {
  id: string
  label: string
  kind: BuilderDataSourceKind
  description?: string
  linkedComponentTypes?: BuilderComponentType[]
}

export interface BuilderDataSource {
  id: string
  kind: BuilderDataSourceKind
  label: string
  description?: string
  payload: Record<string, any>
}

export interface BuilderComponentBinding {
  key: string
  sourceId: string | null
}

export interface BuilderComponentInstance<TConfig = unknown> {
  id: string
  type: BuilderComponentType
  slot: CanvasSlot | null
  name: string
  config: TConfig
  bindings: BuilderComponentBinding[]
}

export interface SchemaFieldOption {
  label: string
  value: string | number | boolean
}

export interface SchemaField {
  key: string
  label: string
  type: SchemaFieldType
  min?: number
  max?: number
  step?: number
  placeholder?: string
  options?: SchemaFieldOption[]
  description?: string
}

export interface BuilderBindingDefinition {
  key: string
  label: string
  sourceKinds: BuilderDataSourceKind[]
  description?: string
  createPayload?: Record<string, any>
}

export interface HeaderAreaConfig {
  title: string
  visible: boolean
  sticky: boolean
  showLogo: boolean
  showSearch: boolean
  showLanguage: boolean
  showTheme: boolean
  navMenuCode: NavMenuCode
  themeOverrides: BlockThemeOverrides
}

export interface SidebarAreaConfig {
  title: string
  visible: boolean
  sticky: boolean
  width: number
  navMenuCode: NavMenuCode
  themeOverrides: BlockThemeOverrides
}

export interface ContentAreaConfig {
  title: string
  visible: boolean
  maxWidth: number
  themeOverrides: BlockThemeOverrides
}

export interface TocAreaConfig {
  title: string
  visible: boolean
  sticky: boolean
  width: number
  themeOverrides: BlockThemeOverrides
}

export interface FooterAreaConfig {
  title: string
  visible: boolean
  note: string
  showPager: boolean
  pagerSource: FooterPagerSource
  themeOverrides: BlockThemeOverrides
}

export interface AreaConfigMap {
  header: HeaderAreaConfig
  sidebar: SidebarAreaConfig
  content: ContentAreaConfig
  toc: TocAreaConfig
  footer: FooterAreaConfig
}
