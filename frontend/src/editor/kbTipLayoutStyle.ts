/**
 * 提示框（kbLayoutSection variant=tip）左侧条 / 背景色：校验与序列化到 HTML。
 */

/** 仅允许 hex / rgb(a)，避免注入 */
export function sanitizeKbTipColor(input: string | null | undefined): string | null {
  const s = (input || '').trim()
  if (!s) return null
  if (/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/.test(s)) return s
  if (
    /^rgba\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*(0?\.\d+|1(\.0+)?)\s*\)$/.test(s)
  ) {
    return s.replace(/\s+/g, '')
  }
  if (/^rgb\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}\s*\)$/.test(s)) {
    return s.replace(/\s+/g, '')
  }
  return null
}

/** 供 data-* / style 写入 bodyMd 时转义 */
export function escapeKbHtmlAttr(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;')
}

/**
 * 自定义提示色时写入 section 的 style（与样式表里默认色叠加：内联优先）
 * 同时设置 --kb-tip-title，便于首行标题与左侧条同色
 */
export function kbTipLayoutInlineStyle(accent: string | null, bg: string | null): string | null {
  const parts: string[] = []
  if (bg) parts.push(`background-color:${bg}`)
  if (accent) {
    parts.push(`box-shadow:inset 4px 0 0 ${accent}`)
    parts.push(`--kb-tip-title:${accent}`)
  }
  return parts.length ? parts.join(';') : null
}
