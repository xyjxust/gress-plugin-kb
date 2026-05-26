<template>
  <div class="kb-site-builder" :style="siteThemeVars">
    <div class="page-header-wrapper">
      <PageHeader title="Wiki 站点搭建器">
        <template #actions>
          <n-space align="center">
            <n-select
              size="small"
              :value="activeSiteKey"
              :options="siteOptions"
              style="min-width: 260px"
              @update:value="onSiteChange"
            />
            <n-button size="small" secondary @click="loadAll" :loading="loading">刷新</n-button>
            <n-button size="small" secondary @click="saveBuilderState">保存</n-button>
            <n-button size="small" type="primary" @click="publishAll" :loading="publishingHeader || publishingSidebar"
              >发布</n-button
            >
          </n-space>
        </template>
      </PageHeader>
    </div>

    <div class="kb-site-builder__body">
      <KbSiteCanvas
        :preview-mode="previewMode"
        :hovered-slot="hoveredSlot"
        :material-menu-slot="materialMenuSlot"
        :selected-area="selectedArea"
        :selected-header-nav-id="selectedHeaderNavId"
        :selected-sidebar-nav-id="selectedSidebarNavId"
        :component-instances="componentInstances"
        :main-slots="mainSlots"
        :area-meta="areaMeta"
        :slot-meta="slotMeta"
        :area-configs="areaConfigs"
        :resolved-themes="resolvedThemes"
        :site-theme-vars="siteThemeVars"
        :preview-header-tree="previewHeaderTree"
        :preview-sidebar-tree="previewSidebarTree"
        :preview-doc="previewDoc"
        :doc-loading="docLoading"
        :toc-items="tocItems"
        :prev-doc="prevDoc"
        :next-doc="nextDoc"
        :main-grid-style="mainGridStyle"
        @hover-slot="hoveredSlot = $event"
        @clear-hover-slot="(slot) => { if (hoveredSlot === slot) hoveredSlot = null }"
        @open-material-menu="openMaterialMenu"
        @assign-area="assignAreaToSlot"
        @drop-slot="onSlotDrop"
        @drag-area-start="onAreaDragStart"
        @drag-area-end="onAreaDragEnd"
        @select-area="selectArea"
        @open-inspector="openInspector"
        @remove-area="removeAreaFromSlot"
        @select-nav="onNavSelect"
      />

      <KbSiteInspectorDrawer
        :open="inspectorOpen"
        :selected-area="selectedArea"
        :component-instance="selectedComponentInstance"
        :current-slot-label="findSlotByArea(selectedArea) ? slotMeta[findSlotByArea(selectedArea) as CanvasSlot].short : '未放置'"
        :active-theme-scheme-id="activeThemeSchemeId"
        :doc-options="docOptions"
        :data-sources="dataSources"
        :theme-preset-options="themeSchemes.map((item) => ({ label: item.name, value: item.id }))"
        :area-meta="areaMeta"
        :site-theme="siteTheme"
        :site-theme-vars="siteThemeVars"
        @update:open="inspectorOpen = $event"
        @apply-preset="applyThemeScheme"
        @save-theme-scheme="saveThemeScheme"
        @duplicate-theme-scheme="duplicateThemeScheme"
        @reset-theme-scheme="resetThemeScheme"
        @save-data-source="saveDataSource"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useMessage, useRoute } from '@keqi.gress/plugin-bridge'
import { PageHeader } from '@keqi.gress/plugin-ui'
import { kbApi } from '../api/kb'
import { kbHasAuthToken } from '../utils/kbSession'
import type { KbDoc, KbNavNode, KbSite, KbTreeNode } from '../types/kb'
import type { AreaConfigMap, AreaKey, BuilderComponentInstance, BuilderDataSource, BuilderDataSourceOption, CanvasSlot, PreviewMode, SiteThemeConfig, ThemePresetId, ThemeScheme } from '../types/siteBuilder'
import { buildSiteThemeVars, cloneSiteTheme, createBuiltinThemeSchemes, createDefaultSiteTheme, createSiteThemePreset, extractTocItems, findPrevNextDocs, resolveBlockTheme } from '../utils/siteBuilder'
import KbSiteInspectorDrawer from '../components/site-builder/KbSiteInspectorDrawer.vue'
import KbSiteCanvas from '../components/site-builder/KbSiteCanvas.vue'
import { siteBuilderRegistry } from '../components/site-builder/siteBuilderRegistry'

const message = useMessage()
const route = useRoute()

const sites = ref<KbSite[]>([])
const activeSiteKey = ref<string>('default')

const siteOptions = computed(() =>
  sites.value
    .filter((s) => s.enabled !== 0)
    .map((s) => ({ label: `${s.name}（${s.routePrefix}）`, value: s.spaceKey }))
)

const slotList: CanvasSlot[] = ['top', 'left', 'center', 'right', 'bottom']
const mainSlots: CanvasSlot[] = ['left', 'center', 'right']

const areaMeta: Record<AreaKey, { label: string; description: string; slots: CanvasSlot[] }> = {
  header: {
    label: '顶部导航',
    description: '品牌区、搜索、顶部导航和快捷入口',
    slots: ['top']
  },
  sidebar: {
    label: '左侧菜单',
    description: '章节树、教程目录、文档导航',
    slots: ['left', 'center', 'right']
  },
  content: {
    label: '内容显示区',
    description: '文档正文、资源链接和文章主体',
    slots: ['left', 'center', 'right']
  },
  toc: {
    label: '目录区',
    description: '文章内标题目录、章节定位和锚点入口',
    slots: ['left', 'center', 'right']
  },
  footer: {
    label: '页脚区',
    description: '上一篇 / 下一篇、补充说明和版权信息',
    slots: ['bottom']
  }
}

const slotMeta: Record<CanvasSlot, { label: string; short: string; hint: string }> = {
  top: { label: '顶部槽位', short: 'Top', hint: '可放置 Header' },
  left: { label: '左栏槽位', short: 'Left', hint: '可放置 Sidebar / Content / TOC' },
  center: { label: '中栏槽位', short: 'Center', hint: '通常放置 Content' },
  right: { label: '右栏槽位', short: 'Right', hint: '可放置 Sidebar / Content / TOC' },
  bottom: { label: '底部槽位', short: 'Bottom', hint: '可放置 Footer' }
}

const navSourceOptions = [
  { label: '顶部导航树', value: 'header' as const },
  { label: '侧栏导航树', value: 'sidebar' as const }
]

const footerSourceOptions = [
  { label: '跟随左侧菜单', value: 'follow-sidebar' as const },
  { label: '顶部导航树', value: 'header' as const },
  { label: '侧栏导航树', value: 'sidebar' as const }
]

const loading = ref(false)
const publishingHeader = ref(false)
const publishingSidebar = ref(false)
const previewMode = ref<PreviewMode>('draft')
const selectedArea = ref<AreaKey>('content')
const selectedSlot = ref<CanvasSlot>('center')
const hoveredSlot = ref<CanvasSlot | null>(null)
const draggingArea = ref<AreaKey | null>(null)
const materialMenuSlot = ref<CanvasSlot | null>(null)
const inspectorOpen = ref(false)
const selectedHeaderNavId = ref<number | null>(1001)
const selectedSidebarNavId = ref<number | null>(2105)
const docLoading = ref(false)
const previewDoc = ref<KbDoc | null>(null)

const docsTree = ref<KbTreeNode[]>([])
const draftHeaderTree = ref<KbNavNode[]>([])
const draftSidebarTree = ref<KbNavNode[]>([])
const publishedHeaderTree = ref<KbNavNode[]>([])
const publishedSidebarTree = ref<KbNavNode[]>([])
const mockDocs: Record<number, KbDoc> = {
  9000: {
    id: 9000,
    spaceId: 1,
    parentId: null,
    slug: 'chapter-1-intro',
    title: '第 1 章：认识 NocoBase',
    bodyMd: `## 为什么选择 NocoBase\n\nNocoBase 提供以数据模型驱动的页面搭建能力，可以帮助我们快速构建企业内部系统。\n\n## 教程目标\n\n这一套教程会带你完成 IT 工单系统的搭建。`,
    status: 'PUBLISHED',
    version: 1,
    publishedAt: '2026-04-01T12:00:00',
    updatedAt: '2026-04-01T22:00:00'
  },
  9001: {
    id: 9001,
    spaceId: 1,
    parentId: null,
    slug: 'chapter-2-data-modeling',
    title: '第 2 章：数据建模',
    bodyMd: `## 系统字段\n\n- 系统字段 = ID、创建日期、创建人等，建表时自动勾选\n- 关系字段（多对一）= 指向另一张表的记录，建立表与表之间的关联\n\n## 下一章预告\n\n骨架搭好了，但现在只有空表。下一章，我们要搭建页面，让数据真正能展示出来。\n\n## 相关资源\n\n- [数据源概述](#)\n- [数据表字段](#)\n- [多对一关联](#)`,
    status: 'PUBLISHED',
    version: 1,
    publishedAt: '2026-04-01T12:00:00',
    updatedAt: '2026-04-01T22:38:01'
  },
  9002: {
    id: 9002,
    spaceId: 1,
    parentId: null,
    slug: 'chapter-3-page',
    title: '第 3 章：搭建页面',
    bodyMd: `## 页面骨架\n\n这一章我们开始把列表、表单和详情块组合到页面里。\n\n## 交互结构\n\n通过布局区块把信息架构稳定下来。`,
    status: 'PUBLISHED',
    version: 1,
    publishedAt: '2026-04-01T12:00:00',
    updatedAt: '2026-04-01T22:10:00'
  },
  9003: {
    id: 9003,
    spaceId: 1,
    parentId: null,
    slug: 'chapter-4-forms',
    title: '第 4 章：表单与详情',
    bodyMd: `## 表单与详情的目标\n\n从这一章开始，我们不再只是把字段摆上去，而是要让页面进入真实可用的状态。用户需要更清晰的表单结构、更稳定的详情展示，以及顺滑的阅读与操作路径。\n\n## 创建表单区块\n\n先在页面中添加表单区块，并为字段设置更符合业务语义的标题、提示文案与默认值。一个好的表单不只是可填写，更要让用户一眼看懂信息组织方式。\n\n- 将字段按“基础信息 / 流程信息 / 说明信息”分组\n- 为关键字段补充占位提示与帮助说明\n- 保持操作按钮位置稳定，避免交互跳跃\n\n## 添加详情区块\n\n详情区块用于承接记录的只读展示。它通常与表单共享同一套数据结构，但在阅读节奏上更强调信息层级，因此可以把标题、描述、状态等元素进一步强化。\n\n> 当表单与详情遵循同一套信息架构时，编辑态与浏览态的切换成本会明显降低。\n\n## 让页面联动起来\n\n接下来我们会把列表、表单与详情串联起来，让页面形成真正可工作的流程。比如点击某条记录后，可以在抽屉中直接打开详情，再从详情继续进入编辑。\n\n## 小结\n\n完成这一章之后，你会得到一套更接近生产环境的页面结构，也会更容易继续扩展权限、流程和自动化能力。`,
    status: 'PUBLISHED',
    version: 1,
    publishedAt: '2026-04-01T12:00:00',
    updatedAt: '2026-04-01T22:15:00'
  },
  9004: {
    id: 9004,
    spaceId: 1,
    parentId: null,
    slug: 'chapter-5-auth',
    title: '第 5 章：用户与权限',
    bodyMd: `## 权限体系\n\n通过角色、菜单和数据规则来限制可见与可操作范围。`,
    status: 'PUBLISHED',
    version: 1,
    publishedAt: '2026-04-01T12:00:00',
    updatedAt: '2026-04-01T22:20:00'
  },
  9005: {
    id: 9005,
    spaceId: 1,
    parentId: null,
    slug: 'api',
    title: 'API',
    bodyMd: `## API 使用\n\n这里展示 API 文档、鉴权说明与调用示例。`,
    status: 'PUBLISHED',
    version: 1,
    publishedAt: '2026-04-01T12:00:00',
    updatedAt: '2026-04-01T22:30:00'
  }
}
const mockDocsTree: KbTreeNode[] = [
  {
    id: 9900,
    parentId: null,
    title: 'V2 教程（IT 工单系统）',
    slug: 'v2-tutorials',
    status: 'PUBLISHED',
    children: [
      { id: 9000, parentId: 9900, title: '第 1 章：认识 NocoBase', slug: 'chapter-1-intro', status: 'PUBLISHED', children: [] },
      { id: 9001, parentId: 9900, title: '第 2 章：数据建模', slug: 'chapter-2-data-modeling', status: 'PUBLISHED', children: [] },
      { id: 9002, parentId: 9900, title: '第 3 章：搭建页面', slug: 'chapter-3-page', status: 'PUBLISHED', children: [] },
      { id: 9003, parentId: 9900, title: '第 4 章：表单与详情', slug: 'chapter-4-forms', status: 'PUBLISHED', children: [] },
      { id: 9004, parentId: 9900, title: '第 5 章：用户与权限', slug: 'chapter-5-auth', status: 'PUBLISHED', children: [] }
    ]
  }
]

function createMockHeaderTree(status: 'DRAFT' | 'PUBLISHED'): KbNavNode[] {
  return [
    { id: 1001, parentId: null, menuCode: 'header', title: '开始', nodeType: 'DOC', docId: 9001, status, children: [] },
    { id: 1002, parentId: null, menuCode: 'header', title: '教程', nodeType: 'DOC', docId: 9001, status, children: [] },
    { id: 1003, parentId: null, menuCode: 'header', title: '手册', nodeType: 'DOC', docId: 9002, status, children: [] },
    { id: 1004, parentId: null, menuCode: 'header', title: '开发', nodeType: 'DOC', docId: 9003, status, children: [] },
    { id: 1005, parentId: null, menuCode: 'header', title: '插件', nodeType: 'DOC', docId: 9004, status, children: [] },
    { id: 1006, parentId: null, menuCode: 'header', title: 'API', nodeType: 'DOC', docId: 9005, status, children: [] }
  ]
}

function createMockSidebarTree(status: 'DRAFT' | 'PUBLISHED'): KbNavNode[] {
  return [
    {
      id: 2001,
      parentId: null,
      menuCode: 'sidebar',
      title: 'V2 教程（IT 工单系统）',
      nodeType: 'GROUP',
      status,
      children: [
        { id: 2101, parentId: 2001, menuCode: 'sidebar', title: '教程简介', nodeType: 'DOC', docId: 9000, status, children: [] },
        { id: 2102, parentId: 2001, menuCode: 'sidebar', title: '第 1 章：认识 NocoBase', nodeType: 'DOC', docId: 9000, status, children: [] },
        { id: 2103, parentId: 2001, menuCode: 'sidebar', title: '第 2 章：数据建模', nodeType: 'DOC', docId: 9001, status, children: [] },
        { id: 2104, parentId: 2001, menuCode: 'sidebar', title: '第 3 章：搭建页面', nodeType: 'DOC', docId: 9002, status, children: [] },
        { id: 2105, parentId: 2001, menuCode: 'sidebar', title: '第 4 章：表单与详情', nodeType: 'DOC', docId: 9003, status, children: [] },
        { id: 2106, parentId: 2001, menuCode: 'sidebar', title: '第 5 章：用户与权限', nodeType: 'DOC', docId: 9004, status, children: [] }
      ]
    }
  ]
}

function createDefaultDataSources(): BuilderDataSource[] {
  return [
    {
      id: 'source-nav-header',
      kind: 'nav-tree',
      label: '顶部导航树',
      description: '站点顶部导航，可在组件配置中维护整棵树',
      payload: {
        menuCode: 'header',
        tree: createMockHeaderTree('DRAFT')
      }
    },
    {
      id: 'source-nav-sidebar',
      kind: 'nav-tree',
      label: '侧栏导航映射',
      description: '按顶部导航节点切换不同侧栏树',
      payload: {
        menuCode: 'sidebar',
        parentSourceId: 'source-nav-header',
        sections: [
          {
            id: 'section-start',
            headerNavId: 1001,
            label: '开始',
            tree: createMockSidebarTree('DRAFT')
          },
          {
            id: 'section-manual',
            headerNavId: 1003,
            label: '手册',
            tree: [
              {
                id: 2301,
                parentId: null,
                menuCode: 'sidebar',
                title: '开发手册',
                nodeType: 'GROUP',
                status: 'DRAFT',
                children: [
                  { id: 2302, parentId: 2301, menuCode: 'sidebar', title: '表单与详情', nodeType: 'DOC', docId: 9003, status: 'DRAFT', children: [] },
                  { id: 2303, parentId: 2301, menuCode: 'sidebar', title: '用户与权限', nodeType: 'DOC', docId: 9004, status: 'DRAFT', children: [] }
                ]
              }
            ]
          }
        ]
      }
    },
    { id: 'source-doc-current', kind: 'document', label: '当前预览文档', description: '内容组件当前预览的文档', payload: { docId: 9003, doc: mockDocs[9003] } },
    { id: 'source-toc-current', kind: 'toc', label: '当前文档目录', description: '从当前预览文档实时解析目录', payload: { documentSourceId: 'source-doc-current' } },
    { id: 'source-pager-sidebar', kind: 'pager', label: '侧栏顺序翻页', description: '根据侧栏树顺序生成上一篇 / 下一篇', payload: { navSourceId: 'source-nav-sidebar' } }
  ]
}

function createDefaultComponentInstances(): BuilderComponentInstance<any>[] {
  return [
    {
      id: 'cmp-header',
      type: 'header',
      name: '顶部导航',
      slot: 'top',
      config: siteBuilderRegistry.header.createConfig(),
      bindings: [{ key: 'primaryNav', sourceId: 'source-nav-header' }]
    },
    {
      id: 'cmp-sidebar',
      type: 'sidebar',
      name: '左侧菜单',
      slot: 'left',
      config: siteBuilderRegistry.sidebar.createConfig(),
      bindings: [{ key: 'menuNav', sourceId: 'source-nav-sidebar' }]
    },
    {
      id: 'cmp-content',
      type: 'content',
      name: '正文内容',
      slot: 'center',
      config: siteBuilderRegistry.content.createConfig(),
      bindings: [{ key: 'document', sourceId: 'source-doc-current' }]
    },
    {
      id: 'cmp-toc',
      type: 'toc',
      name: '目录区',
      slot: 'right',
      config: siteBuilderRegistry.toc.createConfig(),
      bindings: [{ key: 'toc', sourceId: 'source-toc-current' }]
    },
    {
      id: 'cmp-footer',
      type: 'footer',
      name: '页脚区',
      slot: 'bottom',
      config: siteBuilderRegistry.footer.createConfig(),
      bindings: [{ key: 'pager', sourceId: 'source-pager-sidebar' }]
    }
  ]
}

const THEME_SCHEME_STORAGE_KEY = 'kb-site-builder-theme-schemes'
const ACTIVE_THEME_SCHEME_STORAGE_KEY = 'kb-site-builder-active-theme-scheme'
const BUILDER_STATE_STORAGE_KEY = 'kb-site-builder-state'

const componentInstances = ref<BuilderComponentInstance<any>[]>(createDefaultComponentInstances())
const dataSources = ref<BuilderDataSource[]>(createDefaultDataSources())
const siteTheme = ref<SiteThemeConfig>(createDefaultSiteTheme())
const themeSchemes = ref<ThemeScheme[]>(createBuiltinThemeSchemes())
const activeThemeSchemeId = ref<string>('docs-light')

const areaConfigs = computed(() => {
  const getConfig = <T>(type: AreaKey) => componentInstances.value.find((item) => item.type === type)?.config as T
  return {
    header: getConfig<AreaConfigMap['header']>('header'),
    sidebar: getConfig<AreaConfigMap['sidebar']>('sidebar'),
    content: getConfig<AreaConfigMap['content']>('content'),
    toc: getConfig<AreaConfigMap['toc']>('toc'),
    footer: getConfig<AreaConfigMap['footer']>('footer')
  }
})

const selectedComponentInstance = computed(() => componentInstances.value.find((item) => item.type === selectedArea.value) || componentInstances.value[0])

const dataSourceOptions = computed<BuilderDataSourceOption[]>(() =>
  dataSources.value.map((item) => ({
    id: item.id,
    label: item.label,
    kind: item.kind,
    description: item.description
  }))
)

const resolvedThemes = computed(() => ({
  header: resolveBlockTheme(siteTheme.value, areaConfigs.value.header.themeOverrides),
  sidebar: resolveBlockTheme(siteTheme.value, areaConfigs.value.sidebar.themeOverrides),
  content: resolveBlockTheme(siteTheme.value, areaConfigs.value.content.themeOverrides),
  toc: resolveBlockTheme(siteTheme.value, areaConfigs.value.toc.themeOverrides),
  footer: resolveBlockTheme(siteTheme.value, areaConfigs.value.footer.themeOverrides)
}))

const siteThemeVars = computed(() => buildSiteThemeVars(siteTheme.value))

function applyThemeScheme(id: string) {
  const scheme = themeSchemes.value.find((item) => item.id === id)
  if (!scheme) return
  activeThemeSchemeId.value = scheme.id
  siteTheme.value = cloneSiteTheme(scheme.theme)
}

function saveThemeScheme() {
  const existing = themeSchemes.value.find((item) => item.id === activeThemeSchemeId.value)
  if (existing && existing.kind === 'custom') {
    existing.theme = cloneSiteTheme(siteTheme.value)
    message.success('主题方案已保存')
    return
  }
  const id = `custom-${Date.now()}`
  themeSchemes.value.push({
    id,
    name: `自定义主题 ${themeSchemes.value.filter((item) => item.kind === 'custom').length + 1}`,
    kind: 'custom',
    theme: cloneSiteTheme(siteTheme.value)
  })
  activeThemeSchemeId.value = id
  message.success('已保存为新的自定义主题方案')
}

function duplicateThemeScheme() {
  const id = `custom-${Date.now()}`
  const source = themeSchemes.value.find((item) => item.id === activeThemeSchemeId.value)
  themeSchemes.value.push({
    id,
    name: `${source?.name || '主题方案'} 副本`,
    kind: 'custom',
    theme: cloneSiteTheme(siteTheme.value)
  })
  activeThemeSchemeId.value = id
  message.success('已复制当前主题方案')
}

function resetThemeScheme() {
  if (activeThemeSchemeId.value.startsWith('custom-')) {
    const current = themeSchemes.value.find((item) => item.id === activeThemeSchemeId.value)
    if (current) {
      current.theme = cloneSiteTheme(createDefaultSiteTheme())
      siteTheme.value = cloneSiteTheme(current.theme)
      message.success('当前自定义主题已重置为默认基线')
      return
    }
  }
  const builtinId = activeThemeSchemeId.value as ThemePresetId
  siteTheme.value = createSiteThemePreset(builtinId)
  message.success('已重置当前预设主题')
}

function hydrateThemeSchemes() {
  if (typeof window === 'undefined') return
  const builtinSchemes = createBuiltinThemeSchemes()
  const rawCustomSchemes = window.localStorage.getItem(THEME_SCHEME_STORAGE_KEY)
  const rawActiveSchemeId = window.localStorage.getItem(ACTIVE_THEME_SCHEME_STORAGE_KEY)

  if (!rawCustomSchemes) {
    themeSchemes.value = builtinSchemes
    if (rawActiveSchemeId) applyThemeScheme(rawActiveSchemeId)
    return
  }

  try {
    const parsed = JSON.parse(rawCustomSchemes) as ThemeScheme[]
    const customSchemes = Array.isArray(parsed) ? parsed.filter((item) => item?.kind === 'custom') : []
    themeSchemes.value = [...builtinSchemes, ...customSchemes]
    const nextId = rawActiveSchemeId || 'docs-light'
    applyThemeScheme(nextId)
  } catch {
    themeSchemes.value = builtinSchemes
  }
}

function saveBuilderState() {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(
    BUILDER_STATE_STORAGE_KEY,
    JSON.stringify({
      componentInstances: componentInstances.value,
      dataSources: dataSources.value,
      siteTheme: siteTheme.value
    })
  )
  message.success('站点构建方案已保存')
}

function hydrateBuilderState() {
  if (typeof window === 'undefined') return
  const raw = window.localStorage.getItem(BUILDER_STATE_STORAGE_KEY)
  if (!raw) return
  try {
    const parsed = JSON.parse(raw) as {
      componentInstances?: BuilderComponentInstance<any>[]
      dataSources?: BuilderDataSource[]
      siteTheme?: SiteThemeConfig
    }
    if (parsed.componentInstances?.length) componentInstances.value = parsed.componentInstances
    if (parsed.dataSources?.length) dataSources.value = parsed.dataSources
    if (parsed.siteTheme) siteTheme.value = parsed.siteTheme
  } catch {
    // ignore invalid local cache
  }
}

function resolveNavTree(menuCode: 'header' | 'sidebar', stage: PreviewMode) {
  if (stage === 'draft') {
    return menuCode === 'header' ? draftHeaderTree.value : draftSidebarTree.value
  }
  return menuCode === 'header' ? publishedHeaderTree.value : publishedSidebarTree.value
}

function extractTreeFromSource(source: BuilderDataSource | null) {
  return Array.isArray(source?.payload?.tree) ? (source.payload.tree as KbNavNode[]) : []
}

function extractSidebarSections(source: BuilderDataSource | null) {
  return Array.isArray(source?.payload?.sections)
    ? (source.payload.sections as Array<{ id?: string; headerNavId: number | null; label?: string; tree: KbNavNode[] }>)
    : []
}

function getBindingSource(componentType: AreaKey, bindingKey: string) {
  const component = componentInstances.value.find((item) => item.type === componentType)
  const sourceId = component?.bindings.find((item) => item.key === bindingKey)?.sourceId
  return dataSources.value.find((item) => item.id === sourceId) || null
}

const previewHeaderTree = computed(() => {
  const source = getBindingSource('header', 'primaryNav')
  const manualTree = extractTreeFromSource(source)
  if (manualTree.length) return manualTree
  const menuCode = (source?.payload.menuCode || 'header') as 'header' | 'sidebar'
  const tree = resolveNavTree(menuCode, previewMode.value)
  return tree.length ? tree : createMockHeaderTree(previewMode.value === 'draft' ? 'DRAFT' : 'PUBLISHED')
})

const previewSidebarTree = computed(() => {
  const source = getBindingSource('sidebar', 'menuNav')
  const mappedTree = extractSidebarSections(source).find((item) => item.headerNavId === selectedHeaderNavId.value)?.tree
  if (mappedTree?.length) return mappedTree
  const manualTree = extractTreeFromSource(source)
  if (manualTree.length) return manualTree
  const menuCode = (source?.payload.menuCode || 'sidebar') as 'header' | 'sidebar'
  const tree = resolveNavTree(menuCode, previewMode.value)
  return tree.length ? tree : createMockSidebarTree(previewMode.value === 'draft' ? 'DRAFT' : 'PUBLISHED')
})

const docOptions = computed(() => {
  const out: Array<{ label: string; value: number }> = []
  const walk = (list: KbTreeNode[], depth = 0) => {
    list.forEach((node) => {
      out.push({ label: `${'— '.repeat(depth)}${node.title}`, value: node.id })
      if (node.children?.length) walk(node.children, depth + 1)
    })
  }
  walk(docsTree.value.length ? docsTree.value : mockDocsTree)
  return out
})

const currentDocId = computed<number | null>(() => {
  const source = getBindingSource('content', 'document')
  return typeof source?.payload.docId === 'number' ? source.payload.docId : 9003
})

const footerPagerTree = computed(() => {
  const pagerSource = getBindingSource('footer', 'pager')
  const navSourceId = pagerSource?.payload.navSourceId as string | undefined
  const navSource = dataSources.value.find((item) => item.id === navSourceId)
  const mappedTree = extractSidebarSections(navSource).find((item) => item.headerNavId === selectedHeaderNavId.value)?.tree
  if (mappedTree?.length) return mappedTree
  const manualTree = extractTreeFromSource(navSource)
  if (manualTree.length) return manualTree
  const menuCode = (navSource?.payload.menuCode || 'sidebar') as 'header' | 'sidebar'
  return resolveNavTree(menuCode, previewMode.value)
})

const prevNextDocs = computed(() => findPrevNextDocs(footerPagerTree.value, currentDocId.value))

const prevDoc = computed(() => prevNextDocs.value.prevDoc)
const nextDoc = computed(() => prevNextDocs.value.nextDoc)

const tocItems = computed(() => {
  return extractTocItems(previewDoc.value?.bodyMd || '')
})

const mainGridStyle = computed(() => {
  const columns = mainSlots.map((slot) => {
    const area = getSlotArea(slot)
    if (area === 'sidebar' || area === 'toc') {
      return `minmax(180px, ${areaConfigs.value[area].width}px)`
    }
    return 'minmax(280px, 1fr)'
  })
  return {
    gridTemplateColumns: columns.join(' ')
  }
})

function getSlotArea(slot: CanvasSlot): AreaKey | null {
  return componentInstances.value.find((item) => item.slot === slot)?.type || null
}

function findSlotByArea(area: AreaKey): CanvasSlot | null {
  return componentInstances.value.find((item) => item.type === area)?.slot || null
}

function isSlotCompatible(area: AreaKey, slot: CanvasSlot) {
  return areaMeta[area].slots.includes(slot)
}

function showAreaInSlot(slot: CanvasSlot) {
  return componentInstances.value.some((item) => item.slot === slot && item.config?.visible !== false)
}

function selectArea(area: AreaKey) {
  selectedArea.value = area
  const slot = findSlotByArea(area)
  if (slot) selectedSlot.value = slot
}

function openInspector(area: AreaKey, slot?: CanvasSlot | null) {
  selectedArea.value = area
  if (slot) selectedSlot.value = slot
  inspectorOpen.value = true
}

function selectSlot(slot: CanvasSlot) {
  selectedSlot.value = slot
  const area = getSlotArea(slot)
  if (area) selectedArea.value = area
}

function onAreaDragStart(area: AreaKey) {
  draggingArea.value = area
  selectedArea.value = area
}

function onAreaDragEnd() {
  draggingArea.value = null
  hoveredSlot.value = null
}

function availableAreasForSlot(slot: CanvasSlot) {
  return (Object.keys(areaMeta) as AreaKey[]).filter((area) => {
    if (!isSlotCompatible(area, slot)) return false
    return true
  })
}

function openMaterialMenu(slot: CanvasSlot) {
  materialMenuSlot.value = materialMenuSlot.value === slot ? null : slot
  hoveredSlot.value = slot
  selectedSlot.value = slot
}

function assignAreaToSlot(area: AreaKey, slot: CanvasSlot) {
  if (!isSlotCompatible(area, slot)) {
    message.warning(`${areaMeta[area].label} 不能放到 ${slotMeta[slot].label}`)
    return
  }
  const instance = componentInstances.value.find((item) => item.type === area)
  if (!instance) return
  instance.slot = slot
  materialMenuSlot.value = null
  selectedArea.value = area
  selectedSlot.value = slot
  inspectorOpen.value = true
}

function removeAreaFromSlot(area: AreaKey) {
  const instance = componentInstances.value.find((item) => item.type === area)
  if (instance) instance.slot = null
  materialMenuSlot.value = null
  if (selectedArea.value === area) {
    selectedArea.value = 'content'
  }
  if (!findSlotByArea(selectedArea.value)) {
    inspectorOpen.value = false
  }
}

function onSlotDrop(slot: CanvasSlot) {
  const area = draggingArea.value
  if (!area) return
  if (!isSlotCompatible(area, slot)) {
    message.warning(`${areaMeta[area].label} 不能放到 ${slotMeta[slot].label}`)
    onAreaDragEnd()
    return
  }
  const instance = componentInstances.value.find((item) => item.type === area)
  if (!instance) return
  instance.slot = slot
  selectedSlot.value = slot
  selectedArea.value = area
  hoveredSlot.value = null
  draggingArea.value = null
  materialMenuSlot.value = null
}

function resetLayout() {
  componentInstances.value = createDefaultComponentInstances()
  dataSources.value = createDefaultDataSources()
  siteTheme.value = createDefaultSiteTheme()
  activeThemeSchemeId.value = 'docs-light'
  selectedArea.value = 'content'
  selectedSlot.value = 'center'
  materialMenuSlot.value = null
}

function saveDataSource(source: BuilderDataSource) {
  const index = dataSources.value.findIndex((item) => item.id === source.id)
  if (index >= 0) {
    dataSources.value[index] = source
    message.success('数据源已更新')
    return
  }
  dataSources.value.push(source)
  message.success('数据源已创建')
}

function walkNavNodes(list: KbNavNode[], targetId: number): KbNavNode | null {
  for (const node of list) {
    if (node.id === targetId) return node
    if (node.children?.length) {
      const found = walkNavNodes(node.children, targetId)
      if (found) return found
    }
  }
  return null
}

function findFirstDocNode(list: KbNavNode[]): KbNavNode | null {
  for (const node of list) {
    if (node.nodeType === 'DOC' && node.docId) return node
    if (node.children?.length) {
      const found = findFirstDocNode(node.children)
      if (found) return found
    }
  }
  return null
}

function applyDocSelection(docId: number | null) {
  if (!docId) return
  const documentSource = getBindingSource('content', 'document')
  if (!documentSource) return
  documentSource.payload.docId = docId
  if (mockDocs[docId]) {
    documentSource.payload.doc = mockDocs[docId]
  }
}

function onNavSelect(payload: { area: 'header' | 'sidebar'; navId: number }) {
  if (payload.area === 'header') {
    selectedHeaderNavId.value = payload.navId
    const firstSidebarDoc = findFirstDocNode(previewSidebarTree.value)
    if (firstSidebarDoc) {
      selectedSidebarNavId.value = firstSidebarDoc.id
      applyDocSelection(firstSidebarDoc.docId || null)
      return
    }
    const headerNode = walkNavNodes(previewHeaderTree.value, payload.navId)
    applyDocSelection(headerNode?.docId || null)
    return
  }

  selectedSidebarNavId.value = payload.navId
  const sidebarNode = walkNavNodes(previewSidebarTree.value, payload.navId)
  applyDocSelection(sidebarNode?.docId || null)
}

async function loadPreviewDoc(docId: number | null) {
  if (!docId) {
    previewDoc.value = null
    return
  }
  const documentSource = getBindingSource('content', 'document')
  if (documentSource?.payload?.doc && documentSource.payload.docId === docId) {
    previewDoc.value = documentSource.payload.doc as KbDoc
    return
  }
  if (mockDocs[docId]) {
    previewDoc.value = mockDocs[docId]
    return
  }
  docLoading.value = true
  try {
    previewDoc.value = await kbApi.getDoc(docId, activeSiteKey.value || undefined)
  } catch (e: any) {
    previewDoc.value = null
    message.error(e?.message || '加载文档失败')
  } finally {
    docLoading.value = false
  }
}

async function loadAll() {
  loading.value = true
  try {
    // 站点列表（用于站点切换）
    if (!sites.value.length) {
      try {
        sites.value = await kbApi.listSites(kbHasAuthToken() ? 'full' : 'public')
        if (!sites.value.some((s) => s.spaceKey === activeSiteKey.value)) {
          activeSiteKey.value = sites.value.find((s) => s.spaceKey === 'default')?.spaceKey || sites.value[0]?.spaceKey || 'default'
        }
      } catch {
        // ignore
      }
    }

    const [side, head, pubSide, pubHead, docs] = await Promise.all([
      kbApi.adminNavTree('sidebar', activeSiteKey.value || undefined),
      kbApi.adminNavTree('header', activeSiteKey.value || undefined),
      kbApi.siteNavTree('sidebar', activeSiteKey.value || undefined),
      kbApi.siteNavTree('header', activeSiteKey.value || undefined),
      kbApi.tree(activeSiteKey.value || undefined, kbHasAuthToken() ? 'full' : 'public')
    ])
    draftSidebarTree.value = side
    draftHeaderTree.value = head
    publishedSidebarTree.value = pubSide
    publishedHeaderTree.value = pubHead
    docsTree.value = docs.length ? docs : mockDocsTree

    if (!currentDocId.value && docOptions.value.length) {
      const documentSource = getBindingSource('content', 'document')
      if (documentSource) documentSource.payload.docId = docOptions.value[0].value
    }
  } catch (e: any) {
    message.error(e?.message || '加载站点数据失败')
  } finally {
    loading.value = false
  }
}

function onSiteChange(v: string) {
  activeSiteKey.value = String(v || 'default')
  // 切站点后重置选中，避免不存在的 navId/docId
  selectedHeaderNavId.value = null
  selectedSidebarNavId.value = null
  previewDoc.value = null
  void loadAll()
}

async function publishMenu(menu: 'header' | 'sidebar') {
  const loadingRef = menu === 'header' ? publishingHeader : publishingSidebar
  loadingRef.value = true
  try {
    await kbApi.publishNav(menu, activeSiteKey.value || undefined)
    message.success(`已发布${menu === 'header' ? '顶部' : '侧栏'}导航`)
    await loadAll()
  } catch (e: any) {
    message.error(e?.message || '发布失败')
  } finally {
    loadingRef.value = false
  }
}

async function publishAll() {
  publishingHeader.value = true
  publishingSidebar.value = true
  try {
    await Promise.all([
      kbApi.publishNav('header', activeSiteKey.value || undefined),
      kbApi.publishNav('sidebar', activeSiteKey.value || undefined)
    ])
    message.success('导航已发布')
    await loadAll()
  } catch (e: any) {
    message.error(e?.message || '发布失败')
  } finally {
    publishingHeader.value = false
    publishingSidebar.value = false
  }
}

watch(
  () => currentDocId.value,
  (docId) => {
    void loadPreviewDoc(docId)
  },
  { immediate: true }
)

watch(
  () => themeSchemes.value,
  (schemes) => {
    if (typeof window === 'undefined') return
    const customSchemes = schemes.filter((item) => item.kind === 'custom')
    window.localStorage.setItem(THEME_SCHEME_STORAGE_KEY, JSON.stringify(customSchemes))
  },
  { deep: true }
)

watch(
  () => activeThemeSchemeId.value,
  (id) => {
    if (typeof window === 'undefined') return
    window.localStorage.setItem(ACTIVE_THEME_SCHEME_STORAGE_KEY, id)
  }
)

onMounted(() => {
  hydrateThemeSchemes()
  hydrateBuilderState()
  const q = route.value.query?.siteKey
  if (typeof q === 'string' && q.trim()) {
    activeSiteKey.value = q.trim()
  }
  void loadAll()
})

watch(
  () => route.value.query?.siteKey,
  (v) => {
    if (typeof v === 'string' && v.trim() && v.trim() !== activeSiteKey.value) {
      activeSiteKey.value = v.trim()
      void loadAll()
    }
  }
)

watch(
  () => previewHeaderTree.value,
  (tree) => {
    if (!tree.length) return
    if (!selectedHeaderNavId.value || !walkNavNodes(tree, selectedHeaderNavId.value)) {
      selectedHeaderNavId.value = tree[0]?.id || null
    }
  },
  { immediate: true }
)

watch(
  () => previewSidebarTree.value,
  (tree) => {
    if (!tree.length) {
      selectedSidebarNavId.value = null
      return
    }
    if (!selectedSidebarNavId.value || !walkNavNodes(tree, selectedSidebarNavId.value)) {
      const firstDoc = findFirstDocNode(tree)
      selectedSidebarNavId.value = firstDoc?.id || tree[0]?.id || null
      applyDocSelection(firstDoc?.docId || null)
    }
  },
  { immediate: true }
)
</script>

<style scoped>
.kb-site-builder {
  min-height: 100%;
  display: flex;
  flex-direction: column;
  background:
    radial-gradient(circle at top left, color-mix(in srgb, var(--kb-block-selected-border) 12%, transparent) 0%, transparent 24%),
    linear-gradient(180deg, var(--kb-page-bg) 0%, color-mix(in srgb, var(--kb-page-bg) 86%, #eef2f7 14%) 100%);
  color: #0f172a;
}

.page-header-wrapper {
  flex-shrink: 0;
}

.kb-page-header-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 12px;
  flex-wrap: wrap;
}

.kb-page-header-group {
  display: flex;
  align-items: center;
  gap: 10px;
  min-height: 48px;
  padding: 6px 10px;
  border-radius: 999px;
  border: 1px solid var(--kb-studio-panel-border);
  background: #fff;
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.04);
}

.kb-site-builder__body {
  flex: 1;
  display: grid;
  grid-template-columns: minmax(0, 1fr) 320px;
  gap: 18px;
  padding: 0 20px 24px;
  min-width: 0;
}

.kb-studio-panel,
.kb-canvas-frame,
.kb-canvas-toolbar {
  background: var(--kb-studio-panel-bg);
  border: 1px solid var(--kb-studio-panel-border);
  box-shadow: var(--kb-studio-panel-shadow);
  backdrop-filter: blur(10px);
}

.kb-studio-panel {
  border-radius: 24px;
  padding: 18px;
  min-width: 0;
  overflow: hidden;
}

.kb-studio-panel__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 14px;
}

.kb-studio-panel__eyebrow {
  display: inline-flex;
  align-items: center;
  height: 24px;
  padding: 0 10px;
  border-radius: 999px;
  background: var(--kb-studio-eyebrow-bg);
  color: var(--kb-studio-eyebrow-text);
  font-size: 11px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.kb-studio-panel__header h3 {
  margin: 10px 0 0;
  font-size: 20px;
}

.kb-text-button {
  border: none;
  background: transparent;
  color: #2563eb;
  font-size: 13px;
  cursor: pointer;
}

.kb-section-title {
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--kb-studio-eyebrow-text);
}

.kb-layer-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border: 1px dashed #cbd5e1;
  border-radius: 16px;
  cursor: pointer;
  background: rgba(248, 250, 252, 0.7);
}

.kb-layer-row--active {
  border-color: #60a5fa;
  background: rgba(239, 246, 255, 0.9);
}

.kb-layer-row__slot {
  width: 52px;
  flex-shrink: 0;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  color: #2563eb;
}

.kb-layer-row__content {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.kb-layer-row__content strong {
  font-size: 14px;
}

.kb-layer-row__content small {
  color: #64748b;
}

.kb-studio-canvas {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.kb-canvas-toolbar {
  border-radius: 22px;
  padding: 12px 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.kb-canvas-toolbar__left,
.kb-canvas-toolbar__right {
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 8px;
}

.kb-studio-chip {
  display: inline-flex;
  align-items: center;
  height: 28px;
  padding: 0 12px;
  border-radius: 999px;
  background: var(--kb-studio-chip-bg);
  color: var(--kb-studio-chip-text);
  font-size: 12px;
  font-weight: 600;
}

.kb-studio-chip--muted {
  background: transparent;
  color: var(--kb-studio-chip-muted-text);
}

.kb-canvas-frame {
  border-radius: 28px;
  padding: 18px;
  min-height: 920px;
}

.kb-drop-slot {
  transition: 0.18s ease;
}

.kb-drop-slot--hot {
  transform: translateY(-2px);
}

.kb-drop-slot__placeholder {
  position: relative;
  min-height: 120px;
  border: 1px dashed #bfd4f8;
  border-radius: 24px;
  background: linear-gradient(180deg, rgba(248, 250, 252, 0.88), rgba(239, 246, 255, 0.74));
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  gap: 8px;
  color: #64748b;
  text-align: center;
}

.kb-drop-slot__placeholder strong {
  color: #0f172a;
}

.kb-inline-add {
  position: absolute;
  left: -18px;
  top: 50%;
  transform: translateY(-50%);
  width: 38px;
  height: 38px;
  border: none;
  border-radius: 999px;
  background: #2563eb;
  color: #fff;
  font-size: 24px;
  line-height: 1;
  cursor: pointer;
  box-shadow: 0 10px 24px rgba(37, 99, 235, 0.28);
}

.kb-material-menu {
  position: absolute;
  left: 28px;
  top: 50%;
  transform: translateY(-50%);
  width: 260px;
  padding: 10px;
  border-radius: 18px;
  border: 1px solid rgba(226, 232, 240, 0.95);
  background: rgba(255, 255, 255, 0.98);
  box-shadow: 0 18px 42px rgba(15, 23, 42, 0.12);
  z-index: 10;
  display: grid;
  gap: 8px;
}

.kb-material-menu__item {
  border: 1px solid #e2e8f0;
  background: #fff;
  border-radius: 14px;
  padding: 10px 12px;
  text-align: left;
  cursor: pointer;
  display: grid;
  gap: 4px;
}

.kb-material-menu__item strong {
  font-size: 14px;
}

.kb-material-menu__item span {
  font-size: 12px;
  line-height: 1.5;
  color: #64748b;
}

.kb-preview-header,
.kb-preview-sidebar,
.kb-preview-content,
.kb-preview-toc,
.kb-preview-footer {
  background: rgba(255, 255, 255, 0.96);
  border: 1px solid rgba(226, 232, 240, 0.95);
  box-shadow: 0 12px 30px rgba(15, 23, 42, 0.05);
  position: relative;
}

.is-selected {
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.14), 0 12px 30px rgba(15, 23, 42, 0.05);
  border-color: #60a5fa;
}

.kb-preview-header {
  height: 74px;
  border-radius: 24px;
  padding: 0 22px;
  display: grid;
  grid-template-columns: auto auto minmax(0, 1fr) auto;
  align-items: center;
  gap: 18px;
  margin-bottom: 18px;
}

.kb-preview-header--sticky {
  position: sticky;
  top: 0;
  z-index: 2;
}

.kb-preview-header__brand {
  display: flex;
  align-items: center;
  gap: 12px;
}

.kb-preview-header__logo {
  width: 36px;
  height: 36px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #0f172a;
  color: #fff;
  font-weight: 800;
}

.kb-preview-header__title-group {
  display: flex;
  flex-direction: column;
}

.kb-preview-header__title-group small {
  color: #64748b;
  font-size: 12px;
}

.kb-preview-header__search {
  height: 44px;
  min-width: 240px;
  padding: 0 14px;
  border-radius: 999px;
  background: #f5f5f4;
  display: flex;
  align-items: center;
  justify-content: space-between;
  color: #78716c;
}

.kb-preview-header__search kbd {
  border-radius: 8px;
  background: #fff;
  padding: 2px 6px;
  font-size: 11px;
}

.kb-preview-header__nav {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  min-width: 0;
}

.kb-preview-header__actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.kb-header-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 34px;
  height: 34px;
  padding: 0 10px;
  border: 1px solid #d6d3d1;
  border-radius: 12px;
  background: #fff;
  color: #57534e;
  font-size: 12px;
}

.kb-block-actions {
  position: absolute;
  top: 12px;
  right: 12px;
  display: flex;
  align-items: center;
  gap: 8px;
  opacity: 0;
  transition: opacity 0.18s ease;
}

.kb-preview-header:hover .kb-block-actions,
.kb-preview-sidebar:hover .kb-block-actions,
.kb-preview-content:hover .kb-block-actions,
.kb-preview-toc:hover .kb-block-actions,
.kb-preview-footer:hover .kb-block-actions,
.is-selected .kb-block-actions {
  opacity: 1;
}

.kb-block-actions__button {
  border: 1px solid rgba(226, 232, 240, 0.95);
  background: rgba(255, 255, 255, 0.96);
  color: #475569;
  border-radius: 999px;
  height: 30px;
  padding: 0 12px;
  font-size: 12px;
  cursor: pointer;
}

.kb-preview-main {
  display: grid;
  align-items: start;
  gap: 32px;
}

.kb-preview-sidebar,
.kb-preview-toc {
  border-radius: 24px;
  padding: 18px 0;
}

.kb-preview-sidebar--sticky,
.kb-preview-toc--sticky {
  position: sticky;
  top: 92px;
}

.kb-preview-panel__title {
  padding: 0 18px 14px;
  font-size: 24px;
  font-weight: 800;
  letter-spacing: -0.02em;
}

.kb-preview-sidebar__section {
  padding: 0 18px 12px;
  font-size: 12px;
  color: #64748b;
}

.kb-preview-sidebar__tree {
  padding: 0 10px;
}

.kb-preview-content {
  border-radius: 28px;
  padding: 28px 30px 36px;
}

.kb-preview-content__head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 18px;
}

.kb-preview-content__eyebrow {
  display: inline-flex;
  margin-bottom: 10px;
  font-size: 11px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: #64748b;
}

.kb-preview-content__head h1 {
  margin: 0;
  font-size: 44px;
  line-height: 1.04;
  letter-spacing: -0.04em;
}

.kb-preview-content__meta {
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 12px;
  color: #64748b;
  text-align: right;
}

.kb-preview-content__body {
  margin: 0 auto;
}

.kb-preview-content__body :deep(.kb-doc-body__prose),
.kb-preview-content__body :deep(.kb-doc-body__frame-wrap) {
  border: none;
  border-radius: 0;
  padding: 0;
  box-shadow: none;
  background: transparent;
}

.kb-preview-content__body :deep(.kb-doc-body__prose) {
  font-size: 17px;
  line-height: 1.92;
}

.kb-preview-content__body :deep(.kb-doc-body__prose h1),
.kb-preview-content__body :deep(.kb-doc-body__prose h2),
.kb-preview-content__body :deep(.kb-doc-body__prose h3) {
  letter-spacing: -0.03em;
}

.kb-preview-toc__list {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 0 10px;
}

.kb-preview-toc__item {
  border: none;
  background: transparent;
  text-align: left;
  min-height: 34px;
  border-radius: 12px;
  color: #475569;
  cursor: pointer;
  padding-right: 10px;
}

.kb-preview-toc__item:hover {
  background: #eef2ff;
  color: #1d4ed8;
}

.kb-preview-footer {
  margin-top: 18px;
  border-radius: 28px;
  padding: 22px;
}

.kb-preview-footer__meta {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 18px;
}

.kb-preview-footer__meta span {
  color: #64748b;
  line-height: 1.6;
}

.kb-preview-footer__pager {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}

.kb-page-card {
  min-height: 110px;
  border-radius: 22px;
  padding: 18px 20px;
  border: 1px solid #e7e5e4;
  background: #fff;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 8px;
}

.kb-page-card small {
  color: #78716c;
}

.kb-page-card--next {
  text-align: right;
}

.kb-preview-empty {
  display: inline-flex;
  align-items: center;
  min-height: 40px;
  color: #94a3b8;
  font-size: 13px;
}

.kb-slot-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 72px;
  height: 28px;
  padding: 0 10px;
  border-radius: 999px;
  background: #eef2ff;
  color: #4338ca;
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
}

.kb-inspector-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.16);
  z-index: 30;
}

.kb-studio-panel--inspector {
  position: fixed;
  top: 0;
  right: 0;
  width: min(360px, 92vw);
  height: 100vh;
  border-radius: 24px 0 0 24px;
  border-right: none;
  z-index: 31;
  overflow-y: auto;
  transform: translateX(104%);
  transition: transform 0.22s ease;
}

.kb-studio-panel--inspector-open {
  transform: translateX(0);
}

.kb-inspector-header-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.kb-inspector-section {
  display: grid;
  gap: 12px;
  padding-top: 14px;
  margin-top: 14px;
  border-top: 1px solid #e2e8f0;
}

.kb-field {
  display: grid;
  gap: 8px;
}

.kb-field span {
  font-size: 13px;
  color: #475569;
}

.kb-native-input,
.kb-range-input {
  width: 100%;
}

.kb-native-input {
  height: 38px;
  border: 1px solid #d1d5db;
  border-radius: 12px;
  padding: 0 12px;
  outline: none;
  background: #fff;
}

.kb-check-row {
  display: flex;
  align-items: center;
  gap: 10px;
  min-height: 36px;
  color: #334155;
}

.kb-range-input {
  accent-color: #2563eb;
}

.kb-tips {
  margin: 0;
  padding-left: 18px;
  color: #475569;
  line-height: 1.8;
}

@media (max-width: 1560px) {
  .kb-site-builder__body {
    grid-template-columns: minmax(0, 1fr);
  }
}

@media (max-width: 1120px) {
  .kb-page-header-actions {
    justify-content: flex-start;
  }

  .kb-page-header-group {
    width: 100%;
    justify-content: flex-start;
    border-radius: 18px;
  }

  .kb-site-builder__body {
    grid-template-columns: 1fr;
    padding: 16px;
  }

  .kb-preview-header {
    grid-template-columns: 1fr;
    height: auto;
    padding: 18px;
  }

  .kb-preview-main {
    grid-template-columns: 1fr !important;
  }

  .kb-preview-footer__pager {
    grid-template-columns: 1fr;
  }

  .kb-inline-add {
    left: 12px;
    top: 12px;
    transform: none;
  }

  .kb-material-menu {
    left: 12px;
    top: 56px;
    transform: none;
    width: min(260px, calc(100% - 24px));
  }

  .kb-canvas-toolbar {
    flex-direction: column;
    align-items: stretch;
  }
}

/* WYSIWYG overrides: editing should look like final site */
.kb-site-builder {
  background: #f8f8f6;
  color: #111827;
}

.kb-site-builder__body {
  gap: 0;
  padding: 0;
}

.kb-studio-canvas {
  gap: 0;
}

.kb-canvas-toolbar {
  position: sticky;
  top: 0;
  z-index: 5;
  padding: 10px 28px;
  border-radius: 0;
  border: none;
  border-bottom: 1px solid #ececec;
  background: rgba(248, 248, 246, 0.92);
  box-shadow: none;
  backdrop-filter: blur(12px);
}

.kb-studio-chip {
  background: #eef2f7;
  color: #4b5563;
}

.kb-studio-chip--muted {
  background: transparent;
  color: #9ca3af;
}

.kb-canvas-frame {
  border: none;
  border-radius: 0;
  box-shadow: none;
  backdrop-filter: none;
  background: #f8f8f6;
  padding: 14px 28px 42px;
}

.kb-drop-slot--hot {
  transform: none;
}

.kb-drop-slot__placeholder {
  min-height: 96px;
  border: 1px dashed rgba(59, 130, 246, 0.22);
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.45);
  gap: 6px;
  color: #94a3b8;
}

.kb-drop-slot__placeholder strong {
  color: #334155;
  font-size: 16px;
}

.kb-inline-add {
  left: -16px;
  width: 34px;
  height: 34px;
  font-size: 22px;
  opacity: 0;
  box-shadow: 0 8px 18px rgba(37, 99, 235, 0.22);
  transition: opacity 0.16s ease;
}

.kb-drop-slot__placeholder:hover .kb-inline-add,
.kb-drop-slot--hot .kb-inline-add {
  opacity: 1;
}

.kb-preview-header,
.kb-preview-sidebar,
.kb-preview-content,
.kb-preview-toc,
.kb-preview-footer {
  background: transparent;
  border: 1px solid transparent;
  box-shadow: none;
}

.kb-preview-header:hover,
.kb-preview-sidebar:hover,
.kb-preview-content:hover,
.kb-preview-toc:hover,
.kb-preview-footer:hover {
  border-color: rgba(96, 165, 250, 0.24);
}

.is-selected {
  border-color: #6aa2ff;
  border-radius: 20px;
  box-shadow: 0 0 0 2px rgba(96, 165, 250, 0.18);
}

.kb-preview-header {
  height: auto;
  min-height: 72px;
  padding: 6px 0 16px;
  margin-bottom: 18px;
  border-radius: 0;
  border-bottom: 1px solid #ececec;
}

.kb-preview-header--sticky {
  top: 48px;
  background: rgba(248, 248, 246, 0.94);
  backdrop-filter: blur(12px);
}

.kb-preview-header__brand {
  gap: 16px;
}

.kb-preview-header__logo {
  width: 46px;
  height: 46px;
  border-radius: 12px;
  background: #111827;
  font-size: 22px;
}

.kb-preview-header__title-group strong {
  display: block;
  font-size: 18px;
  font-weight: 700;
}

.kb-preview-header__search {
  height: 46px;
  padding: 0 16px;
  background: #f4f4f3;
}

.kb-preview-header__search kbd {
  padding: 2px 8px;
  color: #6b7280;
}

.kb-preview-header__nav {
  gap: 18px;
}

.kb-preview-header__actions {
  gap: 12px;
}

.kb-header-icon {
  min-width: 38px;
  height: 38px;
  border-color: #d6d6d6;
  color: #6b7280;
}

.kb-block-actions {
  top: 10px;
  right: 8px;
  opacity: 0;
}

.kb-preview-header:hover .kb-block-actions,
.kb-preview-sidebar:hover .kb-block-actions,
.kb-preview-content:hover .kb-block-actions,
.kb-preview-toc:hover .kb-block-actions,
.kb-preview-footer:hover .kb-block-actions,
.is-selected .kb-block-actions {
  opacity: 1;
}

.kb-block-actions__button {
  border-color: #dfdfdf;
  color: #6b7280;
}

.kb-preview-main {
  gap: 32px;
}

.kb-preview-sidebar,
.kb-preview-toc {
  padding: 18px 0 0;
  border-radius: 0;
}

.kb-preview-sidebar--sticky,
.kb-preview-toc--sticky {
  top: 96px;
}

.kb-preview-panel__title {
  padding: 0 10px 14px;
  font-size: 16px;
  font-weight: 700;
  color: #111827;
}

.kb-preview-sidebar__section {
  padding: 0 10px 12px;
}

.kb-preview-sidebar__tree {
  padding: 0 0 0 6px;
}

.kb-preview-content {
  min-height: 68vh;
  padding: 12px 12px 36px;
  border-radius: 0;
}

.kb-preview-content__head {
  margin-bottom: 20px;
}

.kb-preview-content__eyebrow {
  letter-spacing: 0.14em;
}

.kb-preview-content__head h1 {
  font-size: 52px;
  letter-spacing: -0.05em;
  font-weight: 800;
}

.kb-preview-content__meta {
  padding-top: 10px;
}

.kb-preview-content__body :deep(.kb-doc-body__prose),
.kb-preview-content__body :deep(.kb-doc-body__frame-wrap) {
  border: none;
  border-radius: 0;
  padding: 0;
  background: transparent;
  box-shadow: none;
}

.kb-preview-content__body :deep(.kb-doc-body__prose) {
  font-size: 18px;
  line-height: 1.92;
  color: #292929;
}

.kb-preview-content__body :deep(.kb-doc-body__prose h1),
.kb-preview-content__body :deep(.kb-doc-body__prose h2),
.kb-preview-content__body :deep(.kb-doc-body__prose h3) {
  color: #111827;
  font-weight: 800;
  letter-spacing: -0.03em;
}

.kb-preview-content__body :deep(.kb-doc-body__prose h1) {
  font-size: 2.7rem;
}

.kb-preview-content__body :deep(.kb-doc-body__prose h2) {
  font-size: 2rem;
}

.kb-preview-content__body :deep(.kb-doc-body__prose h3) {
  font-size: 1.45rem;
}

.kb-preview-content__body :deep(.kb-doc-body__prose blockquote) {
  margin: 1.2rem 0;
  padding-left: 1rem;
  border-left: 3px solid #d4d4d4;
  color: #5b5b5b;
}

.kb-preview-content__body :deep(.kb-doc-body__empty) {
  text-align: left;
  padding-left: 0;
}

.kb-preview-toc__list {
  padding: 0 6px;
}

.kb-preview-toc__item {
  color: #4b5563;
}

.kb-preview-footer {
  margin-top: 22px;
  padding: 28px 12px 0;
  border-top: 1px solid #ececec;
  border-radius: 0;
}

.kb-preview-footer__pager {
  gap: 22px;
}

.kb-page-card {
  padding: 18px 22px;
  border-radius: 22px;
  border-color: #e7e5e4;
}

.kb-inspector-backdrop {
  background: rgba(15, 23, 42, 0.08);
}

.kb-studio-panel--inspector {
  border-radius: 0;
  border: none;
  border-left: 1px solid #ececec;
  box-shadow: -20px 0 40px rgba(15, 23, 42, 0.06);
}

@media (max-width: 1120px) {
  .kb-site-builder__body {
    padding: 0;
  }

  .kb-canvas-toolbar {
    padding: 12px 16px;
  }

  .kb-canvas-frame {
    padding: 16px;
  }

  .kb-preview-header {
    padding: 8px 0 14px;
  }

  .kb-preview-main {
    gap: 20px;
  }

  .kb-inline-add {
    left: 12px;
    top: 12px;
    transform: none;
    opacity: 1;
  }
}
</style>
