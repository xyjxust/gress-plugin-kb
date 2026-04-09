<template>
  <section class="kb-preview-header">
    <div class="kb-preview-header__brand">
      <div v-if="config.showLogo" class="kb-preview-header__logo" :style="{ background: theme.accentColor }">N</div>
      <div class="kb-preview-header__title-group">
        <strong :style="{ fontSize: `${theme.titleSize}px` }">{{ config.title }}</strong>
        <small>教程 / 文档 / API</small>
      </div>
    </div>

    <div v-if="config.showSearch" class="kb-preview-header__search">
      <span class="kb-preview-header__search-icon">⌕</span>
      <span>搜索文档、教程与 API</span>
      <kbd>K</kbd>
    </div>

    <nav class="kb-preview-header__nav">
      <template v-for="node in navTree" :key="node.id">
        <KbShellNavNode :node="node" :active-nav-id="selectedNavId" horizontal @select-nav="emit('select-nav', $event)" />
      </template>
      <span v-if="!navTree.length" class="kb-preview-empty">拖拽后这里会展示 header 导航</span>
    </nav>

    <div class="kb-preview-header__actions">
      <span v-if="config.showLanguage" class="kb-header-icon">中/EN</span>
      <span v-if="config.showTheme" class="kb-header-icon">主题</span>
      <span class="kb-header-icon">社区</span>
    </div>
  </section>
</template>

<script setup lang="ts">
import type { KbNavNode } from '../../../types/kb'
import type { BlockThemeTokens, HeaderAreaConfig } from '../../../types/siteBuilder'
import KbShellNavNode from '../../KbShellNavNode.vue'

defineProps<{
  config: HeaderAreaConfig
  theme: BlockThemeTokens
  navTree: KbNavNode[]
  selectedNavId: number | null
}>()

const emit = defineEmits<{
  'select-nav': [navId: number]
}>()
</script>

<style scoped>
.kb-preview-header { min-height:72px; display:grid; grid-template-columns:auto minmax(240px,320px) minmax(0,1fr) auto; align-items:center; gap:22px; border-bottom:1px solid var(--kb-divider-color); overflow:visible; }
.kb-preview-header__brand { display:flex; align-items:center; gap:14px; min-width:0; }
.kb-preview-header__logo { display:flex; align-items:center; justify-content:center; color:#fff; font-weight:800; font-size:20px; width:36px; height:36px; border-radius:10px; flex-shrink:0; }
.kb-preview-header__title-group { min-width:0; }
.kb-preview-header__title-group strong { display:block; font-size:18px; font-weight:700; color:var(--kb-header-brand-text); line-height:1.2; }
.kb-preview-header__title-group small { display:block; margin-top:2px; font-size:12px; color:var(--kb-header-search-text); }
.kb-preview-header__search { height:40px; min-width:0; padding:0 14px; border-radius:999px; display:flex; align-items:center; gap:10px; color:var(--kb-header-search-text); background:var(--kb-header-search-bg); border:1px solid color-mix(in srgb, var(--kb-header-icon-border) 76%, white 24%); }
.kb-preview-header__search-icon { font-size:14px; opacity:0.8; }
.kb-preview-header__search kbd { margin-left:auto; border-radius:8px; background:var(--kb-header-kbd-bg); padding:2px 8px; font-size:11px; color:var(--kb-header-kbd-text); border:1px solid var(--kb-header-icon-border); }
.kb-preview-header__nav { display:flex; align-items:center; gap:var(--kb-header-nav-gap); flex-wrap:wrap; min-width:0; overflow:visible; position:relative; z-index:6; }
.kb-preview-header__actions { display:flex; align-items:center; gap:10px; }
.kb-header-icon { display:inline-flex; align-items:center; justify-content:center; min-width:54px; height:36px; padding:0 12px; border:1px solid var(--kb-header-icon-border); border-radius:999px; background:var(--kb-header-action-bg); color:var(--kb-header-action-text); font-size:12px; }
.kb-preview-empty { display:inline-flex; align-items:center; min-height:40px; color:var(--kb-empty-text-color); font-size:13px; }
@media (max-width: 1120px) {
  .kb-preview-header { grid-template-columns: 1fr; }
}
</style>
