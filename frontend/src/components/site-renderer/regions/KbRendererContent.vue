<template>
  <article class="sr-content">
    <!-- 文档头部 -->
    <header v-if="page && !resolvedPageComponent" class="sr-content__header">
      <h1 class="sr-content__title">{{ page.title }}</h1>
      <p
        v-if="page.description && !page.meta?.kbDocListSource"
        class="sr-content__desc"
      >
        {{ page.description }}
      </p>
      <div v-if="showMeta" class="sr-content__meta">
        <span v-if="page.updatedAt">&#x1F4C5; {{ page.updatedAt }}</span>
        <span v-if="page.readTime">&#x23F1; {{ page.readTime }} 分钟阅读</span>
        <span v-if="page.author">&#x270D;&#xFE0F; {{ page.author }}</span>
      </div>
    </header>

    <!-- 扩展页面组件（用于“编辑器无法表达”的复杂交互页） -->
    <div v-if="resolvedPageComponent" class="sr-content__body sr-content__body--component">
      <component
        :is="resolvedPageComponent"
        v-bind="pageComponentProps"
      />
    </div>

    <!-- 与 KbDocList 同源的 kb 文档：走 KbDocBody（含存储下载链接改写） -->
    <div v-else-if="page?.meta?.kbDocListSource" class="sr-content__body sr-content__body--kb">
      <KbDocBody
        :doc="page.meta.kbDoc ?? null"
        :loading="!!page.meta.kbDocLoading"
        prefer-inline
      />
    </div>

    <!-- 内容区 HTML 渲染 -->
    <div v-else-if="page?.html" class="sr-content__body" v-html="page.html" />

    <!-- 空状态 -->
    <div v-else-if="!page" class="sr-content__empty">
      <span>暂无内容</span>
    </div>
  </article>
</template>

<script setup lang="ts">
import { computed, inject } from 'vue'
import type { Component } from 'vue'
import type { PageData, SiteRendererConfig } from '../../../types/siteRenderer'
import KbDocBody from '../../KbDocBody.vue'

const props = defineProps<{
  page?: PageData | null
  config?: SiteRendererConfig
}>()

const showMeta = computed(
  () => props.page && (props.page.updatedAt || props.page.readTime || props.page.author)
)

// 宿主共享组件注册表 getter（与 codegen/SystemSettings.vue 同款模式）
const SHARED_GET_REGISTRY_KEY = 'sharedComponentsGetRegistry'
const sharedGetRegistry = inject<((category: string) => Record<string, Component>) | undefined>(
  SHARED_GET_REGISTRY_KEY,
  undefined
)

type RenderComponentRef = { category: string; name: string; props?: Record<string, any> }

const renderComponentRef = computed<RenderComponentRef | null>(() => {
  const meta = props.page?.meta as any
  // 1) 优先显式 renderComponent（站点配置或 hydrate 时写入）
  const raw = meta?.renderComponent
  if (raw) {
    const category = String(raw.category || '').trim()
    const name = String(raw.name || '').trim()
    if (category && name) return { category, name, props: (raw.props || {}) as Record<string, any> }
  }

  // 2) 兼容：KB 文档页（kbDocListSource）里若 kbDoc.docType=COMPONENT，则直接从 kbDoc 派生组件引用
  const kbDoc = meta?.kbDoc
  const dt = String(kbDoc?.docType || '').toUpperCase()
  if (dt === 'COMPONENT') {
    const category = String(kbDoc?.componentCategory || '').trim()
    const name = String(kbDoc?.componentName || '').trim()
    if (!category || !name) return null
    let props: Record<string, any> = {}
    const rawJson = kbDoc?.componentPropsJson
    if (typeof rawJson === 'string' && rawJson.trim()) {
      try {
        props = JSON.parse(rawJson)
      } catch {
        props = {}
      }
    }
    return { category, name, props }
  }

  return null
})

const resolvedPageComponent = computed<Component | null>(() => {
  const ref = renderComponentRef.value
  if (!ref || !sharedGetRegistry) return null
  return sharedGetRegistry(ref.category)?.[ref.name] || null
})

const pageComponentProps = computed(() => {
  const ref = renderComponentRef.value
  const extProps = ref?.props || {}
  return {
    ...extProps,
    page: props.page || null,
    siteConfig: props.config || null,
  }
})
</script>

<style scoped>
.sr-content__header {
  margin-bottom: 36px;
}
.sr-content__title {
  font-family: var(--font-serif);
  font-size: 36px;
  font-weight: 400;
  color: var(--text);
  letter-spacing: -0.5px;
  line-height: 1.25;
  margin-bottom: 12px;
}
.sr-content__desc {
  font-size: 16px;
  color: var(--text2);
  line-height: 1.7;
}
.sr-content__meta {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid var(--border);
  font-size: 12px;
  color: var(--text3);
  font-family: var(--font-mono);
}
.sr-content__empty {
  padding: 80px 0;
  text-align: center;
  color: var(--text3);
  font-size: 14px;
}

/* ── prose 排版（v-html 内容） ───────────────────────────────── */
.sr-content__body {
  line-height: 1.8;
}
.sr-content__body :deep(h2) {
  font-size: 22px;
  font-weight: 600;
  margin: 36px 0 14px;
  color: var(--text);
  padding-top: 8px;
  border-top: 1px solid var(--border);
  letter-spacing: -0.3px;
}
.sr-content__body :deep(h3) {
  font-size: 16px;
  font-weight: 600;
  margin: 24px 0 10px;
  color: var(--text);
}
.sr-content__body :deep(p) {
  margin-bottom: 16px;
  color: var(--text2);
  font-size: 15px;
}
.sr-content__body :deep(code) {
  font-family: var(--font-mono);
  font-size: 13px;
  background: var(--bg3);
  border: 1px solid var(--border);
  padding: 1px 6px;
  border-radius: 4px;
  color: var(--primary-text);
}

/* 自定义容器 */
.sr-content__body :deep(.container-tip),
.sr-content__body :deep(.container-warning),
.sr-content__body :deep(.container-danger),
.sr-content__body :deep(.container-info) {
  padding: 14px 16px;
  border-radius: var(--r);
  border-left: 3px solid;
  margin: 20px 0;
  font-size: 14px;
}
.sr-content__body :deep(.container-tip) {
  background: #f0fdf4;
  border-color: #22c55e;
  color: #15803d;
}
.sr-content__body :deep(.container-warning) {
  background: #fffbeb;
  border-color: #f59e0b;
  color: #92400e;
}
.sr-content__body :deep(.container-danger) {
  background: #fef2f2;
  border-color: #ef4444;
  color: #991b1b;
}
.sr-content__body :deep(.container-info) {
  background: var(--primary-light);
  border-color: var(--primary);
  color: var(--primary-text);
}
.sr-content__body :deep(.container-title) {
  font-weight: 600;
  font-size: 13px;
  letter-spacing: 0.3px;
  margin-bottom: 6px;
  display: flex;
  align-items: center;
  gap: 6px;
}

/* 暗色容器覆盖（通过父级 .theme-dark 触发） */
:global(.theme-dark) .sr-content__body :deep(.container-tip) {
  background: #052e16;
  border-color: #22c55e;
  color: #86efac;
}
:global(.theme-dark) .sr-content__body :deep(.container-warning) {
  background: #1c1400;
  border-color: #f59e0b;
  color: #fcd34d;
}
:global(.theme-dark) .sr-content__body :deep(.container-danger) {
  background: #1c0303;
  border-color: #ef4444;
  color: #fca5a5;
}
:global(.theme-dark) .sr-content__body :deep(.container-info) {
  background: #0d1f3c;
  border-color: var(--primary);
  color: #93c5fd;
}

/* 代码块 */
.sr-content__body :deep(.code-block) {
  background: var(--bg3);
  border: 1px solid var(--border);
  border-radius: var(--r);
  overflow: hidden;
  margin: 20px 0;
}
.sr-content__body :deep(.code-header) {
  display: flex;
  align-items: center;
  padding: 8px 14px;
  border-bottom: 1px solid var(--border);
  gap: 8px;
}
.sr-content__body :deep(.code-lang) {
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--text3);
}
.sr-content__body :deep(.code-copy) {
  margin-left: auto;
  font-size: 11px;
  color: var(--text3);
  cursor: pointer;
  padding: 2px 8px;
  border-radius: 4px;
  border: 1px solid var(--border);
  background: var(--bg);
  transition: all 0.12s;
}
.sr-content__body :deep(.code-copy:hover) {
  color: var(--text2);
  border-color: var(--border2);
}
.sr-content__body :deep(.code-content) {
  padding: 16px;
  font-family: var(--font-mono);
  font-size: 13px;
  line-height: 1.7;
  color: var(--text);
  overflow-x: auto;
  white-space: pre;
}
</style>
