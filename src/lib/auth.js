const KEY = 'komga-cred'

export function setCredentials(user, pass) {
  localStorage.setItem(KEY, btoa(user + ':' + pass))
}
export function clearCredentials() {
  localStorage.removeItem(KEY)
}
export function getAuthHeader() {
  const c = localStorage.getItem(KEY)
  return c ? 'Basic ' + c : null
}
export function hasCredentials() {
  return localStorage.getItem(KEY) != null
}
