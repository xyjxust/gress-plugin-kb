import type { Editor } from '@tiptap/core'

export interface OutlineItem {
  level: number
  text: string
  /** ProseMirror 文档位置（heading 节点起始） */
  pos: number
}

export function outlineFromEditor(editor: Editor): OutlineItem[] {
  const items: OutlineItem[] = []
  editor.state.doc.descendants((node, pos) => {
    if (node.type.name === 'heading') {
      const level = node.attrs.level as number
      items.push({
        level,
        text: node.textContent,
        pos
      })
    }
  })
  return items
}
