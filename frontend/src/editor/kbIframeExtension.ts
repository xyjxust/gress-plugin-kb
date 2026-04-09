import { Node, mergeAttributes, ResizableNodeView } from '@tiptap/core'

/** 嵌入式网页 / 视频（iframe），用于「/ 视频」「/ 网页」 */
export const KbIframe = Node.create({
  name: 'kbIframe',

  group: 'block',

  atom: true,

  draggable: true,

  addAttributes() {
    return {
      src: {
        default: null
      },
      title: {
        default: ''
      },
      align: {
        default: 'left'
      },
      width: {
        default: null
      },
      height: {
        default: null
      }
    }
  },

  parseHTML() {
    return [
      {
        tag: 'iframe[data-kb-embed="1"]'
      }
    ]
  },

  renderHTML({ HTMLAttributes }) {
    const width = Number(HTMLAttributes.width || 0)
    const height = Number(HTMLAttributes.height || 0)
    const align = String(HTMLAttributes.align || 'left')
    const sizeStyle =
      width > 0 && height > 0
        ? `width:${width}px;height:${height}px;`
        : 'width:100%;min-height:min(56.25vw,420px);max-height:70vh;'
    const alignStyle =
      align === 'center' ? 'margin-left:auto;margin-right:auto;' : align === 'right' ? 'margin-left:auto;margin-right:0;' : 'margin-left:0;margin-right:auto;'
    return [
      'iframe',
      mergeAttributes(HTMLAttributes, {
        'data-kb-embed': '1',
        'data-kb-align': align,
        class: 'kb-embed-iframe',
        frameborder: '0',
        loading: 'lazy',
        allowfullscreen: 'true',
        style: `${sizeStyle}${alignStyle}border:0;border-radius:8px;background:#f8fafc;display:block;`
      })
    ]
  },

  addNodeView() {
    if (typeof document === 'undefined') return null
    return ({ node, getPos, HTMLAttributes, editor }) => {
      const el = document.createElement('iframe')
      Object.entries(HTMLAttributes).forEach(([key, value]) => {
        if (value != null && key !== 'width' && key !== 'height') {
          el.setAttribute(key, String(value))
        }
      })
      const src = HTMLAttributes.src || node.attrs.src
      if (src) el.setAttribute('src', String(src))
      const initW = Number(node.attrs.width || 0)
      const initH = Number(node.attrs.height || 0)
      const initAlign = String(node.attrs.align || 'left')
      if (initW > 0) el.style.width = `${initW}px`
      if (initH > 0) el.style.height = `${initH}px`
      el.setAttribute('data-kb-align', initAlign)

      const nodeView = new ResizableNodeView({
        element: el,
        editor,
        node,
        getPos,
        onResize: (width, height) => {
          el.style.width = `${width}px`
          el.style.height = `${height}px`
        },
        onCommit: (width, height) => {
          const pos = getPos()
          if (pos === undefined) return
          const host = nodeView.dom as HTMLElement
          const align = host.getAttribute('data-kb-align') || 'left'
          this.editor
            .chain()
            .setNodeSelection(pos)
            .updateAttributes(this.name, { width, height, align })
            .run()
        },
        onUpdate: (updatedNode) => {
          if (updatedNode.type !== node.type) return false
          const host = nodeView.dom as HTMLElement
          const align = String(updatedNode.attrs.align || 'left')
          host.setAttribute('data-kb-align', align)
          if (align === 'center') {
            host.style.marginLeft = 'auto'
            host.style.marginRight = 'auto'
          } else if (align === 'right') {
            host.style.marginLeft = 'auto'
            host.style.marginRight = '0'
          } else {
            host.style.marginLeft = '0'
            host.style.marginRight = 'auto'
          }
          return true
        },
        options: {
          min: { width: 220, height: 140 },
          preserveAspectRatio: false
        }
      })
      const host = nodeView.dom as HTMLElement
      if (initAlign === 'center') {
        host.style.marginLeft = 'auto'
        host.style.marginRight = 'auto'
      } else if (initAlign === 'right') {
        host.style.marginLeft = 'auto'
        host.style.marginRight = '0'
      } else {
        host.style.marginLeft = '0'
        host.style.marginRight = 'auto'
      }

      return nodeView
    }
  }
})
