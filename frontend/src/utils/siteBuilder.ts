import type { CSSProperties } from 'vue'
import type { KbNavNode } from '../types/kb'
import type { BlockThemeOverrides, BlockThemeTokens, SiteThemeConfig, ThemePresetId, ThemeScheme, TocItem } from '../types/siteBuilder'

export interface FlatNavDocItem {
  navId: number
  docId: number
  title: string
}

export function extractTocItems(bodyMd: string): TocItem[] {
  const lines = (bodyMd || '').split(/\r?\n/)
  const items: TocItem[] = []
  lines.forEach((line, index) => {
    const match = /^(#{1,3})\s+(.+)$/.exec(line.trim())
    if (!match) return
    items.push({
      id: `toc-${index}`,
      level: match[1].length,
      text: match[2].replace(/\[(.*?)\]\(.*?\)/g, '$1').replace(/[*_`>#-]/g, '').trim()
    })
  })
  return items
}

export function flattenNavDocItems(list: KbNavNode[]): FlatNavDocItem[] {
  const result: FlatNavDocItem[] = []
  const walk = (nodes: KbNavNode[]) => {
    nodes.forEach((node) => {
      if (node.nodeType === 'DOC' && node.docId) {
        result.push({
          navId: node.id,
          docId: node.docId,
          title: node.title
        })
      }
      if (node.children?.length) walk(node.children)
    })
  }
  walk(list)
  return result
}

export function findPrevNextDocs(list: KbNavNode[], currentDocId: number | null) {
  const flat = flattenNavDocItems(list)
  if (!currentDocId) return { prevDoc: null, nextDoc: null }
  const index = flat.findIndex((item) => item.docId === currentDocId)
  return {
    prevDoc: index > 0 ? flat[index - 1] : null,
    nextDoc: index >= 0 && index < flat.length - 1 ? flat[index + 1] : null
  }
}

export function createBaseBlockTheme(overrides: Partial<BlockThemeTokens> = {}): BlockThemeTokens {
  return {
    fontFamily: '"PingFang SC","Helvetica Neue",Arial,sans-serif',
    textColor: '#1f2937',
    mutedColor: '#6b7280',
    accentColor: '#2563eb',
    backgroundColor: 'transparent',
    borderColor: 'transparent',
    borderRadius: 14,
    paddingX: 18,
    paddingY: 18,
    titleSize: 18,
    ...overrides
  }
}

export function createSiteThemePreset(presetId: ThemePresetId): SiteThemeConfig {
  const base = {
    blockBase: createBaseBlockTheme()
  }
  if (presetId === 'docs-clean') {
    return {
      presetId,
      pageBackground: '#f8f8f5',
      canvasBackground: '#fcfcfa',
      toolbarBackground: 'rgba(252, 252, 250, 0.94)',
      dividerColor: '#e9e7de',
      studioPanelBg: 'rgba(255,255,255,0.88)',
      studioPanelBorder: 'rgba(233,231,222,0.92)',
      studioPanelShadow: '0 20px 48px rgba(15, 23, 42, 0.07)',
      studioEyebrowBg: '#f1f5f9',
      studioEyebrowText: '#64748b',
      studioChipBg: '#eef2f7',
      studioChipText: '#4b5563',
      studioMutedChipText: '#9ca3af',
      headerBrandText: '#111827',
      headerSearchBg: '#f4f1ea',
      headerSearchText: '#8a7d69',
      headerIconBorder: '#e6e0d4',
      headerActionBg: '#ffffff',
      headerActionText: '#5f6368',
      headerKbdBg: '#ffffff',
      headerKbdText: '#8a7d69',
      headerNavText: '#5f6368',
      headerNavActiveText: '#111827',
      headerNavActiveBg: '#f0ece2',
      headerNavGap: 22,
      inlineAddBg: '#2563eb',
      inlineAddText: '#ffffff',
      inlineAddShadow: '0 8px 18px rgba(37,99,235,.22)',
      placeholderBorder: 'rgba(59, 130, 246, 0.18)',
      placeholderBg: 'rgba(255,255,255,0.56)',
      materialMenuBorder: '#e5e7eb',
      tocHoverBg: '#f6f2e8',
      tocTextColor: '#78716c',
      tocActiveText: '#111827',
      tocItemRadius: 10,
      pageCardBg: '#ffffff',
      pageMetaText: '#78716c',
      pageCardBorder: '#e7e2d8',
      pageCardRadius: 18,
      materialMenuBg: 'rgba(255,255,255,0.98)',
      materialMenuItemBg: '#ffffff',
      materialMenuItemBorder: '#e5e7eb',
      materialMenuItemText: '#111827',
      materialMenuItemMutedText: '#64748b',
      blockSurface: 'rgba(255,255,255,0.96)',
      blockBorder: 'rgba(233,231,222,0.95)',
      blockShadow: '0 12px 30px rgba(15,23,42,.05)',
      blockHoverBorder: 'rgba(96,165,250,.24)',
      blockSelectedBorder: '#6aa2ff',
      blockSelectedRing: '0 0 0 2px rgba(96,165,250,.18)',
      contentProseColor: '#2f2f2b',
      contentHeadingColor: '#111827',
      contentQuoteBorder: '#ddd6ca',
      contentQuoteText: '#5b5b5b',
      sidebarGroupText: '#a18b62',
      sidebarItemHoverBg: '#f6f2e8',
      sidebarItemActiveBg: '#f0ece2',
      sidebarItemActiveText: '#111827',
      sidebarRailColor: '#eee7d8',
      emptyTextColor: '#94a3b8',
      contentTitleLetterSpacing: -0.05,
      ...base
    }
  }
  if (presetId === 'docs-enterprise') {
    return {
      presetId,
      pageBackground: '#f5f7fb',
      canvasBackground: '#f5f7fb',
      toolbarBackground: 'rgba(245, 247, 251, 0.96)',
      dividerColor: '#dbe2ea',
      studioPanelBg: 'rgba(255,255,255,0.92)',
      studioPanelBorder: 'rgba(219,226,234,0.96)',
      studioPanelShadow: '0 22px 54px rgba(15, 23, 42, 0.08)',
      studioEyebrowBg: '#e8eefc',
      studioEyebrowText: '#335caa',
      studioChipBg: '#e8eefc',
      studioChipText: '#335caa',
      studioMutedChipText: '#64748b',
      headerBrandText: '#0f172a',
      headerSearchBg: '#eef2f7',
      headerSearchText: '#64748b',
      headerIconBorder: '#cbd5e1',
      headerActionBg: '#ffffff',
      headerActionText: '#475569',
      headerKbdBg: '#ffffff',
      headerKbdText: '#475569',
      headerNavText: '#475569',
      headerNavActiveText: '#1d4ed8',
      headerNavActiveBg: '#e8eefc',
      headerNavGap: 16,
      inlineAddBg: '#1d4ed8',
      inlineAddText: '#ffffff',
      inlineAddShadow: '0 10px 24px rgba(29,78,216,.24)',
      placeholderBorder: 'rgba(37, 99, 235, 0.22)',
      placeholderBg: 'rgba(248,250,252,0.9)',
      materialMenuBorder: '#dbe2ea',
      tocHoverBg: '#e8eefc',
      tocTextColor: '#475569',
      tocActiveText: '#1d4ed8',
      tocItemRadius: 10,
      pageCardBg: '#ffffff',
      pageMetaText: '#64748b',
      pageCardBorder: '#dbe2ea',
      pageCardRadius: 18,
      materialMenuBg: 'rgba(255,255,255,0.99)',
      materialMenuItemBg: '#ffffff',
      materialMenuItemBorder: '#dbe2ea',
      materialMenuItemText: '#0f172a',
      materialMenuItemMutedText: '#64748b',
      blockSurface: 'rgba(255,255,255,0.98)',
      blockBorder: 'rgba(219,226,234,0.96)',
      blockShadow: '0 14px 34px rgba(15,23,42,.06)',
      blockHoverBorder: 'rgba(37,99,235,.26)',
      blockSelectedBorder: '#3b82f6',
      blockSelectedRing: '0 0 0 3px rgba(59,130,246,.16)',
      contentProseColor: '#334155',
      contentHeadingColor: '#0f172a',
      contentQuoteBorder: '#cbd5e1',
      contentQuoteText: '#475569',
      sidebarGroupText: '#335caa',
      sidebarItemHoverBg: '#eff4ff',
      sidebarItemActiveBg: '#e8eefc',
      sidebarItemActiveText: '#0f172a',
      sidebarRailColor: '#d8e2f4',
      emptyTextColor: '#94a3b8',
      contentTitleLetterSpacing: -0.04,
      blockBase: createBaseBlockTheme({
        textColor: '#0f172a',
        mutedColor: '#475569',
        accentColor: '#1d4ed8'
      })
    }
  }
  return {
    presetId,
    pageBackground: '#f6f7f3',
    canvasBackground: '#fbfbf8',
    toolbarBackground: 'rgba(251,251,248,0.96)',
    dividerColor: '#ece9dd',
    studioPanelBg: 'rgba(255,255,255,0.96)',
    studioPanelBorder: 'rgba(236,233,221,0.92)',
    studioPanelShadow: '0 14px 40px rgba(15, 23, 42, 0.04)',
    studioEyebrowBg: '#f5f1e7',
    studioEyebrowText: '#8a7551',
    studioChipBg: '#f2eee5',
    studioChipText: '#5f6368',
    studioMutedChipText: '#a1a1aa',
    headerBrandText: '#111827',
    headerSearchBg: '#f6f3eb',
    headerSearchText: '#8a7d69',
    headerIconBorder: '#ece6d8',
    headerActionBg: '#ffffff',
    headerActionText: '#6b7280',
    headerKbdBg: '#ffffff',
    headerKbdText: '#9a8e7a',
    headerNavText: '#5f6368',
    headerNavActiveText: '#111827',
    headerNavActiveBg: '#f2ede2',
    headerNavGap: 24,
    inlineAddBg: '#5b5ce6',
    inlineAddText: '#ffffff',
    inlineAddShadow: '0 10px 24px rgba(91,92,230,.18)',
    placeholderBorder: 'rgba(120, 119, 98, 0.18)',
    placeholderBg: 'rgba(255,255,255,0.86)',
    materialMenuBorder: '#e8e2d5',
    tocHoverBg: '#f6f2e8',
    tocTextColor: '#757575',
    tocActiveText: '#111827',
    tocItemRadius: 10,
    pageCardBg: '#ffffff',
    pageMetaText: '#8c8c8c',
    pageCardBorder: '#e8e2d5',
    pageCardRadius: 18,
    materialMenuBg: 'rgba(255,255,255,0.98)',
    materialMenuItemBg: '#ffffff',
    materialMenuItemBorder: '#ebe4d8',
    materialMenuItemText: '#111827',
    materialMenuItemMutedText: '#6b7280',
    blockSurface: '#ffffff',
    blockBorder: '#f0ecdf',
    blockShadow: '0 10px 32px rgba(15,23,42,.04)',
    blockHoverBorder: 'rgba(168,151,117,.18)',
    blockSelectedBorder: '#d8d2c2',
    blockSelectedRing: '0 0 0 2px rgba(216,210,194,.45)',
    contentProseColor: '#44403c',
    contentHeadingColor: '#111827',
    contentQuoteBorder: '#e0d9ca',
    contentQuoteText: '#6b7280',
    sidebarGroupText: '#a18b62',
    sidebarItemHoverBg: '#f6f2e8',
    sidebarItemActiveBg: '#f2ede2',
    sidebarItemActiveText: '#111827',
    sidebarRailColor: '#ece6d8',
    emptyTextColor: '#a1a1aa',
    contentTitleLetterSpacing: -0.03,
    blockBase: createBaseBlockTheme({
      fontFamily: '"SF Pro Display","PingFang SC","Helvetica Neue",Arial,sans-serif',
      textColor: '#1f2937',
      mutedColor: '#6b7280',
      accentColor: '#111827',
      borderRadius: 18,
      paddingX: 24,
      paddingY: 20
    })
  }
}

export function createDefaultSiteTheme(): SiteThemeConfig {
  return createSiteThemePreset('docs-light')
}

export function resolveBlockTheme(siteTheme: SiteThemeConfig, overrides?: BlockThemeOverrides): BlockThemeTokens {
  return {
    ...siteTheme.blockBase,
    ...(overrides || {})
  }
}

export function buildSiteThemeVars(siteTheme: SiteThemeConfig): CSSProperties {
  return {
    '--kb-page-bg': siteTheme.pageBackground,
    '--kb-canvas-bg': siteTheme.canvasBackground,
    '--kb-toolbar-bg': siteTheme.toolbarBackground,
    '--kb-divider-color': siteTheme.dividerColor,
    '--kb-studio-panel-bg': siteTheme.studioPanelBg,
    '--kb-studio-panel-border': siteTheme.studioPanelBorder,
    '--kb-studio-panel-shadow': siteTheme.studioPanelShadow,
    '--kb-studio-eyebrow-bg': siteTheme.studioEyebrowBg,
    '--kb-studio-eyebrow-text': siteTheme.studioEyebrowText,
    '--kb-studio-chip-bg': siteTheme.studioChipBg,
    '--kb-studio-chip-text': siteTheme.studioChipText,
    '--kb-studio-chip-muted-text': siteTheme.studioMutedChipText,
    '--kb-header-brand-text': siteTheme.headerBrandText,
    '--kb-header-search-bg': siteTheme.headerSearchBg,
    '--kb-header-search-text': siteTheme.headerSearchText,
    '--kb-header-icon-border': siteTheme.headerIconBorder,
    '--kb-header-action-bg': siteTheme.headerActionBg,
    '--kb-header-action-text': siteTheme.headerActionText,
    '--kb-header-kbd-bg': siteTheme.headerKbdBg,
    '--kb-header-kbd-text': siteTheme.headerKbdText,
    '--kb-header-nav-text': siteTheme.headerNavText,
    '--kb-header-nav-active-text': siteTheme.headerNavActiveText,
    '--kb-header-nav-active-bg': siteTheme.headerNavActiveBg,
    '--kb-header-nav-gap': `${siteTheme.headerNavGap}px`,
    '--kb-inline-add-bg': siteTheme.inlineAddBg,
    '--kb-inline-add-text': siteTheme.inlineAddText,
    '--kb-inline-add-shadow': siteTheme.inlineAddShadow,
    '--kb-placeholder-border': siteTheme.placeholderBorder,
    '--kb-placeholder-bg': siteTheme.placeholderBg,
    '--kb-material-menu-border': siteTheme.materialMenuBorder,
    '--kb-toc-hover-bg': siteTheme.tocHoverBg,
    '--kb-toc-text-color': siteTheme.tocTextColor,
    '--kb-toc-active-text': siteTheme.tocActiveText,
    '--kb-toc-item-radius': `${siteTheme.tocItemRadius}px`,
    '--kb-page-card-bg': siteTheme.pageCardBg,
    '--kb-page-meta-text': siteTheme.pageMetaText,
    '--kb-page-card-border': siteTheme.pageCardBorder,
    '--kb-page-card-radius': `${siteTheme.pageCardRadius}px`,
    '--kb-material-menu-bg': siteTheme.materialMenuBg,
    '--kb-material-menu-item-bg': siteTheme.materialMenuItemBg,
    '--kb-material-menu-item-border': siteTheme.materialMenuItemBorder,
    '--kb-material-menu-item-text': siteTheme.materialMenuItemText,
    '--kb-material-menu-item-muted-text': siteTheme.materialMenuItemMutedText,
    '--kb-block-surface': siteTheme.blockSurface,
    '--kb-block-border': siteTheme.blockBorder,
    '--kb-block-shadow': siteTheme.blockShadow,
    '--kb-block-hover-border': siteTheme.blockHoverBorder,
    '--kb-block-selected-border': siteTheme.blockSelectedBorder,
    '--kb-block-selected-ring': siteTheme.blockSelectedRing,
    '--kb-content-prose-color': siteTheme.contentProseColor,
    '--kb-content-heading-color': siteTheme.contentHeadingColor,
    '--kb-content-quote-border': siteTheme.contentQuoteBorder,
    '--kb-content-quote-text': siteTheme.contentQuoteText,
    '--kb-sidebar-group-text': siteTheme.sidebarGroupText,
    '--kb-sidebar-item-hover-bg': siteTheme.sidebarItemHoverBg,
    '--kb-sidebar-item-active-bg': siteTheme.sidebarItemActiveBg,
    '--kb-sidebar-item-active-text': siteTheme.sidebarItemActiveText,
    '--kb-sidebar-rail-color': siteTheme.sidebarRailColor,
    '--kb-empty-text-color': siteTheme.emptyTextColor,
    '--kb-content-title-letter-spacing': `${siteTheme.contentTitleLetterSpacing}em`
  } as CSSProperties
}

export function cloneSiteTheme(theme: SiteThemeConfig): SiteThemeConfig {
  return JSON.parse(JSON.stringify(theme))
}

export function createBuiltinThemeSchemes(): ThemeScheme[] {
  return [
    { id: 'docs-light', name: 'Docs Light', kind: 'builtin', theme: createSiteThemePreset('docs-light') },
    { id: 'docs-clean', name: 'Docs Clean', kind: 'builtin', theme: createSiteThemePreset('docs-clean') },
    { id: 'docs-enterprise', name: 'Docs Enterprise', kind: 'builtin', theme: createSiteThemePreset('docs-enterprise') }
  ]
}
