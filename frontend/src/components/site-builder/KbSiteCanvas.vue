<template>
  <main class="kb-studio-canvas" :style="siteThemeVars">
    <div class="kb-canvas-frame">
      <div
        v-for="slot in topSlots"
        :key="slot"
        class="kb-drop-slot kb-drop-slot--top"
        :class="{ 'kb-drop-slot--hot': hoveredSlot === slot }"
        @dragover.prevent="emit('hover-slot', slot)"
        @dragleave="emit('clear-hover-slot', slot)"
        @drop.prevent="emit('drop-slot', slot)"
      >
        <template v-if="hasVisibleComponent(slot)">
          <KbBuilderBlockShell
            v-for="componentItem in visibleComponentsInSlot(slot)"
            :key="componentItem.id"
            :variant="componentItem.type"
            :selected="selectedArea === componentItem.type"
            :sticky="isStickyComponent(componentItem)"
            :sticky-top="48"
            :block-style="getComponentTheme(componentItem.type)"
            @select="emit('select-area', componentItem.type)"
            @open-inspector="emit('open-inspector', componentItem.type, slot)"
            @remove="emit('remove-area', componentItem.type)"
            @dragstart="emit('drag-area-start', componentItem.type)"
            @dragend="emit('drag-area-end')"
          >
            <component
              :is="siteBuilderRegistry[componentItem.type].renderer"
              v-bind="buildComponentProps(componentItem.type)"
              @select-nav="emit('select-nav', { area: componentItem.type === 'header' ? 'header' : 'sidebar', navId: $event })"
            />
          </KbBuilderBlockShell>
        </template>
        <template v-else>
          <div class="kb-drop-slot__placeholder" @mouseenter="emit('hover-slot', slot)" @mouseleave="emit('clear-hover-slot', slot)">
            <button type="button" class="kb-inline-add" @click.stop="emit('open-material-menu', slot)">+</button>
            <strong>{{ hasAssignedComponent(slot) ? '顶部区域组件已隐藏' : '顶部区域' }}</strong>
            <span>{{ slotMeta[slot].hint }}</span>
            <div v-if="materialMenuSlot === slot" class="kb-material-menu">
              <button
                v-for="area in availableAreasForSlot(slot)"
                :key="area"
                type="button"
                class="kb-material-menu__item"
                @click.stop="emit('assign-area', area, slot)"
              >
                <strong>{{ areaMeta[area].label }}</strong>
                <span>{{ areaMeta[area].description }}</span>
              </button>
            </div>
          </div>
        </template>
      </div>

      <div class="kb-preview-main" :style="mainGridStyle">
        <div
          v-for="slot in middleSlots"
          :key="slot"
          class="kb-drop-slot kb-drop-slot--main"
          :class="{ 'kb-drop-slot--hot': hoveredSlot === slot }"
          @dragover.prevent="emit('hover-slot', slot)"
          @dragleave="emit('clear-hover-slot', slot)"
          @drop.prevent="emit('drop-slot', slot)"
        >
          <template v-if="hasVisibleComponent(slot)">
            <KbBuilderBlockShell
              v-for="componentItem in visibleComponentsInSlot(slot)"
              :key="componentItem.id"
              :variant="componentItem.type"
              :selected="selectedArea === componentItem.type"
              :sticky="isStickyComponent(componentItem)"
              :sticky-top="96"
              :block-style="getComponentTheme(componentItem.type)"
              @select="emit('select-area', componentItem.type)"
              @open-inspector="emit('open-inspector', componentItem.type, slot)"
              @remove="emit('remove-area', componentItem.type)"
              @dragstart="emit('drag-area-start', componentItem.type)"
              @dragend="emit('drag-area-end')"
            >
              <component
                :is="siteBuilderRegistry[componentItem.type].renderer"
                v-bind="buildComponentProps(componentItem.type)"
                @select-nav="emit('select-nav', { area: componentItem.type === 'header' ? 'header' : 'sidebar', navId: $event })"
              />
            </KbBuilderBlockShell>
          </template>

          <template v-else>
            <div class="kb-drop-slot__placeholder" @mouseenter="emit('hover-slot', slot)" @mouseleave="emit('clear-hover-slot', slot)">
              <button type="button" class="kb-inline-add" @click.stop="emit('open-material-menu', slot)">+</button>
              <strong>{{ hasAssignedComponent(slot) ? '该槽位组件已隐藏' : slotMeta[slot].label }}</strong>
              <span>{{ slotMeta[slot].hint }}</span>
              <div v-if="materialMenuSlot === slot" class="kb-material-menu">
                <button
                  v-for="area in availableAreasForSlot(slot)"
                  :key="area"
                  type="button"
                  class="kb-material-menu__item"
                  @click.stop="emit('assign-area', area, slot)"
                >
                  <strong>{{ areaMeta[area].label }}</strong>
                  <span>{{ areaMeta[area].description }}</span>
                </button>
              </div>
            </div>
          </template>
        </div>
      </div>

      <div
        v-for="slot in bottomSlots"
        :key="slot"
        class="kb-drop-slot kb-drop-slot--bottom"
        :class="{ 'kb-drop-slot--hot': hoveredSlot === slot }"
        @dragover.prevent="emit('hover-slot', slot)"
        @dragleave="emit('clear-hover-slot', slot)"
        @drop.prevent="emit('drop-slot', slot)"
      >
        <template v-if="hasVisibleComponent(slot)">
          <KbBuilderBlockShell
            v-for="componentItem in visibleComponentsInSlot(slot)"
            :key="componentItem.id"
            :variant="componentItem.type"
            :selected="selectedArea === componentItem.type"
            :block-style="getComponentTheme(componentItem.type)"
            @select="emit('select-area', componentItem.type)"
            @open-inspector="emit('open-inspector', componentItem.type, slot)"
            @remove="emit('remove-area', componentItem.type)"
            @dragstart="emit('drag-area-start', componentItem.type)"
            @dragend="emit('drag-area-end')"
          >
            <component
              :is="siteBuilderRegistry[componentItem.type].renderer"
              v-bind="buildComponentProps(componentItem.type)"
              @select-nav="emit('select-nav', { area: componentItem.type === 'header' ? 'header' : 'sidebar', navId: $event })"
            />
          </KbBuilderBlockShell>
        </template>
        <template v-else>
          <div class="kb-drop-slot__placeholder" @mouseenter="emit('hover-slot', slot)" @mouseleave="emit('clear-hover-slot', slot)">
            <button type="button" class="kb-inline-add" @click.stop="emit('open-material-menu', slot)">+</button>
            <strong>{{ hasAssignedComponent(slot) ? '底部区域组件已隐藏' : '底部区域' }}</strong>
            <span>{{ slotMeta[slot].hint }}</span>
            <div v-if="materialMenuSlot === slot" class="kb-material-menu">
              <button
                v-for="area in availableAreasForSlot(slot)"
                :key="area"
                type="button"
                class="kb-material-menu__item"
                @click.stop="emit('assign-area', area, slot)"
              >
                <strong>{{ areaMeta[area].label }}</strong>
                <span>{{ areaMeta[area].description }}</span>
              </button>
            </div>
          </div>
        </template>
      </div>
    </div>
  </main>
</template>

<script setup lang="ts">
import { computed, type CSSProperties } from 'vue'
import type { KbDoc, KbNavNode } from '../../types/kb'
import type { AreaConfigMap, AreaKey, BlockThemeTokens, BuilderComponentInstance, CanvasSlot, PreviewMode, TocItem } from '../../types/siteBuilder'
import KbBuilderBlockShell from './KbBuilderBlockShell.vue'
import { siteBuilderRegistry } from './siteBuilderRegistry'

const props = defineProps<{
  previewMode: PreviewMode
  hoveredSlot: CanvasSlot | null
  materialMenuSlot: CanvasSlot | null
  selectedArea: AreaKey
  selectedHeaderNavId: number | null
  selectedSidebarNavId: number | null
  componentInstances: BuilderComponentInstance<any>[]
  mainSlots: CanvasSlot[]
  areaMeta: Record<AreaKey, { label: string; description: string; slots: CanvasSlot[] }>
  slotMeta: Record<CanvasSlot, { label: string; short: string; hint: string }>
  areaConfigs: AreaConfigMap
  resolvedThemes: Record<AreaKey, BlockThemeTokens>
  siteThemeVars: CSSProperties
  previewHeaderTree: KbNavNode[]
  previewSidebarTree: KbNavNode[]
  previewDoc: KbDoc | null
  docLoading: boolean
  tocItems: TocItem[]
  prevDoc: { title: string } | null
  nextDoc: { title: string } | null
  mainGridStyle: CSSProperties
}>()

const emit = defineEmits<{
  'hover-slot': [slot: CanvasSlot]
  'clear-hover-slot': [slot: CanvasSlot]
  'open-material-menu': [slot: CanvasSlot]
  'assign-area': [area: AreaKey, slot: CanvasSlot]
  'drop-slot': [slot: CanvasSlot]
  'drag-area-start': [area: AreaKey]
  'drag-area-end': []
  'select-area': [area: AreaKey]
  'open-inspector': [area: AreaKey, slot: CanvasSlot]
  'remove-area': [area: AreaKey]
  'select-nav': [payload: { area: 'header' | 'sidebar'; navId: number }]
}>()

const topSlots = computed<CanvasSlot[]>(() => ['top'])
const middleSlots = computed<CanvasSlot[]>(() => props.mainSlots)
const bottomSlots = computed<CanvasSlot[]>(() => ['bottom'])

function getComponentInSlot(slot: CanvasSlot) {
  return props.componentInstances.find((item) => item.slot === slot) || null
}

function getComponentsInSlot(slot: CanvasSlot) {
  return props.componentInstances.filter((item) => item.slot === slot)
}

function visibleComponentsInSlot(slot: CanvasSlot) {
  return getComponentsInSlot(slot).filter((item) => item.config?.visible !== false)
}

function hasVisibleComponent(slot: CanvasSlot) {
  return visibleComponentsInSlot(slot).length > 0
}

function hasAssignedComponent(slot: CanvasSlot) {
  return getComponentsInSlot(slot).length > 0
}

function availableAreasForSlot(slot: CanvasSlot) {
  return (Object.keys(props.areaMeta) as AreaKey[]).filter((area) => {
    if (!siteBuilderRegistry[area].slots.includes(slot)) return false
    const existingSlot = props.componentInstances.find((item) => item.type === area)?.slot
    return !existingSlot || existingSlot !== slot
  })
}

function blockStyle(theme: BlockThemeTokens): CSSProperties {
  return {
    fontFamily: theme.fontFamily || 'inherit',
    color: theme.textColor,
    background: theme.backgroundColor,
    borderColor: theme.borderColor,
    borderRadius: `${theme.borderRadius}px`,
    paddingLeft: `${theme.paddingX}px`,
    paddingRight: `${theme.paddingX}px`,
    paddingTop: `${theme.paddingY}px`,
    paddingBottom: `${theme.paddingY}px`
  }
}

function isStickyComponent(component: BuilderComponentInstance<any>) {
  return Boolean((component.config as { sticky?: boolean }).sticky)
}

function getComponentTheme(area: AreaKey) {
  return blockStyle(props.resolvedThemes[area])
}

function buildComponentProps(area: AreaKey) {
  if (area === 'header') {
    return {
      config: props.areaConfigs.header,
      theme: props.resolvedThemes.header,
      navTree: props.previewHeaderTree,
      selectedNavId: props.selectedHeaderNavId
    }
  }
  if (area === 'sidebar') {
    return {
      config: props.areaConfigs.sidebar,
      theme: props.resolvedThemes.sidebar,
      navTree: props.previewSidebarTree,
      selectedNavId: props.selectedSidebarNavId,
      previewMode: props.previewMode
    }
  }
  if (area === 'content') {
    return {
      config: props.areaConfigs.content,
      theme: props.resolvedThemes.content,
      previewDoc: props.previewDoc,
      docLoading: props.docLoading
    }
  }
  if (area === 'toc') {
    return {
      config: props.areaConfigs.toc,
      theme: props.resolvedThemes.toc,
      tocItems: props.tocItems,
      activeTocId: props.tocItems[props.tocItems.length - 1]?.id || props.tocItems[0]?.id || null
    }
  }
  return {
    config: props.areaConfigs.footer,
    theme: props.resolvedThemes.footer,
    prevDoc: props.prevDoc,
    nextDoc: props.nextDoc
  }
}
</script>

<style scoped>
.kb-studio-canvas { min-width: 0; display: flex; flex-direction: column; gap: 0; }
.kb-canvas-frame { padding: 14px 28px 42px; min-height: 920px; background: var(--kb-canvas-bg); }
.kb-drop-slot__placeholder { position: relative; min-height: 96px; border: 1px dashed var(--kb-placeholder-border); border-radius: 16px; background: var(--kb-placeholder-bg); display:flex; align-items:center; justify-content:center; flex-direction:column; gap:6px; text-align:center; color:#94a3b8; }
.kb-drop-slot__placeholder strong { color:var(--kb-content-heading-color); font-size:16px; }
.kb-inline-add { position:absolute; left:-16px; top:50%; transform:translateY(-50%); width:34px; height:34px; border:none; border-radius:999px; background:var(--kb-inline-add-bg); color:var(--kb-inline-add-text); font-size:22px; line-height:1; cursor:pointer; box-shadow:var(--kb-inline-add-shadow); opacity:0; transition:opacity .16s ease; }
.kb-drop-slot__placeholder:hover .kb-inline-add, .kb-drop-slot--hot .kb-inline-add { opacity:1; }
.kb-material-menu { position:absolute; left:28px; top:50%; transform:translateY(-50%); width:260px; padding:10px; border-radius:18px; border:1px solid var(--kb-material-menu-border); background:var(--kb-material-menu-bg); box-shadow:0 18px 42px rgba(15,23,42,.12); z-index:10; display:grid; gap:8px; }
.kb-material-menu__item { border:1px solid var(--kb-material-menu-item-border); background:var(--kb-material-menu-item-bg); border-radius:14px; padding:10px 12px; text-align:left; cursor:pointer; display:grid; gap:4px; }
.kb-material-menu__item strong { font-size:14px; color:var(--kb-material-menu-item-text); }
.kb-material-menu__item span { font-size:12px; line-height:1.5; color:var(--kb-material-menu-item-muted-text); }
.kb-preview-main { display:grid; align-items:start; gap:32px; }
@media (max-width: 1120px) {
  .kb-canvas-frame { padding:16px; }
  .kb-preview-main { grid-template-columns:1fr !important; gap:20px; }
  .kb-inline-add { left:12px; top:12px; transform:none; opacity:1; }
  .kb-material-menu { left:12px; top:56px; transform:none; width:min(260px, calc(100% - 24px)); }
}
</style>
