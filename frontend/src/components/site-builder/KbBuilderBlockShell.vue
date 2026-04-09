<template>
  <div
    class="kb-builder-block-shell"
    :class="[
      `kb-builder-block-shell--${variant}`,
      { 'is-selected': selected, 'kb-builder-block-shell--sticky': sticky }
    ]"
    :style="shellStyle"
    draggable="true"
    @click.stop="emit('select')"
    @dragstart="emit('dragstart')"
    @dragend="emit('dragend')"
  >
    <div class="kb-block-actions">
      <n-button size="tiny" secondary round @click.stop="emit('open-inspector')">配置</n-button>
      <n-button size="tiny" secondary round @click.stop="emit('remove')">删除</n-button>
    </div>
    <slot />
  </div>
</template>

<script setup lang="ts">
import { computed, type CSSProperties } from 'vue'

const props = defineProps<{
  variant: string
  selected: boolean
  sticky?: boolean
  stickyTop?: number
  blockStyle?: CSSProperties
}>()

const emit = defineEmits<{
  select: []
  'open-inspector': []
  remove: []
  dragstart: []
  dragend: []
}>()

const shellStyle = computed<CSSProperties>(() => ({
  ...(props.blockStyle || {}),
  ...(props.sticky ? { top: `${props.stickyTop ?? 0}px` } : {})
}))
</script>

<style scoped>
.kb-builder-block-shell {
  position: relative;
  border: 1px solid var(--kb-block-border);
  background: var(--kb-block-surface);
  box-shadow: var(--kb-block-shadow);
  transition: border-color .16s ease, box-shadow .16s ease;
}

.kb-builder-block-shell:hover {
  border-color: var(--kb-block-hover-border);
}

.kb-builder-block-shell.is-selected {
  border-color: var(--kb-block-selected-border);
  box-shadow: var(--kb-block-selected-ring), var(--kb-block-shadow);
}

.kb-builder-block-shell--sticky {
  position: sticky;
  z-index: 4;
}

.kb-block-actions {
  position: absolute;
  top: 10px;
  right: 8px;
  display: flex;
  align-items: center;
  gap: 8px;
  opacity: 0;
  transition: opacity .16s ease;
}

.kb-builder-block-shell:hover .kb-block-actions,
.kb-builder-block-shell.is-selected .kb-block-actions {
  opacity: 1;
}

</style>
