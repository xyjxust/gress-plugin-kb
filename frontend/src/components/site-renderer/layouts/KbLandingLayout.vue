<template>
  <div class="sr-layout-landing">
    <!-- Navbar -->
    <KbRendererNavbar
      :config="config.navbar"
      :primary="config.theme.primary"
      :active-nav-id="activeNavId"
      @nav-click="(item) => $emit('nav-click', item)"
      @search="$emit('search')"
    />

    <!-- content-top 插槽 -->
    <div
      v-if="contentTopSlot && slotVisible['content-top'] !== false"
      class="sr-landing-slot-top"
    >
      <KbRendererSlot :instance="contentTopSlot" @close="slotVisible['content-top'] = false" />
    </div>

    <!-- Hero -->
    <KbRendererHero
      :title="heroTitle"
      :subtitle="heroSubtitle"
      :badge-text="landing?.badgeText"
      :actions="landing?.actions || defaultActions"
      :primary="config.theme.primary"
      @action-click="(a) => $emit('action-click', a)"
    />

    <!-- Features -->
    <KbRendererFeatures
      :label="landing?.featuresLabel || '核心功能'"
      :title="landing?.featuresTitle || featuresTitle"
      :features="landing?.features || defaultFeatures"
    />

    <!-- Footer -->
    <KbRendererFooter :config="config.footer" />
  </div>
</template>

<script setup lang="ts">
import { computed, reactive } from 'vue'
import type { SiteRendererConfig, CTAAction, FeatureItem } from '../../../types/siteRenderer'
import KbRendererNavbar from '../regions/KbRendererNavbar.vue'
import KbRendererHero from '../regions/KbRendererHero.vue'
import KbRendererFeatures from '../regions/KbRendererFeatures.vue'
import KbRendererFooter from '../regions/KbRendererFooter.vue'
import KbRendererSlot from '../KbRendererSlot.vue'

const props = defineProps<{
  config: SiteRendererConfig
  activePageId: string
  activeNavId?: string
}>()

defineEmits<{
  'nav-click': [item: any]
  'action-click': [action: CTAAction]
  search: []
}>()

const slotVisible = reactive<Record<string, boolean>>({})

const currentPage = computed(() => props.config.pages[props.activePageId] || null)
const landing = computed(() => props.config.landingConfig)
const contentTopSlot = computed(() => props.config.slots['content-top'] || null)

const heroTitle = computed(
  () => landing.value?.heroTitle || currentPage.value?.title || 'Welcome'
)
const heroSubtitle = computed(
  () => landing.value?.heroSubtitle || currentPage.value?.description || ''
)
const featuresTitle = computed(
  () => `为什么选择 ${props.config.navbar.brand}`
)

const defaultActions: CTAAction[] = [
  { id: 'start', label: '🚀 快速开始', type: 'primary' },
  { id: 'github', label: '⭐ GitHub', type: 'secondary' },
]

const defaultFeatures: FeatureItem[] = [
  { icon: '🧩', name: '插件市场', desc: '丰富的生态', color: '#f0fdf4' },
  { icon: '🎨', name: '可视化构建', desc: '零代码配置', color: '#eff6ff' },
  { icon: '⚡', name: '热更新', desc: '秒级部署', color: '#fff7ed' },
]
</script>

<style scoped>
.sr-layout-landing {
  min-height: 100vh;
}
.sr-landing-slot-top {
  border-bottom: 1px solid var(--border);
}
</style>
