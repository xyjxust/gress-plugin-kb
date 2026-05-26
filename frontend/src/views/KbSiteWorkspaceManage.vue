<template>
  <div class="kb-sites">
    <PageHeader title="站点管理">
      <template #actions>
        <n-space>
          <n-input
            v-model:value="resolvePath"
            size="small"
            placeholder="输入 URL 路径，例如 /docs/java/getting-started"
            style="min-width: 320px"
          />
          <n-button size="small" secondary :loading="resolving" @click="resolveByPath">测试 URL 匹配</n-button>
          <n-button size="small" secondary :loading="loading" @click="loadSites">刷新</n-button>
          <n-button size="small" type="primary" @click="openCreate">新建站点</n-button>
        </n-space>
      </template>
    </PageHeader>

    <n-card class="kb-sites__card" :bordered="false">
      <n-alert type="info" :bordered="false" style="margin-bottom: 12px">
        每个站点通过「URL 前缀」匹配访问路径，命中规则为「最长前缀优先」。示例：`/docs/java` 会优先命中
        `/docs/java`，其次才是 `/docs`。
      </n-alert>
      <n-data-table :columns="columns" :data="sites" :loading="loading" :pagination="false" />
    </n-card>

    <n-modal
      v-model:show="showEditor"
      preset="dialog"
      :title="editing ? '编辑站点' : '新建站点'"
      :show-icon="false"
      positive-text="保存"
      negative-text="取消"
      @positive-click="submitSite"
    >
      <n-space vertical>
        <n-input
          v-model:value="form.spaceKey"
          :disabled="!!editing"
          placeholder="站点 Key（英文/数字/-/_）"
        />
        <n-input v-model:value="form.name" placeholder="站点名称" />
        <n-input v-model:value="form.routePrefix" placeholder="URL 前缀，例如 /docs、/help/java" />
        <n-input v-model:value="form.description" type="textarea" placeholder="站点描述（可选）" />
        <n-switch v-model:value="enabledSwitch">
          <template #checked>已启用</template>
          <template #unchecked>已停用</template>
        </n-switch>
      </n-space>
    </n-modal>
  </div>
</template>

<script setup lang="ts">
import { computed, h, onMounted, ref } from 'vue'
import { PageHeader } from '@keqi.gress/plugin-ui'
import { useMessage, useRouter } from '@keqi.gress/plugin-bridge'
import type { DataTableColumns } from 'naive-ui'
import { NButton, NSpace, NTag } from 'naive-ui'
import { kbApi } from '../api/kb'
import { kbHasAuthToken } from '../utils/kbSession'
import type { KbSite, UpsertKbSiteRequest } from '../types/kb'

const message = useMessage()
const router = useRouter()
const loading = ref(false)
const resolving = ref(false)
const resolvePath = ref('/docs/getting-started')
const sites = ref<KbSite[]>([])

const showEditor = ref(false)
const editing = ref<KbSite | null>(null)
const form = ref<UpsertKbSiteRequest>({
  spaceKey: '',
  name: '',
  routePrefix: '/',
  description: '',
  enabled: 1
})

const enabledSwitch = computed({
  get: () => form.value.enabled !== 0,
  set: (v: boolean) => {
    form.value.enabled = v ? 1 : 0
  }
})

function resetForm() {
  form.value = {
    spaceKey: '',
    name: '',
    routePrefix: '/',
    description: '',
    enabled: 1
  }
}

function openCreate() {
  editing.value = null
  resetForm()
  showEditor.value = true
}

function openEdit(row: KbSite) {
  editing.value = row
  form.value = {
    spaceKey: row.spaceKey,
    name: row.name,
    routePrefix: row.routePrefix,
    description: row.description || '',
    enabled: row.enabled
  }
  showEditor.value = true
}

async function submitSite() {
  const req = { ...form.value }
  if (!req.spaceKey?.trim()) {
    message.warning('请填写站点 Key')
    return false
  }
  if (!req.name?.trim()) {
    message.warning('请填写站点名称')
    return false
  }
  if (!req.routePrefix?.trim()) {
    message.warning('请填写 URL 前缀')
    return false
  }
  try {
    if (editing.value) {
      await kbApi.updateSite(editing.value.id, req)
      message.success('站点已更新')
    } else {
      await kbApi.createSite(req)
      message.success('站点已创建')
    }
    showEditor.value = false
    await loadSites()
  } catch (e: any) {
    message.error(e?.message || '保存失败')
    return false
  }
  return true
}

async function removeSite(row: KbSite) {
  if (!window.confirm(`确认删除站点「${row.name}」？`)) return
  try {
    await kbApi.deleteSite(row.id)
    message.success('已删除')
    await loadSites()
  } catch (e: any) {
    message.error(e?.message || '删除失败')
  }
}

function openSiteBuilder(row: KbSite) {
  void router.push(`/plugins/kb/site-visual-builder/${encodeURIComponent(row.spaceKey)}`)
}

function openSiteDocs(row: KbSite) {
  void router.push(`/plugins/kb/docs/${encodeURIComponent(row.spaceKey)}`)
}

async function resolveByPath() {
  resolving.value = true
  try {
    const matched = await kbApi.resolveSiteByUrl(resolvePath.value || '/')
    if (!matched) {
      message.warning('未匹配到站点')
      return
    }
    message.success(`命中站点：${matched.name}（${matched.spaceKey}）=> ${matched.routePrefix}`)
  } catch (e: any) {
    message.error(e?.message || '匹配失败')
  } finally {
    resolving.value = false
  }
}

async function loadSites() {
  loading.value = true
  try {
    sites.value = await kbApi.listSites(kbHasAuthToken() ? 'full' : 'public')
  } catch (e: any) {
    message.error(e?.message || '加载站点失败')
  } finally {
    loading.value = false
  }
}

const columns: DataTableColumns<KbSite> = [
  { title: '站点名称', key: 'name' },
  { title: 'Site Key', key: 'spaceKey' },
  {
    title: 'URL 前缀',
    key: 'routePrefix',
    render: (row) => h('code', row.routePrefix)
  },
  {
    title: '状态',
    key: 'enabled',
    render: (row) => h(NTag, { type: row.enabled === 0 ? 'default' : 'success', size: 'small' }, () => (row.enabled === 0 ? '停用' : '启用'))
  },
  {
    title: '操作',
    key: 'actions',
    render: (row) =>
      h(NSpace, { size: 8 }, () => [
        h(
          NButton,
          { size: 'tiny', quaternary: true, onClick: () => openSiteBuilder(row) },
          () => '构建器'
        ),
        h(
          NButton,
          { size: 'tiny', quaternary: true, onClick: () => openSiteDocs(row) },
          () => '文档'
        ),
        h(
          NButton,
          { size: 'tiny', quaternary: true, onClick: () => openEdit(row) },
          () => '编辑'
        ),
        h(
          NButton,
          { size: 'tiny', quaternary: true, type: 'error', disabled: row.spaceKey === 'default', onClick: () => removeSite(row) },
          () => '删除'
        )
      ])
  }
]

onMounted(() => {
  void loadSites()
})
</script>

<style scoped>
.kb-sites {
  min-height: 100%;
}

.kb-sites__card {
  margin: 0 20px 20px;
}
</style>

