<template>
  <section class="kbvb-canvas">
    <div class="kbvb-canvas__bar">
      <div class="kbvb-canvas__info">
        <span>{{ currentThemeLabel }}</span>
        <span>·</span>
        <span>{{ deviceLabel }}</span>
        <span>·</span>
        <span>{{ config.theme.primary }}</span>
      </div>
      <div class="kbvb-canvas__devices">
        <button
          v-for="item in devices"
          :key="item.id"
          class="kbvb-device-btn"
          :class="{ active: device === item.id }"
          @click="$emit('update:device', item.id)"
        >
          {{ item.icon }}
        </button>
      </div>
    </div>

    <div class="kbvb-canvas__scroll">
      <div class="kbvb-canvas__shell" :class="device">
        <KbSiteRenderer
          class="kbvb-canvas__renderer"
          :config="config"
          :active-page-id="activePageId"
          :active-nav-id="activeNavId"
          @page-select="(id) => $emit('page-select', id)"
          @nav-click="(item) => $emit('nav-click', item)"
        />

        <div class="kbvb-hotspots">
          <button
            v-for="spot in spots"
            :key="spot.key"
            class="kbvb-hotspot"
            :class="{ active: isActiveSpot(spot.kind, spot.key), [`spot-${spot.kind}`]: true }"
            :style="spot.style"
            @click="$emit(spot.kind === 'slot' ? 'select-slot' : 'select-region', spot.key)"
          >
            <span>{{ spot.label }}</span>
          </button>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import KbSiteRenderer from '../site-renderer/KbSiteRenderer.vue'
import type { SiteRendererConfig } from '../../types/siteRenderer'
import type { BuilderDevice, BuilderSelectionKind } from '../../types/siteVisualBuilder'

const props = defineProps<{
  config: SiteRendererConfig
  activePageId: string
  activeNavId: string
  device: BuilderDevice
  selectedKind: BuilderSelectionKind
  selectedValue: string
  themeLabel: string
}>()

defineEmits<{
  'update:device': [device: BuilderDevice]
  'select-region': [region: string]
  'select-slot': [slot: string]
  'page-select': [id: string]
  'nav-click': [item: any]
}>()

const devices = [
  { id: 'desktop', icon: '🖥' },
  { id: 'tablet', icon: '📱' },
  { id: 'mobile', icon: '📲' },
] as const

const deviceLabel = computed(() => ({ desktop: '桌面', tablet: '平板 768', mobile: '手机 390' }[props.device]))
const currentThemeLabel = computed(() => props.themeLabel)

const spots = computed(() => {
  const docs = [
    { kind: 'region', key: 'navbar', label: 'Navbar', style: { inset: '0 0 auto 0', height: '60px' } },
    { kind: 'region', key: 'sidebar', label: 'Sidebar', style: { top: '60px', left: '0', bottom: '64px', width: `${props.config.sidebar.width}px` } },
    { kind: 'slot', key: 'sidebar-top', label: 'sidebar-top', style: { top: '72px', left: '12px', width: `${Math.max(props.config.sidebar.width - 24, 120)}px`, height: '66px' } },
    { kind: 'region', key: 'content', label: 'Content', style: { top: '60px', left: `${props.config.sidebar.width}px`, right: '0', bottom: '64px' } },
    { kind: 'slot', key: 'content-top', label: 'content-top', style: { top: '60px', left: `${props.config.sidebar.width}px`, right: '0', height: '54px' } },
    { kind: 'region', key: 'footer', label: 'Footer', style: { left: `${props.config.sidebar.width}px`, right: '0', bottom: '0', height: '64px' } },
  ]

  if (props.config.themeId === 'blog') {
    return [
      { kind: 'region', key: 'navbar', label: 'Navbar', style: { inset: '0 0 auto 0', height: '60px' } },
      { kind: 'slot', key: 'content-top', label: 'content-top', style: { top: '60px', left: '0', right: '0', height: '54px' } },
      { kind: 'region', key: 'content', label: 'Content', style: { top: '114px', left: '0', right: '0', bottom: '64px' } },
      { kind: 'region', key: 'footer', label: 'Footer', style: { left: '0', right: '0', bottom: '0', height: '64px' } },
    ]
  }

  if (props.config.themeId === 'landing') {
    return [
      { kind: 'region', key: 'navbar', label: 'Navbar', style: { inset: '0 0 auto 0', height: '60px' } },
      { kind: 'slot', key: 'content-top', label: 'content-top', style: { top: '60px', left: '0', right: '0', height: '54px' } },
      { kind: 'region', key: 'hero', label: 'Hero', style: { top: '114px', left: '0', right: '0', height: '380px' } },
      { kind: 'region', key: 'features', label: 'Features', style: { top: '494px', left: '0', right: '0', bottom: '64px' } },
      { kind: 'region', key: 'footer', label: 'Footer', style: { left: '0', right: '0', bottom: '0', height: '64px' } },
    ]
  }

  return docs
})

function isActiveSpot(kind: string, key: string): boolean {
  return props.selectedKind === kind && props.selectedValue === key
}
</script>

<style scoped>
.kbvb-canvas {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  background: #070b12;
}
.kbvb-canvas__bar {
  height: 44px;
  border-bottom: 1px solid #202738;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
  background: #0e1118;
}
.kbvb-canvas__info {
  display: inline-flex;
  gap: 8px;
  color: #72819d;
  font-size: 12px;
}
.kbvb-canvas__devices {
  display: inline-flex;
  gap: 6px;
}
.kbvb-device-btn {
  width: 32px;
  height: 32px;
  border-radius: 10px;
  border: 1px solid transparent;
  background: transparent;
  color: #72819d;
  cursor: pointer;
}
.kbvb-device-btn.active {
  background: rgba(77, 142, 245, 0.14);
  border-color: rgba(77, 142, 245, 0.36);
  color: #e8efff;
}
.kbvb-canvas__scroll {
  flex: 1;
  overflow: auto;
  padding: 24px;
}
.kbvb-canvas__shell {
  position: relative;
  margin: 0 auto;
  min-height: 760px;
  background: #fff;
  border-radius: 14px;
  overflow: hidden;
  box-shadow: 0 24px 80px rgba(0, 0, 0, 0.42);
}
.kbvb-canvas__shell.desktop {
  width: min(100%, 1180px);
}
.kbvb-canvas__shell.tablet {
  width: 768px;
}
.kbvb-canvas__shell.mobile {
  width: 390px;
}
.kbvb-canvas__renderer {
  min-height: 760px;
}
.kbvb-hotspots {
  position: absolute;
  inset: 0;
  pointer-events: none;
}
.kbvb-hotspot {
  position: absolute;
  border: 2px dashed transparent;
  background: transparent;
  color: transparent;
  pointer-events: auto;
  cursor: pointer;
  transition: border-color 0.15s ease, background 0.15s ease;
}
.kbvb-hotspot:hover,
.kbvb-hotspot.active {
  border-color: rgba(77, 142, 245, 0.7);
  background: rgba(77, 142, 245, 0.08);
}
.kbvb-hotspot span {
  position: absolute;
  top: 8px;
  right: 8px;
  background: rgba(8, 10, 16, 0.84);
  color: #f8fbff;
  border-radius: 999px;
  padding: 3px 8px;
  font-size: 11px;
  line-height: 1;
}
.kbvb-hotspot.spot-slot:hover,
.kbvb-hotspot.spot-slot.active {
  border-color: rgba(245, 166, 35, 0.8);
  background: rgba(245, 166, 35, 0.12);
}
</style>
