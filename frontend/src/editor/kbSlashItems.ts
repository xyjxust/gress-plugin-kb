import type { Editor } from '@tiptap/core'
import type { Range } from '@tiptap/core'
import { defaultKbTabbedPanels } from './kbTabbedPanelExtension'

export interface KbSlashHandlers {
  requestImage: (p: { editor: Editor; range: Range }) => void
  requestImageGallery: (p: { editor: Editor; range: Range }) => void
  requestVideoEmbed: (p: { editor: Editor; range: Range }) => void
  requestWebEmbed: (p: { editor: Editor; range: Range }) => void
}

/** 分组标题：用于 / 菜单展示，按 createKbSlashItems 中的顺序出现 */
export const KB_SLASH_GROUPS = {
  text: '文本与标题',
  list: '列表与引用',
  tableCode: '表格与代码',
  layout: '版式',
  media: '图片与嵌入'
} as const

export interface KbSlashItem {
  id: string
  title: string
  /** 功能分组，同一组在菜单中连续展示并带分组标题 */
  group: string
  keywords: string[]
  command: (p: { editor: Editor; range: Range }) => void
}

export function createKbSlashItems(h: KbSlashHandlers): KbSlashItem[] {
  const G = KB_SLASH_GROUPS
  return [
    // —— 文本与标题（先正文再标题，层级 h1→h2→h3）
    {
      id: 'paragraph',
      title: '正文',
      group: G.text,
      keywords: ['p', '段落', 'text', '正文'],
      command: ({ editor, range }) => {
        editor.chain().focus().deleteRange(range).setParagraph().run()
      }
    },
    {
      id: 'h1',
      title: '一级标题',
      group: G.text,
      keywords: ['h1', '标题', 'heading'],
      command: ({ editor, range }) => {
        editor.chain().focus().deleteRange(range).toggleHeading({ level: 1 }).run()
      }
    },
    {
      id: 'h2',
      title: '二级标题',
      group: G.text,
      keywords: ['h2', '标题', 'heading'],
      command: ({ editor, range }) => {
        editor.chain().focus().deleteRange(range).toggleHeading({ level: 2 }).run()
      }
    },
    {
      id: 'h3',
      title: '三级标题',
      group: G.text,
      keywords: ['h3', '标题'],
      command: ({ editor, range }) => {
        editor.chain().focus().deleteRange(range).toggleHeading({ level: 3 }).run()
      }
    },
    // —— 列表与引用
    {
      id: 'bullet',
      title: '无序列表',
      group: G.list,
      keywords: ['list', 'ul', '列表', '无序'],
      command: ({ editor, range }) => {
        editor.chain().focus().deleteRange(range).toggleBulletList().run()
      }
    },
    {
      id: 'ordered',
      title: '有序列表',
      group: G.list,
      keywords: ['ol', '列表', '有序', '编号'],
      command: ({ editor, range }) => {
        editor.chain().focus().deleteRange(range).toggleOrderedList().run()
      }
    },
    {
      id: 'quote',
      title: '引用',
      group: G.list,
      keywords: ['quote', '引用', 'blockquote'],
      command: ({ editor, range }) => {
        editor.chain().focus().deleteRange(range).toggleBlockquote().run()
      }
    },
    {
      id: 'hr',
      title: '分割线',
      group: G.list,
      keywords: ['hr', '分割', '线', '分隔'],
      command: ({ editor, range }) => {
        editor.chain().focus().deleteRange(range).setHorizontalRule().run()
      }
    },
    // —— 表格与代码
    {
      id: 'table',
      title: '表格',
      group: G.tableCode,
      keywords: ['table', '表格', 'biaoge', '表'],
      command: ({ editor, range }) => {
        editor
          .chain()
          .focus()
          .deleteRange(range)
          .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
          .run()
      }
    },
    {
      id: 'code',
      title: '代码块',
      group: G.tableCode,
      keywords: ['code', '代码', '语法高亮'],
      command: ({ editor, range }) => {
        editor.chain().focus().deleteRange(range).toggleCodeBlock().run()
      }
    },
    {
      id: 'tabbed-code',
      title: '多标签代码',
      group: G.tableCode,
      keywords: ['tab', 'tabs', '标签', '版本', '多标签', 'nocobase', 'git'],
      command: ({ editor, range }) => {
        const tabGroupId =
          'g' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6)
        editor
          .chain()
          .focus()
          .deleteRange(range)
          .insertContent({
            type: 'kbTabbedPanel',
            attrs: {
              tabGroupId,
              panels: defaultKbTabbedPanels().map((p) => ({ ...p }))
            }
          })
          .run()
      }
    },
    // —— 版式
    {
      id: 'layout-section',
      title: '版式区',
      group: G.layout,
      keywords: ['layout', 'section', '版式', '分节', '区块', '容器'],
      command: ({ editor, range }) => {
        editor
          .chain()
          .focus()
          .deleteRange(range)
          .insertContent({
            type: 'kbLayoutSection',
            attrs: { variant: 'muted' },
            content: [{ type: 'paragraph' }]
          })
          .run()
      }
    },
    {
      id: 'layout-tip',
      title: '提示框',
      group: G.layout,
      keywords: ['tip', '提示', 'callout', 'admonition', '注意', '说明', '版式'],
      command: ({ editor, range }) => {
        editor
          .chain()
          .focus()
          .deleteRange(range)
          .insertContent({
            type: 'kbLayoutSection',
            attrs: { variant: 'tip' },
            content: [
              {
                type: 'paragraph',
                content: [
                  { type: 'text', text: '💡 ' },
                  { type: 'text', text: '提示', marks: [{ type: 'bold' }] }
                ]
              },
              {
                type: 'paragraph',
                content: [{ type: 'text', text: '在此输入说明文字…' }]
              }
            ]
          })
          .run()
      }
    },
    {
      id: 'layout-grid',
      title: '多列布局',
      group: G.layout,
      keywords: ['grid', 'cols', 'column', '多列', '布局', '栅格', 'naive', 'n-grid'],
      command: ({ editor, range }) => {
        editor
          .chain()
          .focus()
          .deleteRange(range)
          .insertContent({
            type: 'kbGrid',
            attrs: { cols: 2, colsSm: 1, colsMd: 2, colsLg: 3, xGap: 16, yGap: 12 },
            content: [
              { type: 'kbGridColumn', content: [{ type: 'paragraph' }] },
              { type: 'kbGridColumn', content: [{ type: 'paragraph' }] },
            ]
          })
          .run()
      }
    },
    // —— 图片与嵌入
    {
      id: 'image',
      title: '图片',
      group: G.media,
      keywords: ['image', 'img', '图', '照片', '上传'],
      command: (p) => h.requestImage(p)
    },
    {
      id: 'gallery',
      title: '图片集',
      group: G.media,
      keywords: ['gallery', '图片集', '多图', '组图', 'row', '并排'],
      command: (p) => h.requestImageGallery(p)
    },
    {
      id: 'video',
      title: '视频',
      group: G.media,
      keywords: ['video', '视频', 'youtube', 'bilibili', '播放'],
      command: (p) => h.requestVideoEmbed(p)
    },
    {
      id: 'web',
      title: '网页',
      group: G.media,
      keywords: ['web', '网页', 'iframe', '嵌入', '站点'],
      command: (p) => h.requestWebEmbed(p)
    }
  ]
}

export function filterSlashItems(query: string, h: KbSlashHandlers): KbSlashItem[] {
  const all = createKbSlashItems(h)
  const q = query.trim().toLowerCase()
  if (!q) return all
  return all.filter(
    (i) =>
      i.title.toLowerCase().includes(q) ||
      i.group.toLowerCase().includes(q) ||
      i.keywords.some((k) => k.includes(q) || k.toLowerCase().includes(q)) ||
      i.id.toLowerCase().includes(q)
  )
}
