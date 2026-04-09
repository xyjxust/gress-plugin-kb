<template>
  <div class="sr-menu-entry" :class="{ 'sr-menu-entry--nested': depth > 0 }">
    <div
      class="sr-sidebar__node-label"
      :class="{
        active: isLeaf && activePageId === effectivePageKey,
        'sr-menu-entry__row--deep': depth > 0,
      }"
      :style="rowStyle"
      @click="onRowClick"
    >
      <svg
        v-if="hasChildren"
        class="sr-sidebar__chevron"
        :class="{ open: expandedIds.has(node.id) }"
        viewBox="0 0 16 16"
        fill="none"
      >
        <path
          d="M6 4l4 4-4 4"
          stroke="currentColor"
          stroke-width="1.5"
          stroke-linecap="round"
        />
      </svg>
      <span v-else class="sr-sidebar__chevron-placeholder" />

      <span v-if="node.icon" class="sr-sidebar__icon">{{ node.icon }}</span>
      <span class="sr-sidebar__label-text">{{ node.label }}</span>
      <span v-if="node.badge" class="sr-sidebar__badge" :style="badgeStyle(node.badge)">
        {{ node.badge }}
      </span>
    </div>

    <div
      v-if="hasChildren"
      class="sr-sidebar__nest"
      :class="{ open: expandedIds.has(node.id) }"
    >
      <div class="sr-sidebar__nest-rail" :style="railStyle">
        <KbSidebarMenuEntry
          v-for="ch in node.children"
          :key="ch.id"
          :node="ch"
          :depth="depth + 1"
          :active-page-id="activePageId"
          :expanded-ids="expandedIds"
          @toggle="emit('toggle', $event)"
          @page-select="emit('page-select', $event)"
          @unbound-click="emit('unbound-click', $event)"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { SidebarMenuNode } from '../../../types/siteRenderer'

const props = withDefaults(
  defineProps<{
    node: SidebarMenuNode
    depth?: number
    activePageId?: string
    expandedIds: Set<string>
  }>(),
  {
    depth: 0,
    activePageId: '',
  }
)

const emit = defineEmits<{
  toggle: [id: string]
  'page-select': [id: string]
  'unbound-click': [label: string]
}>()

const hasChildren = computed(() => !!props.node.children?.length)
const isLeaf = computed(() => !hasChildren.value)
const effectivePageKey = computed(() => props.node.pageId || props.node.id)

const rowStyle = computed(() => ({
  paddingLeft: `${8 + props.depth * 12}px`,
  paddingRight: '12px',
}))

const railStyle = computed(() => ({
  paddingLeft: `${4 + Math.min(props.depth, 6) * 2}px`,
}))

function onRowClick() {
  if (hasChildren.value) {
    emit('toggle', props.node.id)
    return
  }
  // 未绑定 pageId 的叶子不要用 node.id 冒充页面 id，否则会触发宿主页 sync 把顶栏锁到第一项（如「文档」）
  const pid = props.node.pageId
  if (pid) emit('page-select', pid)
  else emit('unbound-click', props.node.label || '未绑定页面')
}

function badgeStyle(badge: string): Record<string, string> {
  if (badge === 'NEW') return { background: '#dcfce7', color: '#16a34a' }
  if (badge === 'Beta') return { background: '#fef9c3', color: '#ca8a04' }
  return { background: 'var(--bg3)', color: 'var(--text3)' }
}
</script>

<style scoped>
.sr-sidebar__node-label {
  display: flex;
  align-items: center;
  gap: 7px;
  padding-top: 6px;
  padding-bottom: 6px;
  font-size: 13px;
  color: var(--text2);
  cursor: pointer;
  transition: all 0.1s;
  user-select: none;
  border-left: 2px solid transparent;
}
.sr-sidebar__node-label:hover {
  color: var(--text);
  background: var(--bg2);
}
.sr-sidebar__node-label.active {
  color: var(--primary-text);
  background: var(--primary-light);
  border-left-color: var(--primary);
  font-weight: 500;
}
.sr-menu-entry--nested .sr-sidebar__node-label {
  font-size: 12.5px;
}
.sr-menu-entry__row--deep {
  font-weight: 400;
}
.sr-sidebar__nest {
  overflow: hidden;
  max-height: 0;
  transition: max-height 0.28s ease;
}
.sr-sidebar__nest.open {
  max-height: 4000px;
}
.sr-sidebar__nest-rail {
  margin: 0 0 2px 0;
  border-left: 1px solid var(--border);
  margin-left: 22px;
}
.sr-sidebar__chevron {
  width: 14px;
  height: 14px;
  transition: transform 0.2s;
  flex-shrink: 0;
  opacity: 0.5;
}
.sr-sidebar__chevron.open {
  transform: rotate(90deg);
}
.sr-sidebar__chevron-placeholder {
  width: 14px;
  flex-shrink: 0;
}
.sr-sidebar__icon {
  font-size: 14px;
}
.sr-sidebar__label-text {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.sr-sidebar__badge {
  margin-left: auto;
  font-size: 9px;
  font-weight: 600;
  padding: 1px 6px;
  border-radius: 10px;
  letter-spacing: 0.3px;
  flex-shrink: 0;
}
</style>
