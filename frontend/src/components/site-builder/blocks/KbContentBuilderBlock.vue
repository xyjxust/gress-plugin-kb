<template>
  <section class="kb-preview-content">
    <div class="kb-preview-content__head">
      <div>
        <span class="kb-preview-content__eyebrow">V2 教程</span>
        <h1 :style="{ fontSize: `${theme.titleSize}px` }">{{ previewDoc?.title || config.title }}</h1>
        <p class="kb-preview-content__summary">围绕表单、详情和页面联动，预演真实 wiki 站点里常见的阅读节奏与信息层级。</p>
      </div>
      <div class="kb-preview-content__meta" :style="{ color: theme.mutedColor }">
        <span>{{ previewDoc?.status === 'PUBLISHED' ? '已发布' : '草稿' }}</span>
        <span v-if="previewDoc?.updatedAt">更新于 {{ previewDoc.updatedAt }}</span>
      </div>
    </div>

    <div class="kb-preview-content__body" :style="{ maxWidth: `${config.maxWidth}px` }">
      <KbDocBody :doc="previewDoc" :loading="docLoading" empty-text="请选择一篇文档来预演内容区" prefer-inline />
    </div>
  </section>
</template>

<script setup lang="ts">
import type { KbDoc } from '../../../types/kb'
import type { BlockThemeTokens, ContentAreaConfig } from '../../../types/siteBuilder'
import KbDocBody from '../../KbDocBody.vue'

defineProps<{
  config: ContentAreaConfig
  theme: BlockThemeTokens
  previewDoc: KbDoc | null
  docLoading: boolean
}>()
</script>

<style scoped>
.kb-preview-content { min-height:68vh; }
.kb-preview-content__head { display:flex; align-items:flex-start; justify-content:space-between; gap:24px; margin-bottom:32px; padding-bottom:18px; border-bottom:1px solid var(--kb-divider-color); }
.kb-preview-content__eyebrow { display:inline-flex; margin-bottom:12px; font-size:11px; letter-spacing:.12em; text-transform:uppercase; color:var(--kb-sidebar-group-text); font-weight:700; }
.kb-preview-content__head h1 { margin:0; line-height:1.08; letter-spacing:var(--kb-content-title-letter-spacing); font-weight:800; max-width:12em; }
.kb-preview-content__summary { margin:16px 0 0; max-width:680px; color:var(--kb-content-prose-color); font-size:16px; line-height:1.8; }
.kb-preview-content__meta { display:flex; flex-direction:column; gap:6px; padding-top:8px; font-size:12px; text-align:right; flex-shrink:0; }
.kb-preview-content__body { margin:0 auto; }
.kb-preview-content__body :deep(.kb-doc-body__prose), .kb-preview-content__body :deep(.kb-doc-body__frame-wrap) { border:none; border-radius:0; padding:0; background:transparent; box-shadow:none; }
.kb-preview-content__body :deep(.kb-doc-body__prose) { font-size:16px; line-height:1.95; color:var(--kb-content-prose-color); }
.kb-preview-content__body :deep(.kb-doc-body__prose h1), .kb-preview-content__body :deep(.kb-doc-body__prose h2), .kb-preview-content__body :deep(.kb-doc-body__prose h3) { color:var(--kb-content-heading-color); font-weight:800; letter-spacing:-.03em; }
.kb-preview-content__body :deep(.kb-doc-body__prose h2) { margin-top:2.2rem; font-size:1.65rem; }
.kb-preview-content__body :deep(.kb-doc-body__prose h3) { margin-top:1.5rem; font-size:1.2rem; }
.kb-preview-content__body :deep(.kb-doc-body__prose p) { margin:1rem 0; }
.kb-preview-content__body :deep(.kb-doc-body__prose ul) { margin:1rem 0; padding-left:1.25rem; }
.kb-preview-content__body :deep(.kb-doc-body__prose li) { margin:.42rem 0; }
.kb-preview-content__body :deep(.kb-doc-body__prose code) { padding:.18rem .42rem; border-radius:6px; background:#f6f3eb; color:#8b5e3c; font-size:.92em; }
.kb-preview-content__body :deep(.kb-doc-body__prose blockquote) { margin:1.5rem 0; padding-left:1rem; border-left:3px solid var(--kb-content-quote-border); color:var(--kb-content-quote-text); }
.kb-preview-content__body :deep(.kb-doc-body__empty) { text-align:left; padding-left:0; }
</style>
