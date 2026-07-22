import { beforeEach, expect, test, vi } from 'vitest'
import { setCredentials } from '../src/lib/auth.js'
import { login, getSeries, getBooks, pageUrl, thumbUrl, saveProgress, getBook, searchBooks } from '../src/lib/api.js'

beforeEach(() => { localStorage.clear(); setCredentials('u', 'p') })

test('login returns true on 200', async () => {
  global.fetch = vi.fn().mockResolvedValue({ ok: true, status: 200 })
  await expect(login('u', 'p')).resolves.toBe(true)
  const [url, opts] = global.fetch.mock.calls[0]
  expect(url).toBe('/api/v2/users/me')
  expect(opts.headers.Authorization).toBe('Basic ' + btoa('u:p'))
})

test('login returns false on 401', async () => {
  global.fetch = vi.fn().mockResolvedValue({ ok: false, status: 401 })
  await expect(login('u', 'x')).resolves.toBe(false)
})

test('getSeries maps content array', async () => {
  global.fetch = vi.fn().mockResolvedValue({
    ok: true, json: async () => ({ content: [{ id: 's1', name: '블리치', booksCount: 79 }] }),
  })
  const s = await getSeries()
  expect(s).toEqual([{ id: 's1', name: '블리치', booksCount: 79 }])
})

test('getBooks maps pagesCount and readProgress', async () => {
  global.fetch = vi.fn().mockResolvedValue({
    ok: true, json: async () => ({ content: [
      { id: 'b1', name: '1권', media: { pagesCount: 20 }, readProgress: { page: 5, completed: false } },
    ] }),
  })
  const b = await getBooks('s1')
  expect(b).toEqual([{ id: 'b1', name: '1권', pagesCount: 20, readProgress: { page: 5, completed: false } }])
})

test('pageUrl and thumbUrl build same-origin /api paths', () => {
  expect(pageUrl('b1', 3)).toBe('/api/v1/books/b1/pages/3')
  expect(thumbUrl('series', 's1')).toBe('/api/v1/series/s1/thumbnail')
  expect(thumbUrl('book', 'b1')).toBe('/api/v1/books/b1/thumbnail')
})

test('saveProgress PATCHes page + completed', async () => {
  global.fetch = vi.fn().mockResolvedValue({ ok: true, status: 204 })
  await saveProgress('b1', 7, false)
  const [url, opts] = global.fetch.mock.calls[0]
  expect(url).toBe('/api/v1/books/b1/read-progress')
  expect(opts.method).toBe('PATCH')
  expect(JSON.parse(opts.body)).toEqual({ page: 7, completed: false })
})

test('getBook returns id, name, seriesId, pagesCount, readProgress', async () => {
  global.fetch = vi.fn().mockResolvedValue({
    ok: true, json: async () => ({ id: 'b1', name: '1권', seriesId: 's1', media: { pagesCount: 20 }, readProgress: { page: 5, completed: false } }),
  })
  const b = await getBook('b1')
  expect(b).toEqual({ id: 'b1', name: '1권', seriesId: 's1', pagesCount: 20, readProgress: { page: 5, completed: false } })
})

test('getSeries appends search param when given', async () => {
  global.fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ content: [] }) })
  await getSeries('블리치')
  expect(global.fetch.mock.calls[0][0]).toBe('/api/v1/series?size=500&search=' + encodeURIComponent('블리치'))
})

test('getSeries without search has no search param', async () => {
  global.fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ content: [] }) })
  await getSeries()
  expect(global.fetch.mock.calls[0][0]).toBe('/api/v1/series?size=500')
})

test('searchBooks maps id, name, seriesTitle, pagesCount', async () => {
  global.fetch = vi.fn().mockResolvedValue({
    ok: true, json: async () => ({ content: [
      { id: 'b1', name: '블리치 01권', seriesTitle: '블리치', media: { pagesCount: 20 } },
    ] }),
  })
  const r = await searchBooks('블리치')
  expect(global.fetch.mock.calls[0][0]).toBe('/api/v1/books?search=' + encodeURIComponent('블리치') + '&size=50')
  expect(r).toEqual([{ id: 'b1', name: '블리치 01권', seriesTitle: '블리치', pagesCount: 20 }])
})
