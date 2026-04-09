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
      />

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
  </div>
</template>

<script setup lang="ts">
import { computed, h, onMounted, ref, resolveComponent, watch } from 'vue'
import { useMessage, useIcon, useRoute, useRouter } from '@keqi.gress/plugin-bridge'
import { useDialog } from 'naive-ui'
import { PageHeader, FilterPanel } from '@keqi.gress/plugin-ui'
import type { FilterFieldConfig } from '@keqi.gress/plugin-ui'
import { kbApi } from '../api/kb'
import type { KbTreeNode } from '../types/kb'

const Add = useIcon('AddOutline')
const Refresh = useIcon('RefreshOutline')
const Edit = useIcon('CreateOutline')
const OpenOutline = useIcon('OpenOutline')
const TrashOutline = useIcon('TrashOutline')

const message = useMessage()
const dialog = useDialog()
const route = useRoute()
const router = useRouter()
const siteKey = computed(() => {
  const fromParam = route.value.params?.siteKey
  if (typeof fromParam === 'string' && fromParam.trim()) return fromParam.trim()
  const raw = route.value.query?.siteKey
  return typeof raw === 'string' && raw.trim() ? raw.trim() : ''
})

const loading = ref(false)
const refreshLoading = ref(false)
const tree = ref<KbTreeNode[]>([])
const showAdvanced = ref(false)

const filters = ref({
  keyword: '',
  status: '' as '' | 'DRAFT' | 'PUBLISHED'
})

const advancedFieldsEmpty: FilterFieldConfig[] = []

const basicFields = computed<FilterFieldConfig[]>(() => [
  {
    key: 'keyword',
    label: '关键词',
    type: 'input',
    placeholder: '搜索标题',
    span: 12
  },
  {
    key: 'status',
    label: '状态',
    type: 'select',
    placeholder: '全部',
    clearable: true,
    options: [
      { label: '全部', value: '' },
      { label: '草稿', value: 'DRAFT' },
      { label: '已发布', value: 'PUBLISHED' }
    ],
    span: 12
  }
])

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
  if (filters.value.status) {
    rows = rows.filter((r) => r.status === filters.value.status)
  }
  return rows
})

function handleSearch() {
  /* FilterPanel 已双向绑定 filters */
}

function handleReset() {
  filters.value.keyword = ''
  filters.value.status = ''
}

function formatStatus(s: string) {
  if (s === 'PUBLISHED') return '已发布'
  if (s === 'DRAFT') return '草稿'
  return s || '-'
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
  if (siteKey.value) return `${prefix}/plugins/kb/docs/${encodeURIComponent(siteKey.value)}/edit/${docId}`
  return `${prefix}/plugins/kb/docs/edit/${docId}`
}

function openEdit(docId: number, newTab: boolean) {
  const path = editorPath(docId)
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
        await kbApi.delete(row.id, siteKey.value || undefined)
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
  void router.push(editorPath('new'))
}

async function loadData() {
  loading.value = true
  refreshLoading.value = true
  try {
    tree.value = await kbApi.tree(siteKey.value || undefined)
  } catch (e: any) {
    message.error(e?.message || '加载失败')
  } finally {
    loading.value = false
    refreshLoading.value = false
  }
}

onMounted(() => {
  void loadData()
})

watch(siteKey, () => {
  void loadData()
})
</script>

<style scoped>
.kb-list-page {
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
  gap: 16px;
}

.table-container {
  background: #fff;
  border-radius: 12px;
  border: 1px solid #e5e7eb;
  overflow: hidden;
}
</style>
