<template>
  <div class="kb-list-page">
    <div class="page-header-wrapper">
      <PageHeader title="文档与知识库" subtitle="管理知识库文档，支持草稿与发布">
        <template #actions>
          <n-button secondary @click="router.push('/plugins/kb/sites')">站点工作区</n-button>
          <n-button type="primary" @click="handleCreate">
            <template #icon>
              <n-icon><component :is="Add" /></n-icon>
            </template>
            新建文档
          </n-button>
          <n-button @click="loadData" :loading="refreshLoading">
            <template #icon>
              <n-icon><component :is="Refresh" /></n-icon>
            </template>
            刷新
          </n-button>
        </template>
      </PageHeader>
    </div>

    <div class="page-content">
      <FilterPanel
        v-model:filters="filters"
        v-model:show-advanced="showAdvanced"
        :basic-fields="basicFields"
        :advanced-fields="advancedFieldsEmpty"
        @search="handleSearch"
        @reset="handleReset"
      >
        <template #filter-siteKey="{ value, update }">
          <n-select
            :value="(value as string) || 'default'"
            :options="siteSelectOptions"
            filterable
            placeholder="请选择站点"
            size="small"
            @update:value="(v) => update(v)"
          />
        </template>
        <template #filter-status="{ value, update }">
          <n-select
            :value="value as null | 'DRAFT' | 'PUBLISHED'"
            :options="statusFilterOptions"
            clearable
            placeholder="请选择状态"
            size="small"
            @update:value="(v) => update(v)"
          />
        </template>
      </FilterPanel>

      <div class="table-container">
        <n-data-table
          :columns="columns"
          :data="filteredRows"
          :loading="loading"
          :row-key="(row: FlatRow) => row.id"
          striped
        />
      </div>
    </div>

    <!-- 新建文档：选择编辑器 / 页面组件 -->
    <n-modal v-model:show="showCreateModal" preset="card" title="新建文档" style="width: 560px">
      <div class="kb-create-doc">
        <div class="field">
          <div class="fl">类型</div>
          <n-radio-group v-model:value="createType" name="kb-doc-type">
            <n-space>
              <n-radio value="EDITOR">编辑器文档</n-radio>
              <n-radio value="COMPONENT">页面组件文档</n-radio>
            </n-space>
          </n-radio-group>
        </div>

        <div class="field">
          <div class="fl">标题</div>
          <n-input v-model:value="createForm.title" placeholder="请输入标题" />
        </div>

        <div class="field">
          <div class="fl">Slug（可选）</div>
          <n-input v-model:value="createForm.slug" placeholder="留空将按标题自动生成" />
        </div>

        <template v-if="createType === 'COMPONENT'">
          <div class="field">
            <div class="fl">页面组件</div>
            <n-select
              v-model:value="createForm.componentName"
              filterable
              placeholder="选择一个共享页面组件"
              :options="pageComponentOptions"
            />
            <div class="fl-hint">
              组件来源：宿主共享 registry（category=`site-renderer.page`）。
            </div>
          </div>

          <div class="field">
            <div class="fl">组件 Props（JSON，可选）</div>
            <n-input
              v-model:value="createForm.componentPropsJson"
              type="textarea"
              :autosize="{ minRows: 3, maxRows: 10 }"
              placeholder='例如：{"siteKey":"gress"}'
            />
          </div>
        </template>

        <div class="kb-create-doc__ft">
          <n-space justify="end">
            <n-button @click="showCreateModal = false">取消</n-button>
            <n-button type="primary" :loading="createSaving" @click="submitCreate">创建</n-button>
          </n-space>
        </div>
      </div>
    </n-modal>
  </div>
</template>

<script setup lang="ts">
import { computed, h, onMounted, ref, resolveComponent, watch, inject } from 'vue'
import type { Component } from 'vue'
import { useMessage, useIcon, useRoute, useRouter } from '@keqi.gress/plugin-bridge'
import { useDialog } from 'naive-ui'
import { PageHeader, FilterPanel } from '@keqi.gress/plugin-ui'
import type { FilterFieldConfig } from '@keqi.gress/plugin-ui'
import { kbApi } from '../api/kb'
import type { KbSite, KbTreeNode } from '../types/kb'

const Add = useIcon('AddOutline')
const Refresh = useIcon('RefreshOutline')
const Edit = useIcon('CreateOutline')
const OpenOutline = useIcon('OpenOutline')
const TrashOutline = useIcon('TrashOutline')

const message = useMessage()
const dialog = useDialog()
const route = useRoute()
const router = useRouter()
/** 路由上的站点（如 /docs/:siteKey），用于与下拉框初始同步 */
const routeSiteKey = computed(() => {
  const fromParam = route.value.params?.siteKey
  if (typeof fromParam === 'string' && fromParam.trim()) return fromParam.trim()
  const raw = route.value.query?.siteKey
  return typeof raw === 'string' && raw.trim() ? raw.trim() : ''
})

const sites = ref<KbSite[]>([])
const siteSelectOptions = computed(() => {
  const list = sites.value.map((s) => ({
    label: s.name ? `${s.name}（${s.spaceKey}）` : s.spaceKey,
    value: s.spaceKey
  }))
  const keys = new Set(list.map((o) => o.value))
  if (!keys.has('default')) {
    list.unshift({ label: 'default', value: 'default' })
  }
  return list
})

const statusFilterOptions = [
  { label: '全部', value: null },
  { label: '草稿', value: 'DRAFT' as const },
  { label: '已发布', value: 'PUBLISHED' as const }
]

function currentSiteKey(): string {
  const k = String(filters.value.siteKey || '').trim()
  return k || 'default'
}

const loading = ref(false)
const refreshLoading = ref(false)
const tree = ref<KbTreeNode[]>([])
const showAdvanced = ref(false)

// ── create doc modal ────────────────────────────────────────────
const showCreateModal = ref(false)
const createSaving = ref(false)
const createType = ref<'EDITOR' | 'COMPONENT'>('EDITOR')
const createForm = ref({
  title: '',
  slug: '',
  componentName: '' as string,
  componentPropsJson: '',
})

const SHARED_GET_REGISTRY_KEY = 'sharedComponentsGetRegistry'
const sharedGetRegistry = inject<((category: string) => Record<string, Component>) | undefined>(
  SHARED_GET_REGISTRY_KEY,
  undefined
)

const PAGE_COMPONENT_CATEGORY = 'site-renderer.page'
const pageComponentOptions = computed(() => {
  const reg = sharedGetRegistry?.(PAGE_COMPONENT_CATEGORY) || {}
  return Object.keys(reg).map((name) => ({ label: name, value: name }))
})

const filters = ref({
  /** 知识库空间站点，默认 default */
  siteKey: 'default',
  keyword: '',
  /** 与 FilterPanel / Naive NSelect 一致：「全部」用 null，勿用 ''（空串会导致选择框不渲染或异常） */
  status: null as null | 'DRAFT' | 'PUBLISHED'
})

const advancedFieldsEmpty: FilterFieldConfig[] = []

/** 站点、状态走 FilterPanel 插槽（`slotName` 与模板 `#filter-*` 对应；不依赖 type 含 `slot` 的旧版 d.ts） */
const basicFields: FilterFieldConfig[] = [
  { key: 'siteKey', label: '站点', slotName: 'filter-siteKey' },
  { key: 'keyword', label: '关键词', type: 'input', placeholder: '搜索标题' },
  { key: 'status', label: '状态', slotName: 'filter-status' }
]

type FlatRow = KbTreeNode & { depth: number }

function flatten(nodes: KbTreeNode[], depth = 0): FlatRow[] {
  const out: FlatRow[] = []
  for (const n of nodes) {
    out.push({ ...n, depth })
    if (n.children?.length) {
      out.push(...flatten(n.children, depth + 1))
    }
  }
  return out
}

const flatRows = computed(() => flatten(tree.value))

const filteredRows = computed(() => {
  let rows = flatRows.value
  const kw = (filters.value.keyword || '').trim().toLowerCase()
  if (kw) {
    rows = rows.filter((r) => (r.title || '').toLowerCase().includes(kw))
  }
  const st = filters.value.status
  if (st === 'DRAFT' || st === 'PUBLISHED') {
    rows = rows.filter((r) => r.status === st)
  }
  return rows
})

function handleSearch() {
  /* FilterPanel 已双向绑定 filters */
}

function handleReset() {
  filters.value.siteKey = 'default'
  filters.value.keyword = ''
  filters.value.status = null
}

function formatStatus(s: string) {
  if (s === 'PUBLISHED') return '已发布'
  if (s === 'DRAFT') return '草稿'
  return s || '-'
}

function formatDocType(t?: string) {
  const dt = String(t || 'EDITOR').toUpperCase()
  if (dt === 'COMPONENT') return '组件'
  return '编辑器'
}

const columns: any[] = [
  {
    title: 'ID',
    key: 'id',
    width: 72
  },
  {
    title: '标题',
    key: 'title',
    ellipsis: { tooltip: true },
    render: (row: FlatRow) => {
      const pad = row.depth * 14
      return h(
        'span',
        { style: { paddingLeft: `${pad}px`, display: 'inline-block' } },
        row.title || '（无标题）'
      )
    }
  },
  {
    title: '类型',
    key: 'docType',
    width: 90,
    render: (row: FlatRow) => {
      const NTag = resolveComponent('NTag') as any
      const dt = String((row as any).docType || 'EDITOR').toUpperCase()
      const type = dt === 'COMPONENT' ? 'info' : 'default'
      return h(NTag, { type, size: 'small' }, { default: () => formatDocType((row as any).docType) })
    }
  },
  {
    title: '状态',
    key: 'status',
    width: 96,
    render: (row: FlatRow) => {
      const NTag = resolveComponent('NTag') as any
      const type = row.status === 'PUBLISHED' ? 'success' : 'warning'
      return h(NTag, { type, size: 'small' }, { default: () => formatStatus(row.status) })
    }
  },
  {
    title: 'Slug',
    key: 'slug',
    width: 140,
    ellipsis: { tooltip: true }
  },
  {
    title: '操作',
    key: 'actions',
    width: 220,
    fixed: 'right',
    render: (row: FlatRow) => {
      const NButton = resolveComponent('NButton') as any
      const NSpace = resolveComponent('NSpace') as any
      const NIcon = resolveComponent('NIcon') as any
      return h(
        NSpace,
        { size: 8, wrap: false },
        {
          default: () => [
            h(
              NButton,
              { size: 'small', type: 'primary', secondary: true, onClick: () => openEdit(row.id, false) },
              { default: () => '编辑' }
            ),
            h(
              NButton,
              { size: 'small', quaternary: true, onClick: () => openEdit(row.id, true) },
              {
                icon: () => h(NIcon, { component: OpenOutline }),
                default: () => '新标签'
              }
            ),
            h(
              NButton,
              { size: 'small', quaternary: true, type: 'error', onClick: () => confirmDelete(row) },
              {
                icon: () => h(NIcon, { component: TrashOutline }),
                default: () => '删除'
              }
            )
          ]
        }
      )
    }
  }
]

/** 与当前列表 URL 同级的编辑页路径（兼容应用 base，如 /gress）；bridge.router 无 resolve */
function editorPath(docId: number | 'new'): string {
  const fullPath = router.currentRoute.value.fullPath
  const idx = fullPath.indexOf('/plugins/kb/docs')
  const prefix = idx >= 0 ? fullPath.slice(0, idx) : ''
  const sk = currentSiteKey()
  if (sk) return `${prefix}/plugins/kb/docs/${encodeURIComponent(sk)}/edit/${docId}`
  return `${prefix}/plugins/kb/docs/edit/${docId}`
}

function componentEditorPath(docId: number): string {
  const fullPath = router.currentRoute.value.fullPath
  const idx = fullPath.indexOf('/plugins/kb/docs')
  const prefix = idx >= 0 ? fullPath.slice(0, idx) : ''
  const sk = currentSiteKey()
  if (sk) return `${prefix}/plugins/kb/docs/${encodeURIComponent(sk)}/component/${docId}`
  return `${prefix}/plugins/kb/docs/component/${docId}`
}

function openEdit(docId: number, newTab: boolean) {
  const row = flatRows.value.find((r) => r.id === docId) as any
  const dt = String(row?.docType || 'EDITOR').toUpperCase()
  const path = dt === 'COMPONENT' ? componentEditorPath(docId) : editorPath(docId)
  if (newTab) {
    window.open(`${window.location.origin}${path}`, '_blank')
  } else {
    void router.push(path)
  }
}

function confirmDelete(row: FlatRow) {
  dialog.warning({
    title: '删除文档',
    content: `确定删除「${row.title || row.id}」吗？不可恢复。`,
    positiveText: '删除',
    negativeText: '取消',
    onPositiveClick: async () => {
      try {
        await kbApi.delete(row.id, currentSiteKey())
        message.success('已删除')
        await loadData()
        return true
      } catch (e: any) {
        message.error(e?.message || '删除失败')
        return false
      }
    }
  })
}

/** 新建不写入数据库，进入编辑器后由用户点击「保存草稿」再创建，避免重复 slug 等问题 */
function handleCreate() {
  createType.value = 'EDITOR'
  createForm.value = { title: '', slug: '', componentName: '', componentPropsJson: '' }
  showCreateModal.value = true
}

async function submitCreate() {
  const title = (createForm.value.title || '').trim()
  if (!title) {
    message.warning('请输入标题')
    return
  }
  if (createType.value === 'COMPONENT' && !createForm.value.componentName) {
    message.warning('请选择页面组件')
    return
  }
  createSaving.value = true
  try {
    const req: any = {
      title,
      slug: (createForm.value.slug || '').trim() || undefined,
    }
    if (createType.value === 'COMPONENT') {
      req.docType = 'COMPONENT'
      req.componentCategory = PAGE_COMPONENT_CATEGORY
      req.componentName = createForm.value.componentName
      req.componentPropsJson = (createForm.value.componentPropsJson || '').trim() || '{}'
      req.bodyMd = ''
    } else {
      req.docType = 'EDITOR'
      req.bodyMd = ''
    }
    await kbApi.createDoc(req, currentSiteKey())
    message.success('已创建')
    showCreateModal.value = false
    await loadData()
  } catch (e: any) {
    message.error(e?.message || '创建失败')
  } finally {
    createSaving.value = false
  }
}

async function loadSites() {
  try {
    sites.value = await kbApi.listSites()
  } catch {
    sites.value = []
  }
}

async function loadData() {
  loading.value = true
  refreshLoading.value = true
  try {
    tree.value = await kbApi.tree(currentSiteKey())
  } catch (e: any) {
    message.error(e?.message || '加载失败')
  } finally {
    loading.value = false
    refreshLoading.value = false
  }
}

onMounted(async () => {
  await loadSites()
  const fromRoute = routeSiteKey.value
  if (fromRoute && fromRoute !== filters.value.siteKey) {
    filters.value.siteKey = fromRoute
    // 由下方 watch(siteKey) 拉取目录
  } else {
    await loadData()
  }
})

watch(routeSiteKey, (k) => {
  if (k && k !== filters.value.siteKey) filters.value.siteKey = k
})

watch(
  () => filters.value.siteKey,
  () => {
    void loadData()
  }
)
</script>

<style scoped>
.kb-list-page {
  height: 100%;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: #f5f5f5;
}

.page-header-wrapper {
  flex-shrink: 0;
}

.page-content {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 16px 20px 24px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.table-container {
  background: #fff;
  border-radius: 12px;
  border: 1px solid #e5e7eb;
  overflow: hidden;
}

.kb-create-doc {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.kb-create-doc__ft {
  margin-top: 6px;
}
</style>
