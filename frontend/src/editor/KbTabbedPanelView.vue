<template>
  <node-view-wrapper
    class="kb-tabbed-panel kb-tabbed-panel--editor"
    :class="{ 'kb-tabbed-panel--selected': selected }"
  >
    <div class="kb-tabbed-panel__shell" contenteditable="false">
      <div class="kb-tabbed-panel__toolbar" @mousedown.prevent>
        <span class="kb-tabbed-panel__drag" data-drag-handle aria-label="拖动">⠿</span>
        <span class="kb-tabbed-panel__badge">多标签</span>
        <div class="kb-tabbed-panel__grow" />
        <n-button size="tiny" quaternary @click="addPanel">添加标签</n-button>
        <n-button size="tiny" quaternary :disabled="localPanels.length <= 1" @click="removeActivePanel">
          删除当前
        </n-button>
      </div>

      <div class="kb-tabbed-panel__tabs">
        <button
          v-for="(p, i) in localPanels"
          :key="i"
          type="button"
          class="kb-tabbed-panel__tab-btn"
          :class="{ 'kb-tabbed-panel__tab-btn--active': i === activeIndex }"
          @click="activeIndex = i"
        >
          {{ p.label || `标签 ${i + 1}` }}
        </button>
      </div>

      <div v-if="currentPanel" class="kb-tabbed-panel__editor">
        <n-input
          v-model:value="currentPanel.label"
          size="small"
          placeholder="标签名称"
          class="kb-tabbed-panel__label-input"
          @blur="commit"
        />
        <n-input
          v-model:value="currentPanel.code"
          type="textarea"
          placeholder="命令或代码"
          :autosize="{ minRows: 3, maxRows: 14 }"
          class="kb-tabbed-panel__code-input"
          @blur="commit"
        />
        <div class="kb-tabbed-panel__footer">
          <n-select
            v-model:value="currentPanel.language"
            size="tiny"
            :options="langOptions"
            class="kb-tabbed-panel__lang"
            @update:value="commit"
          />
          <n-button size="tiny" quaternary @click="copyCurrent">复制</n-button>
        </div>
      </div>
    </div>
  </node-view-wrapper>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { NodeViewWrapper, nodeViewProps } from '@tiptap/vue-3'
import { useMessage } from '@keqi.gress/plugin-bridge'
import { defaultKbTabbedPanels, type KbTabbedPanelItem } from './kbTabbedPanelExtension'

const props = defineProps(nodeViewProps)
const message = useMessage()

const langOptions = [
  { label: 'Bash', value: 'bash' },
  { label: 'Shell', value: 'shell' },
  { label: 'Text', value: 'text' },
  { label: 'JSON', value: 'json' },
  { label: 'SQL', value: 'sql' },
  { label: 'JavaScript', value: 'javascript' }
]

const localPanels = ref<KbTabbedPanelItem[]>([])
const activeIndex = ref(0)

function clonePanels(raw: unknown): KbTabbedPanelItem[] {
  const p = raw as KbTabbedPanelItem[] | undefined
  if (!Array.isArray(p) || !p.length) {
    return defaultKbTabbedPanels().map((x) => ({ ...x }))
  }
  return p.map((x) => ({
    label: typeof x.label === 'string' ? x.label : '标签',
    code: typeof x.code === 'string' ? x.code : '',
    language: typeof x.language === 'string' ? x.language : 'bash'
  }))
}

watch(
  () => props.node.attrs.panels,
  (next) => {
    localPanels.value = clonePanels(next)
    if (activeIndex.value >= localPanels.value.length) {
      activeIndex.value = Math.max(0, localPanels.value.length - 1)
    }
  },
  { immediate: true, deep: true }
)

const currentPanel = computed(() => localPanels.value[activeIndex.value] ?? null)

function commit() {
  props.updateAttributes({ panels: localPanels.value.map((x) => ({ ...x })) })
}

function addPanel() {
  localPanels.value.push({ label: '新版本', code: '', language: 'bash' })
  activeIndex.value = localPanels.value.length - 1
  commit()
}

function removeActivePanel() {
  if (localPanels.value.length <= 1) return
  localPanels.value.splice(activeIndex.value, 1)
  activeIndex.value = Math.min(activeIndex.value, localPanels.value.length - 1)
  commit()
}

async function copyCurrent() {
  const t = currentPanel.value?.code || ''
  if (!t) {
    message.warning('当前标签无内容')
    return
  }
  try {
    await navigator.clipboard.writeText(t)
    message.success('已复制')
  } catch {
    message.warning('复制失败')
  }
}
</script>

<style scoped>
.kb-tabbed-panel--editor {
  margin: 0.75rem 0;
}

.kb-tabbed-panel__shell {
  background: #f4f4f5;
  border-radius: 14px;
  padding: 12px 14px 14px;
  border: 1px solid #e4e4e7;
}

.kb-tabbed-panel--selected .kb-tabbed-panel__shell {
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.22);
}

.kb-tabbed-panel__toolbar {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
  font-size: 12px;
  color: #71717a;
}

.kb-tabbed-panel__drag {
  cursor: grab;
  opacity: 0.55;
  user-select: none;
}

.kb-tabbed-panel__badge {
  font-weight: 600;
  color: #52525b;
}

.kb-tabbed-panel__grow {
  flex: 1;
  min-width: 4px;
}

.kb-tabbed-panel__tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 4px 18px;
  margin-bottom: 12px;
  border-bottom: 1px solid #e4e4e7;
  padding-bottom: 2px;
}

.kb-tabbed-panel__tab-btn {
  border: none;
  background: transparent;
  padding: 6px 2px 8px;
  font-size: 14px;
  color: #a1a1aa;
  cursor: pointer;
  position: relative;
  transition: color 0.15s ease;
}

.kb-tabbed-panel__tab-btn:hover {
  color: #6366f1;
}

.kb-tabbed-panel__tab-btn--active {
  color: #2563eb;
  font-weight: 600;
}

.kb-tabbed-panel__tab-btn--active::after {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  bottom: -3px;
  height: 3px;
  border-radius: 2px 2px 0 0;
  background: #2563eb;
}

.kb-tabbed-panel__editor {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.kb-tabbed-panel__label-input {
  max-width: 280px;
}

/* 与外层 shell 一体：去掉代码框默认灰底 */
.kb-tabbed-panel__code-input :deep(.n-input),
.kb-tabbed-panel__code-input :deep(.n-input-wrapper) {
  background-color: transparent !important;
  --n-color: transparent;
  --n-color-focus: transparent;
}

.kb-tabbed-panel__code-input :deep(.n-input__border),
.kb-tabbed-panel__code-input :deep(.n-input__state-border) {
  border-color: #e4e4e7;
}

.kb-tabbed-panel__code-input :deep(textarea),
.kb-tabbed-panel__code-input :deep(.n-input__textarea-el) {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 13px;
  line-height: 1.5;
  background-color: transparent !important;
}

.kb-tabbed-panel__footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.kb-tabbed-panel__lang {
  width: 140px;
}
</style>
