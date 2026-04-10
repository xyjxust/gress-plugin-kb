<template>
  <div class="kb-doc-body">
    <div v-if="loading" class="kb-doc-body__empty">加载中...</div>
    <div v-else-if="doc && staticHtmlUrl" class="kb-doc-body__frame-wrap">
      <iframe class="kb-doc-body__frame" :src="staticHtmlUrl" title="文档静态页" />
    </div>
    <div
      v-else-if="doc"
      ref="proseRef"
      class="kb-doc-body__prose"
      v-html="html"
      @click="onProseClick"
    />
    <div v-else class="kb-doc-body__empty">{{ emptyText }}</div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useMessage } from '@keqi.gress/plugin-bridge'
import type { KbDoc } from '../types/kb'
import { parseKbMarkdown } from '../editor/kbMarked'
import { rewriteHtmlStorageUrlsToDownloadApi } from '../utils/kbStorageDownload'
import { enhanceKbDocCodeBlocks, enhanceKbTabbedPanels } from '../utils/kbDocCodeBlocks'
import { ensureDocLinksOpenInNewTab } from '../utils/kbDocProseLinks'
import { injectHeadingIdsIntoHtml } from '../utils/kbHeadingAnchors'
import 'highlight.js/styles/github.css'

const message = useMessage()
const proseRef = ref<HTMLElement | null>(null)

function onProseClick(e: MouseEvent) {
  const target = e.target as HTMLElement | null
  const tabCopy = target?.closest?.('[data-kb-tabbed-copy]') as HTMLElement | null
  if (tabCopy && proseRef.value?.contains(tabCopy)) {
    e.preventDefault()
    const pane = tabCopy.closest('.kb-tabbed-panel__pane')
    const codeEl = pane?.querySelector('pre code') as HTMLElement | null
    const text = codeEl?.textContent ?? ''
    if (!text) return
    void navigator.clipboard.writeText(text).then(
      () => message.success('已复制'),
      () => message.warning('复制失败')
    )
    return
  }

  const btn = target?.closest?.('[data-kb-code-copy]') as HTMLElement | null
  if (!btn || !proseRef.value?.contains(btn)) return
  e.preventDefault()
  const panel = btn.closest('.kb-code-panel')
  const codeEl = panel?.querySelector('.kb-code-panel__pre code') as HTMLElement | null
  const text = codeEl?.textContent ?? ''
  if (!text) return
  void navigator.clipboard.writeText(text).then(
    () => message.success('已复制'),
    () => message.warning('复制失败')
  )
}

const props = withDefaults(
  defineProps<{
    doc: KbDoc | null
    loading?: boolean
    emptyText?: string
    preferInline?: boolean
    /** 是否将上传/存储文件 URL 改写为宿主 /system/storage/download?url= */
    proxyStorageDownloads?: boolean
  }>(),
  {
    loading: false,
    emptyText: '暂无内容',
    preferInline: false,
    proxyStorageDownloads: true
  }
)

/**
 * 静态整页 iframe 与「重写存储链接」互斥：iframe 内文档无法被本组件改写 href/src，
 * 需要走下方 v-html（bodyHtml / bodyMd）才会经过 rewriteHtmlStorageUrlsToDownloadApi。
 */
const staticHtmlUrl = computed(() => {
  const d = props.doc
  if (!d) return ''
  if (props.preferInline) return ''
  if (props.proxyStorageDownloads) return ''
  if (d.status !== 'PUBLISHED') return ''
  return d.staticHtmlUrl || ''
})

const html = computed(() => {
  let inner: string
  if (props.doc?.status === 'PUBLISHED' && props.doc.bodyHtml) {
    inner = props.doc.bodyHtml
  } else {
    inner = parseKbMarkdown(props.doc?.bodyMd || '')
  }
  if (props.proxyStorageDownloads) {
    inner = rewriteHtmlStorageUrlsToDownloadApi(inner)
  }
  inner = enhanceKbTabbedPanels(enhanceKbDocCodeBlocks(inner))
  inner = injectHeadingIdsIntoHtml(inner)
  return ensureDocLinksOpenInNewTab(inner)
})
</script>

<style scoped>
.kb-doc-body {
  min-height: 120px;
}

.kb-doc-body__frame-wrap {
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  overflow: hidden;
  background: #fff;
}

.kb-doc-body__frame {
  width: 100%;
  height: min(62vh, 720px);
  border: 0;
  display: block;
}

.kb-doc-body__prose {
  border-radius: 10px;
  padding: 18px 20px;
  line-height: 1.7;
  word-break: break-word;
  overflow-wrap: anywhere;
}

.kb-doc-body__prose :deep(h1),
.kb-doc-body__prose :deep(h2),
.kb-doc-body__prose :deep(h3),
.kb-doc-body__prose :deep(h4),
.kb-doc-body__prose :deep(h5),
.kb-doc-body__prose :deep(h6) {
  color: #0f172a;
  line-height: 1.35;
  margin: 1.1em 0 0.55em;
}

.kb-doc-body__prose :deep(h1) {
  font-size: 1.65rem;
}
.kb-doc-body__prose :deep(h2) {
  font-size: 1.35rem;
}
.kb-doc-body__prose :deep(h3) {
  font-size: 1.15rem;
}

.kb-doc-body__prose :deep(p) {
  margin: 0.7em 0;
}

.kb-doc-body__prose :deep(ul),
.kb-doc-body__prose :deep(ol) {
  margin: 0.75em 0;
  padding-left: 1.4em;
}

.kb-doc-body__prose :deep(li) {
  margin: 0.25em 0;
}

/* 普通 fenced 代码（未走 kb-code-panel 时） */
.kb-doc-body__prose :deep(pre:not(.kb-code-panel__pre)) {
  background: #f1f5f9;
  border-radius: 8px;
  padding: 12px 14px;
  overflow-x: auto;
  font-size: 13px;
  line-height: 1.5;
}

.kb-doc-body__prose :deep(pre[data-kb-code-block='1']) {
  border: 1px solid #e2e8f0;
  margin: 0.65em 0;
}

.kb-doc-body__prose :deep(hr) {
  border: none;
  border-top: 1px solid #e5e7eb;
  margin: 1rem 0;
}

.kb-doc-body__prose :deep(p[data-kb-paragraph-spacer]:has(+ hr)) {
  margin-bottom: 0.35em;
}
.kb-doc-body__prose :deep(p[data-kb-paragraph-spacer] + hr) {
  margin-top: 0;
}

.kb-doc-body__prose :deep(pre:not(.kb-code-panel__pre) code) {
  background: transparent;
  font-size: inherit;
  padding: 0;
}

/* 阅读态代码块：顶栏 + 正文（与编辑器 KbCodeBlockView 默认色一致） */
.kb-doc-body__prose :deep(.kb-code-panel) {
  margin: 0.75em 0;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  overflow: hidden;
  background: #f8fafc;
}

.kb-doc-body__prose :deep(.kb-code-panel__head) {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 6px 8px;
  background: #f1f5f9;
  border-bottom: 1px solid #e2e8f0;
  font-size: 12px;
}

.kb-doc-body__prose :deep(.kb-code-panel__lang) {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  color: #64748b;
  text-transform: lowercase;
}

.kb-doc-body__prose :deep(.kb-code-panel__copy) {
  flex-shrink: 0;
  padding: 2px 10px;
  font-size: 12px;
  line-height: 1.4;
  color: #475569;
  background: #fff;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  cursor: pointer;
}

.kb-doc-body__prose :deep(.kb-code-panel__copy:hover) {
  border-color: #94a3b8;
  color: #0f172a;
}

/* 仅外层 .kb-code-panel 保留边框与圆角；内层 pre/code 不再单独描边/圆角（避免 github.css 的 padding+白底形成「盒中盒」） */
.kb-doc-body__prose :deep(.kb-code-panel__pre) {
  margin: 0;
  padding: 10px 12px;
  overflow-x: auto;
  font-size: 13px;
  line-height: 1.5;
  white-space: pre-wrap;
  word-break: break-word;
  background: #f1f5f9;
  border: none;
  border-radius: 0;
  box-shadow: none;
  /* 与外层 8px 圆角、1px 边框对齐，避免内层底色在圆角处露直角 */
  border-bottom-left-radius: 7px;
  border-bottom-right-radius: 7px;
}

.kb-doc-body__prose :deep(.kb-code-panel__pre--nowrap) {
  white-space: pre;
  word-break: normal;
}

/* 多标签代码块（阅读态，与编辑器视觉一致） */
.kb-doc-body__prose :deep(.kb-tabbed-panel) {
  margin: 0.85em 0;
  padding: 14px 16px 16px;
  background: #f4f4f5;
  border-radius: 14px;
  border: 1px solid #e4e4e7;
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  gap: 0 14px;
}

.kb-doc-body__prose :deep(.kb-tabbed-panel__tab) {
  cursor: pointer;
  font-size: 14px;
  color: #a1a1aa;
  padding: 6px 2px 10px;
  margin-bottom: 2px;
  user-select: none;
  transition: color 0.15s ease;
}

.kb-doc-body__prose :deep(.kb-tabbed-panel__tab:hover) {
  color: #6366f1;
}

.kb-doc-body__prose :deep(.kb-tabbed-panel__pane) {
  flex-basis: 100%;
  width: 100%;
  position: relative;
  margin-top: 4px;
}

.kb-doc-body__prose :deep(.kb-tabbed-panel__pre) {
  margin: 0;
  padding: 12px 14px 40px;
  background: transparent;
  border: 1px solid #e4e4e7;
  border-radius: 10px;
  overflow-x: auto;
  font-size: 13px;
  line-height: 1.55;
}

.kb-doc-body__prose :deep(.kb-tabbed-panel__pre code.hljs) {
  background: transparent !important;
}

.kb-doc-body__prose :deep(.kb-tabbed-panel__copy) {
  position: absolute;
  right: 10px;
  bottom: 10px;
  padding: 4px 10px;
  font-size: 12px;
  color: #71717a;
  background: rgba(255, 255, 255, 0.9);
  border: 1px solid #e4e4e7;
  border-radius: 6px;
  cursor: pointer;
}

.kb-doc-body__prose :deep(.kb-tabbed-panel__copy:hover) {
  color: #18181b;
  border-color: #d4d4d8;
}

.kb-doc-body__prose :deep(.tableWrapper) {
  margin: 0.75em 0;
}

.kb-doc-body__prose :deep(table) {
  border-collapse: collapse;
  table-layout: auto;
  width: 100%;
  font-size: 14px;
  line-height: 1.5;
}

.kb-doc-body__prose :deep(th),
.kb-doc-body__prose :deep(td) {
  border: 1px solid #e8e8e8;
  padding: 10px 12px;
  vertical-align: top;
}

.kb-doc-body__prose :deep(th) {
  background: #f8f8f8;
  font-weight: 700;
  text-align: center;
}

.kb-doc-body__prose :deep(td) {
  background: #fff;
  text-align: left;
}

.kb-doc-body__prose :deep(.kb-code-panel__pre code),
.kb-doc-body__prose :deep(.kb-code-panel__pre code.hljs) {
  display: block;
  margin: 0;
  border: none !important;
  border-radius: 0 !important;
  outline: none !important;
  box-shadow: none !important;
  background: transparent !important;
  padding: 0 !important;
  /* 覆盖 github.css「pre code.hljs { overflow-x: auto }」，否则内层 code 成方角滚动盒 */
  overflow-x: visible !important;
  overflow-y: visible !important;
  font-size: inherit;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New',
    monospace;
}

.kb-doc-body__prose :deep(a) {
  color: #2563eb;
  text-decoration: underline;
}

/* http(s) 外链：文后 ↗（与编辑器一致） */
.kb-doc-body__prose :deep(a[href^='http://']::after),
.kb-doc-body__prose :deep(a[href^='https://']::after) {
  content: '\2197';
  display: inline-block;
  margin-left: 0.12em;
  font-size: 0.88em;
  line-height: 1;
  vertical-align: 0.08em;
  text-decoration: none;
  color: inherit;
}

.kb-doc-body__prose :deep(img) {
  max-width: 100% !important;
  height: auto !important;
  border-radius: 8px;
  display: block;
  margin: 0.6rem 0;
}

.kb-doc-body__prose :deep(img[data-kb-align='center']) {
  margin-left: auto;
  margin-right: auto;
}

.kb-doc-body__prose :deep(img[data-kb-align='right']) {
  margin-left: auto;
  margin-right: 0;
}

.kb-doc-body__prose :deep(iframe) {
  max-width: 100%;
  display: block;
  margin: 0.75rem 0;
  border: 0;
  border-radius: 8px;
  background: #f8fafc;
}

.kb-doc-body__prose :deep(iframe[data-kb-align='center']),
.kb-doc-body__prose :deep(.kb-image-gallery[data-kb-align='center']) {
  margin-left: auto;
  margin-right: auto;
}

.kb-doc-body__prose :deep(iframe[data-kb-align='right']),
.kb-doc-body__prose :deep(.kb-image-gallery[data-kb-align='right']) {
  margin-left: auto;
  margin-right: 0;
}

.kb-doc-body__prose :deep(.kb-layout-section) {
  border-radius: 10px;
  margin: 0.75rem 0;
  padding: 14px 18px;
}

.kb-doc-body__prose :deep(.kb-layout-section[data-kb-variant='default']) {
  background: transparent;
}

.kb-doc-body__prose :deep(.kb-layout-section[data-kb-variant='muted']) {
  background: #f8fafc;
}

.kb-doc-body__prose :deep(.kb-layout-section[data-kb-variant='emphasis']) {
  background: #eff6ff;
}

.kb-doc-body__prose :deep(.kb-layout-section[data-kb-variant='tip']) {
  position: relative;
  margin: 0.75rem 0;
  padding: 14px 18px 14px 20px;
  background: #f0f7ff;
  border-radius: 10px;
  box-shadow: inset 4px 0 0 #1d4ed8;
  color: #1e3a5f;
}

.kb-doc-body__prose :deep(.kb-layout-section[data-kb-variant='tip'] > p:first-child) {
  margin-top: 0;
  color: var(--kb-tip-title, #1d4ed8);
  font-weight: 600;
}

.kb-doc-body__prose :deep(.kb-layout-section[data-kb-variant='tip'] > p:first-child strong) {
  color: var(--kb-tip-title, #1d4ed8);
  font-weight: 700;
}

.kb-doc-body__prose :deep(.kb-layout-section[data-kb-variant='tip'] > p + p) {
  margin-top: 0.5rem;
  color: #1e3a5f;
  font-weight: 400;
}

.kb-doc-body__prose :deep(.kb-grid) {
  display: grid;
  grid-template-columns: repeat(var(--kb-grid-cols, 2), minmax(0, 1fr));
  column-gap: var(--kb-grid-x-gap, 16px);
  row-gap: var(--kb-grid-y-gap, 12px);
  margin: 0.75rem 0;
}

.kb-doc-body__prose :deep(.kb-grid__col) {
  min-width: 0;
}

.kb-doc-body__prose :deep(.kb-grid__col > *:first-child) {
  margin-top: 0;
}

.kb-doc-body__prose :deep(.kb-grid__col > *:last-child) {
  margin-bottom: 0;
}

.kb-doc-body__prose :deep(.kb-image-gallery) {
  display: flex;
  align-items: flex-start;
  flex-wrap: nowrap;
  gap: 8px;
  margin: 0.75rem 0;
  overflow-x: auto;
  padding-bottom: 4px;
}

.kb-doc-body__prose :deep(.kb-image-gallery__img) {
  flex: 1 1 0;
  min-width: 120px;
  max-width: min(320px, 45vw);
  height: auto;
  max-height: 280px;
  object-fit: cover;
  border-radius: 8px;
}

.kb-doc-body__empty {
  color: #94a3b8;
  font-size: 13px;
  padding: 24px 12px;
  text-align: center;
}

@media (max-width: 960px) {
  .kb-doc-body__frame {
    height: 58vh;
  }
  .kb-doc-body__prose {
    padding: 14px 12px;
  }
  .kb-doc-body__prose :deep(.kb-image-gallery) {
    flex-wrap: wrap;
    overflow-x: hidden;
    gap: 6px;
  }
  .kb-doc-body__prose :deep(.kb-image-gallery__img) {
    flex: 1 1 calc(50% - 6px);
    min-width: min(180px, 44%);
    max-width: 100%;
    max-height: 220px;
  }
}

@media (max-width: 640px) {
  .kb-doc-body__prose :deep(.kb-grid) {
    grid-template-columns: 1fr;
  }
}
</style>
