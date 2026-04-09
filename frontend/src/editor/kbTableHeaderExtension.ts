import { TableHeader } from '@tiptap/extension-table/header'
import { mergeAttributes } from '@tiptap/core'

function readCssColor(el: HTMLElement, prop: 'backgroundColor' | 'color'): string | null {
  const v = el.style[prop]
  if (v && v !== 'transparent' && v !== 'inherit') return v
  return null
}

export const KbTableHeader = TableHeader.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      backgroundColor: {
        default: null as string | null,
        parseHTML: (element) => {
          if (!(element instanceof HTMLElement)) return null
          return readCssColor(element, 'backgroundColor')
        },
        renderHTML: () => ({})
      },
      textColor: {
        default: null as string | null,
        parseHTML: (element) => {
          if (!(element instanceof HTMLElement)) return null
          return readCssColor(element, 'color')
        },
        renderHTML: () => ({})
      }
    }
  },

  renderHTML({ node, HTMLAttributes }) {
    const attrs = mergeAttributes(this.options.HTMLAttributes, HTMLAttributes)
    const extra: string[] = []
    if (node.attrs.backgroundColor) {
      extra.push(`background-color: ${node.attrs.backgroundColor}`)
    }
    if (node.attrs.textColor) {
      extra.push(`color: ${node.attrs.textColor}`)
    }
    if (extra.length) {
      attrs.style = [attrs.style, extra.join('; ')].filter(Boolean).join('; ')
    }
    return ['th', attrs, 0]
  }
})
