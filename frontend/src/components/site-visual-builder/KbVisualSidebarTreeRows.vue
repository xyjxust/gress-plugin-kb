<template>
  <div class="vsb-rows">
    <template v-for="(it, ix) in nodes" :key="it.id">
      <div class="vsb-row-block">
        <div
          class="te-child"
          :class="{
            on: selTreeNode === pathKey(sectionIndex, [...pathPrefix, ix]),
            'te-child--unbound-leaf': !it.pageId && !(it.children?.length)
          }"
          @click="emit('update:sel-tree-node', pathKey(sectionIndex, [...pathPrefix, ix]))"
        >
          <span>{{ it.icon || '📄' }}</span>
          <span>{{ it.label }}</span>
          <span v-if="it.pageId" class="tc-page">{{ pageSlug(it.pageId) }}</span>
          <span v-else-if="!(it.children?.length)" class="tc-unbound">⚠ 未绑定 · 预览不可跳转</span>
          <div class="te-child-acts">
            <button
              type="button"
              class="ta"
              title="在此项下添加子项"
              @click.stop="emit('add-child', { sectionIndex, parentPath: [...pathPrefix, ix] })"
            >
              +
            </button>
            <button
              type="button"
              class="ta del"
              title="删除"
              @click.stop="emit('remove', { sectionIndex, nodePath: [...pathPrefix, ix] })"
            >
              ×
            </button>
          </div>
        </div>
        <div v-if="it.children?.length" class="vsb-nested">
          <KbVisualSidebarTreeRows
            :nodes="it.children"
            :section-index="sectionIndex"
            :path-prefix="[...pathPrefix, ix]"
            :sel-tree-node="selTreeNode"
            :page-slug="pageSlug"
            @update:sel-tree-node="emit('update:sel-tree-node', $event)"
            @add-child="emit('add-child', $event)"
            @remove="emit('remove', $event)"
          />
        </div>
      </div>
    </template>
  </div>
</template>

<script lang="ts">
export interface SidebarBuilderNode {
  id: string
  label: string
  icon: string
  pageId: string | null
  badge: string
  /** 有子节点时默认展开；设为 false 则初始折叠 */
  expanded?: boolean
  children?: SidebarBuilderNode[]
}
</script>

<script setup lang="ts">
defineProps<{
  nodes: SidebarBuilderNode[]
  sectionIndex: number
  pathPrefix: number[]
  selTreeNode: string | null
  pageSlug: (pageId: string) => string
}>()

const emit = defineEmits<{
  'update:sel-tree-node': [key: string]
  'add-child': [payload: { sectionIndex: number; parentPath: number[] }]
  'remove': [payload: { sectionIndex: number; nodePath: number[] }]
}>()

function pathKey(si: number, indices: number[]): string {
  return indices.length === 0 ? `${si}.root` : [si, ...indices].join('.')
}
</script>

<style scoped>
.vsb-rows {
  display: flex;
  flex-direction: column;
  gap: 0;
}
.vsb-row-block {
  display: flex;
  flex-direction: column;
}
.vsb-nested {
  margin-left: 14px;
  padding-left: 8px;
  border-left: 1px solid var(--bd, #e2e8f0);
}
.te-child {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 8px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 12px;
}
.te-child.on {
  background: var(--bg2, #f1f5f9);
}
.te-child-acts {
  margin-left: auto;
  display: flex;
  gap: 2px;
}
.te-child-acts .ta {
  border: none;
  background: transparent;
  cursor: pointer;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 12px;
  color: var(--tx2, #64748b);
}
.te-child-acts .ta:hover {
  background: var(--bg, #fff);
}
.te-child-acts .ta.del:hover {
  color: var(--red, #ef4444);
}
.tc-page {
  font-size: 10px;
  color: var(--acc, #64748b);
  font-family: var(--mono, monospace);
  max-width: 120px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.tc-unbound {
  font-size: 10px;
  color: #b91c1c;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 999px;
  padding: 1px 6px;
  white-space: nowrap;
}
.te-child--unbound-leaf {
  opacity: 0.88;
}
</style>
