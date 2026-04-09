import type { SchemaSection } from './KbVisualBuilderSchemaForm.vue'

export function createRegionSchema(kind: string): SchemaSection[] {
  switch (kind) {
    case 'navbar':
      return [
        {
          key: 'navbar-base',
          title: '基础设置',
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
            { key: 'search', label: '显示搜索', path: 'navbar.showSearch', type: 'switch' },
          ],
        },
        {
          key: 'navbar-items',
          title: '导航项',
          description: '支持绑定页面，slug 变更时自动同步 href。',
          fields: [{ key: 'nav-editor', type: 'custom', slot: 'nav-editor', fullWidth: true }],
        },
      ]
    case 'sidebar':
      return [
        {
          key: 'sidebar-base',
          title: '基础设置',
          fields: [
            { key: 'width', label: '侧栏宽度', type: 'custom', slot: 'sidebar-width' },
            { key: 'collapsible', label: '允许折叠', path: 'sidebar.collapsible', type: 'switch' },
          ],
        },
        {
          key: 'sidebar-tree',
          title: '菜单树',
          description: '节点绑定 pageId 后，页面删除会自动清理引用。',
          fields: [{ key: 'sidebar-editor', type: 'custom', slot: 'sidebar-editor', fullWidth: true }],
        },
      ]
    case 'content':
      return [
        {
          key: 'content-base',
          title: '内容区',
          fields: [
            {
              key: 'max-width',
              label: '内容宽度',
              path: 'content.maxWidth',
              type: 'select',
              options: [
                { label: '窄 660px', value: '660px' },
                { label: '标准 760px', value: '760px' },
                { label: '宽 960px', value: '960px' },
                { label: '全宽 100%', value: '100%' },
              ],
            },
            { key: 'show-toc', label: '显示目录 TOC', path: 'content.showToc', type: 'switch' },
          ],
        },
      ]
    case 'footer':
      return [
        {
          key: 'footer-base',
          title: '页脚',
          fields: [
            { key: 'visible', label: '显示页脚', path: 'footer.visible', type: 'switch' },
            { key: 'copyright', label: '版权文案', path: 'footer.copyright', type: 'textarea', fullWidth: true },
            { key: 'footer-links', type: 'custom', slot: 'footer-links', fullWidth: true },
          ],
        },
      ]
    case 'hero':
      return [
        {
          key: 'hero-base',
          title: 'Hero',
          fields: [
            { key: 'hero-title', label: 'Hero 标题', path: 'landingConfig.heroTitle', type: 'text', fullWidth: true },
            { key: 'hero-subtitle', label: 'Hero 副标题', path: 'landingConfig.heroSubtitle', type: 'textarea', fullWidth: true },
          ],
        },
      ]
    case 'features':
      return [
        {
          key: 'features-base',
          title: '功能卡片',
          fields: [{ key: 'features-editor', type: 'custom', slot: 'features-editor', fullWidth: true }],
        },
      ]
    default:
      return [
        {
          key: 'theme-base',
          title: '主题',
          fields: [
            { key: 'theme-primary', label: '主题主色', path: 'theme.primary', type: 'color' },
            { key: 'theme-dark', label: '暗色模式', path: 'theme.darkMode', type: 'switch' },
            { key: 'font', label: '正文字体', path: 'theme.fontSans', type: 'text', fullWidth: true },
          ],
        },
      ]
  }
}

export function createSlotSchema(): SchemaSection[] {
  return [
    {
      key: 'slot-base',
      title: '插槽配置',
      fields: [
        { key: 'slot-toggle', type: 'custom', slot: 'slot-toggle', fullWidth: true },
        { key: 'slot-component', type: 'custom', slot: 'slot-component', fullWidth: true },
        { key: 'slot-fields', type: 'custom', slot: 'slot-fields', fullWidth: true },
      ],
    },
  ]
}

export function createPageSchema(pageTypeOptions: Array<{ label: string; value: string }>, parentPageOptions: Array<{ label: string; value: string }>): SchemaSection[] {
  return [
    {
      key: 'page-base',
      title: '页面基础',
      fields: [
        { key: 'page-title', label: '标题', path: 'page.title', type: 'text', fullWidth: true },
        { key: 'page-slug', label: 'Slug', path: 'meta.slug', type: 'text', fullWidth: true },
        { key: 'page-type', label: '类型', path: 'meta.type', type: 'select', options: pageTypeOptions },
        { key: 'page-parent', label: '父页面', path: 'meta.parentId', type: 'select', options: parentPageOptions, clearable: true },
        { key: 'page-desc', label: '描述', path: 'page.description', type: 'textarea', fullWidth: true },
      ],
    },
    {
      key: 'page-meta',
      title: '页面元信息',
      fields: [
        { key: 'page-author', label: '作者', path: 'page.author', type: 'text' },
        { key: 'page-category', label: '分类', path: 'page.category', type: 'text' },
        { key: 'page-updated-at', label: '更新时间', path: 'page.updatedAt', type: 'text' },
        { key: 'page-read-time', type: 'custom', slot: 'page-read-time' },
        { key: 'page-html', type: 'custom', slot: 'page-html', fullWidth: true },
        { key: 'page-delete', type: 'custom', slot: 'page-delete', fullWidth: true },
      ],
    },
  ]
}
