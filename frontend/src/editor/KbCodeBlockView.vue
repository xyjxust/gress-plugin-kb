<template>
  <node-view-wrapper
    class="kb-code-block-view"
    :class="{ 'kb-code-block-view--selected': selected }"
  >
    <div class="kb-code-block-view__toolbar" contenteditable="false" @mousedown.prevent>
      <span class="kb-code-block-view__drag" data-drag-handle aria-label="拖动">⠿</span>
      <span class="kb-code-block-view__label">代码块</span>
      <div class="kb-code-block-view__grow" />
      <n-select
        size="small"
        :value="langForSelect"
        :options="languageOptions"
        placeholder="语言"
        class="kb-code-block-view__lang"
        @update:value="onLangChange"
      />
      <n-divider vertical />
      <n-button size="tiny" quaternary @click="toggleNowrap">
        {{ nowrap ? '自动换行' : '取消自动换行' }}
      </n-button>
      <n-divider vertical />
      <n-button size="tiny" quaternary @click="copyCode">复制</n-button>
      <n-popover trigger="click" placement="bottom-end" :show-arrow="false">
        <template #trigger>
          <n-button size="tiny" quaternary>底色</n-button>
        </template>
        <div class="kb-code-block-view__palette">
          <button
            v-for="opt in bgPresets"
            :key="opt.value || 'default'"
            type="button"
            class="kb-code-block-view__swatch"
            :class="{ 'kb-code-block-view__swatch--active': isActiveBg(opt.value) }"
            :style="{ background: opt.value || '#f1f5f9' }"
            :title="opt.label"
            @click="setBg(opt.value)"
          />
        </div>
      </n-popover>
    </div>
    <pre
      class="kb-code-block-view__pre"
      :class="{ 'kb-code-block-view__pre--nowrap': nowrap }"
      :style="preInlineStyle"
      spellcheck="false"
      autocorrect="off"
      autocapitalize="off"
    ><node-view-content as="code" :class="codeClass" /></pre>
  </node-view-wrapper>
</template>

<script setup lang="ts">
import 'highlight.js/styles/github.css'
import { computed } from 'vue'
import { NodeViewWrapper, NodeViewContent, nodeViewProps } from '@tiptap/vue-3'
import { useMessage } from '@keqi.gress/plugin-bridge'

const props = defineProps(nodeViewProps)
const message = useMessage()

const DEFAULT_BG = '#f1f5f9'

const languageOptions = [
  { label: '纯文本', value: '' },
  { label: 'SQL', value: 'sql' },
  { label: 'JavaScript', value: 'javascript' },
  { label: 'TypeScript', value: 'typescript' },
  { label: 'JSON', value: 'json' },
  { label: 'YAML', value: 'yaml' },
  { label: 'HTML', value: 'html' },
  { label: 'CSS', value: 'css' },
  { label: 'Vue', value: 'vue' },
  { label: 'Python', value: 'python' },
  { label: 'Java', value: 'java' },
  { label: 'Go', value: 'go' },
  { label: 'Rust', value: 'rust' },
  { label: 'Bash', value: 'bash' },
  { label: 'Markdown', value: 'markdown' },
  { label: 'XML', value: 'xml' }
]

const bgPresets = [
  { label: '默认灰', value: null as string | null },
  { label: '白', value: '#ffffff' },
  { label: '深底', value: '#1e293b' },
  { label: '浅黄', value: '#fef3c7' },
  { label: '浅蓝', value: '#dbeafe' },
  { label: '浅紫', value: '#ede9fe' },
  { label: '浅绿', value: '#dcfce7' },
  { label: '浅红', value: '#fee2e2' }
]

const nowrap = computed(() => !!props.node.attrs.nowrap)

const langForSelect = computed(() => {
  const l = props.node.attrs.language as string | null | undefined
  return l && l.length ? l : null
})

const codeClass = computed(() => {
  const l = props.node.attrs.language as string | null | undefined
  return l ? `language-${l}` : null
})

const preInlineStyle = computed(() => {
  const bg = props.node.attrs.backgroundColor as string | null | undefined
  const s: Record<string, string> = {}
  if (bg) s.backgroundColor = bg
  else s.backgroundColor = DEFAULT_BG
  return s
})

function isActiveBg(value: string | null) {
  const cur = props.node.attrs.backgroundColor as string | null | undefined
  return (cur || null) === (value || null)
}

function onLangChange(v: string | null) {
  props.updateAttributes({ language: v && v.length ? v : null })
}

function toggleNowrap() {
  props.updateAttributes({ nowrap: !props.node.attrs.nowrap })
}

function setBg(value: string | null) {
  props.updateAttributes({ backgroundColor: value })
}

async function copyCode() {
  const text = props.node.textContent || ''
  try {
    await navigator.clipboard.writeText(text)
    message.success('已复制')
  } catch {
    message.warning('复制失败')
  }
}
</script>

<style scoped>
.kb-code-block-view {
  margin: 0.65rem 0;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: #f8fafc;
  overflow: hidden;
}

.kb-code-block-view--selected {
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.25);
}

.kb-code-block-view__toolbar {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
  padding: 6px 8px;
  border-bottom: 1px solid #e2e8f0;
  background: #f1f5f9;
  font-size: 12px;
  color: #475569;
}

.kb-code-block-view__drag {
  cursor: grab;
  user-select: none;
  opacity: 0.65;
  padding: 0 2px;
  font-size: 14px;
  line-height: 1;
}

.kb-code-block-view__drag:active {
  cursor: grabbing;
}

.kb-code-block-view__label {
  font-weight: 500;
}

.kb-code-block-view__grow {
  flex: 1;
  min-width: 4px;
}

.kb-code-block-view__lang {
  width: 128px;
}

.kb-code-block-view__pre {
  margin: 0;
  padding: 10px 12px;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New',
    monospace;
  font-size: 13px;
  line-height: 1.5;
  white-space: pre-wrap;
  word-break: break-word;
  overflow-x: auto;
  min-height: 2.5em;
  border: none !important;
  border-radius: 0 !important;
  box-shadow: none !important;
  outline: none;
  border-bottom-left-radius: 7px;
  border-bottom-right-radius: 7px;
}

.kb-code-block-view__pre:focus,
.kb-code-block-view__pre:focus-within {
  outline: none;
}

.kb-code-block-view__pre--nowrap {
  white-space: pre;
  word-break: normal;
}

/* 覆盖 github.css：pre code.hljs 的 padding + .hljs 白底，避免内层「盒中盒」与直角/圆角错位 */
.kb-code-block-view__pre :deep(code),
.kb-code-block-view__pre :deep(code.hljs) {
  display: block;
  margin: 0;
  border: none !important;
  border-radius: 0 !important;
  outline: none !important;
  box-shadow: none !important;
  background: transparent !important;
  padding: 0 !important;
  overflow-x: visible !important;
  overflow-y: visible !important;
  font-size: inherit;
  font-family: inherit;
}

.kb-code-block-view__palette {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  padding: 4px;
  max-width: 200px;
}

.kb-code-block-view__swatch {
  width: 26px;
  height: 26px;
  border-radius: 6px;
  border: 2px solid #e2e8f0;
  cursor: pointer;
  padding: 0;
}

.kb-code-block-view__swatch--active {
  border-color: #2563eb;
  box-shadow: 0 0 0 1px #2563eb;
}
</style>
