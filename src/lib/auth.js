const KEY = 'komga-cred'
export const AUTH_CLEARED_EVENT = 'simple-komga:auth-cleared'

export function setCredentials(user, pass) {
  localStorage.setItem(KEY, btoa(user + ':' + pass))
}
export function clearCredentials() {
  localStorage.removeItem(KEY)
  globalThis.dispatchEvent?.(new Event(AUTH_CLEARED_EVENT))
}
export function getAuthHeader() {
  const c = localStorage.getItem(KEY)
  return c ? 'Basic ' + c : null
}
export function hasCredentials() {
  return localStorage.getItem(KEY) != null
}
