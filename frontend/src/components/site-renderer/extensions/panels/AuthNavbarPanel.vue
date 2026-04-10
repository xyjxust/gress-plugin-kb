<template>
  <div class="ext-panel">
    <div class="field">
      <div class="fl">显示位置</div>
      <select class="fi" :value="String(local.slotKey || 'navbar-trailing')" @change="set('slotKey', ($event.target as HTMLSelectElement).value)">
        <option value="navbar-trailing">导航栏右侧</option>
        <option value="content-top">正文顶部</option>
      </select>
    </div>
    <div class="field">
      <div class="fl">按钮文案</div>
      <input class="fi" :value="String(local.text || '')" placeholder="登录" @input="set('text', ($event.target as HTMLInputElement).value)" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{ options?: Record<string, any> }>()
const emit = defineEmits<{ 'update:options': [opts: Record<string, any>] }>()

const local = computed(() => props.options || {})

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

