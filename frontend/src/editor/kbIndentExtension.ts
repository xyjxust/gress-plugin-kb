import { Extension } from '@tiptap/core'

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    kbIndent: {
      indentMore: () => ReturnType
      indentLess: () => ReturnType
    }
  }
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n))
}

export const KbIndent = Extension.create({
  name: 'kbIndent',

  addOptions() {
    return {
      /** 每级缩进 px */
      step: 24,
      /** 最大缩进级别 */
      max: 6
    }
  },

  addGlobalAttributes() {
    return [
      {
        types: ['paragraph', 'heading'],
        attributes: {
          indent: {
            default: 0,
            parseHTML: (element) => {
              const raw = element.getAttribute('data-kb-indent')
              const n = raw ? Number(raw) : 0
              return Number.isFinite(n) ? clamp(n, 0, this.options.max) : 0
            },
            renderHTML: (attributes) => {
              const indent = Number(attributes.indent || 0)
              if (!indent) return {}
              return {
                'data-kb-indent': String(indent),
                style: `margin-left:${indent * this.options.step}px;`
              }
            }
          }
        }
      }
    ]
  },

  addCommands() {
    const findTargetAtCursor = (state: any) => {
      const { $from } = state.selection
      for (let d = $from.depth; d >= 0; d--) {
        const node = $from.node(d)
        const name = node.type.name
        if (name === 'paragraph' || name === 'heading') {
          return { pos: $from.before(d), node }
        }
      }
      return null
    }

    const collectTargetsFromSelection = (state: any) => {
      const targets: Array<{ pos: number; node: any }> = []
      const seen = new Set<number>()
      const from = state.selection.from
      const to = state.selection.to

      state.doc.nodesBetween(from, to, (node: any, pos: number) => {
        const name = node?.type?.name
        if ((name === 'paragraph' || name === 'heading') && !seen.has(pos)) {
          seen.add(pos)
          targets.push({ pos, node })
        }
      })

      if (!targets.length) {
        const single = findTargetAtCursor(state)
        if (single) targets.push(single)
      }

      return targets
    }

    const setIndent = (delta: number) => {
      return ({ state, dispatch }: any) => {
        const targets = collectTargetsFromSelection(state)
        if (!targets.length) return false
        let changed = false
        const tr = state.tr
        targets.forEach((t) => {
          const prev = Number(t.node.attrs.indent || 0)
          const next = clamp(prev + delta, 0, this.options.max)
          if (next === prev) return
          changed = true
          tr.setNodeMarkup(t.pos, undefined, {
            ...t.node.attrs,
            indent: next
          })
        })
        if (!changed) return false
        dispatch?.(tr)
        return true
      }
    }

    return {
      indentMore: () => setIndent(+1),
      indentLess: () => setIndent(-1)
    }
  }
})

