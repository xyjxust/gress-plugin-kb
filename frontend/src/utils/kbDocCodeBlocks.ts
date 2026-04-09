import { toHtml } from 'hast-util-to-html'
import type { Root } from 'hast'
import { kbLowlight } from '../editor/kbLowlight'

/** TipTap / marked 语言 id → lowlight 可识别名 */
const LANG_MAP: Record<string, string> = {
  vue: 'xml',
  html: 'xml',
  text: 'plaintext',
  js: 'javascript',
  ts: 'typescript',
  shell: 'bash',
  sh: 'bash',
  zsh: 'bash'
}

function mapLang(lang: string): string {
  const k = (lang || '').toLowerCase()
  return LANG_MAP[k] || k
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function highlightCode(raw: string, rawLangLabel: string): string {
  const hlName = mapLang(rawLangLabel)
  let tree: Root
  try {
    if (rawLangLabel && rawLangLabel !== 'text' && kbLowlight.registered(hlName)) {
      tree = kbLowlight.highlight(hlName, raw)
    } else {
      tree = kbLowlight.highlightAuto(raw)
    }
    if (!tree.children?.length) {
      return `<span class="hljs">${escapeHtml(raw)}</span>`
    }
    return toHtml(tree)
  } catch {
    return `<span class="hljs">${escapeHtml(raw)}</span>`
  }
}

/**
 * 多标签块：注入基于 :has() 的切换样式（每组 data-kb-tab-group 独立）。
 */
export function enhanceKbTabbedPanels(html: string): string {
  if (!html || typeof DOMParser === 'undefined') return html
  try {
    const wrapped = `<div class="kb-doc-code-root">${html}</div>`
    const doc = new DOMParser().parseFromString(wrapped, 'text/html')
    const root = doc.querySelector('.kb-doc-code-root')
    if (!root) return html

    const blocks = root.querySelectorAll('.kb-tabbed-panel[data-kb-tabbed-panel="1"]')
    blocks.forEach((panel) => {
      if (!(panel instanceof HTMLElement)) return
      if (panel.querySelector(':scope > style[data-kb-tabbed-style="1"]')) return

      const gid = (panel.getAttribute('data-kb-tab-group') || 'g0').replace(/[^a-zA-Z0-9_-]/g, '') || 'g0'
      let n = 0
      try {
        const raw = panel.getAttribute('data-kb-panels')
        const parsed = raw ? JSON.parse(raw) : []
        n = Array.isArray(parsed) ? parsed.length : 0
      } catch {
        n = 0
      }
      if (!n) return

      const css: string[] = [
        `.kb-tabbed-panel[data-kb-tab-group="${gid}"] .kb-tabbed-panel__pane{display:none!important;}`,
        `.kb-tabbed-panel[data-kb-tab-group="${gid}"] .kb-tabbed-panel__state{position:absolute!important;opacity:0!important;width:0!important;height:0!important;margin:0!important;pointer-events:none!important;}`
      ]
      for (let i = 0; i < n; i++) {
        const rid = `kb-tab-${gid}-${i}`
        css.push(
          `.kb-tabbed-panel[data-kb-tab-group="${gid}"]:has(#${rid}:checked) .kb-tabbed-panel__pane[data-kb-pane-index="${i}"]{display:block!important;}`
        )
        css.push(
          `.kb-tabbed-panel[data-kb-tab-group="${gid}"]:has(#${rid}:checked) label[for="${rid}"]{color:#2563eb!important;font-weight:600!important;box-shadow:inset 0 -3px 0 #2563eb!important;}`
        )
      }

      const style = doc.createElement('style')
      style.setAttribute('data-kb-tabbed-style', '1')
      style.textContent = css.join('\n')
      panel.insertBefore(style, panel.firstChild)
    })

    return root.innerHTML
  } catch {
    return html
  }
}

/**
 * 将正文 HTML 中的 pre>code 包成带顶栏（语言 + 复制）的块，并写入语法高亮。
 * 已含 .kb-code-panel 的跳过，避免重复处理。
 */
export function enhanceKbDocCodeBlocks(html: string): string {
  if (!html || typeof DOMParser === 'undefined') return html
  try {
    const wrapped = `<div class="kb-doc-code-root">${html}</div>`
    const doc = new DOMParser().parseFromString(wrapped, 'text/html')
    const root = doc.querySelector('.kb-doc-code-root')
    if (!root) return html

    const pres = Array.from(root.querySelectorAll('pre'))
    for (const pre of pres) {
      if (pre.closest('.kb-code-panel')) continue
      if (pre.closest('.kb-tabbed-panel')) {
        const code = pre.querySelector(':scope > code')
        if (!code) continue
        const raw = code.textContent || ''
        const cls = code.getAttribute('class') || ''
        const m = /language-(\S+)/.exec(cls)
        const rawLang = (m?.[1] || '').toLowerCase() || 'text'
        code.className = `hljs language-${rawLang}`
        code.innerHTML = highlightCode(raw, rawLang)
        continue
      }
      const code = pre.querySelector(':scope > code')
      if (!code) continue

      const raw = code.textContent || ''
      const cls = code.getAttribute('class') || ''
      const m = /language-(\S+)/.exec(cls)
      const rawLang = (m?.[1] || '').toLowerCase() || 'text'

      const panel = doc.createElement('div')
      panel.className = 'kb-code-panel'

      const head = doc.createElement('div')
      head.className = 'kb-code-panel__head'

      const langSpan = doc.createElement('span')
      langSpan.className = 'kb-code-panel__lang'
      langSpan.textContent = rawLang

      const btn = doc.createElement('button')
      btn.type = 'button'
      btn.className = 'kb-code-panel__copy'
      btn.setAttribute('data-kb-code-copy', '1')
      btn.textContent = '复制'

      head.append(langSpan, btn)

      const innerHtml = highlightCode(raw, rawLang)

      const newPre = doc.createElement('pre')
      newPre.className = 'kb-code-panel__pre'
      const styleAttr = pre.getAttribute('style')
      if (styleAttr) newPre.setAttribute('style', styleAttr)
      if (pre.getAttribute('data-kb-code-nowrap') === '1') {
        newPre.classList.add('kb-code-panel__pre--nowrap')
      }

      const newCode = doc.createElement('code')
      newCode.className = `hljs language-${rawLang}`
      newCode.innerHTML = innerHtml

      newPre.appendChild(newCode)
      panel.append(head, newPre)
      pre.replaceWith(panel)
    }

    return root.innerHTML
  } catch {
    return html
  }
}
