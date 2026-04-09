<template>
  <footer v-if="config.visible" class="sr-footer">
    <span>{{ config.copyright }}</span>
    <div class="sr-footer__links">
      <a
        v-for="link in config.links"
        :key="link.label"
        class="sr-footer__link"
        :href="link.href || '#'"
        @click.prevent
      >
        {{ link.label }}
      </a>
    </div>
  </footer>
</template>

<script setup lang="ts">
import type { FooterConfig } from '../../../types/siteRenderer'

defineProps<{
  config: FooterConfig
}>()
</script>

<style scoped>
.sr-footer {
  border-top: 1px solid var(--border);
  padding: 24px 40px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 12px;
  color: var(--text3);
  font-family: var(--font-mono);
  flex-wrap: wrap;
  gap: 12px;
  background: var(--bg);
}
.sr-footer__links {
  display: flex;
  gap: 16px;
}
.sr-footer__link {
  color: var(--text3);
  text-decoration: none;
  cursor: pointer;
  transition: color 0.12s;
}
.sr-footer__link:hover {
  color: var(--text2);
}
</style>
