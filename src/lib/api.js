import { getAuthHeader, setCredentials } from './auth.js'

const BASE = '/api/v1'
const MEDIA_BASE = '/komga/api/v1'
const LAST_SYNC_KEY = 'simplekomga.sync.lastscan'
const LOCALE_KEY = 'simplekomga.locale'

function authHeaders(extra = {}) {
  const h = { ...extra }
  const a = getAuthHeader()
  if (a) h.Authorization = a
  return h
}

export async function login(user, pass) {
  setCredentials(user, pass)
  // Komga moved the current-user endpoint to /api/v2 (v1 returns 404)
  const res = await fetch('/api/v2/users/me', { headers: authHeaders() })
  return res.status === 200
}

export async function getMe() {
  const res = await fetch('/api/v2/users/me', { headers: authHeaders() })
  if (!res.ok) throw new Error('me ' + res.status)
  return res.json()
}

export async function getLastSync() {
  const res = await fetch(`${BASE}/client-settings/global/list`, { headers: authHeaders() })
  if (!res.ok) throw new Error('sync status ' + res.status)
  const settings = await res.json()
  return settings[LAST_SYNC_KEY]?.value ?? null
}

export async function getLocalePreference() {
  const res = await fetch(`${BASE}/client-settings/user/list`, { headers: authHeaders() })
  if (!res.ok) throw new Error('locale setting ' + res.status)
  const settings = await res.json()
  return settings[LOCALE_KEY]?.value ?? null
}

export async function saveLocalePreference(value) {
  const res = await fetch(`${BASE}/client-settings/user`, {
    method: 'PATCH',
    headers: authHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({ [LOCALE_KEY]: { value } }),
  })
  if (!res.ok) throw new Error('locale setting save ' + res.status)
}

export async function syncLibraries() {
  const librariesRes = await fetch(`${BASE}/libraries`, { headers: authHeaders() })
  if (!librariesRes.ok) throw new Error('libraries ' + librariesRes.status)
  const libraries = await librariesRes.json()

  await Promise.all(libraries.map(async ({ id }) => {
    const res = await fetch(`${BASE}/libraries/${id}/scan`, {
      method: 'POST',
      headers: authHeaders(),
    })
    if (res.status !== 202) throw new Error('scan ' + res.status)
  }))

  const timestamp = new Date().toISOString()
  const settingRes = await fetch(`${BASE}/client-settings/global`, {
    method: 'PATCH',
    headers: authHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({
      [LAST_SYNC_KEY]: { value: timestamp, allowUnauthorized: false },
    }),
  })
  if (!settingRes.ok) throw new Error('sync status save ' + settingRes.status)
  return timestamp
}

export async function getSeries(search = '') {
  const q = search ? `&search=${encodeURIComponent(search)}` : ''
  const res = await fetch(`${BASE}/series?size=500${q}`, { headers: authHeaders() })
  if (!res.ok) throw new Error('series ' + res.status)
  const data = await res.json()
  return data.content.map((s) => ({ id: s.id, name: s.name, booksCount: s.booksCount }))
}

export async function searchBooks(term) {
  const res = await fetch(`${BASE}/books?search=${encodeURIComponent(term)}&size=50`, { headers: authHeaders() })
  if (!res.ok) throw new Error('search books ' + res.status)
  const data = await res.json()
  return data.content.map((b) => ({
    id: b.id, name: b.name, seriesTitle: b.seriesTitle ?? '', pagesCount: b.media?.pagesCount ?? 0,
  }))
}

export async function getBooks(seriesId) {
  const res = await fetch(
    `${BASE}/series/${seriesId}/books?size=500&sort=metadata.numberSort,asc`,
    { headers: authHeaders() },
  )
  if (!res.ok) throw new Error('books ' + res.status)
  const data = await res.json()
  return data.content.map((b) => ({
    id: b.id, name: b.name, pagesCount: b.media?.pagesCount ?? 0, readProgress: b.readProgress ?? null,
  }))
}

export async function getSeriesById(seriesId) {
  const res = await fetch(`${BASE}/series/${seriesId}`, { headers: authHeaders() })
  if (!res.ok) throw new Error('series ' + res.status)
  const series = await res.json()
  return { id: series.id, name: series.name }
}

export async function getPages(bookId) {
  const res = await fetch(`${BASE}/books/${bookId}/pages`, { headers: authHeaders() })
  if (!res.ok) throw new Error('pages ' + res.status)
  return res.json()
}

export function pageUrl(bookId, number) {
  return `${MEDIA_BASE}/books/${bookId}/pages/${number}`
}

export function thumbUrl(kind, id) {
  return kind === 'series'
    ? `${MEDIA_BASE}/series/${id}/thumbnail`
    : `${MEDIA_BASE}/books/${id}/thumbnail`
}

export async function getBook(bookId) {
  const res = await fetch(`${BASE}/books/${bookId}`, { headers: authHeaders() })
  if (!res.ok) throw new Error('book ' + res.status)
  const b = await res.json()
  return {
    id: b.id, name: b.name, seriesId: b.seriesId,
    pagesCount: b.media?.pagesCount ?? 0, readProgress: b.readProgress ?? null,
  }
}

export async function saveProgress(bookId, page, completed) {
  const res = await fetch(`${BASE}/books/${bookId}/read-progress`, {
    method: 'PATCH',
    headers: authHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({ page, completed }),
  })
  if (!res.ok) throw new Error('progress ' + res.status)
}
