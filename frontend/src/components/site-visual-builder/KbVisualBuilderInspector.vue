<template>
  <aside class="kbvb-inspector">
    <div class="kbvb-inspector__head">
      <div class="kbvb-inspector__title">{{ inspectorTitle }}</div>
      <div class="kbvb-inspector__tag">{{ inspectorTag }}</div>
    </div>

    <div class="kbvb-inspector__body">
      <template v-if="selectedKind === 'none'">
        <div class="kbvb-empty">点击画布区域、页面卡片或插槽开始编辑。</div>
      </template>

      <template v-else-if="selectedKind === 'page' && selectedPage && selectedPageMeta">
        <div class="kbvb-field">
          <label>标题</label>
          <n-input v-model:value="selectedPage.title" />
        </div>
        <div class="kbvb-field">
          <label>Slug</label>
          <n-input v-model:value="selectedPageMeta.slug" />
        </div>
        <div class="kbvb-field">
          <label>描述</label>
          <n-input v-model:value="selectedPage.description" />
        </div>

        <div class="kbvb-divider"></div>
        <div class="kbvb-section-title">关联引用</div>

        <div class="kbvb-ref-list">
          <div v-for="binding in pageBindings" :key="binding.id" class="kbvb-ref-item">
            <span>{{ binding.label }}</span>
            <small>{{ binding.location }}</small>
          </div>
        </div>

        <div class="kbvb-quick-actions">
          <button class="kbvb-outline-btn" @click="actions.addNavItemFromPage(selectedPage.id)">+ 快速添加到导航栏</button>
          <button class="kbvb-outline-btn" @click="actions.addSidebarItemFromPage(selectedPage.id)">+ 快速添加到菜单树</button>
        </div>
      </template>

      <template v-else-if="selectedKind === 'region' && selectedValue === 'navbar'">
        <KbVisualBuilderSchemaForm :model="siteConfig as any" :schema="navbarSchema">
          <template #nav-editor>
            <div class="kbvb-section-title">导航项</div>
            <div class="kbvb-card-list">
              <div v-for="(item, index) in siteConfig.navbar.links" :key="item.id" class="kbvb-card">
                <div class="kbvb-card__head">
                  <strong>{{ item.label || `导航 ${index + 1}` }}</strong>
                  <n-button size="tiny" tertiary type="error" @click="actions.removeNavItem(index)">删除</n-button>
                </div>
                <div class="kbvb-grid">
                  <div class="kbvb-field">
                    <label>标签</label>
                    <n-input v-model:value="item.label" />
                  </div>
                  <div class="kbvb-field">
                    <label>图标</label>
                    <n-input v-model:value="item.icon" />
                  </div>
                  <div class="kbvb-field">
                    <label>类型</label>
                    <n-select v-model:value="item.type" :options="navTypeOptions" />
                  </div>
                  <div class="kbvb-field">
                    <label>绑定页面</label>
                    <n-select
                      :value="navMeta[item.id]?.targetPageId || null"
                      :options="pageOptions"
                      clearable
                      @update:value="actions.setNavTarget(item.id, $event || '')"
                    />
                  </div>
                  <div class="kbvb-field">
                    <label>链接</label>
                    <n-input v-model:value="item.href" :disabled="!!navMeta[item.id]?.targetPageId" />
                  </div>
                  <div class="kbvb-field">
                    <label>标签跟随页面</label>
                    <n-switch
                      :value="navMeta[item.id]?.syncLabel ?? false"
                      @update:value="actions.toggleNavLabelSync(item.id, $event)"
                    />
                  </div>
                </div>
              </div>
            </div>
            <button class="kbvb-outline-btn" @click="actions.addNavItem">+ 添加导航项</button>
          </template>
        </KbVisualBuilderSchemaForm>
      </template>

      <template v-else-if="selectedKind === 'region' && selectedValue === 'sidebar'">
        <KbVisualBuilderSchemaForm :model="siteConfig as any" :schema="sidebarSchema">
          <template #sidebar-width>
            <div class="kbvb-field">
              <label>侧栏宽度</label>
              <n-input :value="String(siteConfig.sidebar.width)" @update:value="actions.updateSidebarWidth" />
            </div>
          </template>
          <template #sidebar-editor>
            <div class="kbvb-section-title">菜单树</div>
            <div class="kbvb-card-list">
              <div v-for="(section, sectionIndex) in siteConfig.sidebar.tree" :key="section.id" class="kbvb-card">
                <div class="kbvb-card__head">
                  <strong>{{ section.groupLabel || `分组 ${sectionIndex + 1}` }}</strong>
                  <div class="kbvb-inline-actions">
                    <n-button size="tiny" tertiary @click="actions.addSidebarItem(sectionIndex)">加子项</n-button>
                    <n-button size="tiny" tertiary type="error" @click="siteConfig.sidebar.tree.splice(sectionIndex, 1)">删除</n-button>
                  </div>
                </div>
                <div class="kbvb-field">
                  <label>分组标题</label>
                  <n-input v-model:value="section.groupLabel" />
                </div>
                <div class="kbvb-card-list kbvb-card-list--tight">
                  <div v-for="(node, nodeIndex) in section.children" :key="node.id" class="kbvb-subcard">
                    <div class="kbvb-card__head">
                      <strong>{{ node.label || `节点 ${nodeIndex + 1}` }}</strong>
                      <div class="kbvb-inline-actions">
                        <n-button size="tiny" tertiary @click="actions.addSidebarChild(sectionIndex, nodeIndex)">加子页</n-button>
                        <n-button size="tiny" tertiary @click="actions.toggleSidebarNodeGroup(sectionIndex, nodeIndex)">
                          {{ node.children ? '转叶子' : '转分组' }}
                        </n-button>
                      </div>
                    </div>
                    <div class="kbvb-grid">
                      <div class="kbvb-field">
                        <label>标签</label>
                        <n-input v-model:value="node.label" />
                      </div>
                      <div class="kbvb-field">
                        <label>绑定页面</label>
                        <n-select v-model:value="node.pageId" :options="pageOptions" clearable />
                      </div>
                    </div>
                    <div v-if="node.children" class="kbvb-card-list kbvb-card-list--tight">
                      <div v-for="(child, childIndex) in node.children" :key="child.id" class="kbvb-subcard kbvb-subcard--inner">
                        <div class="kbvb-card__head">
                          <strong>{{ child.label || `子页 ${childIndex + 1}` }}</strong>
                          <n-button size="tiny" tertiary type="error" @click="node.children.splice(childIndex, 1)">删除</n-button>
                        </div>
                        <div class="kbvb-grid">
                          <div class="kbvb-field">
                            <label>标签</label>
                            <n-input v-model:value="child.label" />
                          </div>
                          <div class="kbvb-field">
                            <label>绑定页面</label>
                            <n-select v-model:value="child.pageId" :options="pageOptions" clearable />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <button class="kbvb-outline-btn" @click="actions.addSidebarSection">+ 添加分组</button>
          </template>
        </KbVisualBuilderSchemaForm>
      </template>

      <template v-else-if="selectedKind === 'slot' && selectedSlot">
        <div class="kbvb-switch-row">
          <span>启用插槽</span>
          <n-switch :value="!!selectedSlot" @update:value="actions.toggleSlot(selectedValue)" />
        </div>
        <div class="kbvb-field">
          <label>组件类型</label>
          <n-select v-model:value="selectedSlot.componentKey" :options="slotComponentOptions" />
        </div>
        <div v-for="field in slotFields" :key="field.key" class="kbvb-field">
          <label>{{ field.label }}</label>
          <n-input v-if="field.type === 'string'" v-model:value="selectedSlot.props[field.key]" :placeholder="field.placeholder" />
          <n-color-picker v-else-if="field.type === 'color'" v-model:value="selectedSlot.props[field.key]" :show-alpha="false" />
          <n-switch v-else v-model:value="selectedSlot.props[field.key]" />
        </div>
      </template>

      <template v-else>
        <KbVisualBuilderSchemaForm :model="siteConfig as any" :schema="themeSchema" />
      </template>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { SLOT_SCHEMAS } from '../../mock/siteVisualBuilderDemo'
import type { PageData, SiteRendererConfig, SlotComponentInstance } from '../../types/siteRenderer'
import type { BuilderNavMeta, BuilderPageMeta, BuilderSelectionKind } from '../../types/siteVisualBuilder'
import KbVisualBuilderSchemaForm, { type SchemaSection } from './KbVisualBuilderSchemaForm.vue'

const props = defineProps<{
  selectedKind: BuilderSelectionKind
  selectedValue: string
  siteConfig: SiteRendererConfig
  selectedPage: PageData | null
  selectedPageMeta: BuilderPageMeta | null
  pageOptions: Array<{ label: string; value: string }>
  navMeta: Record<string, BuilderNavMeta>
  actions: {
    addNavItem: () => void
    removeNavItem: (index: number) => void
    setNavTarget: (navId: string, pageId: string) => void
    toggleNavLabelSync: (navId: string, value: boolean) => void
    addSidebarSection: () => void
    addSidebarItem: (sectionIndex: number) => void
    addSidebarChild: (sectionIndex: number, nodeIndex: number) => void
    toggleSidebarNodeGroup: (sectionIndex: number, nodeIndex: number) => void
    addFooterLink: () => void
    addFeature: () => void
    toggleSlot: (slotKey: string) => void
    updateSidebarWidth: (value: string) => void
    updatePageReadTime: (value: string) => void
    addNavItemFromPage: (pageId: string) => void
    addSidebarItemFromPage: (pageId: string) => void
  }
}>()

const navTypeOptions = [
  { label: '普通链接', value: 'link' },
  { label: 'CTA 按钮', value: 'cta' },
]

const slotComponentOptions = [
  { label: 'AdBanner', value: 'AdBanner' },
  { label: 'Announcement', value: 'Announcement' },
]

const navbarSchema: SchemaSection[] = [
  {
    key: 'navbar-base',
    fields: [
      { key: 'brand', label: '品牌名称', path: 'navbar.brand', type: 'text', fullWidth: true },
      {
        key: 'style',
        label: '导航风格',
        path: 'navbar.style',
        type: 'select',
        options: [
          { label: '纯色', value: 'solid' },
          { label: '毛玻璃', value: 'blur' },
          { label: '透明', value: 'transparent' },
        ],
      },
      { key: 'showSearch', label: '显示搜索', path: 'navbar.showSearch', type: 'switch' },
      { key: 'custom', type: 'custom', slot: 'nav-editor', fullWidth: true },
    ],
  },
]

const sidebarSchema: SchemaSection[] = [
  {
    key: 'sidebar-base',
    fields: [
      { key: 'sidebar-width', type: 'custom', slot: 'sidebar-width' },
      { key: 'collapsible', label: '允许折叠', path: 'sidebar.collapsible', type: 'switch' },
      { key: 'sidebar-editor', type: 'custom', slot: 'sidebar-editor', fullWidth: true },
    ],
  },
]

const themeSchema: SchemaSection[] = [
  {
    key: 'theme-base',
    fields: [
      { key: 'primary', label: '主题主色', path: 'theme.primary', type: 'color' },
      { key: 'darkMode', label: '暗色模式', path: 'theme.darkMode', type: 'switch' },
      { key: 'fontSans', label: '正文字体', path: 'theme.fontSans', type: 'text', fullWidth: true },
    ],
  },
]

const inspectorTitle = computed(() => {
  if (props.selectedKind === 'page' && props.selectedPage) return '页面'
  if (props.selectedKind === 'slot') return '插槽'
  if (props.selectedKind === 'region') return ({
    navbar: '导航栏',
    sidebar: '侧边栏',
    content: '内容区',
    footer: '页脚',
    hero: 'Hero',
    features: 'Features',
  }[props.selectedValue] || props.selectedValue)
  return '属性面板'
})

const inspectorTag = computed(() => {
  if (props.selectedKind === 'page') return 'Page'
  if (props.selectedKind === 'slot') return props.selectedValue
  if (props.selectedKind === 'region') return 'Region'
  return 'Builder'
})

const selectedSlot = computed<SlotComponentInstance | null>(() => props.siteConfig.slots[props.selectedValue] || null)
const slotFields = computed(() => {
  const schema = SLOT_SCHEMAS[selectedSlot.value?.componentKey || ''] || {}
  return Object.entries(schema).map(([key, field]) => ({ key, ...field }))
})

const pageBindings = computed(() => {
  if (!props.selectedPage) return []
  const refs: Array<{ id: string; label: string; location: string }> = []
  Object.values(props.navMeta).forEach((binding) => {
    if (binding.targetPageId === props.selectedPage?.id) {
      const nav = props.siteConfig.navbar.links.find((item) => item.id === binding.id)
      if (nav) refs.push({ id: `nav-${nav.id}`, label: nav.label, location: '导航栏' })
    }
  })
  props.siteConfig.sidebar.tree.forEach((section) => {
    section.children.forEach((node) => {
      if (node.pageId === props.selectedPage?.id) refs.push({ id: `side-${node.id}`, label: node.label, location: `菜单·${section.groupLabel || '未命名分组'}` })
      node.children?.forEach((child) => {
        if (child.pageId === props.selectedPage?.id) refs.push({ id: `side-${child.id}`, label: child.label, location: `菜单·${section.groupLabel || '未命名分组'}` })
      })
    })
  })
  return refs
})
</script>

<style scoped>
.kbvb-inspector { width:292px; min-width:292px; background:#11141d; border-left:1px solid #262b3d; display:flex; flex-direction:column; }
.kbvb-inspector__head { height:50px; padding:0 14px; border-bottom:1px solid #262b3d; display:flex; align-items:center; justify-content:space-between; }
.kbvb-inspector__title { color:#fff; font-size:14px; font-weight:700; }
.kbvb-inspector__tag { font-size:11px; color:#78a0ff; border:1px solid #314772; padding:2px 7px; border-radius:6px; font-family:ui-monospace,SFMono-Regular,monospace; }
.kbvb-inspector__body { flex:1; overflow:auto; padding:14px; display:flex; flex-direction:column; gap:12px; }
.kbvb-empty { color:#8b97ae; font-size:12px; }
.kbvb-field { display:flex; flex-direction:column; gap:7px; }
.kbvb-field label,.kbvb-switch-row span { color:#bfc9dc; font-size:12px; font-weight:600; }
.kbvb-switch-row { display:flex; align-items:center; justify-content:space-between; }
.kbvb-divider { height:1px; background:#262b3d; margin:2px 0; }
.kbvb-section-title { color:#fff; font-size:12px; font-weight:700; letter-spacing:.04em; }
.kbvb-ref-list,.kbvb-card-list { display:flex; flex-direction:column; gap:8px; }
.kbvb-card-list--tight { gap:6px; }
.kbvb-ref-item,.kbvb-card,.kbvb-subcard { border:1px solid #2a3043; background:#151924; border-radius:12px; padding:10px; display:flex; flex-direction:column; gap:10px; }
.kbvb-ref-item span,.kbvb-card strong,.kbvb-subcard strong { color:#eef3ff; font-size:12px; }
.kbvb-ref-item small { color:#8390a9; font-size:11px; }
.kbvb-card__head,.kbvb-inline-actions,.kbvb-quick-actions { display:flex; align-items:center; justify-content:space-between; gap:8px; }
.kbvb-grid { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:10px; }
.kbvb-subcard--inner { background:#121722; }
.kbvb-outline-btn { width:100%; height:34px; border-radius:10px; border:1px dashed #36425f; background:transparent; color:#90a2c8; cursor:pointer; }
</style>
