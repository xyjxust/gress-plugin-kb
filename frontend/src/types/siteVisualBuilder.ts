import type { PageData, SiteRendererConfig } from './siteRenderer'

export type BuilderTab = 'structure' | 'theme' | 'slots'
export type BuilderDevice = 'desktop' | 'tablet' | 'mobile'
export type BuilderSelectionKind = 'none' | 'region' | 'slot' | 'page'
export type BuilderRegionKey = 'navbar' | 'sidebar' | 'content' | 'footer' | 'hero' | 'features'

export interface BuilderSelection {
  kind: BuilderSelectionKind
  value: string
}

export interface BuilderPageMeta {
  id: string
  slug: string
  type: 'doc' | 'home' | 'blog' | 'api' | 'custom'
  parentId: string
  order: number
}

export interface BuilderNavMeta {
  id: string
  targetPageId: string
  syncLabel: boolean
}

export interface BuilderPageListItem {
  meta: BuilderPageMeta
  page: PageData
  inNavbar: boolean
  inSidebar: boolean
}

export interface SiteVisualBuilderSnapshot {
  siteConfig: SiteRendererConfig
  pageMeta: Record<string, BuilderPageMeta>
  navMeta: Record<string, BuilderNavMeta>
}
