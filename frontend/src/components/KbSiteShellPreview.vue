<template>
  <div class="kb-shell" :class="{ 'kb-shell--published': variant === 'published' }">
    <header class="kb-shell__header">
      <div class="kb-shell__brand">站点预览</div>
      <nav class="kb-shell__header-nav" aria-label="顶部导航">
        <template v-for="n in headerTree" :key="n.id">
          <KbShellNavNode
            :node="n"
            :active-nav-id="activeNavId"
            horizontal
            @select-nav="emit('selectNav', $event)"
          />
        </template>
        <span v-if="!headerTree.length" class="kb-shell__nav-empty">（无 header 节点）</span>
      </nav>
    </header>

    <div class="kb-shell__row">
      <aside class="kb-shell__sidebar" aria-label="侧栏导航">
        <div class="kb-shell__sidebar-title">目录</div>
        <div class="kb-shell__sidebar-inner">
          <template v-for="n in sidebarTree" :key="n.id">
            <KbShellNavNode
              :node="n"
              :active-nav-id="activeNavId"
              @select-nav="emit('selectNav', $event)"
            />
          </template>
          <div v-if="!sidebarTree.length" class="kb-shell__nav-empty">（无 sidebar 节点）</div>
        </div>
      </aside>

      <main class="kb-shell__content">
        <div v-if="variant === 'published'" class="kb-shell__content-tag">已发布快照</div>
        <div v-else class="kb-shell__content-tag kb-shell__content-tag--draft">草稿导航 + 文档内容</div>
        <KbDocBody :doc="doc" :loading="docLoading" :empty-text="emptyHint" />
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { kbApi } from '../api/kb'
import type { KbDoc, KbNavNode } from '../types/kb'
import KbDocBody from './KbDocBody.vue'
import KbShellNavNode from './KbShellNavNode.vue'

defineOptions({ name: 'KbSiteShellPreview' })

const props = withDefaults(
  defineProps<{
    headerTree: KbNavNode[]
    sidebarTree: KbNavNode[]
    /** 当前要高亮的导航节点（与左侧树选中同步） */
    activeNavId?: number | null
    /** 要展示的文档 id；与导航点击、左侧选中联动 */
    docId?: number | null
    variant?: 'draft' | 'published'
  }>(),
  {
    activeNavId: null,
    docId: null,
    variant: 'draft'
  }
)

const emit = defineEmits<{
  selectNav: [navNodeId: number]
}>()

const doc = ref<KbDoc | null>(null)
const docLoading = ref(false)

const emptyHint = '请选择侧栏或顶栏中绑定文档的页面，或在左侧选中 DOC 节点'

async function loadDoc(id: number | null) {
  if (!id) {
    doc.value = null
    return
  }
  docLoading.value = true
  try {
    doc.value = await kbApi.getDoc(id)
  } catch {
    doc.value = null
  } finally {
    docLoading.value = false
  }
}

watch(
  () => props.docId,
  (id) => void loadDoc(id ?? null),
  { immediate: true }
)
</script>

<style scoped>
.kb-shell {
  display: flex;
  flex-direction: column;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  overflow: hidden;
  background: #f8fafc;
  min-height: 420px;
  max-height: min(78vh, 880px);
}

.kb-shell--published {
  border-color: #c7d2fe;
  background: #f5f7ff;
}

.kb-shell__header {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  padding: 10px 14px;
  background: #fff;
  border-bottom: 1px solid #e2e8f0;
}

.kb-shell__brand {
  font-weight: 700;
  font-size: 14px;
  color: #0f172a;
  flex-shrink: 0;
}

.kb-shell__header-nav {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px;
  flex: 1;
  min-width: 0;
}

.kb-shell__row {
  display: flex;
  flex: 1;
  min-height: 0;
}

.kb-shell__sidebar {
  width: 200px;
  flex-shrink: 0;
  background: #fff;
  border-right: 1px solid #e2e8f0;
  display: flex;
  flex-direction: column;
  min-height: 320px;
}

.kb-shell__sidebar-title {
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: #64748b;
  padding: 10px 12px 6px;
}

.kb-shell__sidebar-inner {
  padding: 4px 8px 12px;
  overflow-y: auto;
  flex: 1;
}

.kb-shell__content {
  flex: 1;
  min-width: 0;
  padding: 12px 14px 16px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.kb-shell__content-tag {
  font-size: 11px;
  color: #4338ca;
  background: #eef2ff;
  border-radius: 6px;
  padding: 4px 8px;
  align-self: flex-start;
}

.kb-shell__content-tag--draft {
  color: #b45309;
  background: #fffbeb;
}

.kb-shell__nav-empty {
  font-size: 12px;
  color: #94a3b8;
}

@media (max-width: 720px) {
  .kb-shell__row {
    flex-direction: column;
  }
  .kb-shell__sidebar {
    width: 100%;
    border-right: none;
    border-bottom: 1px solid #e2e8f0;
    min-height: auto;
    max-height: 200px;
  }
}
</style>
