<template>
  <aside class="kbvb-left">
    <div class="kbvb-left__head">
      <div class="kbvb-left__tabs">
        <button
          v-for="tab in tabs"
          :key="tab.id"
          class="kbvb-left__tab"
          :class="{ active: activeTab === tab.id }"
          @click="$emit('tab-change', tab.id)"
        >
          {{ tab.icon }} {{ tab.name }}
        </button>
      </div>
    </div>

    <div v-if="activeTab === 'structure'" class="kbvb-left__body">
      <div class="kbvb-left__section-head">
        <div>
          <div class="kbvb-left__title">页面</div>
          <div class="kbvb-left__meta">{{ pageItems.length }} 项</div>
        </div>
      </div>

      <n-input v-model:value="searchValue" size="small" placeholder="搜索页面..." />

      <div class="kbvb-page-list">
        <button
          v-for="item in filteredPages"
          :key="item.meta.id"
          class="kbvb-page-card"
          :class="{ active: selectedKind === 'page' && selectedValue === item.meta.id }"
          @click="$emit('select-page', item.meta.id)"
        >
          <div class="kbvb-page-card__icon">📄</div>
          <div class="kbvb-page-card__body">
            <strong>{{ item.page.title }}</strong>
            <span>{{ item.meta.slug }}</span>
            <div class="kbvb-page-card__tags">
              <n-tag v-if="item.inNavbar" size="small" :bordered="false" type="info">导航</n-tag>
              <n-tag v-if="item.inSidebar" size="small" :bordered="false" type="success">菜单</n-tag>
              <n-tag v-if="!item.inNavbar && !item.inSidebar" size="small" :bordered="false" type="error">孤立</n-tag>
            </div>
          </div>
        </button>
      </div>
    </div>

    <div v-else-if="activeTab === 'theme'" class="kbvb-left__body">
      <div class="kbvb-left__section-head">
        <div>
          <div class="kbvb-left__title">主题</div>
          <div class="kbvb-left__meta">布局方案</div>
        </div>
      </div>
      <button
        v-for="theme in themeManifests"
        :key="theme.id"
        class="kbvb-theme-card"
        :class="{ active: siteConfig.themeId === theme.id }"
        @click="$emit('switch-theme', theme.id)"
      >
        <div class="kbvb-theme-card__preview">{{ theme.icon }}</div>
        <div class="kbvb-theme-card__body">
          <strong>{{ theme.name }}</strong>
          <span>{{ theme.id }}</span>
        </div>
      </button>
    </div>

    <div v-else class="kbvb-left__body">
      <div class="kbvb-left__section-head">
        <div>
          <div class="kbvb-left__title">插槽</div>
          <div class="kbvb-left__meta">{{ activeSlots.length }} 个区域</div>
        </div>
      </div>
      <button
        v-for="slot in activeSlots"
        :key="slot"
        class="kbvb-slot-row"
        :class="{ active: selectedKind === 'slot' && selectedValue === slot }"
        @click="$emit('select-slot', slot)"
      >
        <div>
          <strong>{{ slot }}</strong>
          <span>{{ siteConfig.slots[slot]?.componentKey || '未配置' }}</span>
        </div>
        <span class="kbvb-slot-row__plus">{{ siteConfig.slots[slot] ? '已启用' : '+' }}</span>
      </button>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import type { ThemeManifest, SiteRendererConfig } from '../../types/siteRenderer'
import type { BuilderPageListItem, BuilderSelectionKind, BuilderTab } from '../../types/siteVisualBuilder'

const props = defineProps<{
  activeTab: BuilderTab
  pageItems: BuilderPageListItem[]
  themeManifests: ThemeManifest[]
  siteConfig: SiteRendererConfig
  activeSlots: string[]
  selectedKind: BuilderSelectionKind
  selectedValue: string
}>()

defineEmits<{
  'tab-change': [tab: BuilderTab]
  'select-page': [id: string]
  'select-slot': [slot: string]
  'switch-theme': [id: string]
}>()

const tabs = [
  { id: 'structure', icon: '🗂', name: '结构' },
  { id: 'theme', icon: '🎨', name: '主题' },
  { id: 'slots', icon: '🧩', name: '插槽' },
] as const

const searchValue = ref('')

const filteredPages = computed(() => {
  const q = searchValue.value.trim().toLowerCase()
  if (!q) return props.pageItems
  return props.pageItems.filter((item: BuilderPageListItem) =>
    [item.page.title, item.meta.slug].some((text) => text.toLowerCase().includes(q))
  )
})
</script>

<style scoped>
.kbvb-left { width:236px; min-width:236px; background:#11141d; border-right:1px solid #262b3d; display:flex; flex-direction:column; }
.kbvb-left__head { padding:10px 10px 0; }
.kbvb-left__tabs { display:flex; gap:8px; }
.kbvb-left__tab { flex:1; height:40px; border-radius:12px; border:1px solid #2a3147; background:#151924; color:#b7bfd0; cursor:pointer; }
.kbvb-left__tab.active { background:#1d2a43; border-color:#4067b7; color:#fff; }
.kbvb-left__body { padding:12px 8px 10px; display:flex; flex-direction:column; gap:10px; min-height:0; overflow:auto; }
.kbvb-left__section-head { display:flex; align-items:center; justify-content:space-between; padding:2px 4px; }
.kbvb-left__title { font-size:13px; font-weight:700; color:#fff; }
.kbvb-left__meta { font-size:12px; color:#7f8ca5; margin-top:2px; }
.kbvb-page-list { display:flex; flex-direction:column; gap:10px; }
.kbvb-page-card { width:100%; text-align:left; display:grid; grid-template-columns:34px 1fr; gap:10px; padding:12px 12px 14px; border-radius:14px; border:1px solid #293044; background:#151924; color:#d9e0ee; cursor:pointer; }
.kbvb-page-card.active { border-color:#4b86f6; box-shadow:0 0 0 1px rgba(77,142,245,.12); background:#182237; }
.kbvb-page-card__icon { width:34px; height:34px; border-radius:12px; background:#242b3e; display:flex; align-items:center; justify-content:center; font-size:16px; }
.kbvb-page-card__body { display:flex; flex-direction:column; gap:4px; min-width:0; }
.kbvb-page-card__body strong { font-size:14px; color:#f5f7fb; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.kbvb-page-card__body span { font-size:12px; color:#77859f; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.kbvb-page-card__tags { display:flex; gap:6px; flex-wrap:wrap; margin-top:2px; }
.kbvb-theme-card,.kbvb-slot-row { width:100%; text-align:left; padding:12px; border-radius:14px; border:1px solid #293044; background:#151924; color:#d9e0ee; cursor:pointer; display:flex; align-items:center; justify-content:space-between; }
.kbvb-theme-card.active,.kbvb-slot-row.active { border-color:#4b86f6; background:#182237; }
.kbvb-theme-card__preview { width:40px; height:40px; border-radius:12px; background:#21283a; display:flex; align-items:center; justify-content:center; font-size:22px; }
.kbvb-theme-card { gap:10px; justify-content:flex-start; }
.kbvb-theme-card__body { display:flex; flex-direction:column; gap:2px; }
.kbvb-theme-card__body strong,.kbvb-slot-row strong { color:#fff; font-size:13px; }
.kbvb-theme-card__body span,.kbvb-slot-row span { color:#7f8ca5; font-size:12px; }
.kbvb-slot-row__plus { color:#c0c8da !important; font-size:12px; }
</style>
