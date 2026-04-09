import { Node, mergeAttributes } from '@tiptap/core'
import { kbTipLayoutInlineStyle, sanitizeKbTipColor } from './kbTipLayoutStyle'

export type KbLayoutSectionVariant = 'default' | 'muted' | 'emphasis' | 'tip'

/** 分节/版式容器：块级，内含 block+，便于排版成组内容 */
export const KbLayoutSection = Node.create({
  name: 'kbLayoutSection',

  group: 'block',

  content: 'block+',

  defining: true,

  addAttributes() {
    return {
      variant: {
        default: 'muted',
        parseHTML: (element) => {
          const v = element.getAttribute('data-kb-variant')
          if (v === 'default' || v === 'muted' || v === 'emphasis' || v === 'tip') return v
          return 'muted'
        },
        renderHTML: (attributes) => ({
          'data-kb-variant': String(attributes.variant || 'muted')
        })
      },
      /** 提示框左侧强调条颜色（仅 variant=tip） */
      tipAccent: {
        default: null,
        parseHTML: (element) => sanitizeKbTipColor(element.getAttribute('data-kb-tip-accent'))
      },
      /** 提示框背景色（仅 variant=tip） */
      tipBg: {
        default: null,
        parseHTML: (element) => sanitizeKbTipColor(element.getAttribute('data-kb-tip-bg'))
      }
    }
  },

  parseHTML() {
    return [
      {
        tag: 'section[data-kb-layout-section="1"]'
      }
    ]
  },

  renderHTML({ node, HTMLAttributes }) {
    const variant = node.attrs.variant as KbLayoutSectionVariant
    const accent = sanitizeKbTipColor(node.attrs.tipAccent as string | null)
    const bg = sanitizeKbTipColor(node.attrs.tipBg as string | null)

    const merged = mergeAttributes(HTMLAttributes, {
      class: 'kb-layout-section',
      'data-kb-layout-section': '1'
    })

    if (variant === 'tip' && accent) {
      merged['data-kb-tip-accent'] = accent
    }
    if (variant === 'tip' && bg) {
      merged['data-kb-tip-bg'] = bg
    }

    const inline = variant === 'tip' ? kbTipLayoutInlineStyle(accent, bg) : null
    if (inline) {
      const prev = merged.style
      merged.style = prev ? `${String(prev)};${inline}` : inline
    }

    return ['section', merged, 0]
  }
})
