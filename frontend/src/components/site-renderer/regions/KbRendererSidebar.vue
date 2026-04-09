<template>
  <aside class="sr-sidebar" :class="{ collapsed: !open }" :style="sidebarStyle">
    <!-- sidebar-top 插槽位 -->
    <div v-if="$slots['sidebar-top']" class="sr-sidebar__slot-top">
      <slot name="sidebar-top" />
    </div>

    <!-- 树形菜单（无限层级） -->
    <div class="sr-sidebar__tree">
      <template v-for="section in config.tree" :key="section.id">
        <div class="sr-sidebar__section">
          <div v-if="section.groupLabel" class="sr-sidebar__section-title">
            {{ section.groupLabel }}
          </div>

          <KbSidebarMenuEntry
            v-for="node in section.children"
            :key="node.id"
            :node="node"
            :depth="0"
            :active-page-id="activePageId"
            :expanded-ids="expandedIds"
            @toggle="onToggleExpand"
            @page-select="(id) => emit('page-select', id)"
            @unbound-click="(label) => emit('unbound-click', label)"
          />
        </div>
      </template>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { computed, reactive, watch } from 'vue'
import type { SidebarConfig, SidebarMenuNode } from '../../../types/siteRenderer'
import KbSidebarMenuEntry from './KbSidebarMenuEntry.vue'

const props = withDefaults(
  defineProps<{
    config: SidebarConfig
    open?: boolean
    activePageId?: string
  }>(),
  {
    open: true,
    activePageId: '',
  }
)

const emit = defineEmits<{
  'page-select': [id: string]
  'unbound-click': [label: string]
  'toggle-node': [node: SidebarMenuNode]
}>()

const expandedIds = reactive(new Set<string>())

function walkInitExpanded(nodes: SidebarMenuNode[] | undefined) {
  if (!nodes) return
  for (const n of nodes) {
    if (n.children?.length && n.expanded !== false) expandedIds.add(n.id)
    walkInitExpanded(n.children)
  }
}

watch(
  () => props.config.tree,
  () => {
    expandedIds.clear()
    for (const sec of props.config.tree) walkInitExpanded(sec.children)
  },
  { immediate: true, deep: true }
)

const sidebarStyle = computed(() => ({
  width: props.open ? props.config.width + 'px' : '0',
}))

function onToggleExpand(id: string) {
  if (expandedIds.has(id)) expandedIds.delete(id)
  else expandedIds.add(id)
}
</script>

<style scoped>
.sr-sidebar {
  position: sticky;
  top: var(--navbar-h, 60px);
  height: calc(100vh - var(--navbar-h, 60px));
  flex-shrink: 0;
  border-right: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  min-height: 0;
  overflow: hidden;
  /* 侧栏用次级背景，和内容区拉开层次 */
  background: var(--bg2);
  transition: width 0.25s ease, border-color 0.3s;
}
.sr-sidebar.collapsed {
  width: 0 !important;
  overflow: hidden;
  border-right-color: transparent;
}

/* Slot top */
.sr-sidebar__slot-top {
  flex-shrink: 0;
  border-bottom: 1px solid var(--border);
  overflow: hidden;
  transition: all 0.2s;
}

/* Tree：在 flex 侧栏内占满剩余高度并可滚动（避免 min-height:auto 撑破父级） */
.sr-sidebar__tree {
  flex: 1 1 auto;
  min-height: 0;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 16px 0 24px;
  scrollbar-width: thin;
  scrollbar-color: var(--border2) transparent;
}
.sr-sidebar__tree::-webkit-scrollbar {
  width: 4px;
}
.sr-sidebar__tree::-webkit-scrollbar-thumb {
  background: var(--border2);
  border-radius: 4px;
}
.sr-sidebar__section {
  margin-bottom: 8px;
}
.sr-sidebar__section-title {
  padding: 6px 16px 4px;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.6px;
  text-transform: uppercase;
  color: var(--text3);
  font-family: var(--font-mono);
}

</style>
