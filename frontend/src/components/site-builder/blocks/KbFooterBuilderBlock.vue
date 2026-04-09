<template>
  <footer class="kb-preview-footer">
    <div class="kb-preview-footer__meta">
      <strong :style="{ fontSize: `${theme.titleSize}px` }">{{ config.title }}</strong>
      <span :style="{ color: theme.mutedColor }">{{ config.note }}</span>
    </div>

    <div v-if="config.showPager" class="kb-preview-footer__pager">
      <div class="kb-page-card">
        <small>上一篇</small>
        <strong>{{ prevDoc?.title || '暂无上一页' }}</strong>
      </div>
      <div class="kb-page-card kb-page-card--next">
        <small>下一篇</small>
        <strong>{{ nextDoc?.title || '暂无下一页' }}</strong>
      </div>
    </div>
  </footer>
</template>

<script setup lang="ts">
import type { BlockThemeTokens, FooterAreaConfig } from '../../../types/siteBuilder'

defineProps<{
  config: FooterAreaConfig
  theme: BlockThemeTokens
  prevDoc: { title: string } | null
  nextDoc: { title: string } | null
}>()
</script>

<style scoped>
.kb-preview-footer { margin-top:34px; border-top:1px solid var(--kb-divider-color); padding-top:18px; }
.kb-preview-footer__meta { display:flex; flex-direction:column; gap:6px; margin-bottom:18px; }
.kb-preview-footer__pager { display:grid; grid-template-columns:repeat(2, minmax(0,1fr)); gap:22px; }
.kb-page-card { min-height:102px; border-radius:var(--kb-page-card-radius); padding:18px 22px; border:1px solid var(--kb-page-card-border); background:var(--kb-page-card-bg); display:flex; flex-direction:column; justify-content:space-between; gap:8px; transition:border-color .16s ease, transform .16s ease; }
.kb-page-card:hover { border-color:color-mix(in srgb, var(--kb-page-card-border) 68%, #111827 32%); transform:translateY(-1px); }
.kb-page-card small { color:var(--kb-page-meta-text); font-size:12px; text-transform:uppercase; letter-spacing:.08em; }
.kb-page-card strong { font-size:16px; line-height:1.45; color:var(--kb-content-heading-color); }
.kb-page-card--next { text-align:right; }
@media (max-width: 1120px) {
  .kb-preview-footer__pager { grid-template-columns: 1fr; }
}
</style>
