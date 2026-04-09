import { TableCell } from '@tiptap/extension-table/cell'
import { mergeAttributes } from '@tiptap/core'

function readCssColor(el: HTMLElement, prop: 'backgroundColor' | 'color'): string | null {
  const v = el.style[prop]
  if (v && v !== 'transparent' && v !== 'inherit') return v
  return null
}

/** 表格单元格：支持背景色、文字色（与 setCellAttribute 配合） */
export const KbTableCell = TableCell.extend({
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
    return ['td', attrs, 0]
  }
})
