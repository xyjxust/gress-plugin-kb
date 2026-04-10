import type { PageData, SiteRendererConfig, SlotComponentInstance } from '../../../types/siteRenderer'
import { getExtension, normalizeExtensionConfigs } from './extensionRegistry'

export interface SlotResolveContext {
  activePageId: string
  activeNavId: string
  page: PageData | null
}

function normalizeSlotValue(v: any): SlotComponentInstance[] {
  if (!v) return []
  const arr = Array.isArray(v) ? v : [v]
  return arr
    .filter(Boolean)
    .map((x: any) => ({
      instanceId: String(x.instanceId || ''),
      componentKey: String(x.componentKey || ''),
      visible: x.visible !== false,
      order: typeof x.order === 'number' ? x.order : 0,
      props: x.props || {},
    }))
    .filter((x) => x.instanceId && x.componentKey && x.visible !== false)
}

export function resolveSlotInstances(
  config: SiteRendererConfig,
  slotKey: string,
  ctx: SlotResolveContext
): SlotComponentInstance[] {
  const baseInstances = normalizeSlotValue((config.slots as any)?.[slotKey])

  const extConfigs = normalizeExtensionConfigs(config.extensions)
  const extInstances: SlotComponentInstance[] = []
  for (const ec of extConfigs) {
    if (ec.enabled === false) continue
    const def = getExtension(ec.id)
    if (!def) continue
    const injections = def.inject(
      {
        config,
        activePageId: ctx.activePageId,
        activeNavId: ctx.activeNavId,
        page: ctx.page,
      },
      ec.options || {}
    )
    for (const inj of injections || []) {
      if (inj.slotKey !== slotKey) continue
      extInstances.push(...normalizeSlotValue(inj.instances))
    }
  }

  const merged = [...baseInstances, ...extInstances]
  merged.sort((a, b) => (a.order || 0) - (b.order || 0))
  return merged
}

