import { Node, mergeAttributes } from '@tiptap/core'
import { VueNodeViewRenderer } from '@tiptap/vue-3'
import KbTabbedPanelView from './KbTabbedPanelView.vue'

export interface KbTabbedPanelItem {
  label: string
  code: string
  /** 高亮用语言 id，默认 bash */
  language?: string
}

export const KB_TABBED_PANEL_MARK = 'data-kb-tabbed-panel'

export function defaultKbTabbedPanels(): KbTabbedPanelItem[] {
  return [
    {
      label: 'Latest 版本',
      language: 'bash',
      code: 'git clone https://github.com/nocobase/nocobase.git -b main --depth=1 my-nocobase'
    },
    {
      label: 'Beta 版本',
      language: 'bash',
      code: 'git clone https://github.com/nocobase/nocobase.git -b next my-nocobase'
    },
    {
      label: 'Alpha 版本',
      language: 'bash',
      code: 'git clone https://github.com/nocobase/nocobase.git my-nocobase'
    }
  ]
}

function escapeAttrJson(panels: KbTabbedPanelItem[]): string {
  return JSON.stringify(panels ?? [])
}

/** 多标签代码块：编辑用 NodeView；导出 HTML 供阅读态配合 enhance 注入 :has 样式 */
export const KbTabbedPanel = Node.create({
  name: 'kbTabbedPanel',

  group: 'block',

  atom: true,

  draggable: true,

  addNodeView() {
    return VueNodeViewRenderer(KbTabbedPanelView)
  },

  addAttributes() {
    return {
      tabGroupId: {
        default: '',
        parseHTML: (element) => element.getAttribute('data-kb-tab-group') || '',
        renderHTML: (attributes) => {
          const id = String(attributes.tabGroupId || '').trim()
          return { 'data-kb-tab-group': id || 'g0' }
        }
      },
      panels: {
        default: () => defaultKbTabbedPanels(),
        parseHTML: (element) => {
          try {
            const raw = element.getAttribute('data-kb-panels')
            if (!raw) return defaultKbTabbedPanels()
            const parsed = JSON.parse(raw) as KbTabbedPanelItem[]
            return Array.isArray(parsed) && parsed.length ? parsed : defaultKbTabbedPanels()
          } catch {
            return defaultKbTabbedPanels()
          }
        },
        renderHTML: (attributes) => ({
          'data-kb-panels': escapeAttrJson((attributes.panels as KbTabbedPanelItem[]) || [])
        })
      }
    }
  },

  parseHTML() {
    return [
      {
        tag: `div[${KB_TABBED_PANEL_MARK}="1"]`,
        getAttrs: (el) => {
          if (!(el instanceof HTMLElement)) return false
          try {
            const raw = el.getAttribute('data-kb-panels')
            const gid = el.getAttribute('data-kb-tab-group') || ''
            const parsed = raw ? (JSON.parse(raw) as KbTabbedPanelItem[]) : []
            const panels = Array.isArray(parsed) && parsed.length ? parsed : defaultKbTabbedPanels()
            return {
              tabGroupId: gid,
              panels
            }
          } catch {
            return { tabGroupId: '', panels: defaultKbTabbedPanels() }
          }
        }
      }
    ]
  },

  renderHTML({ node }) {
    const panels = (node.attrs.panels as KbTabbedPanelItem[]) || []
    const gidRaw = String(node.attrs.tabGroupId || '').trim() || 'g0'
    const gid = gidRaw.replace(/[^a-zA-Z0-9_-]/g, '') || 'g0'

    if (!panels.length) {
      return [
        'div',
        mergeAttributes({
          class: 'kb-tabbed-panel',
          [KB_TABBED_PANEL_MARK]: '1',
          'data-kb-tab-group': gid,
          'data-kb-panels': '[]'
        }),
        ['p', { class: 'kb-tabbed-panel__empty' }, '（空标签页）']
      ]
    }

    const children: any[] = []

    panels.forEach((p, i) => {
      const id = `kb-tab-${gid}-${i}`
      const inputAttrs: Record<string, string | boolean | undefined> = {
        type: 'radio',
        name: `kb-tab-${gid}`,
        id,
        class: 'kb-tabbed-panel__state'
      }
      if (i === 0) inputAttrs.checked = true
      children.push(['input', inputAttrs])
      children.push([
        'label',
        { for: id, class: 'kb-tabbed-panel__tab' },
        String(p.label || `标签 ${i + 1}`)
      ])
    })

    panels.forEach((p, i) => {
      const lang = (p.language || 'bash').replace(/[^a-z0-9+-]/gi, '') || 'bash'
      children.push([
        'div',
        { class: 'kb-tabbed-panel__pane', 'data-kb-pane-index': String(i) },
        [
          'pre',
          { class: 'kb-tabbed-panel__pre' },
          ['code', { class: `language-${lang}` }, p.code || '']
        ],
        [
          'button',
          {
            type: 'button',
            class: 'kb-tabbed-panel__copy',
            'data-kb-tabbed-copy': '1'
          },
          '复制'
        ]
      ])
    })

    return [
      'div',
      mergeAttributes({
        class: 'kb-tabbed-panel',
        [KB_TABBED_PANEL_MARK]: '1',
        'data-kb-tab-group': gid,
        'data-kb-panels': escapeAttrJson(panels)
      }),
      ...children
    ]
  }
})
