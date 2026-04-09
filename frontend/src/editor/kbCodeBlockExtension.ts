import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight'
import { mergeAttributes } from '@tiptap/core'
import { VueNodeViewRenderer } from '@tiptap/vue-3'
import KbCodeBlockView from './KbCodeBlockView.vue'
import { kbLowlight } from './kbLowlight'

export const KB_CODE_BLOCK_MARK = 'data-kb-code-block'

/** 扩展代码块：lowlight 高亮 + 语言/底色/换行；编辑时为 NodeView 工具栏 */
export const KbCodeBlock = CodeBlockLowlight.extend({
  addOptions() {
    return {
      ...this.parent?.(),
      lowlight: kbLowlight
    }
  },

  addAttributes() {
    return {
      ...this.parent?.(),
      backgroundColor: {
        default: null as string | null,
        parseHTML: (element) => element.getAttribute('data-kb-code-bg') || null,
        renderHTML: () => ({})
      },
      nowrap: {
        default: false,
        parseHTML: (element) => element.getAttribute('data-kb-code-nowrap') === '1',
        renderHTML: () => ({})
      }
    }
  },

  renderHTML({ node, HTMLAttributes }) {
    const bg = node.attrs.backgroundColor as string | null
    const nowrap = !!node.attrs.nowrap
    const styleParts: string[] = []
    if (bg) styleParts.push(`background-color:${bg}`)
    styleParts.push(nowrap ? 'white-space:pre;overflow-x:auto' : 'white-space:pre-wrap;word-break:break-word')
    return [
      'pre',
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
        [KB_CODE_BLOCK_MARK]: '1',
        ...(bg ? { 'data-kb-code-bg': bg } : {}),
        ...(nowrap ? { 'data-kb-code-nowrap': '1' } : {}),
        style: styleParts.join(';')
      }),
      [
        'code',
        {
          class: node.attrs.language ? this.options.languageClassPrefix + node.attrs.language : null
        },
        0
      ]
    ]
  },

  addNodeView() {
    return VueNodeViewRenderer(KbCodeBlockView)
  }
})
