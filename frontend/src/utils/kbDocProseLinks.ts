/**
 * 阅读态 HTML：为正文中的 <a href> 统一补 target="_blank" 与 rel（含服务端生成的 bodyHtml）。
 */
export function ensureDocLinksOpenInNewTab(html: string): string {
  if (typeof document === 'undefined') return html
  try {
    const tpl = document.createElement('template')
    tpl.innerHTML = html
    tpl.content.querySelectorAll('a[href]').forEach((a) => {
      const href = (a.getAttribute('href') || '').trim()
      if (!href) return
      const low = href.toLowerCase()
      if (low.startsWith('javascript:') || low.startsWith('vbscript:')) return
      a.setAttribute('target', '_blank')
      const relParts = new Set((a.getAttribute('rel') || '').split(/\s+/).filter(Boolean))
      relParts.add('noopener')
      relParts.add('noreferrer')
      a.setAttribute('rel', [...relParts].join(' '))
    })
    return tpl.innerHTML
  } catch {
    return html
  }
}
