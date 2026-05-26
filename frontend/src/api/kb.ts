/**
 * 知识库 API（与 appstore 插件相同：经 bridge 的 http，直接当业务数据返回）
 */
import { http } from './http'
import type {
  KbDoc,
  KbNavNode,
  KbSite,
  KbTreeNode,
  MoveKbNavNodeRequest,
  UpsertKbDocRequest,
  UpsertKbNavNodeRequest,
  UpsertKbSiteRequest
} from '../types/kb'

const BASE = '/plugins/kb/kb'
/** 免登录匿名前缀，与后端 {@code KbAnonController} 一致 */
const ANON_BASE = '/plugins/kb/anon'
const withSiteKey = (siteKey?: string) =>
  siteKey ? `?siteKey=${encodeURIComponent(siteKey)}` : ''
const andSiteKey = (siteKey?: string) =>
  siteKey ? `&siteKey=${encodeURIComponent(siteKey)}` : ''

export const kbApi = {
  /**
   * 默认 `public`：走 /plugins/kb/anon/tree（IAM 免认证），与 KbAnonController 一致。
   * 管理端需草稿/全量时请显式传 `full`（/plugins/kb/kb/tree，需登录）。
   */
  tree: (siteKey?: string, access: 'full' | 'public' = 'public') => {
    const prefix = access === 'public' ? ANON_BASE : BASE
    return http.get<KbTreeNode[]>(`${prefix}/tree${withSiteKey(siteKey)}`) as any
  },
  /**
   * @param access `full`：后台/编辑可读任意状态（需登录）；`public`：仅已发布，走匿名路径免登录
   */
  getDoc: (docId: number, siteKey?: string, access: 'full' | 'public' = 'full') => {
    const path = access === 'public' ? ANON_BASE : BASE
    return http.get<KbDoc>(`${path}/docs/${docId}${withSiteKey(siteKey)}`) as any
  },
  createDoc: (req: UpsertKbDocRequest, siteKey?: string) =>
    http.post<KbDoc>(`${BASE}/docs${withSiteKey(siteKey)}`, req) as any,
  updateDoc: (docId: number, req: UpsertKbDocRequest, siteKey?: string) =>
    http.put<KbDoc>(`${BASE}/docs/${docId}${withSiteKey(siteKey)}`, req) as any,
  publish: (docId: number, siteKey?: string) =>
    http.post<KbDoc>(`${BASE}/docs/${docId}/publish${withSiteKey(siteKey)}`) as any,
  unpublish: (docId: number, siteKey?: string) =>
    http.post<KbDoc>(`${BASE}/docs/${docId}/unpublish${withSiteKey(siteKey)}`) as any,
  delete: (docId: number, siteKey?: string) =>
    http.delete<void>(`${BASE}/docs/${docId}${withSiteKey(siteKey)}`) as any,

  adminNavTree: (menuCode = 'sidebar', siteKey?: string) =>
    http.get<KbNavNode[]>(
      `${BASE}/admin/nav/tree?menuCode=${encodeURIComponent(menuCode)}${andSiteKey(siteKey)}`
    ) as any,
  createNavNode: (req: UpsertKbNavNodeRequest, siteKey?: string) =>
    http.post<KbNavNode>(`${BASE}/admin/nav/node${withSiteKey(siteKey)}`, req) as any,
  updateNavNode: (nodeId: number, req: UpsertKbNavNodeRequest, siteKey?: string) =>
    http.put<KbNavNode>(`${BASE}/admin/nav/node/${nodeId}${withSiteKey(siteKey)}`, req) as any,
  deleteNavNode: (nodeId: number, siteKey?: string) =>
    http.delete<void>(`${BASE}/admin/nav/node/${nodeId}${withSiteKey(siteKey)}`) as any,
  moveNavNode: (req: MoveKbNavNodeRequest, siteKey?: string) =>
    http.post<void>(`${BASE}/admin/nav/move${withSiteKey(siteKey)}`, req) as any,
  publishNav: (menuCode = 'sidebar', siteKey?: string) =>
    http.post<void>(
      `${BASE}/admin/nav/publish?menuCode=${encodeURIComponent(menuCode)}${andSiteKey(siteKey)}`
    ) as any,
  siteNavTree: (menuCode = 'sidebar', siteKey?: string) =>
    http.get<KbNavNode[]>(
      `${ANON_BASE}/site/nav/tree?menuCode=${encodeURIComponent(menuCode)}${andSiteKey(siteKey)}`
    ) as any,
  /** 匿名健康检查：GET /plugins/kb/anon/health */
  anonHealth: () =>
    http.get<{ status: string }>(`${ANON_BASE}/health`) as any,

  /**
   * 默认 `public`：/plugins/kb/anon/sites（免认证）。管理端全量列表请传 `full`（/kb/admin/sites）。
   */
  listSites: (access: 'full' | 'public' = 'public') =>
    (access === 'public'
      ? http.get<KbSite[]>(`${ANON_BASE}/sites`)
      : http.get<KbSite[]>(`${BASE}/admin/sites`)) as any,
  createSite: (req: UpsertKbSiteRequest) => http.post<KbSite>(`${BASE}/admin/sites`, req) as any,
  updateSite: (siteId: number, req: UpsertKbSiteRequest) =>
    http.put<KbSite>(`${BASE}/admin/sites/${siteId}`, req) as any,
  deleteSite: (siteId: number) => http.delete<void>(`${BASE}/admin/sites/${siteId}`) as any,
  resolveSiteByUrl: (urlPath: string) =>
    http.get<KbSite>(`${ANON_BASE}/site/resolve?urlPath=${encodeURIComponent(urlPath)}`) as any,

  /** published 走匿名前缀；draft 仅登录后可读，仍走 /kb */
  getSiteRendererConfig: (siteKey?: string, stage: 'published' | 'draft' = 'published') => {
    if (stage === 'draft') {
      return http.get<string>(
        `${BASE}/site/config?stage=draft${siteKey ? `&siteKey=${encodeURIComponent(siteKey)}` : ''}`
      ) as any
    }
    const q = siteKey ? `?siteKey=${encodeURIComponent(siteKey)}` : ''
    return http.get<string>(`${ANON_BASE}/site/config${q}`) as any
  },
  saveSiteRendererDraft: (json: string, siteKey?: string) =>
    http.post<void>(`${BASE}/admin/site/config/draft${withSiteKey(siteKey)}`, { json }) as any,
  publishSiteRendererConfig: (siteKey?: string) =>
    http.post<void>(`${BASE}/admin/site/config/publish${withSiteKey(siteKey)}`, {}) as any,
  unpublishSiteRendererConfig: (siteKey?: string) =>
    http.post<void>(`${BASE}/admin/site/config/unpublish${withSiteKey(siteKey)}`, {}) as any,
  getSiteRendererConfigStatus: (siteKey?: string) =>
    http.get<{
      version: number
      hasDraft: boolean
      hasPublished: boolean
      publishedAt?: string
      updatedAt?: string
    }>(`${BASE}/admin/site/config/status${withSiteKey(siteKey)}`) as any,
  listSiteRendererConfigHistory: (siteKey?: string, limit = 50) =>
    http.get<Array<{
      id: number
      action: string
      stage?: string
      success: number
      errorMessage?: string
      createdAt?: string
    }>>(`${BASE}/admin/site/config/history?limit=${encodeURIComponent(String(limit))}${andSiteKey(siteKey)}`) as any,
  rollbackSiteRendererConfigByHistory: (historyId: number, stage: 'draft' | 'published' = 'draft', siteKey?: string) =>
    http.post<void>(`${BASE}/admin/site/config/rollback${withSiteKey(siteKey)}`, { historyId, stage }) as any
}
