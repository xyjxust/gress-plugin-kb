/**
 * 为 Markdown 渲染出的标题注入稳定 id，并与「本页目录」TOC 的 id 一致。
 * marked 默认不给 h2/h3 加 id，若只在内存里算 TOC 而不写回 DOM，点击目录无法 scrollTo。
 */

export function slugifyHeadingText(text: string): string {
  const t = String(text || '')
    .trim()
    .toLowerCase()
    .replace(/[^\w\u4e00-\u9fa5]+/g, '-')
    .replace(/^-+|-+$/g, '')
  return t || 'heading'
}

/**
 * 给 HTML 中的 h2–h6 写入唯一 id（与历史 tocFromHtml 规则一致，并处理重复标题）。
 */
export function injectHeadingIdsIntoHtml(html: string): string {
  const raw = String(html || '').trim()
  if (!raw || typeof DOMParser === 'undefined') return html

  try {
    const doc = new DOMParser().parseFromString(`<div id="__kb_root">${raw}</div>`, 'text/html')
    const root = doc.getElementById('__kb_root')
    if (!root) return html

    const used = new Set<string>()
    const hs = root.querySelectorAll('h2, h3, h4, h5, h6')

    hs.forEach((node) => {
      const el = node as HTMLElement
      const text = (el.textContent || '').trim()
      if (!text) return

      let id = (el.getAttribute('id') || '').trim()
      if (id && used.has(id)) id = ''

      if (!id) {
        const base = slugifyHeadingText(text)
        let candidate = base
        let n = 2
        while (used.has(candidate)) {
          candidate = `${base}-${n++}`
        }
        id = candidate
      }

      used.add(id)
      el.id = id
    })

    return root.innerHTML
  } catch {
    return html
  }
}
