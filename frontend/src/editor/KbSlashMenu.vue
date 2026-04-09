<template>
  <div class="kb-slash-menu" :style="menuStyle" @mousedown.prevent>
    <n-scrollbar style="max-height: 280px">
      <div class="kb-slash-menu__inner">
        <template v-for="(row, ri) in displayRows" :key="rowKey(row, ri)">
          <div v-if="row.kind === 'header'" class="kb-slash-menu__group">
            {{ row.label }}
          </div>
          <button
            v-else
            type="button"
            class="kb-slash-menu__item"
            :class="{ 'kb-slash-menu__item--active': row.itemIndex === selected }"
            @click="pick(row.itemIndex)"
          >
            <span class="kb-slash-menu__title">{{ row.item.title }}</span>
            <span class="kb-slash-menu__hint">{{ row.item.id }}</span>
          </button>
        </template>
      </div>
    </n-scrollbar>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { CSSProperties } from 'vue'
import type { KbSlashItem } from './kbSlashItems'
import { clampPopupToViewport } from './clampPopupToViewport'

type DisplayRow =
  | { kind: 'header'; label: string }
  | { kind: 'item'; item: KbSlashItem; itemIndex: number }

const props = defineProps<{
  items: KbSlashItem[]
  command: (item: KbSlashItem) => void
  clientRect?: (() => DOMRect | null) | null
}>()

const selected = ref(0)

const displayRows = computed<DisplayRow[]>(() => {
  const rows: DisplayRow[] = []
  let lastGroup = ''
  props.items.forEach((item, itemIndex) => {
    if (item.group !== lastGroup) {
      rows.push({ kind: 'header', label: item.group })
      lastGroup = item.group
    }
    rows.push({ kind: 'item', item, itemIndex })
  })
  return rows
})

function rowKey(row: DisplayRow, ri: number) {
  return row.kind === 'header' ? `h-${row.label}-${ri}` : `i-${row.item.id}-${ri}`
}

watch(
  () => props.items,
  () => {
    selected.value = 0
  },
  { deep: true }
)

/** 与样式中 max-height、max-width 一致，用于视口夹紧 */
const SLASH_MENU_EST_W = 360
const SLASH_MENU_EST_H = 280
const SLASH_PAD = 8

const menuStyle = computed<CSSProperties>(() => {
  const r = props.clientRect?.()
  if (!r) {
    return { display: 'none' }
  }
  if (typeof window === 'undefined') {
    return {
      position: 'fixed' as const,
      left: `${r.left}px`,
      top: `${r.bottom + 6}px`,
      zIndex: 5000,
      minWidth: '260px',
      maxWidth: 'min(360px, calc(100vw - 16px))'
    }
  }

  const vw = window.innerWidth
  const vh = window.innerHeight
  const menuW = Math.min(SLASH_MENU_EST_W, vw - 2 * SLASH_PAD)
  const menuH = SLASH_MENU_EST_H

  let left = r.left
  let top = r.bottom + 6

  // 先水平夹紧（避免左侧裁切）
  ;({ left, top } = clampPopupToViewport({
    left,
    top,
    width: menuW,
    height: menuH,
    padding: SLASH_PAD
  }))

  // 下方空间不足时，优先翻到触发位置上方
  if (r.bottom + menuH > vh - SLASH_PAD) {
    const aboveTop = r.top - menuH - 6
    if (aboveTop >= SLASH_PAD) {
      top = aboveTop
    }
  }

  ;({ left, top } = clampPopupToViewport({
    left,
    top,
    width: menuW,
    height: menuH,
    padding: SLASH_PAD
  }))

  return {
    position: 'fixed' as const,
    left: `${left}px`,
    top: `${top}px`,
    zIndex: 5000,
    minWidth: '260px',
    maxWidth: `min(360px, calc(100vw - ${SLASH_PAD * 2}px))`
  }
})

function pick(itemIndex: number) {
  const item = props.items[itemIndex]
  if (item) props.command(item)
}

function handleKeyDown(event: KeyboardEvent): boolean {
  if (!props.items.length) return false
  if (event.key === 'ArrowDown') {
    event.preventDefault()
    selected.value = Math.min(selected.value + 1, props.items.length - 1)
    return true
  }
  if (event.key === 'ArrowUp') {
    event.preventDefault()
    selected.value = Math.max(selected.value - 1, 0)
    return true
  }
  if (event.key === 'Enter') {
    event.preventDefault()
    pick(selected.value)
    return true
  }
  return false
}

defineExpose({ handleKeyDown })
</script>

<style scoped>
.kb-slash-menu {
  background: #fff;
  border-radius: 10px;
  border: 1px solid #e5e7eb;
  box-shadow:
    0 10px 40px rgba(15, 23, 42, 0.12),
    0 2px 8px rgba(15, 23, 42, 0.06);
  overflow: hidden;
}

.kb-slash-menu__inner {
  padding: 6px;
}

.kb-slash-menu__group {
  padding: 6px 10px 4px;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.02em;
  color: #64748b;
  text-transform: none;
}

.kb-slash-menu__group:first-child {
  padding-top: 4px;
}

.kb-slash-menu__item {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 8px 10px;
  margin: 0;
  border: none;
  border-radius: 8px;
  background: transparent;
  cursor: pointer;
  font-size: 13px;
  color: #334155;
  text-align: left;
  transition: background 0.12s ease;
}

.kb-slash-menu__item:hover,
.kb-slash-menu__item--active {
  background: rgba(15, 118, 110, 0.1);
}

.kb-slash-menu__title {
  font-weight: 500;
}

.kb-slash-menu__hint {
  font-size: 11px;
  color: #94a3b8;
  font-family: ui-monospace, monospace;
}
</style>
