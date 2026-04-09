import type { Component } from 'vue'
import type { AreaKey, BuilderBindingDefinition, SchemaField } from '../../types/siteBuilder'
import KbContentBuilderBlock from './blocks/KbContentBuilderBlock.vue'
import KbFooterBuilderBlock from './blocks/KbFooterBuilderBlock.vue'
import KbHeaderBuilderBlock from './blocks/KbHeaderBuilderBlock.vue'
import KbSidebarBuilderBlock from './blocks/KbSidebarBuilderBlock.vue'
import KbTocBuilderBlock from './blocks/KbTocBuilderBlock.vue'

export interface SiteBuilderRegistryEntry {
  label: string
  renderer: Component
  slots: string[]
  createConfig: () => Record<string, any>
  dataSchema: SchemaField[]
  appearanceSchema: SchemaField[]
  bindings: BuilderBindingDefinition[]
}

export const siteBuilderRegistry: Record<AreaKey, SiteBuilderRegistryEntry> = {
  header: {
    label: '顶部导航',
    renderer: KbHeaderBuilderBlock,
    slots: ['top'],
    createConfig: () => ({
      title: 'NocoBase',
      visible: true,
      sticky: false,
      showLogo: true,
      showSearch: true,
      showLanguage: true,
      showTheme: true,
      themeOverrides: { paddingX: 0, paddingY: 6, titleSize: 18 }
    }),
    dataSchema: [
      { key: 'showLogo', label: '显示品牌 Logo', type: 'switch' },
      { key: 'showSearch', label: '显示搜索框', type: 'switch' },
      { key: 'showLanguage', label: '显示语言切换', type: 'switch' },
      { key: 'showTheme', label: '显示主题切换', type: 'switch' },
      { key: 'sticky', label: '模拟吸顶 Header', type: 'switch' }
    ],
    appearanceSchema: [],
    bindings: [
      { key: 'primaryNav', label: '导航树', sourceKinds: ['nav-tree'], description: '用于渲染顶部导航项', createPayload: { menuCode: 'header' } }
    ]
  },
  sidebar: {
    label: '左侧菜单',
    renderer: KbSidebarBuilderBlock,
    slots: ['left', 'center', 'right'],
    createConfig: () => ({
      title: 'V2 教程（IT 工单系统）',
      visible: true,
      sticky: true,
      width: 332,
      themeOverrides: { titleSize: 16, mutedColor: '#64748b', paddingX: 10, paddingY: 18 }
    }),
    dataSchema: [
      { key: 'width', label: '左侧栏宽度', type: 'range', min: 180, max: 340, step: 1 },
      { key: 'sticky', label: '模拟吸顶侧栏', type: 'switch' }
    ],
    appearanceSchema: [],
    bindings: [
      { key: 'menuNav', label: '菜单树', sourceKinds: ['nav-tree'], description: '用于渲染左侧菜单', createPayload: { menuCode: 'sidebar' } }
    ]
  },
  content: {
    label: '内容显示区',
    renderer: KbContentBuilderBlock,
    slots: ['left', 'center', 'right'],
    createConfig: () => ({
      title: '数据建模',
      visible: true,
      maxWidth: 980,
      themeOverrides: { titleSize: 52, paddingX: 12, paddingY: 12 }
    }),
    dataSchema: [
      { key: 'maxWidth', label: '正文最大宽度', type: 'range', min: 720, max: 1100, step: 1 }
    ],
    appearanceSchema: [],
    bindings: [
      { key: 'document', label: '文档源', sourceKinds: ['document'], description: '用于内容区预览的文档数据', createPayload: { docId: null } }
    ]
  },
  toc: {
    label: '目录区',
    renderer: KbTocBuilderBlock,
    slots: ['left', 'center', 'right'],
    createConfig: () => ({
      title: 'ON THIS PAGE',
      visible: true,
      sticky: true,
      width: 300,
      themeOverrides: { titleSize: 16, mutedColor: '#4b5563', paddingX: 6, paddingY: 18 }
    }),
    dataSchema: [
      { key: 'width', label: '目录栏宽度', type: 'range', min: 180, max: 340, step: 1 },
      { key: 'sticky', label: '模拟吸顶目录', type: 'switch' }
    ],
    appearanceSchema: [],
    bindings: [
      { key: 'toc', label: '目录数据', sourceKinds: ['toc'], description: '通常绑定到当前正文文档的目录', createPayload: { documentBindingKey: 'document' } }
    ]
  },
  footer: {
    label: '页脚区',
    renderer: KbFooterBuilderBlock,
    slots: ['bottom'],
    createConfig: () => ({
      title: '页面底部导航',
      visible: true,
      note: '帮助读者继续沿着知识路径向前阅读',
      showPager: true,
      themeOverrides: { titleSize: 16, mutedColor: '#64748b', paddingX: 12, paddingY: 28 }
    }),
    dataSchema: [
      { key: 'note', label: '辅助文案', type: 'text', placeholder: '帮助读者继续沿着知识路径向前阅读' },
      { key: 'showPager', label: '显示上一篇 / 下一篇导航', type: 'switch' }
    ],
    appearanceSchema: [],
    bindings: [
      { key: 'pager', label: '翻页数据', sourceKinds: ['pager'], description: '根据导航树顺序推导上一篇 / 下一篇', createPayload: { navSourceId: 'source-nav-sidebar' } }
    ]
  }
}
