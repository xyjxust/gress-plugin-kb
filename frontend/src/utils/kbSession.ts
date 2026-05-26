/**
 * 与宿主 conditionalAuthGuard 一致：用于在未登录时走 anon 接口，避免无意义 401。
 */
export function kbHasAuthToken(): boolean {
  if (typeof window === 'undefined') return false
  return !!(localStorage.getItem('auth_token') || localStorage.getItem('token'))
}
