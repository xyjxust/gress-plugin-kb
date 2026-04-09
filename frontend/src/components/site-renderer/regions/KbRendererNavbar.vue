<template>
  <nav ref="navRoot" class="sr-navbar" :class="['style-' + style]">
    <a class="sr-navbar__brand" :href="config.brandHref || '#'" @click.prevent="emit('brand-click')">
      <div class="sr-navbar__logo" :style="{ background: primary }">
        {{ brandInitial }}
      </div>
      <span class="sr-navbar__name">{{ config.brand }}</span>
    </a>

    <div class="sr-navbar__links">
      <template v-for="item in config.links" :key="item.id">
        <div
          v-if="item.type === 'dropdown' && item.children?.length"
          class="sr-navbar__dropdown"
          :class="{ open: openDropdownId === item.id, active: isDropdownActive(item) }"
        >
          <button
            type="button"
            class="sr-navbar__link sr-navbar__dropdown-trigger"
            @click.stop="toggleDropdown(item.id)"
          >
            <span v-if="item.icon" class="sr-navbar__link-icon">{{ item.icon }}</span>
            {{ item.label }}
            <span class="sr-navbar__chev" aria-hidden="true" />
          </button>
          <!-- padding-top 作为悬停桥梁，避免鼠标经过缝隙时菜单消失 -->
          <div class="sr-navbar__dropdown-pop">
            <div class="sr-navbar__dropdown-panel" role="menu">
              <a
                v-for="ch in item.children"
                :key="ch.id"
                class="sr-navbar__dropdown-item"
                :class="{ active: ch.id === activeNavId, 'is-external': ch.type === 'external' }"
                :href="ch.href || '#'"
                role="menuitem"
                @click.prevent="onChildNavClick(item, ch)"
              >
                <span v-if="ch.icon" class="sr-navbar__link-icon">{{ ch.icon }}</span>
                <span class="sr-navbar__dropdown-item-text">{{ ch.label }}</span>
                <span v-if="ch.type === 'external'" class="sr-navbar__ext-ico" title="外部链接" aria-hidden="true">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                    <polyline points="15 3 21 3 21 9" />
                    <line x1="10" y1="14" x2="21" y2="3" />
                  </svg>
                </span>
              </a>
            </div>
          </div>
        </div>
        <a
          v-else
          class="sr-navbar__link"
          :class="{ active: item.id === activeNavId }"
          :href="item.href || '#'"
          @click.prevent="onNavLinkClick(item)"
        >
          <span v-if="item.icon" class="sr-navbar__link-icon">{{ item.icon }}</span>
          {{ item.label }}
        </a>
      </template>
    </div>

    <div v-if="config.showSearch" class="sr-navbar__search" @click="$emit('search')">
      <span class="sr-navbar__search-icon">&#x1F50D;</span>
      <span>搜索文档...</span>
      <kbd class="sr-navbar__kbd">&#8984;K</kbd>
    </div>

    <slot name="trailing" />
  </nav>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted } from 'vue'
import type { NavbarConfig, NavbarStyle, NavbarLinkItem, NavbarSubLinkItem } from '../../../types/siteRenderer'
import { tryOpenNavbarExternalLink } from '../../../utils/siteRenderer'

const props = withDefaults(
  defineProps<{
    config: NavbarConfig
    primary?: string
    activeNavId?: string
    style?: NavbarStyle
  }>(),
  {
    primary: '#2563eb',
    activeNavId: '',
    style: 'solid',
  }
)

const emit = defineEmits<{
  'brand-click': []
  'nav-click': [item: any]
  search: []
}>()

const navRoot = ref<HTMLElement | null>(null)
const openDropdownId = ref<string | null>(null)

function isDropdownActive(item: NavbarLinkItem) {
  return item.id === props.activeNavId || item.children?.some((c) => c.id === props.activeNavId)
}

function toggleDropdown(id: string) {
  openDropdownId.value = openDropdownId.value === id ? null : id
}

function onNavLinkClick(item: NavbarLinkItem) {
  tryOpenNavbarExternalLink(item)
  emit('nav-click', item)
}

function onChildNavClick(parent: NavbarLinkItem, ch: NavbarSubLinkItem) {
  openDropdownId.value = null
  tryOpenNavbarExternalLink(ch)
  emit('nav-click', { ...ch, _parentNavId: parent.id })
}

function onDocClick(e: MouseEvent) {
  if (!openDropdownId.value) return
  const el = e.target as HTMLElement | null
  if (!el || !navRoot.value?.contains(el)) {
    openDropdownId.value = null
    return
  }
  if (!el.closest('.sr-navbar__dropdown.open')) openDropdownId.value = null
}

onMounted(() => document.addEventListener('click', onDocClick))
onUnmounted(() => document.removeEventListener('click', onDocClick))

const brandInitial = computed(() => (props.config.brand || 'S').charAt(0))
</script>

<style scoped>
.sr-navbar {
  position: sticky;
  top: 0;
  z-index: 100;
  height: var(--navbar-h, 60px);
  display: flex;
  align-items: center;
  padding: 0 24px;
  border-bottom: 1px solid var(--border);
  background: var(--surface);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  transition: background 0.3s, border-color 0.3s;
}
.sr-navbar.style-blur {
  background: color-mix(in srgb, var(--surface) 80%, transparent);
}
.sr-navbar.style-transparent {
  background: transparent;
  border-bottom-color: transparent;
}

/* Brand */
.sr-navbar__brand {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-right: auto;
  text-decoration: none;
}
.sr-navbar__logo {
  width: 30px;
  height: 30px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: var(--font-mono);
  font-size: 13px;
  font-weight: 500;
  color: white;
  flex-shrink: 0;
}
.sr-navbar__name {
  font-size: 16px;
  font-weight: 600;
  color: var(--text);
  letter-spacing: -0.3px;
}

/* Links */
.sr-navbar__links {
  display: flex;
  align-items: center;
  gap: 2px;
}
.sr-navbar__link {
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  color: var(--text2);
  text-decoration: none;
  cursor: pointer;
  transition: all 0.12s;
  border: 1px solid transparent;
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-family: inherit;
  background: transparent;
}
.sr-navbar__link:hover {
  color: var(--text);
  background: var(--bg2);
}
.sr-navbar__link.active {
  color: var(--primary-text);
  background: var(--primary-light);
}

.sr-navbar__dropdown {
  position: relative;
}
.sr-navbar__chev {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 10px;
  height: 10px;
  margin-left: 4px;
  flex-shrink: 0;
  color: currentColor;
  opacity: 0.75;
}
.sr-navbar__chev::after {
  content: '';
  display: block;
  width: 0;
  height: 0;
  border-left: 4px solid transparent;
  border-right: 4px solid transparent;
  border-top: 5px solid currentColor;
  transition: transform 0.15s ease;
}
.sr-navbar__dropdown:hover .sr-navbar__chev::after,
.sr-navbar__dropdown.open .sr-navbar__chev::after {
  border-top: none;
  border-bottom: 5px solid currentColor;
  margin-top: 1px;
}
.sr-navbar__dropdown-pop {
  display: none;
  position: absolute;
  top: 100%;
  left: 0;
  z-index: 120;
  min-width: 100%;
  padding-top: 10px;
  margin-top: -2px;
}
.sr-navbar__dropdown-panel {
  min-width: 200px;
  padding: 10px 8px;
  border-radius: 12px;
  border: 1px solid var(--border);
  background: var(--surface);
  box-shadow:
    0 4px 6px -1px rgba(15, 23, 42, 0.06),
    0 12px 24px -4px rgba(15, 23, 42, 0.12);
}
.sr-navbar__dropdown.open .sr-navbar__dropdown-pop,
.sr-navbar__dropdown:hover .sr-navbar__dropdown-pop {
  display: block;
}
.sr-navbar__dropdown:hover .sr-navbar__dropdown-trigger,
.sr-navbar__dropdown.open .sr-navbar__dropdown-trigger {
  color: var(--primary-text);
  background: var(--primary-light);
}
.sr-navbar__dropdown.active .sr-navbar__dropdown-trigger {
  color: var(--primary-text);
  background: var(--primary-light);
}
.sr-navbar__dropdown-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 11px 12px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  color: var(--text);
  text-decoration: none;
  cursor: pointer;
  line-height: 1.35;
}
.sr-navbar__dropdown-item-text {
  flex: 1;
  min-width: 0;
}
.sr-navbar__dropdown-item:hover {
  color: var(--text);
  background: var(--bg2);
}
.sr-navbar__dropdown-item.active {
  color: var(--primary-text);
  background: var(--primary-light);
}
.sr-navbar__ext-ico {
  flex-shrink: 0;
  display: flex;
  color: var(--text3);
  opacity: 0.85;
}
.sr-navbar__dropdown-item:hover .sr-navbar__ext-ico {
  color: var(--text2);
}

.sr-navbar__link-icon {
  font-size: 14px;
  line-height: 1;
}

/* Search */
.sr-navbar__search {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  border-radius: 8px;
  border: 1px solid var(--border);
  background: var(--bg2);
  color: var(--text3);
  font-size: 13px;
  cursor: pointer;
  margin: 0 12px;
  min-width: 160px;
  transition: all 0.15s;
}
.sr-navbar__search:hover {
  border-color: var(--border2);
  color: var(--text2);
}
.sr-navbar__search-icon {
  font-size: 13px;
}
.sr-navbar__kbd {
  margin-left: auto;
  font-family: var(--font-mono);
  font-size: 10px;
  padding: 1px 5px;
  border-radius: 4px;
  border: 1px solid var(--border2);
  color: var(--text3);
  background: var(--bg);
}

@container sr-root (max-width: 980px) {
  .sr-navbar {
    height: 54px;
    padding: 0 12px;
  }
  .sr-navbar__name {
    font-size: 17px;
  }
  .sr-navbar__links,
  .sr-navbar__search {
    display: none;
  }
}

/* 构建器强制桌面/平板：即使容器窄也保持桌面导航 */
:global(.sr-renderer-root.sr-force-desktop) .sr-navbar {
  height: var(--navbar-h, 60px);
  padding: 0 24px;
}
:global(.sr-renderer-root.sr-force-desktop) .sr-navbar__name {
  font-size: 16px;
}
:global(.sr-renderer-root.sr-force-desktop) .sr-navbar__links {
  display: flex !important;
}
:global(.sr-renderer-root.sr-force-desktop) .sr-navbar__search {
  display: flex !important;
}

/* 构建器强制手机：即使容器宽也走手机导航 */
:global(.sr-renderer-root.sr-force-mobile) .sr-navbar {
  height: 54px;
  padding: 0 12px;
}
:global(.sr-renderer-root.sr-force-mobile) .sr-navbar__name {
  font-size: 17px;
}
:global(.sr-renderer-root.sr-force-mobile) .sr-navbar__links,
:global(.sr-renderer-root.sr-force-mobile) .sr-navbar__search {
  display: none !important;
}

</style>
