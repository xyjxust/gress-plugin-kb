<template>
  <section class="sr-features">
    <div v-if="label" class="sr-features__label">{{ label }}</div>
    <h2 v-if="title" class="sr-features__title">{{ title }}</h2>
    <div class="sr-features__grid">
      <div v-for="(f, idx) in features" :key="idx" class="sr-features__card">
        <div class="sr-features__icon" :style="{ background: f.color || '#f0f9ff' }">
          {{ f.icon }}
        </div>
        <div class="sr-features__name">{{ f.name }}</div>
        <div class="sr-features__desc">{{ f.desc }}</div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import type { FeatureItem } from '../../../types/siteRenderer'

withDefaults(
  defineProps<{
    label?: string
    title?: string
    features: FeatureItem[]
  }>(),
  {
    label: '核心功能',
    title: '',
  }
)
</script>

<style scoped>
.sr-features {
  padding: 80px 48px;
  background: var(--bg2);
  border-top: 1px solid var(--border);
  border-bottom: 1px solid var(--border);
}
.sr-features__label {
  text-align: center;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 1.5px;
  text-transform: uppercase;
  color: var(--text3);
  font-family: var(--font-mono);
  margin-bottom: 16px;
}
.sr-features__title {
  text-align: center;
  font-family: var(--font-serif);
  font-size: 36px;
  color: var(--text);
  margin-bottom: 48px;
  letter-spacing: -0.5px;
}
.sr-features__grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 20px;
  max-width: 1000px;
  margin: 0 auto;
}
.sr-features__card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--r2);
  padding: 24px;
  transition: all 0.2s;
}
.sr-features__card:hover {
  border-color: var(--border2);
  box-shadow: var(--shadow2);
  transform: translateY(-2px);
}
.sr-features__icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  margin-bottom: 14px;
}
.sr-features__name {
  font-size: 15px;
  font-weight: 600;
  color: var(--text);
  margin-bottom: 8px;
}
.sr-features__desc {
  font-size: 13px;
  color: var(--text2);
  line-height: 1.6;
}
</style>
