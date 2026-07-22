import { getAuthHeader, setCredentials } from './auth.js'

const BASE = '/api/v1'

function authHeaders(extra = {}) {
  const h = { ...extra }
  const a = getAuthHeader()
  if (a) h.Authorization = a
  return h
}

export async function login(user, pass) {
  setCredentials(user, pass)
  const res = await fetch(`${BASE}/users/me`, { headers: authHeaders() })
  return res.status === 200
}

export async function getSeries() {
  const res = await fetch(`${BASE}/series?size=500`, { headers: authHeaders() })
  if (!res.ok) throw new Error('series ' + res.status)
  const data = await res.json()
  return data.content.map((s) => ({ id: s.id, name: s.name, booksCount: s.booksCount }))
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

export async function getPages(bookId) {
  const res = await fetch(`${BASE}/books/${bookId}/pages`, { headers: authHeaders() })
  if (!res.ok) throw new Error('pages ' + res.status)
  return res.json()
}

export function pageUrl(bookId, number) {
  return `${BASE}/books/${bookId}/pages/${number}`
}

export function thumbUrl(kind, id) {
  return kind === 'series' ? `${BASE}/series/${id}/thumbnail` : `${BASE}/books/${id}/thumbnail`
}

export async function saveProgress(bookId, page, completed) {
  const res = await fetch(`${BASE}/books/${bookId}/read-progress`, {
    method: 'PATCH',
    headers: authHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({ page, completed }),
  })
  if (!res.ok) throw new Error('progress ' + res.status)
}
