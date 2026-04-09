import { Node } from '@tiptap/core'
import { VueNodeViewRenderer } from '@tiptap/vue-3'
import KbImageGalleryView from './KbImageGalleryView.vue'

export interface KbGalleryImageItem {
  src: string
  alt?: string
}

/** 图片集：一行内并排多张图（可换行） */
export const KbImageGallery = Node.create({
  name: 'kbImageGallery',

  group: 'block',

  atom: true,

  draggable: true,

  addNodeView() {
    return VueNodeViewRenderer(KbImageGalleryView)
  },

  addAttributes() {
    return {
      align: {
        default: 'left',
        parseHTML: (element) => element.getAttribute('data-kb-align') || 'left',
        renderHTML: (attributes) => ({
          'data-kb-align': String(attributes.align || 'left')
        })
      },
      items: {
        default: [] as KbGalleryImageItem[],
        parseHTML: (element) => {
          try {
            const raw = element.getAttribute('data-items')
            if (!raw) return []
            const parsed = JSON.parse(raw) as KbGalleryImageItem[]
            return Array.isArray(parsed) ? parsed : []
          } catch {
            return []
          }
        },
        renderHTML: (attributes) => ({
          'data-items': JSON.stringify(attributes.items ?? [])
        })
      }
    }
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-kb-gallery="1"]',
        getAttrs: (el) => {
          if (!(el instanceof HTMLElement)) return false
          try {
            const raw = el.getAttribute('data-items')
            const items = raw ? (JSON.parse(raw) as KbGalleryImageItem[]) : []
            return { items: Array.isArray(items) ? items : [] }
          } catch {
            return { items: [] }
          }
        }
      }
    ]
  },

  renderHTML({ node }) {
    const items = (node.attrs.items as KbGalleryImageItem[]) || []
    return [
      'div',
      {
        class: 'kb-image-gallery',
        'data-kb-gallery': '1',
        'data-kb-align': String(node.attrs.align || 'left'),
        'data-items': JSON.stringify(items)
      },
      ...items.map(
        (it) =>
          [
            'img',
            {
              src: it.src,
              alt: it.alt || '',
              class: 'kb-image-gallery__img',
              loading: 'lazy'
            }
          ] as const
      )
    ]
  }
})
