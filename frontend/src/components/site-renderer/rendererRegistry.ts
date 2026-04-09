import { defineAsyncComponent, type Component } from 'vue'
import type { ThemeLayoutId, ThemeManifest } from '../../types/siteRenderer'

/* ── 注册表条目 ────────────────────────────────────────────────── */
export interface RendererThemeEntry {
  manifest: ThemeManifest
  layoutComponent: Component
}

/* ── 注册表存储 ────────────────────────────────────────────────── */
const registry = new Map<ThemeLayoutId, RendererThemeEntry>()

/**
 * 注册一个渲染主题（布局 + 清单）
 */
export function registerRendererTheme(entry: RendererThemeEntry): void {
  registry.set(entry.manifest.id, entry)
}

/**
 * 获取已注册的主题
 */
export function getRendererTheme(id: ThemeLayoutId): RendererThemeEntry | undefined {
  return registry.get(id)
}

/**
 * 获取所有已注册的主题清单列表
 */
export function getAllThemeManifests(): ThemeManifest[] {
  return Array.from(registry.values()).map((e) => e.manifest)
}

/**
 * 判断主题是否已注册
 */
export function hasRendererTheme(id: ThemeLayoutId): boolean {
  return registry.has(id)
}

/* ── 内置主题 ──────────────────────────────────────────────────── */
const BUILTIN_MANIFESTS: ThemeManifest[] = [
  {
    id: 'docs',
    name: '文档站',
    icon: '📄',
    regions: ['navbar', 'sidebar', 'content', 'toc', 'footer'],
    slots: ['sidebar-top', 'content-top'],
    defaultPageId: 'getting-started',
  },
  {
    id: 'blog',
    name: '博客',
    icon: '✍️',
    regions: ['navbar', 'content', 'footer'],
    slots: ['content-top'],
    defaultPageId: 'home',
  },
  {
    id: 'landing',
    name: '落地页',
    icon: '🚀',
    regions: ['navbar', 'hero', 'features', 'footer'],
    slots: ['content-top'],
    defaultPageId: 'home',
  },
]

/**
 * 初始化内置主题注册
 * 使用 defineAsyncComponent 延迟加载布局组件
 */
export function initBuiltinThemes(): void {
  registerRendererTheme({
    manifest: BUILTIN_MANIFESTS[0],
    layoutComponent: defineAsyncComponent(() => import('./layouts/KbDocsLayout.vue')),
  })
  registerRendererTheme({
    manifest: BUILTIN_MANIFESTS[1],
    layoutComponent: defineAsyncComponent(() => import('./layouts/KbBlogLayout.vue')),
  })
  registerRendererTheme({
    manifest: BUILTIN_MANIFESTS[2],
    layoutComponent: defineAsyncComponent(() => import('./layouts/KbLandingLayout.vue')),
  })
}

/**
 * 获取内置主题清单（无需等注册完成）
 */
export function getBuiltinManifests(): ThemeManifest[] {
  return BUILTIN_MANIFESTS
}
