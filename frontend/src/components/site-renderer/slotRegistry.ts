import { markRaw, type Component } from 'vue'

/* ── 插槽组件查找表 ────────────────────────────────────────────── */
const SLOT_COMPONENT_MAP: Record<string, Component> = {}

/**
 * 注册插槽组件（可扩展）
 */
export function registerSlotComponent(key: string, component: Component): void {
  SLOT_COMPONENT_MAP[key] = markRaw(component)
}

/**
 * 根据 componentKey 获取已注册组件
 */
export function getSlotComponent(key: string): Component | undefined {
  return SLOT_COMPONENT_MAP[key]
}

/**
 * 初始化内置插槽组件
 */
export function initBuiltinSlotComponents(): void {
  // 延迟导入避免循环依赖
  import('./slot-components/KbSlotAdBanner.vue').then((m) => {
    registerSlotComponent('AdBanner', m.default)
  })
  import('./slot-components/KbSlotAnnouncement.vue').then((m) => {
    registerSlotComponent('Announcement', m.default)
  })
}
