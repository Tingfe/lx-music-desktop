// Sync handshake URLs carry authentication data. Only follow redirects within
// the original origin; a host, port or protocol change requires explicit setup.
export const isAllowedSyncRedirect = (original: string, target: string): boolean => {
  try {
    const from = new URL(original)
    const to = new URL(target, from)
    return !to.username && !to.password && from.origin === to.origin &&
      (to.protocol === 'ws:' || to.protocol === 'wss:')
  } catch {
    return false
  }
}
