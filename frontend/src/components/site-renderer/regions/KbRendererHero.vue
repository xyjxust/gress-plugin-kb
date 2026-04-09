<template>
  <section class="sr-hero">
    <!-- 径向渐变背景 -->
    <div class="sr-hero__bg" :style="heroBgStyle" />

    <div class="sr-hero__inner">
      <!-- Badge -->
      <div v-if="badgeText" class="sr-hero__badge">
        <span class="sr-hero__badge-dot" />
        {{ badgeText }}
      </div>

      <!-- 标题 -->
      <h1 class="sr-hero__title">{{ title }}</h1>

      <!-- 副标题 -->
      <p v-if="subtitle" class="sr-hero__sub">{{ subtitle }}</p>

      <!-- CTA 按钮 -->
      <div v-if="actions.length" class="sr-hero__actions">
        <button
          v-for="action in actions"
          :key="action.id"
          :class="action.type === 'primary' ? 'sr-btn-primary' : 'sr-btn-ghost'"
          @click="$emit('action-click', action)"
        >
          <span v-if="action.icon">{{ action.icon }}</span>
          {{ action.label }}
        </button>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { CTAAction } from '../../../types/siteRenderer'

const props = withDefaults(
  defineProps<{
    title: string
    subtitle?: string
    badgeText?: string
    actions?: CTAAction[]
    primary?: string
  }>(),
  {
    actions: () => [],
    primary: '#2563eb',
  }
)

defineEmits<{
  'action-click': [action: CTAAction]
}>()

const heroBgStyle = computed(() => ({
  background: `radial-gradient(ellipse 80% 60% at 50% 0%, color-mix(in srgb, ${props.primary} 8%, transparent), transparent)`,
}))
</script>

<style scoped>
.sr-hero {
  padding: 100px 48px 80px;
  text-align: center;
  position: relative;
  overflow: hidden;
}
.sr-hero__bg {
  position: absolute;
  inset: 0;
  pointer-events: none;
}
.sr-hero__inner {
  position: relative;
  z-index: 1;
}
.sr-hero__badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 5px 14px;
  border-radius: 20px;
  border: 1px solid var(--border2);
  font-size: 12px;
  color: var(--text2);
  margin-bottom: 28px;
  background: var(--surface);
  font-family: var(--font-mono);
}
.sr-hero__badge-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #22c55e;
}
.sr-hero__title {
  font-family: var(--font-serif);
  font-size: clamp(40px, 6vw, 72px);
  line-height: 1.1;
  letter-spacing: -2px;
  color: var(--text);
  margin-bottom: 24px;
  max-width: 800px;
  margin-left: auto;
  margin-right: auto;
}
.sr-hero__sub {
  font-size: 18px;
  color: var(--text2);
  max-width: 500px;
  margin: 0 auto 40px;
  line-height: 1.7;
}
.sr-hero__actions {
  display: flex;
  gap: 12px;
  justify-content: center;
  flex-wrap: wrap;
}

/* Shared button styles */
.sr-btn-primary {
  padding: 12px 28px;
  background: var(--primary);
  color: white;
  border: none;
  border-radius: var(--r);
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  font-family: var(--font-sans);
  transition: all 0.15s;
  display: flex;
  align-items: center;
  gap: 8px;
}
.sr-btn-primary:hover {
  opacity: 0.9;
  transform: translateY(-1px);
}
.sr-btn-ghost {
  padding: 12px 24px;
  background: var(--bg2);
  color: var(--text2);
  border: 1px solid var(--border);
  border-radius: var(--r);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  font-family: var(--font-sans);
  transition: all 0.15s;
  display: flex;
  align-items: center;
  gap: 6px;
}
.sr-btn-ghost:hover {
  border-color: var(--border2);
  color: var(--text);
}
</style>
