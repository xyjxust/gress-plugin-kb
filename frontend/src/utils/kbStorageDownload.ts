/**
 * 将文档中的「存储静态文件」链接改为走宿主 {@code FileStorageDownloadController}：
 * {@code GET /system/storage/download?url=...}（完整示例：{@code system/storage/download?url=http://localhost:8081/dev/xxx.html}）
 */

/** 与 gress-web {@code @RequestMapping("/system/storage")} + {@code @GetMapping("/download")} 对齐 */
export const KB_STORAGE_DOWNLOAD_API = '/system/storage/download'

export function resolveAbsoluteStorageUrl(href: string): string {
  const t = href.trim()
  if (!t) return t
  if (/^https?:\/\//i.test(t)) return t
  if (typeof window === 'undefined') return t
  if (t.startsWith('//')) return `${window.location.protocol}${t}`
  if (t.startsWith('/')) return `${window.location.origin}${t}`
  try {
    return new URL(t, window.location.href).href
  } catch {
    return t
  }
}

/** 是否应走存储下载代理（避免直接链到上传路径导致鉴权/跨域问题） */
export function isLikelyStorageFileUrl(href: string): boolean {
  const raw = href.trim()
  if (!raw || raw.startsWith('#') || raw.startsWith('mailto:') || raw.startsWith('tel:') || raw.startsWith('javascript:')) {
    return false
  }
  if (raw.includes('system/storage/download')) return false
  try {
    const u = new URL(resolveAbsoluteStorageUrl(raw))
    const p = u.pathname
    if (p.includes('/upload/')) return true
    if (p.includes('/file/') || /\/files\//.test(p)) return true
    // x-file-storage 等生成的静态页：如 http://localhost:8081/dev/69d10a2fd59025593c38856b.html
    if (/\/dev\/[^/]+/i.test(p)) return true
    // 常见静态资源扩展名（同域路径）
    if (/\.(pdf|zip|png|jpe?g|gif|webp|svg|docx?|xlsx?|pptx?|txt|csv|mp4|webm|mov|html?)(\?|$)/i.test(p)) {
      if (u.origin === (typeof window !== 'undefined' ? window.location.origin : u.origin)) return true
    }
    return false
  } catch {
    return false
  }
}

export function toStorageDownloadApiUrl(storedUrl: string): string {
  const abs = resolveAbsoluteStorageUrl(storedUrl)
  return `${KB_STORAGE_DOWNLOAD_API}?url=${encodeURIComponent(abs)}`
}

/**
 * 将 HTML 中指向存储文件的 a[href]、img[src] 改写为下载 API（保留其它链接不变）
 */
export function rewriteHtmlStorageUrlsToDownloadApi(html: string): string {
  if (typeof document === 'undefined' || !html) return html
  try {
    const parser = new DOMParser()
    const wrapped = `<div class="kb-storage-root">${html}</div>`
    const doc = parser.parseFromString(wrapped, 'text/html')
    const root = doc.body.querySelector('.kb-storage-root')
    if (!root) return html

    root.querySelectorAll('a[href]').forEach((a) => {
      const href = a.getAttribute('href') || ''
      if (isLikelyStorageFileUrl(href)) {
        a.setAttribute('href', toStorageDownloadApiUrl(href))
        a.setAttribute('target', '_blank')
        a.setAttribute('rel', 'noopener noreferrer')
      }
    })
    root.querySelectorAll('img[src]').forEach((img) => {
      const src = img.getAttribute('src') || ''
      if (isLikelyStorageFileUrl(src)) {
        img.setAttribute('src', toStorageDownloadApiUrl(src))
      }
    })
    return root.innerHTML
  } catch {
    return html
  }
}
