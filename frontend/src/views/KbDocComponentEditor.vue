<template>
  <div class="kb-comp-editor">
    <div class="page-header-wrapper">
      <PageHeader title="组件文档" subtitle="配置页面组件与参数（不使用富文本编辑器）" />
    </div>

    <div class="page-content">
      <n-card size="small" title="基础信息">
        <n-form :model="form" label-placement="left" label-width="120">
          <n-form-item label="标题" required>
            <n-input v-model:value="form.title" placeholder="请输入标题" />
          </n-form-item>
          <n-form-item label="Slug">
            <n-input v-model:value="form.slug" placeholder="可选，留空不改" />
          </n-form-item>
        </n-form>
      </n-card>

      <n-card size="small" title="页面组件">
        <n-form :model="form" label-placement="left" label-width="120">
          <n-form-item label="组件" required>
            <n-select
              v-model:value="form.componentName"
              filterable
              placeholder="选择一个共享页面组件"
              :options="pageComponentOptions"
            />
          </n-form-item>
          <n-form-item label="Props(JSON)">
            <n-input
              v-model:value="form.componentPropsJson"
              type="textarea"
              :autosize="{ minRows: 6, maxRows: 18 }"
              placeholder='例如：{"siteKey":"gress"}'
            />
          </n-form-item>
        </n-form>
      </n-card>

      <div class="kb-comp-editor__ft">
        <n-space justify="end">
          <n-button @click="goBack">返回</n-button>
          <n-button type="primary" :loading="saving" @click="save">保存</n-button>
        </n-space>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, inject, onMounted, ref } from 'vue'
import type { Component } from 'vue'
import { useMessage, useRoute, useRouter } from '@keqi.gress/plugin-bridge'
import { PageHeader } from '@keqi.gress/plugin-ui'
import { kbApi } from '../api/kb'
import type { KbDoc, UpsertKbDocRequest } from '../types/kb'

const message = useMessage()
const route = useRoute()
const router = useRouter()

const siteKey = computed(() => {
  const fromParam = route.value.params?.siteKey
  if (typeof fromParam === 'string' && fromParam.trim()) return fromParam.trim()
  const raw = route.value.query?.siteKey
  return typeof raw === 'string' && raw.trim() ? raw.trim() : ''
})

const docId = computed(() => Number(route.value.params?.docId || 0))

const PAGE_COMPONENT_CATEGORY = 'site-renderer.page'
const SHARED_GET_REGISTRY_KEY = 'sharedComponentsGetRegistry'
const sharedGetRegistry = inject<((category: string) => Record<string, Component>) | undefined>(
  SHARED_GET_REGISTRY_KEY,
  undefined
)
const pageComponentOptions = computed(() => {
  const reg = sharedGetRegistry?.(PAGE_COMPONENT_CATEGORY) || {}
  return Object.keys(reg).map((name) => ({ label: name, value: name }))
})

const loading = ref(false)
const saving = ref(false)
const doc = ref<KbDoc | null>(null)

const form = ref({
  title: '',
  slug: '',
  componentName: '',
  componentPropsJson: '{}',
})

async function load() {
  if (!docId.value) return
  loading.value = true
  try {
    const d = await kbApi.getDoc(docId.value, siteKey.value || undefined)
    doc.value = d
    form.value.title = d.title || ''
    form.value.slug = d.slug || ''
    form.value.componentName = (d.componentName as any) || ''
    form.value.componentPropsJson = (d.componentPropsJson as any) || '{}'
  } catch (e: any) {
    message.error(e?.message || '加载失败')
  } finally {
    loading.value = false
  }
}

function goBack() {
  // 回到列表页
  const fullPath = router.currentRoute.value.fullPath
  const idx = fullPath.indexOf('/plugins/kb/docs')
  const prefix = idx >= 0 ? fullPath.slice(0, idx) : ''
  if (siteKey.value) void router.push(`${prefix}/plugins/kb/docs/${encodeURIComponent(siteKey.value)}`)
  else void router.push(`${prefix}/plugins/kb/docs`)
}

async function save() {
  const title = form.value.title.trim()
  if (!title) {
    message.warning('请输入标题')
    return
  }
  const cn = form.value.componentName.trim()
  if (!cn) {
    message.warning('请选择组件')
    return
  }
  const req: UpsertKbDocRequest = {
    title,
    slug: form.value.slug.trim() || undefined,
    docType: 'COMPONENT',
    componentCategory: PAGE_COMPONENT_CATEGORY,
    componentName: cn,
    componentPropsJson: (form.value.componentPropsJson || '').trim() || '{}',
    bodyMd: '',
  }
  saving.value = true
  try {
    await kbApi.updateDoc(docId.value, req, siteKey.value || undefined)
    message.success('已保存')
  } catch (e: any) {
    message.error(e?.message || '保存失败')
  } finally {
    saving.value = false
  }
}

onMounted(() => void load())
</script>

<style scoped>
.kb-comp-editor {
  width: 100%;
  min-height: 100%;
  display: flex;
  flex-direction: column;
}
.page-header-wrapper {
  flex-shrink: 0;
}
.page-content {
  flex: 1;
  padding: 16px 20px 24px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.kb-comp-editor__ft {
  margin-top: 4px;
}
</style>

