/**
 * 将弹层左上角限制在视口内（用于 fixed 定位的 Slash 等菜单）
 */
export function clampPopupToViewport(opts: {
  /** 初始左上角（视口坐标） */
  left: number
  top: number
  /** 弹层预估宽高 */
  width: number
  height: number
  padding?: number
}): { left: number; top: number } {
  if (typeof window === 'undefined') {
    return { left: opts.left, top: opts.top }
  }
  const pad = opts.padding ?? 8
  const vw = window.innerWidth
  const vh = window.innerHeight
  const { width: w, height: h } = opts
  let left = opts.left
  let top = opts.top

  if (left + w > vw - pad) left = vw - pad - w
  if (left < pad) left = pad

  if (top + h > vh - pad) top = vh - pad - h
  if (top < pad) top = pad

  return { left, top }
}
