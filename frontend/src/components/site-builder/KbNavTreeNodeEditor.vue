<template>
  <div class="kb-nav-tree-node" :style="{ marginLeft: `${level * 14}px` }">
    <div class="kb-nav-tree-node__card">
      <div class="kb-nav-tree-node__row">
        <n-input :value="node.title" placeholder="节点标题" @update:value="updateField('title', $event)" />
        <n-select :value="node.nodeType" size="small" :options="nodeTypeOptions" @update:value="updateField('nodeType', $event)" />
      </div>

      <div class="kb-nav-tree-node__row kb-nav-tree-node__row--detail">
        <n-select
          v-if="node.nodeType === 'DOC'"
          :value="node.docId ?? null"
          size="small"
          filterable
          clearable
          :options="docOptions"
          placeholder="绑定文档"
          @update:value="updateField('docId', $event)"
        />
        <n-input
          v-else-if="node.nodeType === 'LINK'"
          :value="node.linkUrl || ''"
          placeholder="外部链接地址"
          @update:value="updateField('linkUrl', $event)"
        />
        <div v-else class="kb-nav-tree-node__hint">分组节点用于组织子菜单</div>

        <div class="kb-nav-tree-node__actions">
          <n-button size="tiny" secondary @click="emit('append-child', node.id)">加子项</n-button>
          <n-button size="tiny" tertiary type="error" @click="emit('remove', node.id)">删除</n-button>
        </div>
      </div>
    </div>

    <div v-if="node.children?.length" class="kb-nav-tree-node__children">
      <KbNavTreeNodeEditor
        v-for="child in node.children"
        :key="child.id"
        :node="child"
        :level="level + 1"
        :doc-options="docOptions"
        @update="emit('update', $event)"
        @append-child="emit('append-child', $event)"
        @remove="emit('remove', $event)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { KbNavNode } from '../../types/kb'

defineOptions({ name: 'KbNavTreeNodeEditor' })

const props = defineProps<{
  node: KbNavNode
  level: number
  docOptions: Array<{ label: string; value: number }>
}>()

const emit = defineEmits<{
  update: [node: KbNavNode]
  'append-child': [id: number]
  remove: [id: number]
}>()

const nodeTypeOptions = [
  { label: '文档', value: 'DOC' },
  { label: '分组', value: 'GROUP' },
  { label: '链接', value: 'LINK' }
]

function updateField(key: 'title' | 'nodeType' | 'docId' | 'linkUrl', value: string | number | null) {
  const next: KbNavNode = {
    ...props.node,
    [key]: value
  }
  if (key === 'nodeType') {
    next.docId = value === 'DOC' ? next.docId ?? null : null
    next.linkUrl = value === 'LINK' ? next.linkUrl ?? '' : null
    if (value !== 'GROUP' && next.children?.length) {
      next.children = next.children
    }
  }
  emit('update', next)
}
</script>

<style scoped>
.kb-nav-tree-node {
  display: grid;
  gap: 10px;
}

.kb-nav-tree-node__card {
  display: grid;
  gap: 10px;
  padding: 12px;
  border: 1px solid var(--kb-studio-panel-border);
  border-radius: 14px;
  background: color-mix(in srgb, var(--kb-studio-panel-bg) 94%, #ffffff 6%);
}

.kb-nav-tree-node__row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 128px;
  gap: 10px;
}

.kb-nav-tree-node__row--detail {
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
}

.kb-nav-tree-node__hint {
  display: flex;
  align-items: center;
  min-height: 34px;
  padding: 0 12px;
  border-radius: 10px;
  background: var(--kb-studio-eyebrow-bg);
  color: var(--kb-studio-eyebrow-text);
  font-size: 12px;
}

.kb-nav-tree-node__actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.kb-nav-tree-node__children {
  display: grid;
  gap: 10px;
}

</style>
