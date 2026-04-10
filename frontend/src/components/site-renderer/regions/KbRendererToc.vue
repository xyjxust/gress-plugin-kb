<template>
  <nav v-if="items.length" class="sr-toc">
    <div class="sr-toc__title">本页目录</div>
    <!-- 不用 href="#id"：hash 路由下会覆盖整个 #/... 导致地址栏变成 /#标题、路由丢失 -->
    <button
      v-for="item in items"
      :key="item.id"
      type="button"
      class="sr-toc__item"
      :class="[item.level === 'h3' ? 'h3' : '', { active: activeId === item.id }]"
      @click="$emit('toc-click', item)"
    >
      {{ item.text }}
    </button>
  </nav>
</template>

<script setup lang="ts">
import type { TocItem } from '../../../types/siteRenderer'

defineProps<{
  items: TocItem[]
  activeId?: string
}>()

defineEmits<{
  'toc-click': [item: TocItem]
}>()
</script>

<style scoped>
.sr-toc {
  width: 200px;
  flex-shrink: 0;
  margin-left: 48px;
  position: sticky;
  top: calc(var(--navbar-h, 60px) + 24px);
  height: fit-content;
  max-height: calc(100vh - var(--navbar-h, 60px) - 48px);
  overflow-y: auto;
}
.sr-toc__title {
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.6px;
  text-transform: uppercase;
  color: var(--text3);
  font-family: var(--font-mono);
  margin-bottom: 10px;
}
.sr-toc__item {
  font: inherit;
  font-size: 12px;
  color: var(--text3);
  padding: 3px 0 3px 10px;
  border: 0 solid transparent;
  border-left-width: 2px;
  border-left-color: var(--border);
  background: transparent;
  cursor: pointer;
  transition: all 0.1s;
  display: block;
  width: 100%;
  text-align: left;
  line-height: 1.5;
}
.sr-toc__item:focus-visible {
  outline: 2px solid var(--primary, #2563eb);
  outline-offset: 2px;
}
.sr-toc__item:hover {
  color: var(--text2);
  border-left-color: var(--border2);
}
.sr-toc__item.active {
  color: var(--primary-text);
  border-left-color: var(--primary);
}
.sr-toc__item.h3 {
  padding-left: 22px;
  font-size: 11.5px;
}
</style>
