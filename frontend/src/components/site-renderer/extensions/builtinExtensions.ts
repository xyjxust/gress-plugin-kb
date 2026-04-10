import type { SiteExtensionDefinition } from './extensionRegistry'
import { registerExtension } from './extensionRegistry'

export const EXT_AUTH_NAVBAR_ID = 'auth-navbar'
export const EXT_DOC_COMMENTS_ID = 'doc-comments'

const AuthNavbar: SiteExtensionDefinition = {
  id: EXT_AUTH_NAVBAR_ID,
  name: '登录入口（顶栏）',
  description: '在顶栏右侧显示“登录/个人中心”等入口（示例占位）',
  configPanel: { category: 'site-renderer.extension-panel', name: 'AuthNavbarPanel' },
  optionsSchema: {
    slotKey: {
      type: 'select',
      label: '显示位置',
      options: [
        { label: '导航栏右侧', value: 'navbar-trailing' },
        { label: '正文顶部', value: 'content-top' },
      ],
    },
    text: { type: 'string', label: '按钮文案', placeholder: '登录' },
  },
  defaultOptions: { slotKey: 'navbar-trailing', text: '登录' },
  inject(_ctx, options) {
    const slotKey = String(options.slotKey || 'navbar-trailing')
    return [
      {
        slotKey,
        instances: [
          {
            instanceId: 'ext-auth-navbar',
            componentKey: 'AuthEntry',
            order: 50,
            props: { text: String(options.text || '登录') },
          },
        ],
      },
    ]
  },
}

const DocComments: SiteExtensionDefinition = {
  id: EXT_DOC_COMMENTS_ID,
  name: '评论（正文下方）',
  description: '在文档正文底部展示评论区（示例占位，可替换为真实评论服务）',
  configPanel: { category: 'site-renderer.extension-panel', name: 'DocCommentsPanel' },
  optionsSchema: {
    slotKey: {
      type: 'select',
      label: '显示位置',
      options: [
        { label: '正文下方', value: 'content-bottom' },
        { label: '正文顶部', value: 'content-top' },
      ],
    },
    title: { type: 'string', label: '标题', placeholder: '评论' },
    hint: { type: 'string', label: '提示文案', placeholder: '你可以在这里接入评论服务…' },
    onlyKbDoc: { type: 'boolean', label: '仅 KB 文档页显示' },
  },
  defaultOptions: { slotKey: 'content-bottom', title: '评论', hint: '你可以在这里接入评论服务', onlyKbDoc: true },
  inject(ctx, options) {
    const onlyKbDoc = options.onlyKbDoc !== false
    const isKbDocPage = !!ctx.page?.meta?.kbDocListSource
    if (onlyKbDoc && !isKbDocPage) return []
    const slotKey = String(options.slotKey || 'content-bottom')
    return [
      {
        slotKey,
        instances: [
          {
            instanceId: 'ext-doc-comments',
            componentKey: 'Comments',
            order: 100,
            props: {
              title: String(options.title || '评论'),
              hint: String(options.hint || '你可以在这里接入评论服务'),
            },
          },
        ],
      },
    ]
  },
}

export function initBuiltinExtensions(): void {
  registerExtension(AuthNavbar)
  registerExtension(DocComments)
}

