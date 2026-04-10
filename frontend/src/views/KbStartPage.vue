<template>
  <div class="kb-start-page">
    <div class="kb-start-hero">
      <div class="kb-start-badge">{{ badge }}</div>
      <h1 class="kb-start-title">{{ title }}</h1>
      <p class="kb-start-subtitle">{{ subtitle }}</p>
      <div class="kb-start-actions">
        <a class="kb-start-btn kb-start-btn--primary" :href="primaryHref" @click.prevent="go(primaryHref)">
          {{ primaryText }}
        </a>
        <a class="kb-start-btn" :href="secondaryHref" @click.prevent="go(secondaryHref)">
          {{ secondaryText }}
        </a>
      </div>
    </div>

    <div class="kb-start-grid">
      <div v-for="f in features" :key="f.name" class="kb-start-card">
        <div class="kb-start-card__icon">{{ f.icon }}</div>
        <div class="kb-start-card__name">{{ f.name }}</div>
        <div class="kb-start-card__desc">{{ f.desc }}</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
type Feature = { icon: string; name: string; desc: string }

const props = withDefaults(
  defineProps<{
    title?: string
    subtitle?: string
    badge?: string
    primaryText?: string
    primaryHref?: string
    secondaryText?: string
    secondaryHref?: string
    features?: Feature[]
  }>(),
  {
    badge: 'START',
    title: '开始使用',
    subtitle: '这是一个“页面组件文档”的示例开始页，可用于承载复杂交互而不依赖编辑器 HTML。',
    primaryText: '打开文档列表',
    primaryHref: '/plugins/kb/docs',
    secondaryText: '打开站点构建器',
    secondaryHref: '/plugins/kb/site-visual-builder',
    features: () => [
      { icon: '🧩', name: '组件文档', desc: '用 Vue 组件渲染页面，适合列表/表单/仪表盘等复杂页。' },
      { icon: '🧱', name: 'Slot + Extension', desc: '通过稳定插槽位扩展登录、评论、公告、埋点等能力。' },
      { icon: '🎛️', name: '可配置', desc: '通过共享 registry 配置面板，让插件自带配置 UI。' },
    ],
  }
)

function go(href: string) {
  if (!href) return
  // 站点访问/预览场景下用单页路由
  if (typeof window !== 'undefined') window.location.href = href
}
</script>

<style scoped>
.kb-start-page {
  width: 100%;
  padding: 24px 0 18px;
}
.kb-start-hero {
  border: 1px solid var(--border, #e2e8f0);
  background: var(--surface, #fff);
  border-radius: 16px;
  padding: 22px 22px 18px;
  box-shadow: var(--shadow, 0 1px 3px rgba(0,0,0,0.08));
}
.kb-start-badge {
  display: inline-block;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.6px;
  padding: 4px 10px;
  border-radius: 999px;
  background: var(--primary-light, #f5f3ff);
  color: var(--primary-text, #6d28d9);
  font-family: var(--font-mono, ui-monospace, monospace);
}
.kb-start-title {
  margin: 12px 0 8px;
  font-size: 34px;
  line-height: 1.2;
  letter-spacing: -0.7px;
  color: var(--text, #0f172a);
  font-family: var(--font-serif, ui-serif, Georgia, serif);
  font-weight: 500;
}
.kb-start-subtitle {
  margin: 0;
  color: var(--text2, #475569);
  line-height: 1.7;
  font-size: 14px;
  max-width: 820px;
}
.kb-start-actions {
  margin-top: 14px;
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}
.kb-start-btn {
  height: 36px;
  padding: 0 14px;
  border-radius: 10px;
  border: 1px solid var(--border, #e2e8f0);
  background: var(--bg2, #fff);
  color: var(--text, #0f172a);
  display: inline-flex;
  align-items: center;
  text-decoration: none;
  font-size: 13px;
  cursor: pointer;
}
.kb-start-btn:hover {
  border-color: var(--border2, #cbd5e1);
}
.kb-start-btn--primary {
  border-color: transparent;
  background: var(--primary, #7c3aed);
  color: #fff;
}
.kb-start-btn--primary:hover {
  filter: brightness(0.98);
}

.kb-start-grid {
  margin-top: 14px;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}
.kb-start-card {
  border: 1px solid var(--border, #e2e8f0);
  background: var(--surface, #fff);
  border-radius: 14px;
  padding: 14px 14px 12px;
}
.kb-start-card__icon {
  font-size: 18px;
}
.kb-start-card__name {
  margin-top: 8px;
  font-weight: 600;
  color: var(--text, #0f172a);
  font-size: 13px;
}
.kb-start-card__desc {
  margin-top: 4px;
  color: var(--text2, #475569);
  font-size: 12px;
  line-height: 1.6;
}

@media (max-width: 840px) {
  .kb-start-grid {
    grid-template-columns: 1fr;
  }
}
</style>

