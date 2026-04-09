<template>
  <Teleport to="body">
    <div
      v-show="modelValue"
      class="sr-search-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="搜索文档"
      @click.self="close"
    >
      <div
        class="sr-search-panel"
        :class="{ 'theme-dark': dark }"
        :style="{ '--sr-search-focus': primary }"
        @click.stop
      >
        <div class="sr-search-input-wrap" :class="{ focused: inputFocused }">
          <span class="sr-search-input-icon" aria-hidden="true">&#x1F50D;</span>
          <input
            ref="inputRef"
            v-model="query"
            type="search"
            class="sr-search-input"
            placeholder="搜索文档..."
            autocomplete="off"
            spellcheck="false"
            @keydown="onKeydown"
            @focus="inputFocused = true"
            @blur="inputFocused = false"
          >
          <button
            v-if="query.trim()"
            type="button"
            class="sr-search-clear"
            aria-label="清除"
            @click="query = ''"
          >
            &times;
          </button>
        </div>

        <div ref="listRef" class="sr-search-results">
          <template v-if="!queryTrim">
            <div class="sr-search-hint">输入关键词搜索标题与摘要</div>
          </template>
          <template v-else-if="!filtered.length">
            <div class="sr-search-empty">未找到匹配「{{ queryTrim }}」的文档</div>
          </template>
          <ul v-else class="sr-search-list" role="listbox">
            <li
              v-for="(item, i) in filtered"
              :key="item.id"
              role="option"
              :aria-selected="i === activeIndex"
              class="sr-search-item"
              :class="{ 'sr-search-item--active': i === activeIndex }"
              @click="choose(item.id)"
              @mouseenter="activeIndex = i"
            >
              <span class="sr-search-item-icon" aria-hidden="true">&#x1F4C4;</span>
              <div class="sr-search-item-body">
                <div class="sr-search-item-title" v-html="highlightHtml(item.title)" />
                <div v-if="snippet(item)" class="sr-search-item-desc" v-html="highlightHtml(snippet(item)!)" />
                <div v-if="item.category" class="sr-search-item-meta">{{ item.category }}</div>
              </div>
              <span v-if="i === activeIndex" class="sr-search-item-kbd" aria-hidden="true">&#x21A9;</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, nextTick, ref, watch, withDefaults } from 'vue'
import type { PageData } from '../../types/siteRenderer'

const props = withDefaults(
  defineProps<{
    modelValue: boolean
    pages: Record<string, PageData>
    /** 主色：高亮与聚焦 */
    primary?: string
    dark?: boolean
  }>(),
  {
    primary: '#2563eb',
    dark: false,
  }
)

const emit = defineEmits<{
  'update:modelValue': [v: boolean]
  select: [pageId: string]
}>()

const inputRef = ref<HTMLInputElement | null>(null)
const listRef = ref<HTMLElement | null>(null)
const query = ref('')
const activeIndex = ref(0)
const inputFocused = ref(false)

const queryTrim = computed(() => query.value.trim())

const pageList = computed(() => Object.values(props.pages || {}))

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
}

const filtered = computed(() => {
  const q = queryTrim.value.toLowerCase()
  if (!q) return []
  return pageList.value.filter((p) => {
    const t = (p.title || '').toLowerCase()
    const d = (p.description || '').toLowerCase()
    const h = stripHtml(p.html || '').toLowerCase()
    const c = (p.category || '').toLowerCase()
    return t.includes(q) || d.includes(q) || h.includes(q) || c.includes(q)
  })
})

watch(
  () => props.modelValue,
  async (open) => {
    if (open) {
      query.value = ''
      activeIndex.value = 0
      await nextTick()
      inputRef.value?.focus()
    }
  }
)

watch(queryTrim, () => {
  activeIndex.value = 0
})

watch(filtered, () => {
  if (activeIndex.value >= filtered.value.length) activeIndex.value = Math.max(0, filtered.value.length - 1)
})

function escapeRe(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function highlightHtml(text: string): string {
  const q = queryTrim.value
  if (!q || !text) return escapeHtml(text)
  const re = new RegExp(`(${escapeRe(q)})`, 'gi')
  return escapeHtml(text).replace(re, '<mark class="sr-search-mark">$1</mark>')
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function snippet(p: PageData): string | null {
  const q = queryTrim.value
  if (!q) return p.description || null
  const desc = p.description || ''
  const plain = stripHtml(p.html || '')
  const src = desc || plain.slice(0, 200)
  if (!src) return null
  const lower = src.toLowerCase()
  const idx = lower.indexOf(q.toLowerCase())
  if (idx === -1) return src.length > 120 ? src.slice(0, 117) + '…' : src
  const start = Math.max(0, idx - 40)
  const end = Math.min(src.length, idx + q.length + 80)
  let out = (start > 0 ? '…' : '') + src.slice(start, end) + (end < src.length ? '…' : '')
  return out
}

function close() {
  emit('update:modelValue', false)
}

function choose(pageId: string) {
  emit('select', pageId)
  close()
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') {
    e.preventDefault()
    close()
    return
  }
  if (!filtered.value.length) return
  if (e.key === 'ArrowDown') {
    e.preventDefault()
    activeIndex.value = (activeIndex.value + 1) % filtered.value.length
    scrollActiveIntoView()
  } else if (e.key === 'ArrowUp') {
    e.preventDefault()
    activeIndex.value = (activeIndex.value - 1 + filtered.value.length) % filtered.value.length
    scrollActiveIntoView()
  } else if (e.key === 'Enter') {
    e.preventDefault()
    const p = filtered.value[activeIndex.value]
    if (p) choose(p.id)
  }
}

function scrollActiveIntoView() {
  nextTick(() => {
    const root = listRef.value
    if (!root) return
    const el = root.querySelector('.sr-search-item--active') as HTMLElement | null
    el?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
  })
}

</script>

<style scoped>
.sr-search-overlay {
  position: fixed;
  inset: 0;
  z-index: 10000;
  background: rgba(15, 23, 42, 0.45);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding: 12vh 16px 16px;
  box-sizing: border-box;
}

.sr-search-panel {
  width: min(560px, 100%);
  max-height: min(72vh, 520px);
  display: flex;
  flex-direction: column;
  gap: 14px;
  box-sizing: border-box;
  /* 与参考稿一致：面板内留白，搜索框不再贴外圆角 */
  padding: 16px;
  background: var(--surface, #fff);
  color: var(--text, #0f172a);
  border-radius: 12px;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  border: 1px solid var(--border, #e2e8f0);
  overflow: hidden;
}

.sr-search-input-wrap {
  display: flex;
  align-items: center;
  gap: 10px;
  box-sizing: border-box;
  padding: 10px 12px;
  border: 1px solid var(--border, #e2e8f0);
  border-radius: 10px;
  background: var(--bg2, #f8fafc);
  flex-shrink: 0;
  transition:
    border-color 0.15s,
    box-shadow 0.15s;
}
.sr-search-input-wrap.focused {
  border-color: var(--sr-search-focus, #2563eb);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--sr-search-focus, #2563eb) 22%, transparent);
  background: var(--surface, #fff);
}

.sr-search-input-icon {
  font-size: 15px;
  opacity: 0.75;
  flex-shrink: 0;
}

.sr-search-input {
  flex: 1;
  min-width: 0;
  border: none;
  background: transparent;
  font-size: 15px;
  color: inherit;
  outline: none;
  font-family: inherit;
}
.sr-search-input::placeholder {
  color: var(--text3, #94a3b8);
}

.sr-search-clear {
  width: 28px;
  height: 28px;
  border: none;
  border-radius: 6px;
  background: var(--bg2, #f1f5f9);
  color: var(--text2, #64748b);
  cursor: pointer;
  font-size: 18px;
  line-height: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.sr-search-clear:hover {
  background: var(--border, #e2e8f0);
  color: var(--text, #0f172a);
}

.sr-search-results {
  flex: 1;
  min-height: 100px;
  max-height: min(52vh, 400px);
  overflow-x: hidden;
  overflow-y: auto;
  margin: 0;
  /* 与上方搜索框留出分隔感 */
  border-top: 1px solid var(--border, #e2e8f0);
  padding: 12px 0 0;
}

.sr-search-hint,
.sr-search-empty {
  padding: 24px 8px 8px;
  text-align: center;
  font-size: 13px;
  color: var(--text3, #94a3b8);
}

.sr-search-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.sr-search-item {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 12px 12px;
  border-radius: 10px;
  border: 1px solid var(--border, #e2e8f0);
  background: var(--surface, #fff);
  box-sizing: border-box;
  cursor: pointer;
  transition:
    background 0.12s,
    border-color 0.12s;
}
.sr-search-item:hover:not(.sr-search-item--active) {
  background: var(--primary-light, #eff6ff);
  border-color: color-mix(in srgb, var(--sr-search-focus, #2563eb) 28%, var(--border, #e2e8f0));
}
.sr-search-item--active {
  background: var(--sr-search-focus, #2563eb);
  border-color: var(--sr-search-focus, #2563eb);
  outline: none;
}
.sr-search-item--active .sr-search-item-title {
  color: #fff;
}
.sr-search-item--active .sr-search-item-desc,
.sr-search-item--active .sr-search-item-meta {
  color: rgba(255, 255, 255, 0.88);
}
.sr-search-item--active .sr-search-item-icon {
  filter: brightness(1.2);
}
.sr-search-item--active .sr-search-item-kbd {
  color: rgba(255, 255, 255, 0.85);
}
.sr-search-item--active :deep(.sr-search-mark) {
  background: rgba(255, 255, 255, 0.25);
  color: #fff;
}

.sr-search-item-icon {
  font-size: 16px;
  flex-shrink: 0;
  margin-top: 2px;
  opacity: 0.85;
}

.sr-search-item-body {
  flex: 1;
  min-width: 0;
}

.sr-search-item-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--text, #0f172a);
  line-height: 1.35;
}

.sr-search-item-desc {
  margin-top: 4px;
  font-size: 12px;
  color: var(--text2, #64748b);
  line-height: 1.45;
}

.sr-search-item-meta {
  margin-top: 6px;
  font-size: 11px;
  color: var(--text3, #94a3b8);
}

.sr-search-item-kbd {
  flex-shrink: 0;
  font-size: 14px;
  opacity: 0.5;
  margin-top: 2px;
}

:deep(.sr-search-mark) {
  background: color-mix(in srgb, var(--sr-search-focus, #2563eb) 22%, transparent);
  color: var(--sr-search-focus, #1d4ed8);
  font-weight: 600;
  padding: 0 1px;
  border-radius: 2px;
}

.theme-dark .sr-search-panel {
  --surface: #1e293b;
  --text: #f1f5f9;
  --text2: #94a3b8;
  --text3: #64748b;
  --border: #334155;
  --bg2: #334155;
  --primary-light: rgba(37, 99, 235, 0.2);
}
</style>
