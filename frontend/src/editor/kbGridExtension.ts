import { Node, mergeAttributes } from '@tiptap/core'
import { NodeSelection } from '@tiptap/pm/state'

type KbGridCols = 1 | 2 | 3 | 4 | 5 | 6 | 12

function clampCols(n: any, fallback: KbGridCols): KbGridCols {
  const v = Number(n)
  if (!Number.isFinite(v)) return fallback
  const allowed = new Set([1, 2, 3, 4, 5, 6, 12])
  return (allowed.has(v) ? v : fallback) as KbGridCols
}

/**
 * 多列布局（类似 Naive UI Grid 的概念）：外层 kbGrid + 内层 kbGridColumn。
 * - kbGrid: 负责 cols / gap / 响应式
 * - kbGridColumn: 每列内容容器，content 为 block+，所以列内可插入任意块
 */
export const KbGridColumn = Node.create({
  name: 'kbGridColumn',
  group: 'kbGridChild',
  content: 'block+',
  defining: true,

  parseHTML() {
    return [{ tag: 'div[data-kb-grid-col="1"]' }]
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-kb-grid-col': '1', class: 'kb-grid__col' }), 0]
  }
})

export const KbGrid = Node.create({
  name: 'kbGrid',

  group: 'block',

  content: 'kbGridColumn{2,}',

  defining: true,

  selectable: true,

  addAttributes() {
    return {
      cols: {
        default: 2,
        parseHTML: (el) => clampCols((el as HTMLElement).getAttribute('data-kb-grid-cols'), 2),
        renderHTML: (attrs) => ({ 'data-kb-grid-cols': String(clampCols(attrs.cols, 2)) })
      },
      colsSm: {
        default: null,
        parseHTML: (el) => {
          const v = (el as HTMLElement).getAttribute('data-kb-grid-cols-sm')
          return v == null ? null : clampCols(v, 2)
        },
        renderHTML: (attrs) =>
          attrs.colsSm ? { 'data-kb-grid-cols-sm': String(clampCols(attrs.colsSm, 2)) } : {}
      },
      colsMd: {
        default: null,
        parseHTML: (el) => {
          const v = (el as HTMLElement).getAttribute('data-kb-grid-cols-md')
          return v == null ? null : clampCols(v, 2)
        },
        renderHTML: (attrs) =>
          attrs.colsMd ? { 'data-kb-grid-cols-md': String(clampCols(attrs.colsMd, 2)) } : {}
      },
      colsLg: {
        default: null,
        parseHTML: (el) => {
          const v = (el as HTMLElement).getAttribute('data-kb-grid-cols-lg')
          return v == null ? null : clampCols(v, 2)
        },
        renderHTML: (attrs) =>
          attrs.colsLg ? { 'data-kb-grid-cols-lg': String(clampCols(attrs.colsLg, 2)) } : {}
      },
      xGap: {
        default: 16,
        parseHTML: (el) => {
          const raw = (el as HTMLElement).getAttribute('data-kb-grid-x-gap')
          const n = Number(raw)
          return Number.isFinite(n) ? Math.max(0, Math.min(80, n)) : 16
        },
        renderHTML: (attrs) => ({ 'data-kb-grid-x-gap': String(attrs.xGap ?? 16) })
      },
      yGap: {
        default: 12,
        parseHTML: (el) => {
          const raw = (el as HTMLElement).getAttribute('data-kb-grid-y-gap')
          const n = Number(raw)
          return Number.isFinite(n) ? Math.max(0, Math.min(80, n)) : 12
        },
        renderHTML: (attrs) => ({ 'data-kb-grid-y-gap': String(attrs.yGap ?? 12) })
      }
    }
  },

  parseHTML() {
    return [{ tag: 'div[data-kb-grid="1"]' }]
  },

  renderHTML({ node, HTMLAttributes }) {
    const cols = clampCols(node.attrs.cols, 2)
    const xGap = Number(node.attrs.xGap ?? 16)
    const yGap = Number(node.attrs.yGap ?? 12)
    const styleVars = `--kb-grid-cols:${cols};--kb-grid-x-gap:${xGap}px;--kb-grid-y-gap:${yGap}px;`

    return [
      'div',
      mergeAttributes(HTMLAttributes, {
        class: 'kb-grid',
        'data-kb-grid': '1',
        'data-kb-grid-cols': String(cols),
        'data-kb-grid-x-gap': String(xGap),
        'data-kb-grid-y-gap': String(yGap),
        style: HTMLAttributes.style ? `${HTMLAttributes.style};${styleVars}` : styleVars,
        ...(node.attrs.colsSm ? { 'data-kb-grid-cols-sm': String(node.attrs.colsSm) } : {}),
        ...(node.attrs.colsMd ? { 'data-kb-grid-cols-md': String(node.attrs.colsMd) } : {}),
        ...(node.attrs.colsLg ? { 'data-kb-grid-cols-lg': String(node.attrs.colsLg) } : {})
      }),
      0
    ]
  }

  ,

  addNodeView() {
    if (typeof document === 'undefined') return null
    return ({ node, getPos, editor }) => {
      const dom = document.createElement('div')
      dom.className = 'kb-grid'
      dom.setAttribute('data-kb-grid', '1')

      const applyAttrs = (n: any) => {
        const cols = clampCols(n?.attrs?.cols, 2)
        const xGap = Number(n?.attrs?.xGap ?? 16)
        const yGap = Number(n?.attrs?.yGap ?? 12)
        const styleVars = `--kb-grid-cols:${cols};--kb-grid-x-gap:${xGap}px;--kb-grid-y-gap:${yGap}px;`
        dom.setAttribute('data-kb-grid-cols', String(cols))
        dom.setAttribute('data-kb-grid-x-gap', String(xGap))
        dom.setAttribute('data-kb-grid-y-gap', String(yGap))
        dom.setAttribute('style', styleVars)
      }

      applyAttrs(node)

      const contentDOM = document.createElement('div')
      contentDOM.className = 'kb-grid__content'
      dom.appendChild(contentDOM)

      dom.addEventListener('mousedown', (e) => {
        // 仅当点击在布局器外层留白（非列内容）时，选中整个布局器
        const target = e.target as HTMLElement | null
        if (!target) return
        if (target.closest('.kb-grid__col')) return
        const pos = getPos()
        if (pos == null) return
        e.preventDefault()
        e.stopPropagation()
        editor.commands.setNodeSelection(pos)
      })

      return {
        dom,
        contentDOM,
        update: (updatedNode) => {
          if (updatedNode.type !== node.type) return false
          applyAttrs(updatedNode)
          return true
        }
      }
    }
  },

  addKeyboardShortcuts() {
    const findSiblingGrid = (dir: 'before' | 'after'): { pos: number; nodeSize: number } | null => {
      const ed = this.editor
      const sel = ed.state.selection
      if (!sel.empty) return null
      const $from = sel.$from

      for (let depth = $from.depth; depth >= 1; depth--) {
        const parent = $from.node(depth)
        const index = $from.index(depth)
        if (dir === 'before') {
          if (index <= 0) continue
          const sib = parent.child(index - 1)
          if (sib.type !== ed.schema.nodes.kbGrid) continue
          let pos = $from.before(depth)
          for (let i = 0; i < index - 1; i++) pos += parent.child(i).nodeSize
          return { pos, nodeSize: sib.nodeSize }
        } else {
          if (index >= parent.childCount) continue
          const sib = parent.child(index)
          if (sib.type !== ed.schema.nodes.kbGrid) continue
          let pos = $from.before(depth)
          for (let i = 0; i < index; i++) pos += parent.child(i).nodeSize
          return { pos, nodeSize: sib.nodeSize }
        }
      }
      return null
    }

    return {
      Backspace: () => {
        const ed = this.editor
        const sel = ed.state.selection
        if (sel instanceof NodeSelection && sel.node.type === ed.schema.nodes.kbGrid) {
          return ed.commands.deleteSelection()
        }
        // 只有在当前块的开头才拦截（避免影响正文正常退格）
        if (sel.$from.parentOffset !== 0) return false
        const hit = findSiblingGrid('before')
        if (!hit) return false
        return ed.commands.setNodeSelection(hit.pos)
      },
      Delete: () => {
        const ed = this.editor
        const sel = ed.state.selection
        if (sel instanceof NodeSelection && sel.node.type === ed.schema.nodes.kbGrid) {
          return ed.commands.deleteSelection()
        }
        // 只有在当前块的末尾才拦截（避免影响正文正常删除）
        if (sel.$from.parentOffset !== sel.$from.parent.content.size) return false
        const hit = findSiblingGrid('after')
        if (!hit) return false
        return ed.commands.setNodeSelection(hit.pos)
      }
    }
  }
})

