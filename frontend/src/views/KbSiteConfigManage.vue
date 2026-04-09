<template>
  <div class="kb-site-config-page">
    <div class="page-header-wrapper">
      <PageHeader title="站点配置构建器" subtitle="基于 PersistedSiteConfig 的新一代 Builder">
        <template #actions>
          <n-space>
            <n-button secondary @click="resetConfig">重置</n-button>
            <n-button secondary @click="previewMode = previewMode === 'desktop' ? 'mobile' : 'desktop'">
              {{ previewMode === 'desktop' ? '移动端预览' : '桌面端预览' }}
            </n-button>
            <n-button type="primary" @click="saveLocal">保存草稿</n-button>
          </n-space>
        </template>
      </PageHeader>
    </div>

    <div class="kb-site-config-page__body">
      <n-card title="站点结构" size="small" class="kb-site-config-page__panel">
        <n-scrollbar style="max-height: calc(100vh - 180px)">
          <div class="kb-builder-tree">
            <template v-for="node in builderTree" :key="node.id">
              <button type="button" class="kb-builder-tree__item" :class="{ 'is-active': selectedNodeId === node.id }" @click="selectNode(node.id)">
                {{ node.label }}
              </button>
              <div v-if="node.children?.length" class="kb-builder-tree__children">
                <button
                  v-for="child in node.children"
                  :key="child.id"
                  type="button"
                  class="kb-builder-tree__item kb-builder-tree__item--child"
                  :class="{ 'is-active': selectedNodeId === child.id }"
                  @click="selectNode(child.id)"
                >
                  {{ child.label }}
                </button>
              </div>
            </template>
          </div>
        </n-scrollbar>
      </n-card>

      <n-card title="站点预览" size="small" class="kb-site-config-page__panel kb-site-config-page__panel--preview">
        <KbSiteConfigPreview
          :config="config"
          :active-page="activePage"
          :preview-mode="previewMode"
          @select-route="onNavbarRouteSelect"
          @select-page="onSidebarPageSelect"
        />
      </n-card>

      <n-card :title="selectedNode?.label || '配置'" size="small" class="kb-site-config-page__panel">
        <n-scrollbar style="max-height: calc(100vh - 180px)">
          <KbSiteConfigInspector
            :config="config"
            :selected-node="selectedNode"
            :sections="inspectorSections"
            :issues="validationIssues"
          >
            <template #custom-content>
              <div class="kb-inspector-custom">
                <template v-if="selectedNode?.id === 'site-navbar-brand'">
                  <n-card title="品牌" size="small">
                    <div class="kb-dynamic-block">
                      <div class="kb-dynamic-block__row">
                        <n-input v-model:value="config.navigation.navbar.brand.name" placeholder="品牌名称" />
                        <n-input v-model:value="config.navigation.navbar.brand.logoText" placeholder="Logo 文字" />
                      </div>
                    </div>
                  </n-card>
                </template>

                <template v-if="selectedNode?.id === 'site-navbar-items' || selectedNode?.paneId === 'navbar'">
                  <n-card title="导航菜单" size="small">
                    <n-dynamic-input :value="config.navigation.navbar.items" show-sort-button :on-create="createNavbarItem" @update:value="updateNavbarItems">
                      <template #create-button-default>新增导航项</template>
                      <template #default="{ value: item, index }">
                        <div class="kb-dynamic-block">
                          <div class="kb-dynamic-block__row">
                            <n-input v-model:value="item.label" placeholder="导航名称" />
                            <n-select v-model:value="item.kind" :options="navKindOptions" @update:value="normalizeNavbarItem(item)" />
                          </div>
                          <div v-if="item.kind === 'link'" class="kb-dynamic-block__row">
                            <n-select v-model:value="item.routeKey" :options="pageRouteOptions" filterable clearable placeholder="绑定 routeKey" />
                            <n-select v-model:value="item.type" :options="navLinkTypeOptions" />
                          </div>
                          <div v-else class="kb-dynamic-block__children">
                            <div class="kb-dynamic-block__title">子项</div>
                            <n-dynamic-input :value="item.children" show-sort-button :on-create="createNavbarChild" @update:value="updateNavbarChildren(index, $event)">
                              <template #default="{ value: child }">
                                <div class="kb-dynamic-block__row">
                                  <n-input v-model:value="child.label" placeholder="子项名称" />
                                  <n-select v-model:value="child.routeKey" :options="pageRouteOptions" filterable clearable placeholder="绑定 routeKey" />
                                </div>
                              </template>
                            </n-dynamic-input>
                          </div>
                        </div>
                      </template>
                    </n-dynamic-input>
                  </n-card>
                </template>

                <template v-if="selectedNode?.paneId === 'sidebar'">
                  <n-card title="侧栏树" size="small">
                    <n-dynamic-input :value="config.navigation.sidebar?.sections || []" show-sort-button :on-create="createSidebarSection" @update:value="updateSidebarSections">
                      <template #create-button-default>新增侧栏分组</template>
                      <template #default="{ value: section, index }">
                        <div class="kb-dynamic-block">
                          <div class="kb-dynamic-block__row">
                            <n-input v-model:value="section.groupLabel" placeholder="分组标题" />
                            <n-select v-model:value="section.navbarItemId" :options="navbarRouteOptions" placeholder="绑定顶部导航" clearable />
                          </div>
                          <n-dynamic-input :value="section.items" show-sort-button :on-create="createSidebarItem" @update:value="updateSidebarItems(index, $event)">
                            <template #default="{ value: item, index: childIndex }">
                              <div class="kb-dynamic-block">
                                <div class="kb-dynamic-block__row">
                                  <n-input v-model:value="item.label" placeholder="侧栏项名称" />
                                  <n-select v-model:value="item.kind" :options="sidebarKindOptions" @update:value="normalizeSidebarItem(item)" />
                                </div>
                                <div v-if="item.kind === 'item'" class="kb-dynamic-block__row">
                                  <n-select v-model:value="item.pageId" :options="pageIdOptions" filterable clearable placeholder="绑定 pageId" />
                                  <n-input v-model:value="item.badge" placeholder="徽标" />
                                </div>
                                <div v-else class="kb-dynamic-block__children">
                                  <div class="kb-dynamic-block__title">子项</div>
                                  <n-dynamic-input :value="item.children" show-sort-button :on-create="createSidebarLeaf" @update:value="updateSidebarChildren(index, childIndex, $event)">
                                    <template #default="{ value: child }">
                                      <div class="kb-dynamic-block__row">
                                        <n-input v-model:value="child.label" placeholder="子项名称" />
                                        <n-select v-model:value="child.pageId" :options="pageIdOptions" filterable clearable placeholder="绑定 pageId" />
                                      </div>
                                    </template>
                                  </n-dynamic-input>
                                </div>
                              </div>
                            </template>
                          </n-dynamic-input>
                        </div>
                      </template>
                    </n-dynamic-input>
                  </n-card>
                </template>

                <template v-if="selectedNode?.paneId === 'pages'">
                  <n-card title="页面内容" size="small">
                    <n-dynamic-input :value="config.content.pages" show-sort-button :on-create="createPage" @update:value="updatePages">
                      <template #create-button-default>新增页面</template>
                      <template #default="{ value: page }">
                        <div class="kb-dynamic-block">
                          <div class="kb-dynamic-block__row">
                            <n-input v-model:value="page.id" placeholder="pageId" />
                            <n-input v-model:value="page.routeKey" placeholder="routeKey" />
                          </div>
                          <div class="kb-dynamic-block__row">
                            <n-input v-model:value="page.title" placeholder="标题" />
                            <n-input v-model:value="page.author" placeholder="作者" />
                          </div>
                          <n-input v-model:value="page.description" type="textarea" :autosize="{ minRows: 2, maxRows: 4 }" placeholder="描述" />
                          <n-input v-model:value="page.body" type="textarea" :autosize="{ minRows: 4, maxRows: 8 }" placeholder="正文" />
                        </div>
                      </template>
                    </n-dynamic-input>
                  </n-card>
                </template>

                <template v-if="selectedNode?.paneId === 'slots'">
                  <n-card title="插槽实例" size="small">
                    <n-dynamic-input :value="config.slots" show-sort-button :on-create="createSlotInstance" @update:value="updateSlots">
                      <template #create-button-default>新增插槽实例</template>
                      <template #default="{ value: slot }">
                        <div class="kb-dynamic-block">
                          <div class="kb-dynamic-block__row">
                            <n-select v-model:value="slot.slotKey" :options="slotOptions" />
                            <n-select v-model:value="slot.componentKey" :options="slotComponentOptions" @update:value="normalizeSlot(slot)" />
                          </div>
                          <label class="kb-check-row">
                            <n-switch v-model:value="slot.visible" />
                            <span>显示该插槽</span>
                          </label>
                          <n-input v-model:value="slot.props.title" placeholder="标题" />
                          <n-input v-model:value="slot.props.text" type="textarea" :autosize="{ minRows: 2, maxRows: 5 }" placeholder="文案" />
                        </div>
                      </template>
                    </n-dynamic-input>
                  </n-card>
                </template>

                <template v-if="selectedNode?.paneId === 'bindings'">
                  <n-card title="联动规则" size="small">
                    <n-data-table :columns="bindingColumns" :data="config.bindings" :pagination="false" />
                  </n-card>
                </template>
              </div>
            </template>
          </KbSiteConfigInspector>
        </n-scrollbar>
      </n-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { PageHeader } from '@keqi.gress/plugin-ui'
import type {
  BuilderTreeNode,
  InspectorSectionSchema,
  NavItem,
  NavbarGroupItem,
  NavbarLinkItem,
  PersistedSiteConfig,
  SidebarBranchNode,
  SidebarLeafNode,
  SidebarSection,
  SiteConfigValidationIssue,
  SitePage,
  SlotInstance
} from '../types/siteConfig'
import { builderTreeBlueprint, createDefaultLayoutConfig, createDefaultSiteConfig, createInspectorSchemas, slotComponentSchemas, slotDefinitions, validateSiteConfig } from '../utils/siteConfig'
import KbSiteConfigInspector from '../components/site-config/KbSiteConfigInspector.vue'
import KbSiteConfigPreview from '../components/site-config/KbSiteConfigPreview.vue'

const STORAGE_KEY = 'kb-site-config-manage-v1'

const saved = typeof window !== 'undefined' ? window.localStorage.getItem(STORAGE_KEY) : null
const config = ref<PersistedSiteConfig>(saved ? JSON.parse(saved) : createDefaultSiteConfig('docs'))
const selectedNodeId = ref('site-meta')
const previewMode = ref<'desktop' | 'mobile'>('desktop')

const builderTree = builderTreeBlueprint
const selectedNode = computed(() => findTreeNode(builderTree, selectedNodeId.value))
const inspectorSchemaMap = computed(() => createInspectorSchemas(config.value))
const validationIssues = computed<SiteConfigValidationIssue[]>(() => validateSiteConfig(config.value))
const inspectorSections = computed<InspectorSectionSchema[]>(() => {
  const paneId = selectedNode.value?.paneId
  return paneId ? inspectorSchemaMap.value[paneId] || [] : []
})
const activePage = computed(() => {
  const route = config.value.meta.defaultRoute || firstNavbarRoute(config.value.navigation.navbar.items)
  return config.value.content.pages.find((page) => page.routeKey === route) || config.value.content.pages[0]
})

const siteTypeOptions = [
  { label: '文档站', value: 'docs' },
  { label: '博客', value: 'blog' },
  { label: '落地页', value: 'landing' }
]

const navKindOptions = [
  { label: '链接', value: 'link' },
  { label: '分组', value: 'group' }
]

const navLinkTypeOptions = [
  { label: '普通链接', value: 'link' },
  { label: 'CTA', value: 'cta' }
]

const sidebarKindOptions = [
  { label: '页面项', value: 'item' },
  { label: '分组', value: 'group' }
]

const slotOptions = computed(() => {
  const layoutId = config.value.layout.layoutId
  return slotDefinitions.filter((item) => item.layoutIds.includes(layoutId)).map((item) => ({ label: item.label, value: item.slotKey }))
})

const slotComponentOptions = slotComponentSchemas.map((item) => ({ label: item.label, value: item.componentKey }))
const navbarRouteOptions = computed(() =>
  flattenNavbarLinks(config.value.navigation.navbar.items).map((item) => ({ label: item.label, value: item.id }))
)
const pageRouteOptions = computed(() => config.value.content.pages.map((item) => ({ label: `${item.title} · ${item.routeKey}`, value: item.routeKey })))
const pageIdOptions = computed(() => config.value.content.pages.map((item) => ({ label: `${item.title} · ${item.id}`, value: item.id })))

const bindingColumns = [
  { title: 'ID', key: 'id' },
  { title: '目标', key: 'target.path' },
  { title: '来源', key: 'source.path' }
]

function selectNode(id: string) {
  selectedNodeId.value = id
}

function findTreeNode(list: BuilderTreeNode[], id: string): BuilderTreeNode | null {
  for (const item of list) {
    if (item.id === id) return item
    const found = item.children?.length ? findTreeNode(item.children, id) : null
    if (found) return found
  }
  return null
}

function onSiteTypeChange(value: string) {
  config.value.meta.siteType = value
  config.value.layout = createDefaultLayoutConfig(value)
}

function saveLocal() {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(config.value))
}

function resetConfig() {
  config.value = createDefaultSiteConfig('docs')
  selectedNodeId.value = 'site-meta'
}

function createNavbarItem(): NavItem {
  return {
    id: createId('nav'),
    kind: 'link',
    label: '新导航',
    routeKey: '/docs/getting-started',
    type: 'link'
  }
}

function createNavbarChild(): NavbarLinkItem {
  return {
    id: createId('nav-child'),
    kind: 'link',
    label: '子导航',
    routeKey: '/docs/getting-started',
    type: 'link'
  }
}

function normalizeNavbarItem(item: NavItem) {
  if (item.kind === 'group') {
    ;(item as NavbarGroupItem).children = (item as NavbarGroupItem).children || [createNavbarChild()]
    return
  }
  delete (item as NavbarGroupItem).children
  ;(item as NavbarLinkItem).routeKey = (item as NavbarLinkItem).routeKey || '/docs/getting-started'
  ;(item as NavbarLinkItem).type = (item as NavbarLinkItem).type || 'link'
}

function updateNavbarItems(value: NavItem[]) {
  config.value.navigation.navbar.items = value
}

function updateNavbarChildren(index: number, value: NavbarLinkItem[]) {
  const target = config.value.navigation.navbar.items[index]
  if (!target || target.kind !== 'group') return
  target.children = value
}

function createSidebarSection(): SidebarSection {
  return {
    id: createId('section'),
    groupLabel: '新分组',
    items: [createSidebarItem()]
  }
}

function createSidebarItem(): SidebarLeafNode | SidebarBranchNode {
  return {
    id: createId('sidebar-item'),
    kind: 'item',
    label: '新侧栏项',
    pageId: config.value.content.pages[0]?.id || ''
  }
}

function createSidebarLeaf(): SidebarLeafNode {
  return {
    id: createId('sidebar-leaf'),
    kind: 'item',
    label: '子页面',
    pageId: config.value.content.pages[0]?.id || ''
  }
}

function normalizeSidebarItem(item: SidebarLeafNode | SidebarBranchNode) {
  if (item.kind === 'group') {
    ;(item as SidebarBranchNode).children = (item as SidebarBranchNode).children || [createSidebarLeaf()]
    return
  }
  delete (item as SidebarBranchNode).children
}

function updateSidebarSections(value: SidebarSection[]) {
  if (!config.value.navigation.sidebar) return
  config.value.navigation.sidebar.sections = value
}

function updateSidebarItems(sectionIndex: number, value: Array<SidebarLeafNode | SidebarBranchNode>) {
  const section = config.value.navigation.sidebar?.sections[sectionIndex]
  if (!section) return
  section.items = value
}

function updateSidebarChildren(sectionIndex: number, itemIndex: number, value: SidebarLeafNode[]) {
  const item = config.value.navigation.sidebar?.sections[sectionIndex]?.items[itemIndex]
  if (!item || item.kind !== 'group') return
  item.children = value
}

function createPage(): SitePage {
  return {
    id: createId('page'),
    routeKey: `/docs/${createId('page')}`,
    title: '新页面',
    description: '请输入页面描述',
    body: '## 新页面\n\n请输入页面正文内容。',
    updatedAt: '2026-04-03',
    readTime: 3,
    author: 'Gress Team'
  }
}

function updatePages(value: SitePage[]) {
  config.value.content.pages = value
}

function createSlotInstance(): SlotInstance {
  const firstSchema = slotComponentSchemas[0]
  return {
    id: createId('slot'),
    slotKey: slotDefinitions[0]?.slotKey || 'content-top',
    componentKey: firstSchema.componentKey,
    visible: true,
    order: 1,
    props: { ...firstSchema.defaultProps }
  }
}

function normalizeSlot(slot: SlotInstance) {
  const schema = slotComponentSchemas.find((item) => item.componentKey === slot.componentKey)
  slot.props = schema ? { ...schema.defaultProps, ...slot.props } : slot.props
}

function updateSlots(value: SlotInstance[]) {
  config.value.slots = value
}

function onNavbarRouteSelect(routeKey?: string) {
  if (!routeKey) return
  const page = config.value.content.pages.find((item) => item.routeKey === routeKey)
  if (!page) return
  config.value.meta.defaultRoute = routeKey
}

function onSidebarPageSelect(pageId?: string) {
  if (!pageId) return
  const page = config.value.content.pages.find((item) => item.id === pageId)
  if (!page) return
  config.value.meta.defaultRoute = page.routeKey
}

function firstNavbarRoute(items: NavItem[]) {
  const first = items[0]
  if (!first) return ''
  if (first.kind === 'group') return first.children[0]?.routeKey || ''
  return first.routeKey || ''
}

function flattenNavbarLinks(items: NavItem[]): NavbarLinkItem[] {
  return items.flatMap((item) => (item.kind === 'group' ? item.children : [item]))
}

function createId(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 8)}`
}
</script>

<style scoped>
.kb-site-config-page {
  min-height: 100%;
  display: flex;
  flex-direction: column;
  background: #f6f7fb;
}

.page-header-wrapper {
  flex-shrink: 0;
}

.kb-site-config-page__body {
  flex: 1;
  display: grid;
  grid-template-columns: 240px minmax(0, 1fr) 380px;
  gap: 16px;
  padding: 0 20px 24px;
  min-width: 0;
}

.kb-site-config-page__panel {
  min-width: 0;
}

.kb-site-config-page__panel--preview :deep(.n-card__content) {
  padding: 12px;
}

.kb-inspector-custom {
  display: grid;
  gap: 12px;
  margin-top: 12px;
}

.kb-builder-tree {
  display: grid;
  gap: 8px;
}

.kb-builder-tree__children {
  display: grid;
  gap: 6px;
  padding-left: 12px;
}

.kb-builder-tree__item {
  width: 100%;
  min-height: 38px;
  padding: 0 12px;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  background: #fff;
  text-align: left;
  font-size: 13px;
  cursor: pointer;
}

.kb-builder-tree__item--child {
  min-height: 34px;
  font-size: 12px;
}

.kb-builder-tree__item.is-active {
  border-color: #2563eb;
  background: #eff6ff;
  color: #1d4ed8;
}

.kb-check-row {
  display: flex;
  align-items: center;
  gap: 10px;
  min-height: 34px;
}

.kb-dynamic-block {
  display: grid;
  gap: 10px;
  width: 100%;
}

.kb-dynamic-block__row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  gap: 10px;
}

.kb-dynamic-block__children {
  display: grid;
  gap: 10px;
  padding: 12px;
  border: 1px dashed #dbe1ea;
  border-radius: 14px;
  background: #fafcff;
}

.kb-dynamic-block__title {
  font-size: 12px;
  font-weight: 700;
  color: #64748b;
}

@media (max-width: 1360px) {
  .kb-site-config-page__body {
    grid-template-columns: 220px minmax(0, 1fr);
  }

  .kb-site-config-page__body > :last-child {
    grid-column: 1 / -1;
  }
}

@media (max-width: 960px) {
  .kb-site-config-page__body {
    grid-template-columns: 1fr;
  }

  .preview-docs-layout {
    grid-template-columns: 1fr;
  }

  .preview-sidebar {
    width: 100% !important;
    border-right: none;
    border-bottom: 1px solid #eceff3;
  }
}
</style>
