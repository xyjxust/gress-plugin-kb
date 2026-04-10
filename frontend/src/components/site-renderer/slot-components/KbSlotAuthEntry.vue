<template>
  <button class="sr-auth-entry" type="button" @click="onClick">
    {{ text }}
  </button>
</template>

<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    text?: string
  }>(),
  {
    text: '登录',
  }
)

function onClick() {
  // 这里只做占位：真正登录可由宿主或后续扩展接管（弹窗/跳转/SSO）
  window.alert('登录功能待接入')
}
</script>

<style scoped>
.sr-auth-entry {
  height: 34px;
  padding: 0 12px;
  border-radius: 999px;
  border: 1px solid var(--border);
  background: var(--surface);
  color: var(--text);
  font-size: 13px;
  cursor: pointer;
}
.sr-auth-entry:hover {
  border-color: var(--border2);
}
</style>

