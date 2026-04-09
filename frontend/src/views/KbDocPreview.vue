<template>
  <div class="kb-preview">
    <header class="kb-preview__top">
      <div class="kb-preview__left">
        <n-button quaternary @click="goBack">返回编辑</n-button>
        <span class="kb-preview__title">{{ doc?.title || '文档预览' }}</span>
      </div>
      <n-tag v-if="doc?.status === 'PUBLISHED'" type="success" size="small">已发布</n-tag>
      <n-tag v-else type="warning" size="small">草稿预览</n-tag>
    </header>

    <main class="kb-preview__body">
      <KbDocBody :doc="doc" :loading="loading" :empty-text="emptyText" />
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch, onMounted } from 'vue'
import { useRoute, useRouter } from '@keqi.gress/plugin-bridge'
import { kbApi } from '../api/kb'
import type { KbDoc } from '../types/kb'
import KbDocBody from '../components/KbDocBody.vue'

const route = useRoute()
const router = useRouter()

const doc = ref<KbDoc | null>(null)
const loading = ref(true)
const siteKey = computed(() => {
  const fromParam = route.value.params?.siteKey
  if (typeof fromParam === 'string' && fromParam.trim()) return fromParam.trim()
  const raw = route.value.query?.siteKey
  return typeof raw === 'string' && raw.trim() ? raw.trim() : ''
})

function listPath(): string {
  const fullPath = route.value.fullPath
  const idx = fullPath.indexOf('/plugins/kb/docs')
  const prefix = idx >= 0 ? fullPath.slice(0, idx) : ''
  const id = Number(route.value.params.docId || 0)
  if (siteKey.value) return `${prefix}/plugins/kb/docs/${encodeURIComponent(siteKey.value)}/edit/${id}`
  return `${prefix}/plugins/kb/docs/edit/${id}`
}

function goBack() {
  void router.push(listPath())
}

const emptyText = computed(() => {
  if (loading.value) return '加载中...'
  return '当前内容正在整理中，请查看其他章节'
})

async function loadDoc() {
  const id = Number(route.value.params.docId)
  if (!id) {
    doc.value = null
    loading.value = false
    return
  }
  loading.value = true
  try {
    doc.value = await kbApi.getDoc(id, siteKey.value || undefined)
  } catch (e: any) {
    doc.value = null
  } finally {
    loading.value = false
  }
}

watch(
  () => [route.value.params.docId, route.value.params.siteKey, route.value.query.siteKey],
  () => void loadDoc()
)

onMounted(() => {
  void loadDoc()
})
</script>

<style scoped>
.kb-preview {
  min-height: 100%;
  background: #f8f7f4;
  color: #1f2937;
  display: flex;
  flex-direction: column;
}

.kb-preview__top {
  height: 52px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 0 14px;
  border-bottom: 1px solid #e5e7eb;
  background: #fff;
}

.kb-preview__left {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.kb-preview__title {
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.kb-preview__body {
  padding: 20px 14px 36px;
}

.kb-preview__body :deep(.kb-doc-body__frame-wrap),
.kb-preview__body :deep(.kb-doc-body__prose) {
  max-width: 860px;
  margin-left: auto;
  margin-right: auto;
}

.kb-preview__body :deep(.kb-doc-body__frame) {
  height: min(78vh, 920px);
}

@media (max-width: 960px) {
  .kb-preview__body {
    padding: 12px 8px 24px;
  }
}
</style>
