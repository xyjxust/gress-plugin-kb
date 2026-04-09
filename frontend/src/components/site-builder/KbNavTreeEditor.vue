<template>
  <div class="kb-nav-tree-editor">
    <n-dynamic-input
      :value="innerValue"
      show-sort-button
      :min="1"
      :on-create="createRootNode"
      @update:value="updateList"
    >
      <template #create-button-default>新增节点</template>

      <template #default="{ value: node, index }">
        <div class="kb-dynamic-node">
          <div class="kb-dynamic-node__row">
            <n-input v-model:value="node.title" placeholder="节点标题" />
            <n-select v-model:value="node.nodeType" size="small" :options="nodeTypeOptions" @update:value="normalizeNode(node)" />
          </div>

          <div class="kb-dynamic-node__row kb-dynamic-node__row--detail">
            <n-select
              v-if="node.nodeType === 'DOC'"
              v-model:value="node.docId"
              size="small"
              filterable
              clearable
              :options="docOptions"
              placeholder="绑定文档"
            />
            <n-input v-else-if="node.nodeType === 'LINK'" v-model:value="node.linkUrl" placeholder="外部链接地址" />
            <div v-else class="kb-dynamic-node__hint">分组节点会在 Header 中渲染为可展开菜单，可继续添加子项。</div>

            <n-button size="tiny" quaternary @click="duplicateNode(index)">复制</n-button>
          </div>

          <div v-if="node.nodeType === 'GROUP'" class="kb-dynamic-node__children">
            <div class="kb-dynamic-node__children-title">子项</div>
            <KbNavTreeEditor
              :model-value="node.children || []"
              :menu-code="menuCode"
              :doc-options="docOptions"
              child-mode
              @update:model-value="updateChildren(index, $event)"
            />
          </div>
        </div>
      </template>
    </n-dynamic-input>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { KbNavNode } from '../../types/kb'

defineOptions({ name: 'KbNavTreeEditor' })

const props = defineProps<{
  modelValue: KbNavNode[]
  menuCode: string
  docOptions: Array<{ label: string; value: number }>
  childMode?: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: KbNavNode[]]
}>()

const nodeTypeOptions = [
  { label: '文档', value: 'DOC' },
  { label: '分组', value: 'GROUP' },
  { label: '链接', value: 'LINK' }
]

const innerValue = computed(() => (props.modelValue?.length ? props.modelValue : [createRootNode()]))

function createNode(parentId: number | null): KbNavNode {
  return {
    id: Date.now() + Math.floor(Math.random() * 1000),
    parentId,
    menuCode: props.menuCode,
    title: '新节点',
    nodeType: 'DOC',
    docId: null,
    linkUrl: null,
    status: 'DRAFT',
    children: []
  }
}

function createRootNode() {
  return createNode(null)
}

function normalizeNode(node: KbNavNode) {
  if (node.nodeType === 'DOC') {
    node.linkUrl = null
    node.children = []
    node.docId = node.docId ?? null
    return
  }
  if (node.nodeType === 'LINK') {
    node.docId = null
    node.children = []
    node.linkUrl = node.linkUrl ?? ''
    return
  }
  node.docId = null
  node.linkUrl = null
  node.children = Array.isArray(node.children) ? node.children : []
}

function updateList(list: KbNavNode[]) {
  emit(
    'update:modelValue',
    list.map((node) => ({
      ...node,
      menuCode: props.menuCode,
      parentId: props.childMode ? node.parentId : null,
      children: Array.isArray(node.children) ? node.children : []
    }))
  )
}

function updateChildren(index: number, children: KbNavNode[]) {
  const next = [...innerValue.value]
  const current = next[index]
  if (!current) return
  next[index] = {
    ...current,
    nodeType: 'GROUP',
    children: children.map((child) => ({ ...child, parentId: current.id }))
  }
  emit('update:modelValue', next)
}

function duplicateNode(index: number) {
  const target = innerValue.value[index]
  if (!target) return
  const duplicated: KbNavNode = {
    ...structuredClone(target),
    id: Date.now() + Math.floor(Math.random() * 1000)
  }
  const next = [...innerValue.value]
  next.splice(index + 1, 0, duplicated)
  emit('update:modelValue', next)
}
</script>

<style scoped>
.kb-nav-tree-editor {
  display: grid;
  gap: 12px;
}

.kb-dynamic-node {
  display: grid;
  gap: 10px;
  width: 100%;
}

.kb-dynamic-node__row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 140px;
  gap: 10px;
  align-items: center;
}

.kb-dynamic-node__row--detail {
  grid-template-columns: minmax(0, 1fr) auto;
}

.kb-dynamic-node__hint {
  min-height: 34px;
  display: flex;
  align-items: center;
  padding: 0 12px;
  border-radius: 10px;
  background: var(--kb-studio-eyebrow-bg);
  color: var(--kb-studio-eyebrow-text);
  font-size: 12px;
}

.kb-dynamic-node__children {
  display: grid;
  gap: 10px;
  padding: 12px;
  border-radius: 14px;
  border: 1px dashed var(--kb-studio-panel-border);
  background: color-mix(in srgb, var(--kb-studio-panel-bg) 94%, #ffffff 6%);
}

.kb-dynamic-node__children-title {
  font-size: 12px;
  font-weight: 700;
  color: var(--kb-studio-eyebrow-text);
  letter-spacing: 0.04em;
}
</style>
