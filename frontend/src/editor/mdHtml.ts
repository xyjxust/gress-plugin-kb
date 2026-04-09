/**
 * 后端仍存 bodyMd；Tiptap 使用 HTML。加载 MD→HTML，保存 HTML→MD。
 */
import TurndownService from 'turndown'
import { parseKbMarkdown } from './kbMarked'
import {
  escapeKbHtmlAttr,
  kbTipLayoutInlineStyle,
  sanitizeKbTipColor
} from './kbTipLayoutStyle'

/** 写入 bodyMd：空段落 / 仅 br 在 MD 里会变成「纯换行」，marked 不会生成带 margin 的 <p>，预览会比编辑器更「挤」 */
const KB_PARAGRAPH_SPACER_MD = '\n\n<p data-kb-paragraph-spacer="1"><br></p>\n\n'

function isParagraphSpacerSource(node: Node): boolean {
  if (!(node instanceof HTMLElement) || node.nodeName !== 'P') return false
  if (node.getAttribute('data-kb-paragraph-spacer') === '1') return true
  const text = (node.textContent || '').replace(/\u00a0/g, ' ').trim()
  if (text.length > 0) return false
  if (node.childNodes.length === 0) return false
  for (const child of Array.from(node.childNodes)) {
    if (child.nodeType === 3) {
      if ((child.textContent || '').replace(/\u00a0/g, ' ').trim()) return false
      continue
    }
    if (child.nodeName !== 'BR') return false
  }
  return true
}

const turndown = new TurndownService({
  headingStyle: 'atx',
  codeBlockStyle: 'fenced',
  bulletListMarker: '-',
  blankReplacement(_content, node) {
    if (node.nodeName === 'P') return KB_PARAGRAPH_SPACER_MD
    return node.isBlock ? '\n\n' : ''
  }
})

// 带工具栏配置的代码块：整段 <pre> 原样保留（语言/底色/nowrap）
turndown.addRule('kbCodeBlockHtml', {
  filter(node) {
    return node.nodeName === 'PRE' && (node as HTMLElement).getAttribute('data-kb-code-block') === '1'
  },
  replacement(_content, node) {
    return `\n\n${(node as HTMLElement).outerHTML}\n\n`
  }
})

/** 需写回 bodyMd 的内联 style 属性（与 TipTap TextStyle / Color / FontSize 等一致） */
const KB_INLINE_STYLE_KEEP =
  /(^|;)\s*(color|background-color|font-size|line-height|font-family|font-weight)\s*:/i

// 保留颜色、字号、高亮等富文本样式（用 HTML 片段回写）
turndown.addRule('kbInlineStyleHtml', {
  filter(node) {
    if (!(node instanceof HTMLElement)) return false
    if (node.nodeName === 'SPAN') {
      const style = node.getAttribute('style') || ''
      return KB_INLINE_STYLE_KEEP.test(style)
    }
    if (node.nodeName === 'MARK') return true
    return false
  },
  replacement(_content, node) {
    return (node as HTMLElement).outerHTML
  }
})

turndown.addRule('kbIframeHtml', {
  filter(node) {
    return node.nodeName === 'IFRAME' && (node as HTMLElement).getAttribute('data-kb-embed') === '1'
  },
  replacement(_content, node) {
    return `\n\n${(node as HTMLElement).outerHTML}\n\n`
  }
})

turndown.addRule('kbImageGalleryHtml', {
  filter(node) {
    return node.nodeName === 'DIV' && (node as HTMLElement).getAttribute('data-kb-gallery') === '1'
  },
  replacement(_content, node) {
    return `\n\n${(node as HTMLElement).outerHTML}\n\n`
  }
})

turndown.addRule('kbLayoutSectionHtml', {
  filter(node) {
    return (
      node.nodeName === 'SECTION' &&
      (node as HTMLElement).getAttribute('data-kb-layout-section') === '1'
    )
  },
  replacement(content, node) {
    const el = node as HTMLElement
    const raw = el.getAttribute('data-kb-variant') || 'muted'
    const variant =
      raw === 'default' || raw === 'muted' || raw === 'emphasis' || raw === 'tip' ? raw : 'muted'
    const accent =
      variant === 'tip' ? sanitizeKbTipColor(el.getAttribute('data-kb-tip-accent')) : null
    const bg = variant === 'tip' ? sanitizeKbTipColor(el.getAttribute('data-kb-tip-bg')) : null
    let open = `<section class="kb-layout-section" data-kb-layout-section="1" data-kb-variant="${variant}"`
    if (accent) open += ` data-kb-tip-accent="${escapeKbHtmlAttr(accent)}"`
    if (bg) open += ` data-kb-tip-bg="${escapeKbHtmlAttr(bg)}"`
    const inline = variant === 'tip' ? kbTipLayoutInlineStyle(accent, bg) : null
    if (inline) open += ` style="${escapeKbHtmlAttr(inline)}"`
    open += '>'
    return `\n\n${open}\n${content}\n</section>\n\n`
  }
})

turndown.addRule('kbGridHtml', {
  filter(node) {
    return (
      node instanceof HTMLElement &&
      node.nodeName === 'DIV' &&
      node.getAttribute('data-kb-grid') === '1'
    )
  },
  replacement(_content, node) {
    // 多列布局内部结构复杂，直接整段 HTML 保留，确保再编辑时结构不丢
    return `\n\n${(node as HTMLElement).outerHTML}\n\n`
  }
})

// 保留被拖拽调整过尺寸的图片（width/height），避免重新进入编辑后回到初始大小
turndown.addRule('kbResizedImageHtml', {
  filter(node) {
    if (!(node instanceof HTMLElement) || node.nodeName !== 'IMG') return false
    const hasAlign = !!node.getAttribute('data-kb-align')
    const style = (node.getAttribute('style') || '').toLowerCase()
    const hasAlignStyle = /margin-(left|right)\s*:\s*auto/.test(style)
    const hasSize =
      !!node.getAttribute('width') ||
      !!node.getAttribute('height') ||
      /(^|;)\s*(width|height)\s*:/.test(node.getAttribute('style') || '')
    return hasSize || hasAlign || hasAlignStyle
  },
  replacement(_content, node) {
    return `\n\n${(node as HTMLElement).outerHTML}\n\n`
  }
})

turndown.addRule('kbIndentHtml', {
  filter(node) {
    return (
      node instanceof HTMLElement &&
      (node.nodeName === 'P' || /^H[1-6]$/.test(node.nodeName)) &&
      !!node.getAttribute('data-kb-indent')
    )
  },
  replacement(_content, node) {
    return `\n\n${(node as HTMLElement).outerHTML}\n\n`
  }
})

/** TipTap 可调整列宽时外层 div.tableWrapper；整段 HTML 写入 MD 以便再打开时结构不丢 */
turndown.addRule('kbTableWrapperHtml', {
  filter(node) {
    return (
      node instanceof HTMLElement &&
      node.nodeName === 'DIV' &&
      node.classList.contains('tableWrapper')
    )
  },
  replacement(_content, node) {
    return `\n\n${(node as HTMLElement).outerHTML}\n\n`
  }
})

/** 无 wrapper 的 table（如 GFM 解析结果） */
turndown.addRule('kbTableHtml', {
  filter(node) {
    if (!(node instanceof HTMLElement) || node.nodeName !== 'TABLE') return false
    const p = node.parentElement
    return !(p?.nodeName === 'DIV' && p.classList.contains('tableWrapper'))
  },
  replacement(_content, node) {
    return `\n\n${(node as HTMLElement).outerHTML}\n\n`
  }
})

turndown.addRule('kbTabbedPanelHtml', {
  filter(node) {
    return (
      node instanceof HTMLElement &&
      node.nodeName === 'DIV' &&
      node.getAttribute('data-kb-tabbed-panel') === '1'
    )
  },
  replacement(_content, node) {
    return `\n\n${(node as HTMLElement).outerHTML}\n\n`
  }
})

/**
 * 链接整段保留进 bodyMd（含 target/rel），避免被 Turndown 收成 [text](url) 后丢失新窗口行为。
 * 须最后注册，优先于默认 a 规则。
 */
turndown.addRule('kbAnchorHtml', {
  filter(node) {
    return node instanceof HTMLElement && node.nodeName === 'A' && !!node.getAttribute('href')
  },
  replacement(_content, node) {
    const src = node as HTMLAnchorElement
    const href = (src.getAttribute('href') || '').trim()
    if (!href) return src.textContent || ''
    const low = href.toLowerCase()
    if (low.startsWith('javascript:') || low.startsWith('vbscript:')) return src.textContent || ''
    const el = src.cloneNode(true) as HTMLAnchorElement
    el.setAttribute('target', '_blank')
    const relParts = new Set((el.getAttribute('rel') || '').split(/\s+/).filter(Boolean))
    relParts.add('noopener')
    relParts.add('noreferrer')
    el.setAttribute('rel', [...relParts].join(' '))
    return el.outerHTML
  }
})

turndown.addRule('kbParagraphSpacerHtml', {
  filter(node) {
    return isParagraphSpacerSource(node)
  },
  replacement() {
    return KB_PARAGRAPH_SPACER_MD
  }
})

/**
 * 默认 Turndown 把 hr 收成 `* * *`，与前后 HTML 块（代码块、占位段落等）组合时，
 * CommonMark / marked 对 thematic break 的边界处理不一致，可能出现重复 `<hr>` 或多余空行。
 * 与代码块一致，整段用 HTML `<hr>` 写入 bodyMd，保证预览与发布只渲染一根线。
 */
turndown.addRule('kbHrHtml', {
  filter(node) {
    return node.nodeName === 'HR'
  },
  replacement() {
    return '\n\n<hr>\n\n'
  }
})

export function markdownToHtml(md: string): string {
  return parseKbMarkdown(md || '')
}

export function htmlToMarkdown(html: string): string {
  const h = (html || '').trim() || '<p></p>'
  return turndown.turndown(h).trim()
}
