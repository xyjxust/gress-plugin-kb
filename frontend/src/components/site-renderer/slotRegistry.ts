import { markRaw, type Component } from 'vue'
import KbSlotAdBanner from './slot-components/KbSlotAdBanner.vue'
import KbSlotAnnouncement from './slot-components/KbSlotAnnouncement.vue'
import KbSlotAuthEntry from './slot-components/KbSlotAuthEntry.vue'
import KbSlotComments from './slot-components/KbSlotComments.vue'

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
  registerSlotComponent('AdBanner', KbSlotAdBanner)
  registerSlotComponent('Announcement', KbSlotAnnouncement)
  registerSlotComponent('AuthEntry', KbSlotAuthEntry)
  registerSlotComponent('Comments', KbSlotComments)
}
