/** 将用户输入整理为可嵌入的 URL */

export function normalizeImageUrl(input: string): string {
  let u = input.trim()
  if (!u) return ''
  if (/^data:image\//i.test(u)) return u
  if (!/^https?:\/\//i.test(u) && !u.startsWith('/')) {
    u = `https://${u}`
  }
  return u
}

export function normalizeVideoEmbedUrl(input: string): string {
  const u = input.trim()
  if (!u) return ''
  const m =
    /(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/.exec(u) ||
    /youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/.exec(u)
  if (m) return `https://www.youtube.com/embed/${m[1]}`
  if (/^https?:\/\//i.test(u)) return u
  if (u.startsWith('//')) return `https:${u}`
  return `https://${u}`
}

export function normalizeWebEmbedUrl(input: string): string {
  let u = input.trim()
  if (!u) return ''
  if (!/^https?:\/\//i.test(u)) {
    u = `https://${u}`
  }
  return u
}
