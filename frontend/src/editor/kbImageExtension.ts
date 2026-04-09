import Image from '@tiptap/extension-image'
import { mergeAttributes, ResizableNodeView } from '@tiptap/core'

function applyAlignToHost(host: HTMLElement, align: string) {
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
}

/** 可缩放图片，支持 align 持久化（left/center/right） */
export const KbImage = Image.extend({
  addAttributes() {
    return {
      ...(this.parent?.() || {}),
      align: {
        default: 'left',
        parseHTML: (element) => {
          const byData = element.getAttribute('data-kb-align')
          if (byData === 'center' || byData === 'right' || byData === 'left') return byData
          const style = (element.getAttribute('style') || '').replace(/\s+/g, '').toLowerCase()
          const mlAuto = style.includes('margin-left:auto')
          const mrAuto = style.includes('margin-right:auto')
          if (mlAuto && mrAuto) return 'center'
          if (mlAuto && !mrAuto) return 'right'
          return 'left'
        },
        renderHTML: (attributes) => ({ 'data-kb-align': String(attributes.align || 'left') })
      }
    }
  },

  renderHTML({ HTMLAttributes }) {
    const width = Number(HTMLAttributes.width || 0)
    const height = Number(HTMLAttributes.height || 0)
    const align = String((HTMLAttributes as any)['data-kb-align'] || (HTMLAttributes as any).align || 'left')
    const sizeStyle = `${width > 0 ? `width:${width}px;` : ''}${height > 0 ? `height:${height}px;` : ''}`
    const alignStyle =
      align === 'center' ? 'margin-left:auto;margin-right:auto;' : align === 'right' ? 'margin-left:auto;margin-right:0;' : 'margin-left:0;margin-right:auto;'
    return [
      'img',
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
        'data-kb-align': align,
        style: `${sizeStyle}${alignStyle}display:block;`
      })
    ]
  },

  addNodeView() {
    if (typeof document === 'undefined') return null
    return ({ node, getPos, HTMLAttributes, editor }) => {
      const el = document.createElement('img')
      Object.entries(HTMLAttributes).forEach(([key, value]) => {
        if (value != null && key !== 'width' && key !== 'height' && key !== 'align') {
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

      let nodeView: ResizableNodeView
      nodeView = new ResizableNodeView({
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
          this.editor.chain().setNodeSelection(pos).updateAttributes(this.name, { width, height, align }).run()
        },
        onUpdate: (updatedNode) => {
          if (updatedNode.type !== node.type) return false
          const host = nodeView.dom as HTMLElement
          applyAlignToHost(host, String(updatedNode.attrs.align || 'left'))
          return true
        },
        options: {
          min: { width: 120, height: 60 },
          preserveAspectRatio: true
        }
      })

      const host = nodeView.dom as HTMLElement
      applyAlignToHost(host, initAlign)

      return nodeView
    }
  }
})
