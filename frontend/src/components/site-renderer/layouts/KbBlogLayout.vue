<template>
  <div class="sr-layout-blog">
    <!-- Navbar -->
    <KbRendererNavbar
      :config="config.navbar"
      :primary="config.theme.primary"
      :active-nav-id="activeNavId"
      @nav-click="(item) => $emit('nav-click', item)"
      @search="$emit('search')"
    >
      <template #trailing>
        <KbRendererSlotOutlet
          v-if="hasNavbarTrailing && slotVisible['navbar-trailing'] !== false"
          :config="config"
          slot-key="navbar-trailing"
          :active-page-id="activePageId"
          :active-nav-id="activeNavId"
          :page="currentPage"
          @close="slotVisible['navbar-trailing'] = false"
        />
      </template>
    </KbRendererNavbar>

    <!-- content-top 插槽 -->
    <div v-if="hasContentTop && slotVisible['content-top'] !== false" class="sr-blog-slot-top">
      <KbRendererSlotOutlet
        :config="config"
        slot-key="content-top"
        :active-page-id="activePageId"
        :active-nav-id="activeNavId"
        :page="currentPage"
        @close="slotVisible['content-top'] = false"
      />
    </div>

    <!-- 博客正文 -->
    <main class="sr-blog-content">
      <header class="sr-blog-header">
        <span class="sr-blog-category">{{ currentPage?.category || '技术' }}</span>
        <h1 class="sr-blog-title">{{ currentPage?.title || '' }}</h1>
        <p v-if="currentPage?.description" class="sr-blog-subtitle">
          {{ currentPage.description }}
        </p>
        <div class="sr-blog-byline">
          <div class="sr-blog-avatar" :style="{ background: config.theme.primary }">
            {{ authorInitial }}
          </div>
          <span>{{ currentPage?.author || '匿名作者' }}</span>
          <span>&middot;</span>
          <span>{{ currentPage?.updatedAt || '' }}</span>
          <span>&middot;</span>
          <span>{{ currentPage?.readTime || 0 }} 分钟</span>
        </div>
      </header>

      <!-- Hero 图 -->
      <div class="sr-blog-hero">{{ currentPage?.heroEmoji || '✍️' }}</div>

      <!-- 正文 HTML -->
      <div v-if="currentPage?.html" class="sr-blog-body" v-html="currentPage.html" />

      <div v-if="hasContentBottom && slotVisible['content-bottom'] !== false" class="sr-blog-slot-bottom">
        <KbRendererSlotOutlet
          :config="config"
          slot-key="content-bottom"
          :active-page-id="activePageId"
          :active-nav-id="activeNavId"
          :page="currentPage"
          @close="slotVisible['content-bottom'] = false"
        />
      </div>
    </main>

    <!-- Footer -->
    <KbRendererFooter :config="config.footer" />
  </div>
</template>

<script setup lang="ts">
import { computed, reactive } from 'vue'
import type { SiteRendererConfig } from '../../../types/siteRenderer'
import KbRendererNavbar from '../regions/KbRendererNavbar.vue'
import KbRendererFooter from '../regions/KbRendererFooter.vue'
import KbRendererSlotOutlet from '../KbRendererSlotOutlet.vue'

const props = defineProps<{
  config: SiteRendererConfig
  activePageId: string
  activeNavId?: string
}>()

defineEmits<{
  'nav-click': [item: any]
  search: []
}>()

const slotVisible = reactive<Record<string, boolean>>({})

const currentPage = computed(() => props.config.pages[props.activePageId] || null)
const hasContentTop = computed(() => (props.config.slots as any)['content-top'] != null || !!props.config.extensions?.length)
const hasContentBottom = computed(() => (props.config.slots as any)['content-bottom'] != null || !!props.config.extensions?.length)
const hasNavbarTrailing = computed(() => (props.config.slots as any)['navbar-trailing'] != null || !!props.config.extensions?.length)

const authorInitial = computed(() =>
  (currentPage.value?.author || '匿名').charAt(0)
)
</script>

<style scoped>
.sr-layout-blog {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}
.sr-blog-slot-top {
  border-bottom: 1px solid var(--border);
}
.sr-blog-slot-bottom {
  margin-top: 28px;
}

/* Blog content */
.sr-blog-content {
  max-width: 720px;
  margin: 0 auto;
  padding: 64px 24px;
  flex: 1;
}
.sr-blog-header {
  margin-bottom: 48px;
  text-align: center;
}
.sr-blog-category {
  display: inline-block;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 1px;
  text-transform: uppercase;
  color: var(--primary-text);
  background: var(--primary-light);
  padding: 3px 10px;
  border-radius: 20px;
  margin-bottom: 20px;
  font-family: var(--font-mono);
}
.sr-blog-title {
  font-family: var(--font-serif);
  font-size: 46px;
  line-height: 1.15;
  letter-spacing: -1px;
  color: var(--text);
  margin-bottom: 20px;
  font-style: italic;
}
.sr-blog-subtitle {
  font-size: 18px;
  color: var(--text2);
  line-height: 1.6;
  margin-bottom: 28px;
}
.sr-blog-byline {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  font-size: 13px;
  color: var(--text3);
}
.sr-blog-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  color: white;
  font-weight: 600;
}
.sr-blog-hero {
  width: 100%;
  height: 360px;
  border-radius: var(--r2);
  object-fit: cover;
  margin-bottom: 48px;
  background: linear-gradient(135deg, var(--bg3), var(--bg2));
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 48px;
  border: 1px solid var(--border);
}

/* Blog body prose */
.sr-blog-body {
  font-size: 16px;
  line-height: 1.85;
  color: var(--text2);
}
.sr-blog-body :deep(h2) {
  font-family: var(--font-serif);
  font-size: 28px;
  font-weight: 400;
  color: var(--text);
  margin: 48px 0 16px;
  letter-spacing: -0.3px;
}
.sr-blog-body :deep(p) {
  margin-bottom: 24px;
}
</style>
