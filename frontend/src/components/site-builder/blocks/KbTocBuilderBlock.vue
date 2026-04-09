<template>
  <aside class="kb-preview-toc">
    <div class="kb-preview-panel__title" :style="{ fontSize: `${theme.titleSize}px` }">{{ config.title }}</div>
    <div class="kb-preview-toc__list">
      <button
        v-for="item in tocItems"
        :key="item.id"
        type="button"
        class="kb-preview-toc__item"
        :class="{ 'kb-preview-toc__item--active': activeTocId === item.id }"
        :style="{ paddingLeft: `${(item.level - 1) * 14 + 12}px` }"
      >
        {{ item.text }}
      </button>
      <div v-if="!tocItems.length" class="kb-preview-empty">当前文档还没有可用目录</div>
    </div>
  </aside>
</template>

<script setup lang="ts">
import type { BlockThemeTokens, TocAreaConfig, TocItem } from '../../../types/siteBuilder'

defineProps<{
  config: TocAreaConfig
  theme: BlockThemeTokens
  tocItems: TocItem[]
  activeTocId?: string | null
}>()
</script>

<style scoped>
.kb-preview-toc { padding-top:14px; }
.kb-preview-panel__title { padding:0 10px 14px; font-weight:700; font-size:12px !important; color:var(--kb-sidebar-group-text); letter-spacing:.12em; text-transform:uppercase; }
.kb-preview-toc__list { display:flex; flex-direction:column; gap:3px; padding:0 0 0 10px; border-left:1px solid var(--kb-sidebar-rail-color); }
.kb-preview-toc__item { border:none; background:transparent; text-align:left; min-height:30px; border-radius:var(--kb-toc-item-radius); color:var(--kb-toc-text-color); cursor:pointer; padding-right:10px; font-size:13px; transition:background-color .16s ease,color .16s ease; }
.kb-preview-toc__item:hover { background:var(--kb-toc-hover-bg); color:var(--kb-toc-active-text); }
.kb-preview-toc__item--active { background: var(--kb-toc-hover-bg); color: var(--kb-toc-active-text); font-weight: 700; }
.kb-preview-empty { display:inline-flex; align-items:center; min-height:40px; color:var(--kb-empty-text-color); font-size:13px; }
</style>
