/**
 * 知识库 Markdown 渲染：与 mdHtml / KbDocBody 共用同一 marked 实例，保证行为一致。
 */
import { marked } from 'marked'

function escapeAttr(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;')
}

marked.use({
  renderer: {
    link(this: { parser: { parseInline: (tokens: unknown[]) => string } }, token: {
      href: string
      title?: string | null
      tokens: unknown[]
    }) {
      const text = this.parser.parseInline(token.tokens)
      const raw = (token.href || '').trim()
      if (!raw) return text
      const low = raw.toLowerCase()
      if (low.startsWith('javascript:') || low.startsWith('vbscript:')) return text
      let out = `<a href="${escapeAttr(raw)}" target="_blank" rel="noopener noreferrer"`
      if (token.title) {
        out += ` title="${escapeAttr(token.title)}"`
      }
      out += `>${text}</a>`
      return out
    }
  }
})

export function parseKbMarkdown(md: string): string {
  const raw = marked.parse(md || '', { async: false })
  return typeof raw === 'string' ? raw : ''
}
