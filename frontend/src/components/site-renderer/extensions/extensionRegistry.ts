import type {
  ExtensionSchemaField,
  PageData,
  SiteExtensionConfig,
  SiteRendererConfig,
  SlotComponentInstance,
} from '../../../types/siteRenderer'

export type ExtensionOptionsSchema = Record<string, ExtensionSchemaField>

export interface ExtensionRuntimeContext {
  config: SiteRendererConfig
  activePageId: string
  activeNavId: string
  page: PageData | null
}

export interface SlotInjection {
  slotKey: string
  instances: SlotComponentInstance[]
}

export interface SiteExtensionDefinition {
  id: string
  name: string
  description?: string
  /** 给搭建器渲染表单 */
  optionsSchema?: ExtensionOptionsSchema
  /**
   * 共享配置面板组件（推荐）：像 SystemSettings.vue 一样从宿主共享组件注册表按 category/name 获取组件并渲染。
   * - 面板组件约定：支持 `v-model:options`，接收/回写扩展 options
   */
  configPanel?: { category: string; name: string }
  /** 默认 options（用于首次启用） */
  defaultOptions?: Record<string, any>
  /**
   * 返回要注入的 slot 实例列表
   * - 可基于 ctx 决定是否注入（例如仅 doc 页显示评论）
   */
  inject: (ctx: ExtensionRuntimeContext, options: Record<string, any>) => SlotInjection[]
}

const EXT_REGISTRY = new Map<string, SiteExtensionDefinition>()

export function registerExtension(def: SiteExtensionDefinition): void {
  EXT_REGISTRY.set(def.id, def)
}

export function getExtension(id: string): SiteExtensionDefinition | undefined {
  return EXT_REGISTRY.get(id)
}

export function listExtensions(): SiteExtensionDefinition[] {
  return Array.from(EXT_REGISTRY.values())
}

export function normalizeExtensionConfigs(exts?: SiteExtensionConfig[]): SiteExtensionConfig[] {
  if (!exts?.length) return []
  return exts
    .filter((e) => e && e.id)
    .map((e) => ({
      id: String(e.id),
      enabled: e.enabled !== false,
      order: typeof e.order === 'number' ? e.order : 0,
      options: e.options || {},
    }))
    .sort((a, b) => (a.order || 0) - (b.order || 0))
}

