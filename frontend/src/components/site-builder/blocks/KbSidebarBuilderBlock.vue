<template>
  <aside class="kb-preview-sidebar">
    <div class="kb-preview-sidebar__eyebrow">教程</div>
    <div class="kb-preview-panel__title" :style="{ fontSize: `${theme.titleSize}px` }">{{ config.title }}</div>
    <div class="kb-preview-sidebar__section" :style="{ color: theme.mutedColor }">导航树（{{ previewMode === 'draft' ? '草稿' : '已发布' }}）</div>
    <div class="kb-preview-sidebar__tree">
      <template v-for="node in navTree" :key="node.id">
        <KbShellNavNode :node="node" :active-nav-id="selectedNavId" @select-nav="emit('select-nav', $event)" />
      </template>
      <div v-if="!navTree.length" class="kb-preview-empty">暂无侧栏导航节点</div>
    </div>
  </aside>
</template>

<script setup lang="ts">
import type { KbNavNode } from '../../../types/kb'
import type { BlockThemeTokens, PreviewMode, SidebarAreaConfig } from '../../../types/siteBuilder'
import KbShellNavNode from '../../KbShellNavNode.vue'

defineProps<{
  config: SidebarAreaConfig
  theme: BlockThemeTokens
  navTree: KbNavNode[]
  selectedNavId: number | null
  previewMode: PreviewMode
}>()

const emit = defineEmits<{
  'select-nav': [navId: number]
}>()
</script>

<style scoped>
.kb-preview-sidebar { padding-top:10px; }
.kb-preview-sidebar__eyebrow { display:inline-flex; align-items:center; height:24px; padding:0 10px; margin:0 10px 12px; border-radius:999px; background:#f5f1e7; color:var(--kb-sidebar-group-text); font-size:11px; font-weight:700; letter-spacing:.08em; text-transform:uppercase; }
.kb-preview-panel__title { padding:0 12px 12px; font-weight:700; color:#111827; line-height:1.35; }
.kb-preview-sidebar__section { padding:0 12px 14px; font-size:12px; }
.kb-preview-sidebar__tree { padding:0 0 0 2px; }
.kb-preview-empty { display:inline-flex; align-items:center; min-height:40px; color:var(--kb-empty-text-color); font-size:13px; }
</style>
