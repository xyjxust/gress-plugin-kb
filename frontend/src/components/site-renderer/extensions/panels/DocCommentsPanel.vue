<template>
  <div class="ext-panel">
    <div class="field">
      <div class="fl">显示位置</div>
      <select class="fi" :value="String(local.slotKey || 'content-bottom')" @change="set('slotKey', ($event.target as HTMLSelectElement).value)">
        <option value="content-bottom">正文下方</option>
        <option value="content-top">正文顶部</option>
      </select>
    </div>
    <div class="field">
      <div class="fl">标题</div>
      <input class="fi" :value="String(local.title || '')" placeholder="评论" @input="set('title', ($event.target as HTMLInputElement).value)" />
    </div>
    <div class="field">
      <div class="fl">提示文案</div>
      <input class="fi" :value="String(local.hint || '')" placeholder="你可以在这里接入评论服务…" @input="set('hint', ($event.target as HTMLInputElement).value)" />
    </div>
    <div class="toggle-row">
      <span class="fl" style="margin: 0">仅 KB 文档页显示</span>
      <div class="toggle" :class="{ on: !!local.onlyKbDoc }" @click="set('onlyKbDoc', !local.onlyKbDoc)" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{ options?: Record<string, any> }>()
const emit = defineEmits<{ 'update:options': [opts: Record<string, any>] }>()

const local = computed(() => ({ slotKey: 'content-bottom', onlyKbDoc: true, ...(props.options || {}) }))

function set(k: string, v: any) {
  emit('update:options', { ...(props.options || {}), [k]: v })
}
</script>

<style scoped>
.ext-panel {
  display: grid;
  gap: 10px;
}
.field {
  display: grid;
  gap: 6px;
}
.fl {
  font-size: 12px;
  color: var(--tx2, #64748b);
}
.fi {
  border: 1px solid var(--bd, #e2e8f0);
  border-radius: 8px;
  padding: 8px 10px;
  outline: none;
  font-size: 13px;
}
</style>

