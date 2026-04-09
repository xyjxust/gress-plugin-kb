<template>
  <div class="kb-site-config-preview" :class="[`is-${previewMode}`]">
    <KbSiteRenderer
      :config="rendererConfig"
      :active-page-id="activePageId"
      :active-nav-id="activeNavId"
      @page-select="onPageSelect"
      @nav-click="onNavClick"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { PersistedSiteConfig, SitePage } from '../../types/siteConfig'
import { persistedConfigToRendererConfig, findPageIdByRouteKey } from '../../utils/siteRenderer'
import KbSiteRenderer from '../site-renderer/KbSiteRenderer.vue'

const props = defineProps<{
  config: PersistedSiteConfig
  activePage: SitePage | null
  previewMode: 'desktop' | 'mobile'
}>()

const emit = defineEmits<{
  'select-route': [routeKey: string]
  'select-page': [pageId: string]
}>()

const darkMode = ref(props.config.theme.mode === 'dark')

const rendererConfig = computed(() =>
  persistedConfigToRendererConfig(props.config, { darkMode: darkMode.value })
)

const activePageId = computed(() => props.activePage?.id || '')
const activeNavId = ref('')

// 根据 activePage 的 routeKey 推断 activeNavId
watch(
  () => props.activePage,
  (page) => {
    if (!page) return
    const navItem = props.config.navigation.navbar.items.find((item) => {
      if (item.kind === 'link') return item.routeKey === page.routeKey
      if (item.kind === 'group') return item.children.some((c) => c.routeKey === page.routeKey)
      return false
    })
    if (navItem) activeNavId.value = navItem.id
  },
  { immediate: true }
)

function onPageSelect(pageId: string) {
  emit('select-page', pageId)
}

function onNavClick(item: { id: string; href?: string }) {
  // 尝试从 navbar link 的 routeKey 找到对应页面
  const navItem = props.config.navigation.navbar.items.find((n) => {
    if (n.kind === 'link' && n.id === item.id) return true
    if (n.kind === 'group') return n.children.some((c) => c.id === item.id)
    return false
  })
  if (!navItem) return

  let routeKey: string | undefined
  if (navItem.kind === 'link') {
    routeKey = navItem.routeKey
  } else {
    const child = navItem.children.find((c) => c.id === item.id)
    routeKey = child?.routeKey
  }

  if (routeKey) {
    emit('select-route', routeKey)
  }
  activeNavId.value = navItem.id
}
</script>

<style scoped>
.kb-site-config-preview {
  border: 1px solid #e5e7eb;
  border-radius: 18px;
  background: #fff;
  overflow: hidden;
  min-height: 720px;
}
.kb-site-config-preview.is-mobile {
  max-width: 420px;
  margin: 0 auto;
}
</style>
