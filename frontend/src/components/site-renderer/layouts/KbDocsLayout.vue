<template>
  <div class="sr-layout-docs">
    <!-- Navbar -->
    <KbRendererNavbar
      :config="config.navbar"
      :primary="config.theme.primary"
      :active-nav-id="activeNavId"
      :style="config.navbar.style"
      @brand-click="$emit('brand-click')"
      @nav-click="(item) => $emit('nav-click', item)"
      @search="$emit('search')"
    >
      <template #trailing>
        <button class="sr-mobile-icon" @click="toggleMobileNav">⋯</button>
        <button
          v-if="hasSidebarTree && config.sidebar.collapsible"
          class="sr-sidebar-toggle"
          @click="sidebarOpen = !sidebarOpen"
        >
          {{ sidebarOpen ? '◧' : '▣' }}
        </button>
      </template>
    </KbRendererNavbar>

    <div v-if="showMobileToolbar" class="sr-mobile-toolbar">
      <button v-if="hasSidebarTree" class="sr-mobile-toolbar-btn" @click="mobileSidebarOpen = true">☰ Menu</button>
      <button v-if="showMobileTocButton" class="sr-mobile-toolbar-btn" @click="mobileTocOpen = true">ON THIS PAGE ›</button>
    </div>

    <div v-if="mobileNavOpen" class="sr-mobile-mask sr-mobile-mask--nav" @click="mobileNavOpen = false">
      <div class="sr-mobile-nav-full" @click.stop>
        <div class="sr-mobile-nav-full__header">
          <div class="sr-mobile-nav-full__brand">
            <span class="sr-mobile-nav-full__brand-mark">◆</span>
            <span class="sr-mobile-nav-full__brand-name">{{ config.navbar.brand }}</span>
          </div>
          <div class="sr-mobile-nav-full__ops">
            <button
              v-if="showMobileSearch"
              class="sr-mobile-nav-full__op"
              aria-label="search"
              @click="$emit('search')"
            >
              ⌕
            </button>
            <button class="sr-mobile-nav-full__op" aria-label="close" @click="mobileNavOpen = false">⋯</button>
          </div>
        </div>

        <div class="sr-mobile-nav-full__menu">
          <template v-for="item in config.navbar.links" :key="item.id">
            <div v-if="item.type === 'dropdown' && item.children?.length" class="sr-mobile-nav-full__group">
              <div class="sr-mobile-nav-full__group-label">{{ item.label }}</div>
              <a
                v-for="ch in item.children"
                :key="ch.id"
                class="sr-mobile-nav-full__item sr-mobile-nav-full__item--sub"
                :href="ch.href || '#'"
                @click.prevent="onMobileNavClick(ch)"
              >
                {{ ch.label }}
              </a>
            </div>
            <a
              v-else
              class="sr-mobile-nav-full__item"
              :href="item.href || '#'"
              @click.prevent="onMobileNavClick(item)"
            >
              {{ item.label }}
            </a>
          </template>
        </div>

        <div v-if="showMobileNavFooter" class="sr-mobile-nav-full__footer">
          <a
            v-if="mobileGithubHref"
            class="sr-mobile-nav-full__github"
            :href="mobileGithubHref"
            @click.prevent
          >
            ◔
          </a>
        </div>
      </div>
    </div>

    <div v-if="mobileSidebarOpen" class="sr-mobile-mask" @click="mobileSidebarOpen = false">
      <div class="sr-mobile-sidebar-sheet" @click.stop>
        <KbRendererSidebar
          :config="config.sidebar"
          :open="true"
          :active-page-id="activePageId"
          @page-select="onMobileSidebarPageSelect"
          @unbound-click="(label) => emit('sidebar-unbound-click', label)"
        >
          <template #sidebar-top>
            <KbRendererSlot
              v-if="sidebarTopSlot && slotVisible['sidebar-top'] !== false"
              :instance="sidebarTopSlot"
              @close="slotVisible['sidebar-top'] = false"
            />
          </template>
        </KbRendererSidebar>
      </div>
    </div>

    <div v-if="mobileTocOpen" class="sr-mobile-mask" @click="mobileTocOpen = false">
      <div class="sr-mobile-toc-sheet" @click.stop>
        <KbRendererToc
          v-if="config.content.showToc && currentPage?.toc?.length"
          :items="currentPage.toc"
          @toc-click="onMobileTocClick"
        />
      </div>
    </div>

    <!-- Body -->
    <div class="sr-docs-body">
      <!-- Sidebar：无菜单树时不占列（含桌面侧栏插槽） -->
      <div v-if="hasSidebarTree" class="sr-docs-sidebar-desktop">
        <KbRendererSidebar
          :config="config.sidebar"
          :open="sidebarOpen"
          :active-page-id="activePageId"
          @page-select="(id) => $emit('page-select', id)"
          @unbound-click="(label) => $emit('sidebar-unbound-click', label)"
        >
          <template #sidebar-top>
            <KbRendererSlot
              v-if="sidebarTopSlot && slotVisible['sidebar-top'] !== false"
              :instance="sidebarTopSlot"
              @close="slotVisible['sidebar-top'] = false"
            />
          </template>
        </KbRendererSidebar>
      </div>

      <!-- Content area：正文区滚动；页脚在滚动区内用 flex 贴底（内容少时贴视口底，多时跟在文末） -->
      <main class="sr-docs-content">
        <!-- content-top 插槽 -->
        <div
          v-if="contentTopSlot && slotVisible['content-top'] !== false"
          class="sr-docs-content-slot-top"
        >
          <KbRendererSlot :instance="contentTopSlot" @close="slotVisible['content-top'] = false" />
        </div>

        <div class="sr-docs-content-scroll">
          <div class="sr-docs-content-scroll-inner">
            <transition name="sr-fade" mode="out-in">
              <div
                class="sr-docs-page"
                :class="{ wide: config.content.maxWidth === '100%' }"
                :key="activePageId"
              >
                <KbRendererContent :page="currentPage" />

                <!-- TOC -->
                <KbRendererToc
                  v-if="config.content.showToc && currentPage?.toc?.length"
                  :items="currentPage.toc"
                  @toc-click="(item) => $emit('toc-click', item)"
                />
              </div>
            </transition>

            <div v-if="config.footer.visible" class="sr-docs-footer-wrap">
              <KbRendererFooter :config="config.footer" />
            </div>
          </div>
        </div>
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive, watch } from 'vue'
import type { SiteRendererConfig } from '../../../types/siteRenderer'
import { tryOpenNavbarExternalLink } from '../../../utils/siteRenderer'
import KbRendererNavbar from '../regions/KbRendererNavbar.vue'
import KbRendererSidebar from '../regions/KbRendererSidebar.vue'
import KbRendererContent from '../regions/KbRendererContent.vue'
import KbRendererToc from '../regions/KbRendererToc.vue'
import KbRendererFooter from '../regions/KbRendererFooter.vue'
import KbRendererSlot from '../KbRendererSlot.vue'

const props = defineProps<{
  config: SiteRendererConfig
  activePageId: string
  activeNavId?: string
}>()

const emit = defineEmits<{
  'brand-click': []
  'page-select': [id: string]
  'nav-click': [item: any]
  'toc-click': [item: any]
  'sidebar-unbound-click': [label: string]
  search: []
}>()

const sidebarOpen = ref(!(props.config.sidebar.defaultCollapsed ?? false))
const mobileNavOpen = ref(false)
const mobileSidebarOpen = ref(false)
const mobileTocOpen = ref(false)
const slotVisible = reactive<Record<string, boolean>>({})

const currentPage = computed(() => props.config.pages[props.activePageId] || null)
const showMobileSearch = computed(() => props.config.navbar.showSearch)
const mobileGithubHref = computed(() => {
  const link = props.config.footer.links.find((l) => /github/i.test(l.label))
  return link?.href || ''
})
const showMobileNavFooter = computed(() => Boolean(mobileGithubHref.value))

const sidebarTopSlot = computed(() => props.config.slots['sidebar-top'] || null)
const contentTopSlot = computed(() => props.config.slots['content-top'] || null)

/** 至少有一个分组且含菜单节点时才显示侧栏列 */
const hasSidebarTree = computed(() => {
  const tree = props.config.sidebar.tree
  if (!tree?.length) return false
  return tree.some((sec) => (sec.children?.length ?? 0) > 0)
})

const showMobileTocButton = computed(
  () => props.config.content.showToc && !!(currentPage.value?.toc?.length)
)

const showMobileToolbar = computed(() => hasSidebarTree.value || showMobileTocButton.value)

watch(hasSidebarTree, (v) => {
  if (!v) mobileSidebarOpen.value = false
})

function onMobileNavClick(item: any) {
  mobileNavOpen.value = false
  tryOpenNavbarExternalLink(item)
  emit('nav-click', item)
}

function onMobileSidebarPageSelect(id: string) {
  mobileSidebarOpen.value = false
  emit('page-select', id)
}

function onMobileTocClick(item: any) {
  mobileTocOpen.value = false
  emit('toc-click', item)
}

function toggleMobileNav() {
  const next = !mobileNavOpen.value
  mobileNavOpen.value = next
  if (next) {
    mobileSidebarOpen.value = false
    mobileTocOpen.value = false
  }
}
</script>

<style scoped>
.sr-layout-docs {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
  overflow: hidden;
}

.sr-layout-docs :deep(.sr-navbar) {
  flex-shrink: 0;
}

.sr-mobile-toolbar {
  flex-shrink: 0;
}

.sr-docs-body {
  display: flex;
  flex: 1;
  min-height: 0;
  overflow: hidden;
}

.sr-docs-sidebar-desktop {
  flex-shrink: 0;
  align-self: stretch;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* 侧栏在固定高度容器内占满并自行滚动，避免依赖 100vh */
.sr-docs-sidebar-desktop :deep(.sr-sidebar) {
  position: relative;
  top: 0;
  height: 100%;
  max-height: none;
  min-height: 0;
  flex: 1 1 auto;
}

.sr-docs-content {
  flex: 1;
  min-width: 0;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  /* 内容区用页面底色 */
  background: var(--bg);
}
.sr-docs-content-slot-top {
  flex-shrink: 0;
  border-bottom: 1px solid var(--border);
  background: var(--surface);
}

.sr-docs-content-scroll {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  overflow-x: hidden;
}

/* 至少占满滚动视口高度，正文 flex 伸展，页脚落在底部空白之上 */
.sr-docs-content-scroll-inner {
  display: flex;
  flex-direction: column;
  min-height: 100%;
  box-sizing: border-box;
}

.sr-docs-footer-wrap {
  flex-shrink: 0;
  margin-top: auto;
}

.sr-docs-page {
  flex: 1 1 auto;
  display: flex;
  justify-content: center;
  align-items: flex-start;
  padding: 48px 40px;
}
.sr-docs-page.wide {
  padding: 48px 24px;
}
.sr-docs-page.wide :deep(.sr-content) {
  max-width: 100%;
}
.sr-docs-page :deep(.sr-content) {
  flex: 1;
  min-width: 0;
  max-width: 760px;
}

/* Sidebar toggle */
.sr-sidebar-toggle {
  width: 28px;
  height: 28px;
  border-radius: 6px;
  border: 1px solid var(--border);
  background: var(--bg2);
  color: var(--text2);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  margin-left: 8px;
  transition: all 0.12s;
  flex-shrink: 0;
}
.sr-sidebar-toggle:hover {
  border-color: var(--border2);
  color: var(--text);
}

.sr-mobile-icon,
.sr-mobile-toolbar,
.sr-mobile-mask {
  display: none;
}

.sr-mobile-icon {
  width: 30px;
  height: 30px;
  border-radius: 8px;
  border: 1px solid var(--border);
  background: var(--bg2);
  color: var(--text2);
  margin-left: 6px;
}

.sr-mobile-toolbar {
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  height: 42px;
  padding: 0 12px;
  border-bottom: 1px solid var(--border);
  background: var(--surface);
}
.sr-mobile-toolbar-btn {
  border: none;
  background: transparent;
  color: var(--text2);
  font-size: 13px;
  padding: 0;
}

.sr-mobile-nav-full {
  width: 100%;
  height: 100%;
  background: var(--surface);
  color: var(--text);
  display: flex;
  flex-direction: column;
}
.sr-mobile-nav-full__header {
  height: 60px;
  padding: 0 14px;
  border-bottom: 1px solid var(--border);
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.sr-mobile-nav-full__brand {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 15px;
  font-weight: 600;
}
.sr-mobile-nav-full__brand-mark {
  font-size: 14px;
}
.sr-mobile-nav-full__ops {
  display: flex;
  gap: 8px;
}
.sr-mobile-nav-full__op {
  width: 28px;
  height: 28px;
  border: none;
  border-radius: 8px;
  background: transparent;
  color: var(--text2);
  font-size: 20px;
  line-height: 1;
}
.sr-mobile-nav-full__menu {
  width: min(260px, 70vw);
  margin: 58px auto 0;
}
.sr-mobile-nav-full__group {
  margin-bottom: 8px;
}
.sr-mobile-nav-full__group-label {
  padding: 10px 8px 4px;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--text3);
}
.sr-mobile-nav-full__item {
  height: 62px;
  border-bottom: 1px solid var(--border);
  color: var(--text);
  text-decoration: none;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
  font-weight: 600;
  letter-spacing: 0.2px;
}
.sr-mobile-nav-full__item--sub {
  height: 48px;
  font-size: 17px;
  font-weight: 500;
  color: var(--text2);
}
.sr-mobile-nav-full__footer {
  margin-top: 22px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  color: var(--text2);
}
.sr-mobile-nav-full__github {
  margin-top: 4px;
  color: inherit;
  text-decoration: none;
  font-size: 24px;
}

.sr-mobile-mask {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.4);
  z-index: 400;
}
.sr-mobile-mask--nav {
  background: var(--surface);
}
.sr-mobile-sidebar-sheet {
  width: min(340px, 88vw);
  height: 100%;
  min-height: 0;
  display: flex;
  flex-direction: column;
  background: var(--surface);
  border-right: 1px solid var(--border);
}
.sr-mobile-sidebar-sheet :deep(.sr-sidebar) {
  position: static;
  top: 0;
  height: 100%;
  min-height: 0;
  flex: 1 1 auto;
  width: 100% !important;
  border-right: none;
}
.sr-mobile-toc-sheet {
  margin-left: auto;
  width: min(280px, 78vw);
  height: 100%;
  background: var(--surface);
  border-left: 1px solid var(--border);
  padding: 12px;
}
.sr-mobile-toc-sheet :deep(.sr-toc) {
  width: 100%;
  margin-left: 0;
  position: static;
  max-height: none;
}

@container sr-root (max-width: 980px) {
  .sr-mobile-icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }
  .sr-sidebar-toggle {
    display: none;
  }
  .sr-mobile-toolbar,
  .sr-mobile-mask {
    display: flex;
  }
  .sr-docs-sidebar-desktop {
    display: none;
  }
  .sr-docs-page,
  .sr-docs-page.wide {
    padding: 18px 14px 28px;
  }
  .sr-docs-page :deep(.sr-toc) {
    display: none;
  }
}

/* 构建器强制桌面/平板：禁用手机工具条和抽屉，恢复侧栏与 TOC */
:global(.sr-renderer-root.sr-force-desktop) .sr-mobile-icon,
:global(.sr-renderer-root.sr-force-desktop) .sr-mobile-toolbar,
:global(.sr-renderer-root.sr-force-desktop) .sr-mobile-mask {
  display: none !important;
}
:global(.sr-renderer-root.sr-force-desktop) .sr-docs-sidebar-desktop {
  display: block !important;
}
:global(.sr-renderer-root.sr-force-desktop) .sr-sidebar-toggle {
  display: flex !important;
}
:global(.sr-renderer-root.sr-force-desktop) .sr-docs-page,
:global(.sr-renderer-root.sr-force-desktop) .sr-docs-page.wide {
  padding: 48px 40px;
}
:global(.sr-renderer-root.sr-force-desktop) .sr-docs-page.wide {
  padding: 48px 24px;
}
:global(.sr-renderer-root.sr-force-desktop) .sr-docs-page :deep(.sr-toc) {
  display: block;
}

/* 构建器强制手机：即使容器宽也走手机工具条与抽屉 */
:global(.sr-renderer-root.sr-force-mobile) .sr-mobile-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
:global(.sr-renderer-root.sr-force-mobile) .sr-sidebar-toggle {
  display: none;
}
:global(.sr-renderer-root.sr-force-mobile) .sr-mobile-toolbar,
:global(.sr-renderer-root.sr-force-mobile) .sr-mobile-mask {
  display: flex;
}
:global(.sr-renderer-root.sr-force-mobile) .sr-docs-sidebar-desktop {
  display: none;
}
:global(.sr-renderer-root.sr-force-mobile) .sr-docs-page,
:global(.sr-renderer-root.sr-force-mobile) .sr-docs-page.wide {
  padding: 18px 14px 28px;
}
:global(.sr-renderer-root.sr-force-mobile) .sr-docs-page :deep(.sr-toc) {
  display: none;
}

/* Transition */
.sr-fade-enter-active,
.sr-fade-leave-active {
  transition: opacity 0.2s, transform 0.2s;
}
.sr-fade-enter-from {
  opacity: 0;
  transform: translateY(8px);
}
.sr-fade-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}
</style>
