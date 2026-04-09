<template>
  <div class="kb-nav-node" :class="{ 'kb-nav-node--horizontal': horizontal }">
    <template v-if="node.nodeType === 'GROUP' && !horizontal">
      <div class="kb-nav-node__group" :class="{ 'kb-nav-node__group--horizontal': horizontal }">
        <span class="kb-nav-node__group-label">{{ node.title }}</span>
        <div class="kb-nav-node__children" :class="{ 'kb-nav-node__children--horizontal': horizontal }">
          <KbShellNavNode
            v-for="c in node.children || []"
            :key="c.id"
            :node="c"
            :active-nav-id="activeNavId"
            :horizontal="horizontal"
            @select-nav="$emit('selectNav', $event)"
          />
        </div>
      </div>
    </template>

    <template v-else-if="node.nodeType === 'GROUP' && horizontal">
      <n-popover
        trigger="hover"
        placement="bottom"
        :show-arrow="false"
        :raw="true"
        @update:show="dropdownOpen = $event"
      >
        <template #trigger>
          <div class="kb-nav-node__dropdown" :class="{ 'kb-nav-node__dropdown--active': groupActive || dropdownOpen }">
            <button type="button" class="kb-nav-node__dropdown-trigger">
              <span>{{ node.title }}</span>
              <span class="kb-nav-node__dropdown-caret">⌄</span>
            </button>
          </div>
        </template>

        <div class="kb-nav-node__dropdown-panel">
          <KbShellNavNode
            v-for="c in node.children || []"
            :key="c.id"
            :node="c"
            :active-nav-id="activeNavId"
            @select-nav="onChildSelect"
          />
        </div>
      </n-popover>
    </template>

    <template v-else-if="node.nodeType === 'DOC'">
      <button
        type="button"
        class="kb-nav-node__doc"
        :class="{
          'kb-nav-node__doc--active': activeNavId === node.id,
          'kb-nav-node__doc--horizontal': horizontal
        }"
        :disabled="!node.docId"
        @click="onDocClick"
      >
        {{ node.title }}
      </button>
    </template>

    <template v-else-if="node.nodeType === 'LINK'">
      <a
        class="kb-nav-node__link"
        :class="{ 'kb-nav-node__link--horizontal': horizontal }"
        :href="node.linkUrl || '#'"
        target="_blank"
        rel="noopener noreferrer"
        @click.prevent
      >
        {{ node.title }}
      </a>
    </template>

    <template v-else>
      <span class="kb-nav-node__fallback">{{ node.title }}</span>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import KbShellNavNode from './KbShellNavNode.vue'
import type { KbNavNode } from '../types/kb'

const props = defineProps<{
  node: KbNavNode
  activeNavId?: number | null
  horizontal?: boolean
}>()

const emit = defineEmits<{
  selectNav: [navNodeId: number]
}>()

const groupActive = computed(() => containsActive(props.node, props.activeNavId ?? null))
const dropdownOpen = ref(false)

function onDocClick() {
  const id = props.node.docId
  if (!id) return
  emit('selectNav', props.node.id)
  dropdownOpen.value = false
}

function onChildSelect(navNodeId: number) {
  emit('selectNav', navNodeId)
  dropdownOpen.value = false
}

function containsActive(node: KbNavNode, activeNavId: number | null): boolean {
  if (!activeNavId) return false
  if (node.id === activeNavId) return true
  return Boolean(node.children?.some((child) => containsActive(child, activeNavId)))
}
</script>

<style scoped>
.kb-nav-node--horizontal {
  display: inline-flex;
  align-items: center;
}

.kb-nav-node {
  min-width: 0;
}

.kb-nav-node__group {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.kb-nav-node__group--horizontal {
  flex-direction: row;
  align-items: center;
  gap: 12px;
}

.kb-nav-node__group-label {
  font-size: 11px;
  font-weight: 700;
  color: var(--kb-sidebar-group-text);
  padding: 0 12px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  flex-shrink: 0;
}

.kb-nav-node__dropdown {
  position: relative;
  display: inline-flex;
  align-items: center;
}

.kb-nav-node__dropdown-trigger {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 38px;
  padding: 0 2px;
  border: none;
  background: transparent;
  color: var(--kb-header-nav-text);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  position: relative;
}

.kb-nav-node__dropdown-caret {
  font-size: 12px;
  opacity: 0.7;
  transform: translateY(-1px);
}

.kb-nav-node__dropdown-panel {
  min-width: 220px;
  padding: 10px;
  border: 1px solid var(--kb-page-card-border);
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.98);
  box-shadow: 0 18px 40px rgba(15, 23, 42, 0.12);
  display: grid;
  gap: 2px;
}

.kb-nav-node__dropdown:hover .kb-nav-node__dropdown-trigger,
.kb-nav-node__dropdown:focus-within .kb-nav-node__dropdown-trigger,
.kb-nav-node__dropdown--active .kb-nav-node__dropdown-trigger {
  color: var(--kb-header-nav-active-text);
}

.kb-nav-node__dropdown--active .kb-nav-node__dropdown-trigger::after {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  bottom: -9px;
  height: 2px;
  border-radius: 999px;
  background: var(--kb-header-nav-active-text);
}

.kb-nav-node__children {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding-left: 6px;
  border-left: 1px solid var(--kb-sidebar-rail-color);
}

.kb-nav-node__children--horizontal {
  flex-direction: row;
  flex-wrap: wrap;
  padding-left: 0;
  gap: var(--kb-header-nav-gap);
  align-items: center;
  border-left: none;
}

.kb-nav-node__doc {
  display: block;
  width: 100%;
  text-align: left;
  border: none;
  background: transparent;
  font-size: 14px;
  font-weight: 500;
  color: #44403c;
  padding: 8px 12px;
  border-radius: 10px;
  cursor: pointer;
  line-height: 1.45;
  transition: background-color 0.16s ease, color 0.16s ease;
}

.kb-nav-node__doc:hover:not(:disabled) {
  background: var(--kb-sidebar-item-hover-bg);
}

.kb-nav-node__doc--active {
  background: var(--kb-sidebar-item-active-bg);
  color: var(--kb-sidebar-item-active-text);
  font-weight: 700;
}

.kb-nav-node__doc:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.kb-nav-node__doc--horizontal {
  width: auto;
  white-space: nowrap;
  border: none;
  background: transparent;
  padding: 8px 0;
  border-radius: 999px;
  font-size: 14px;
  color: var(--kb-header-nav-text);
  position: relative;
}

.kb-nav-node__doc--horizontal:hover:not(:disabled) {
  color: var(--kb-header-nav-active-text);
  background: transparent;
}

.kb-nav-node__doc--horizontal.kb-nav-node__doc--active {
  color: var(--kb-header-nav-active-text);
  background: transparent;
}

.kb-nav-node__doc--horizontal.kb-nav-node__doc--active::after {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  bottom: -12px;
  height: 2px;
  border-radius: 999px;
  background: var(--kb-header-nav-active-text);
}

.kb-nav-node__link {
  display: block;
  font-size: 14px;
  color: var(--kb-header-nav-active-text);
  padding: 6px 12px;
  text-decoration: underline;
  text-underline-offset: 2px;
}

.kb-nav-node__link--horizontal {
  display: inline-block;
  padding: 4px 8px;
  font-size: 12px;
}

.kb-nav-node__fallback {
  font-size: 12px;
  color: var(--kb-empty-text-color);
  padding: 4px 8px;
}
</style>
