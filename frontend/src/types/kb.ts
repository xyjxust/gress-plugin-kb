export interface KbTreeNode {
  id: number
  parentId: number | null
  title: string
  slug: string
  status: 'DRAFT' | 'PUBLISHED' | string
  docType?: 'EDITOR' | 'COMPONENT' | string
  children: KbTreeNode[]
}

export interface KbDoc {
  id: number
  spaceId: number
  parentId: number | null
  slug: string
  title: string
  /** EDITOR / COMPONENT */
  docType?: 'EDITOR' | 'COMPONENT' | string
  componentCategory?: string | null
  componentName?: string | null
  componentPropsJson?: string | null
  bodyMd: string
  bodyHtml?: string | null
  status: 'DRAFT' | 'PUBLISHED' | string
  version: number
  staticVersion?: number
  staticHtmlUrl?: string | null
  publishedAt?: string | null
  updatedAt?: string | null
}

export interface KbSite {
  id: number
  spaceKey: string
  name: string
  description?: string | null
  routePrefix: string
  enabled: number
  updatedAt?: string | null
}

export interface UpsertKbSiteRequest {
  spaceKey?: string
  name?: string
  description?: string
  routePrefix?: string
  enabled?: number
}

export interface UpsertKbDocRequest {
  parentId?: number | null
  slug?: string
  title?: string
  bodyMd?: string
  /** EDITOR / COMPONENT */
  docType?: 'EDITOR' | 'COMPONENT' | string
  componentCategory?: string
  componentName?: string
  componentPropsJson?: string
}

export type KbNavNodeType = 'GROUP' | 'DOC' | 'LINK' | string
export type KbNavVisibility = 'PUBLIC' | 'LOGIN' | 'ROLE' | string

export interface KbNavNode {
  id: number
  parentId: number | null
  menuCode: string
  title: string
  nodeType: KbNavNodeType
  docId?: number | null
  linkUrl?: string | null
  sortOrder?: number
  status: 'DRAFT' | 'PUBLISHED' | string
  visibility?: KbNavVisibility
  roles?: string[]
  children: KbNavNode[]
}

export interface UpsertKbNavNodeRequest {
  menuCode?: string
  parentId?: number | null
  title?: string
  nodeType?: KbNavNodeType
  docId?: number | null
  linkUrl?: string
  sortOrder?: number
  visibility?: KbNavVisibility
  roles?: string[]
}

export interface MoveKbNavNodeRequest {
  menuCode?: string
  nodeId: number
  newParentId?: number | null
  siblingOrder?: number[]
}

