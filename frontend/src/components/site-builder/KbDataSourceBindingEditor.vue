<template>
  <div class="kb-inspector-section">
    <div class="kb-section-title">{{ definition.label }}</div>
    <div class="kb-static-note" v-if="definition.description">{{ definition.description }}</div>

    <label class="kb-field">
      <span>绑定数据源</span>
      <n-select
        :value="binding.sourceId"
        size="small"
        :options="selectOptions"
        clearable
        placeholder="选择或创建数据源"
        @update:value="updateBinding"
      />
    </label>

    <div class="kb-theme-actions">
      <n-button size="small" secondary @click="openCreate">新建数据源</n-button>
      <n-button size="small" secondary :disabled="!selectedSource" @click="openEdit">编辑数据源</n-button>
    </div>

    <n-modal v-model:show="modalOpen" preset="card" :title="editingSourceId ? '编辑数据源' : '新建数据源'" style="width: 520px;">
      <div class="kb-schema-form">
        <label class="kb-field">
          <span>名称</span>
          <n-input v-model:value="draft.label" placeholder="例如：顶部导航树" />
        </label>
        <label class="kb-field">
          <span>描述</span>
          <n-input v-model:value="draft.description" type="textarea" placeholder="描述这个数据源如何提供数据" :autosize="{ minRows: 3, maxRows: 6 }" />
        </label>
        <label class="kb-field">
          <span>类型</span>
          <n-select :value="draft.kind" size="small" :options="kindOptions" @update:value="draft.kind = $event as any" />
        </label>

        <label v-if="draft.kind === 'nav-tree'" class="kb-field">
          <span>导航树来源</span>
          <n-select :value="draft.payload.menuCode" size="small" :options="navMenuOptions" @update:value="draft.payload.menuCode = $event" />
        </label>

        <template v-if="draft.kind === 'nav-tree' && definition.key === 'primaryNav'">
          <label class="kb-field">
            <span>顶部导航树</span>
            <KbNavTreeEditor
              :model-value="headerTreeDraft"
              menu-code="header"
              :doc-options="docOptions"
              @update:model-value="draft.payload.tree = $event"
            />
          </label>
        </template>

        <template v-if="draft.kind === 'nav-tree' && definition.key === 'menuNav'">
          <label class="kb-field">
            <span>绑定顶部导航数据源</span>
            <n-select
              :value="draft.payload.parentSourceId || null"
              size="small"
              :options="headerNavSourceOptions"
              clearable
              placeholder="选择顶部导航树"
              @update:value="onSidebarParentSourceChange"
            />
          </label>

          <div class="kb-static-note">
            每个侧栏分组都绑定到一个顶部导航节点。用户点击顶部导航时，会切换到对应的侧栏树；再点击侧栏节点时，正文会切换到该节点绑定的文档。
          </div>

          <div class="kb-sidebar-sections">
            <div v-if="!headerNodeOptions.length" class="kb-nav-tree-editor__empty">先给顶部导航配置节点，然后这里才能绑定对应的侧栏树。</div>
            <div v-for="(section, index) in sidebarSectionsDraft" :key="section.id || index" class="kb-sidebar-sections__card">
              <div class="kb-nav-tree-node__row">
                <n-select
                  :value="section.headerNavId ?? null"
                  size="small"
                  :options="headerNodeOptions"
                  placeholder="选择顶部导航节点"
                  @update:value="updateSidebarSection(index, 'headerNavId', $event)"
                />
                <n-input
                  :value="section.label || ''"
                  placeholder="例如：开始 / 教程"
                  @update:value="updateSidebarSection(index, 'label', $event)"
                />
              </div>
              <KbNavTreeEditor
                :model-value="section.tree || []"
                menu-code="sidebar"
                :doc-options="docOptions"
                @update:model-value="updateSidebarSection(index, 'tree', $event)"
              />
              <n-button size="small" tertiary type="error" @click="removeSidebarSection(index)">删除这组侧栏映射</n-button>
            </div>
            <n-button size="small" secondary @click="addSidebarSection">新增侧栏映射</n-button>
          </div>
        </template>

        <label v-if="draft.kind === 'document'" class="kb-field">
          <span>预览文档</span>
          <n-select :value="draft.payload.docId" size="small" :options="docOptions" filterable clearable @update:value="draft.payload.docId = $event" />
        </label>

        <label v-if="draft.kind === 'toc'" class="kb-field">
          <span>依赖文档源</span>
          <n-select :value="draft.payload.documentSourceId" size="small" :options="documentSourceOptions" @update:value="draft.payload.documentSourceId = $event" />
        </label>

        <label v-if="draft.kind === 'pager'" class="kb-field">
          <span>依赖导航源</span>
          <n-select :value="draft.payload.navSourceId" size="small" :options="navSourceOptions" @update:value="draft.payload.navSourceId = $event" />
        </label>
      </div>
      <template #footer>
        <div class="kb-theme-actions">
          <n-button quaternary @click="modalOpen = false">取消</n-button>
          <n-button type="primary" @click="saveDraft">保存</n-button>
        </div>
      </template>
    </n-modal>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import type { BuilderComponentBinding, BuilderBindingDefinition, BuilderDataSource, BuilderDataSourceKind } from '../../types/siteBuilder'
import type { KbNavNode } from '../../types/kb'
import KbNavTreeEditor from './KbNavTreeEditor.vue'

const props = defineProps<{
  definition: BuilderBindingDefinition
  binding: BuilderComponentBinding
  dataSources: BuilderDataSource[]
  docOptions: Array<{ label: string; value: number }>
}>()

const emit = defineEmits<{
  'update:binding': [sourceId: string | null]
  'save-source': [source: BuilderDataSource]
}>()

const modalOpen = ref(false)
const editingSourceId = ref<string | null>(null)
const draft = reactive<BuilderDataSource>({
  id: '',
  kind: props.definition.sourceKinds[0] as BuilderDataSourceKind,
  label: '',
  description: '',
  payload: {}
})

const selectedSource = computed(() => props.dataSources.find((item) => item.id === props.binding.sourceId) || null)
const selectOptions = computed(() =>
  props.dataSources
    .filter((item) => props.definition.sourceKinds.includes(item.kind))
    .map((item) => ({ label: item.label, value: item.id }))
)
const navMenuOptions = [
  { label: '顶部导航树', value: 'header' },
  { label: '侧栏导航树', value: 'sidebar' }
]
const kindOptions = computed(() =>
  props.definition.sourceKinds.map((kind) => ({
    label: kind,
    value: kind
  }))
)
const documentSourceOptions = computed(() =>
  props.dataSources.filter((item) => item.kind === 'document').map((item) => ({ label: item.label, value: item.id }))
)
const navSourceOptions = computed(() =>
  props.dataSources.filter((item) => item.kind === 'nav-tree').map((item) => ({ label: item.label, value: item.id }))
)
const headerNavSourceOptions = computed(() =>
  props.dataSources
    .filter((item) => item.kind === 'nav-tree' && item.payload?.menuCode === 'header')
    .map((item) => ({ label: item.label, value: item.id }))
)
const headerTreeDraft = computed<KbNavNode[]>(() => (Array.isArray(draft.payload.tree) ? draft.payload.tree : []))
const sidebarSectionsDraft = computed<Array<{ id: string; headerNavId: number | null; label: string; tree: KbNavNode[] }>>(() =>
  Array.isArray(draft.payload.sections) ? draft.payload.sections : []
)
const selectedHeaderSource = computed(() => props.dataSources.find((item) => item.id === draft.payload.parentSourceId) || null)
const headerNodeOptions = computed(() => {
  const tree = Array.isArray(selectedHeaderSource.value?.payload?.tree) ? (selectedHeaderSource.value?.payload?.tree as KbNavNode[]) : []
  const result: Array<{ label: string; value: number }> = []
  const walk = (list: KbNavNode[], depth = 0) => {
    list.forEach((node) => {
      result.push({ label: `${'— '.repeat(depth)}${node.title}`, value: node.id })
      if (node.children?.length) walk(node.children, depth + 1)
    })
  }
  walk(tree)
  return result
})

function resetDraft(kind = props.definition.sourceKinds[0] as BuilderDataSourceKind) {
  draft.id = ''
  draft.kind = kind
  draft.label = ''
  draft.description = ''
  draft.payload = { ...(props.definition.createPayload || {}) }
  if (kind === 'nav-tree' && props.definition.key === 'primaryNav') {
    draft.payload.tree = Array.isArray(draft.payload.tree) ? draft.payload.tree : []
    draft.payload.menuCode = 'header'
  }
  if (kind === 'nav-tree' && props.definition.key === 'menuNav') {
    draft.payload.menuCode = 'sidebar'
    draft.payload.sections = Array.isArray(draft.payload.sections) ? draft.payload.sections : []
  }
}

function openCreate() {
  editingSourceId.value = null
  resetDraft()
  modalOpen.value = true
}

function openEdit() {
  if (!selectedSource.value) return
  editingSourceId.value = selectedSource.value.id
  draft.id = selectedSource.value.id
  draft.kind = selectedSource.value.kind
  draft.label = selectedSource.value.label
  draft.description = selectedSource.value.description || ''
  draft.payload = { ...selectedSource.value.payload }
  modalOpen.value = true
}

function updateBinding(value: string | null) {
  emit('update:binding', value)
}

function onSidebarParentSourceChange(value: string | null) {
  draft.payload.parentSourceId = value
  draft.payload.sections = Array.isArray(draft.payload.sections) ? draft.payload.sections : []
}

function addSidebarSection() {
  const firstOption = headerNodeOptions.value[0]
  const sections = Array.isArray(draft.payload.sections) ? [...draft.payload.sections] : []
  sections.push({
    id: `section-${Date.now()}`,
    headerNavId: firstOption?.value ?? null,
    label: firstOption?.label?.replace(/^—\s*/g, '') || '',
    tree: []
  })
  draft.payload.sections = sections
}

function updateSidebarSection(index: number, key: 'headerNavId' | 'label' | 'tree', value: any) {
  const sections = Array.isArray(draft.payload.sections) ? [...draft.payload.sections] : []
  const current = sections[index]
  if (!current) return
  sections[index] = {
    ...current,
    [key]: value
  }
  draft.payload.sections = sections
}

function removeSidebarSection(index: number) {
  const sections = Array.isArray(draft.payload.sections) ? [...draft.payload.sections] : []
  sections.splice(index, 1)
  draft.payload.sections = sections
}

function saveDraft() {
  const source: BuilderDataSource = {
    id: draft.id || `source-${Date.now()}`,
    kind: draft.kind,
    label: draft.label || '未命名数据源',
    description: draft.description || '',
    payload: { ...draft.payload }
  }
  emit('save-source', source)
  emit('update:binding', source.id)
  modalOpen.value = false
}
</script>

<style scoped>
.kb-inspector-section {
  display: grid;
  gap: 12px;
  padding-top: 14px;
  margin-top: 14px;
  border-top: 1px solid var(--kb-studio-panel-border);
}

.kb-section-title {
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--kb-studio-eyebrow-text);
}

.kb-static-note {
  padding: 10px 12px;
  border-radius: 12px;
  background: color-mix(in srgb, var(--kb-studio-panel-bg) 92%, #ffffff 8%);
  color: var(--kb-studio-eyebrow-text);
  line-height: 1.6;
  font-size: 12px;
}

.kb-field {
  display: grid;
  gap: 8px;
}

.kb-field span {
  font-size: 13px;
  color: #475569;
}

.kb-theme-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.kb-sidebar-sections {
  display: grid;
  gap: 12px;
}

.kb-sidebar-sections__card {
  display: grid;
  gap: 12px;
  padding: 12px;
  border: 1px solid var(--kb-studio-panel-border);
  border-radius: 16px;
  background: color-mix(in srgb, var(--kb-studio-panel-bg) 95%, #ffffff 5%);
}

.kb-nav-tree-editor__empty {
  padding: 12px;
  border: 1px dashed var(--kb-studio-panel-border);
  border-radius: 14px;
  color: var(--kb-empty-text-color);
  font-size: 12px;
  text-align: center;
}

.kb-nav-tree-node__row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  gap: 10px;
}

</style>
