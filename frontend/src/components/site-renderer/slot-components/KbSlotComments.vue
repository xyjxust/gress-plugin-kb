<template>
  <section class="sr-comments">
    <div class="sr-comments__head">
      <div class="sr-comments__title">{{ title }}</div>
      <div class="sr-comments__hint">{{ hint }}</div>
    </div>
    <div class="sr-comments__box">
      <div class="sr-comments__empty">评论功能待接入（示例扩展位）</div>
    </div>
  </section>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    title?: string
    hint?: string
  }>(),
  {
    title: '评论',
    hint: '你可以在这里接入企业 IM / GitHub Discussion / 自建评论服务等',
  }
)
</script>

<style scoped>
.sr-comments {
  border: 1px solid var(--border);
  background: var(--surface);
  border-radius: var(--r2);
  padding: 14px 14px 16px;
  box-shadow: var(--shadow);
}
.sr-comments__head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 10px;
}
.sr-comments__title {
  font-size: 14px;
  font-weight: 600;
  color: var(--text);
}
.sr-comments__hint {
  font-size: 12px;
  color: var(--text3);
}
.sr-comments__box {
  border-top: 1px dashed var(--border);
  padding-top: 12px;
}
.sr-comments__empty {
  font-size: 13px;
  color: var(--text2);
}
</style>

