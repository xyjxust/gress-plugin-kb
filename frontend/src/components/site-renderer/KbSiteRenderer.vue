<template>
  <div
    ref="rootEl"
    class="sr-renderer-root"
    :class="{
      'theme-dark': isDark,
      'sr-force-desktop': isForceDesktop,
      'sr-force-mobile': isForceMobile
    }"
    :style="cssVarsStyle"
  >
    <component
      :is="layoutComponent"
      v-if="layoutComponent"
      :config="layoutConfig"
      :active-page-id="activePageId"
      :active-nav-id="activeNavId"
      @page-select="onPageSelect"
      @brand-click="onBrandClick"
      @nav-click="onNavClick"
      @toc-click="onTocClick"
      @action-click="onActionClick"
      @sidebar-unbound-click="onSidebarUnboundClick"
      @search="openSiteSearch"
    />
    <div v-else class="sr-renderer-fallback">
      未找到主题布局: {{ config.themeId }}
    </div>
    <KbSiteSearchModal
      v-if="config.navbar.showSearch"
      v-model="siteSearchOpen"
      :pages="config.pages"
      :primary="config.theme.primary"
      :dark="isDark"
      @select="onSearchPick"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onBeforeMount, onMounted, onUnmounted } from 'vue'
import type { SiteRendererConfig } from '../../types/siteRenderer'
import { buildRendererCssVars, pickSidebarTreeForActiveNav } from '../../utils/siteRenderer'
import { getRendererTheme, initBuiltinThemes, hasRendererTheme } from './rendererRegistry'
import KbSiteSearchModal from './KbSiteSearchModal.vue'

const props = withDefaults(
  defineProps<{
    config: SiteRendererConfig
    activePageId?: string
    activeNavId?: string
    previewMode?: 'auto' | 'desktop' | 'tablet' | 'mobile'
  }>(),
  {
    activePageId: '',
    activeNavId: '',
    previewMode: 'auto'
  }
)

const emit = defineEmits<{
  'page-select': [id: string]
  'brand-click': []
  'nav-click': [item: any]
  'toc-click': [item: any]
  'action-click': [action: any]
  'sidebar-unbound-click': [label: string]
}>()

const rootEl = ref<HTMLElement>()
const siteSearchOpen = ref(false)

// 确保内置主题已注册
onBeforeMount(() => {
  if (!hasRendererTheme('docs')) {
    initBuiltinThemes()
  }
})

function openSiteSearch() {
  if (!props.config.navbar.showSearch) return
  siteSearchOpen.value = true
}

function onGlobalSearchHotkey(e: KeyboardEvent) {
  if (!props.config.navbar.showSearch) return
  if (!(e.metaKey || e.ctrlKey) || e.key.toLowerCase() !== 'k') return
  const t = e.target as HTMLElement
  if (t.closest('.sr-search-panel')) {
    e.preventDefault()
    siteSearchOpen.value = false
    return
  }
  const tag = t?.tagName
  if (tag === 'INPUT' || tag === 'TEXTAREA' || t.isContentEditable) return
  e.preventDefault()
  siteSearchOpen.value = true
}

onMounted(() => {
  window.addEventListener('keydown', onGlobalSearchHotkey)
})
onUnmounted(() => {
  window.removeEventListener('keydown', onGlobalSearchHotkey)
})

function onSearchPick(pageId: string) {
  emit('page-select', pageId)
  for (const l of props.config.navbar.links) {
    if (l.pageId === pageId) {
      emit('nav-click', l)
      return
    }
    const ch = l.children?.find((c) => c.pageId === pageId)
    if (ch) {
      emit('nav-click', { ...ch, _parentNavId: l.id })
      return
    }
  }
}

const isDark = computed(() => props.config.theme.darkMode)
const isForceDesktop = computed(() => props.previewMode === 'desktop' || props.previewMode === 'tablet')
const isForceMobile = computed(() => props.previewMode === 'mobile')

const cssVarsStyle = computed(() =>
  buildRendererCssVars(props.config, isDark.value ? 'dark' : 'light')
)

const layoutComponent = computed(() => {
  const entry = getRendererTheme(props.config.themeId)
  return entry?.layoutComponent || null
})

/** 顶栏切换时同步侧栏树（与可视化构建器一致，依赖 sidebar.treesByNavId） */
const layoutConfig = computed<SiteRendererConfig>(() => {
  const navIdRaw =
    props.activeNavId != null && props.activeNavId !== ''
      ? props.activeNavId
      : props.config.navbar.links[0]?.id || ''
  const tree = pickSidebarTreeForActiveNav(
    props.config,
    navIdRaw,
    props.activePageId || undefined
  )
  return {
    ...props.config,
    sidebar: {
      ...props.config.sidebar,
      tree,
    },
  }
})

function onPageSelect(id: string) {
  emit('page-select', id)
}
function onBrandClick() {
  emit('brand-click')
}
function onNavClick(item: any) {
  emit('nav-click', item)
}
function onTocClick(item: any) {
  emit('toc-click', item)
}
function onActionClick(action: any) {
  emit('action-click', action)
}
function onSidebarUnboundClick(label: string) {
  emit('sidebar-unbound-click', label)
}
</script>

<style scoped>
.sr-renderer-root {
  font-family: var(--font-sans, 'Outfit', system-ui, sans-serif);
  background: var(--bg);
  color: var(--text);
  container-type: inline-size;
  container-name: sr-root;
  line-height: 1.6;
  overflow-x: hidden;
  transition: background 0.3s, color 0.3s;
  display: flex;
  flex-direction: column;
  flex: 1 1 auto;
  min-height: 0;
}
.sr-renderer-fallback {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  color: var(--text3, #94a3b8);
  font-size: 14px;
}

/* 全局滚动条 */
.sr-renderer-root :deep(*) {
  scrollbar-width: thin;
  scrollbar-color: var(--border2) transparent;
}
.sr-renderer-root :deep(*::-webkit-scrollbar) {
  width: 5px;
  height: 5px;
}
.sr-renderer-root :deep(*::-webkit-scrollbar-thumb) {
  background: var(--border2);
  border-radius: 4px;
}
</style>
