import { beforeEach, expect, test, vi } from 'vitest'
import { getAuthHeader, setCredentials } from '../src/lib/auth.js'
import {
  login, getSeries, getBooks, getSeriesById, pageUrl, thumbUrl, saveProgress, getBook, searchBooks,
  buildSeriesSearch, getFilterOptions, getLastSync, getLocalePreference, logout, saveLocalePreference, syncLibraries,
} from '../src/lib/api.js'

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
  expect(getAuthHeader()).toBeNull()
})

test('logout ends the Komga session and always clears local credentials', async () => {
  global.fetch = vi.fn().mockRejectedValue(new Error('offline'))

  await expect(logout()).rejects.toThrow('offline')
  const [url, options] = global.fetch.mock.calls[0]
  expect(url).toBe('/api/logout')
  expect(options.method).toBe('POST')
  expect(options.headers.Authorization).toBe('Basic ' + btoa('u:p'))
  expect(getAuthHeader()).toBeNull()
})

test('getSeries maps content array', async () => {
  global.fetch = vi.fn().mockResolvedValue({
    ok: true, json: async () => ({ content: [{ id: 's1', name: 'Mock Series', booksCount: 3 }] }),
  })
  const s = await getSeries()
  expect(s).toEqual([{ id: 's1', name: 'Mock Series', booksCount: 3 }])
})

test('getBooks maps pagesCount and readProgress', async () => {
  global.fetch = vi.fn().mockResolvedValue({
    ok: true, json: async () => ({ content: [
      { id: 'b1', name: 'Mock Book 01', media: { pagesCount: 20 }, readProgress: { page: 5, completed: false } },
    ] }),
  })
  const b = await getBooks('s1')
  expect(b).toEqual([{ id: 'b1', name: 'Mock Book 01', pagesCount: 20, readProgress: { page: 5, completed: false } }])
  expect(global.fetch.mock.calls[0][0]).toBe('/api/v1/series/s1/books?size=500&sort=metadata.numberSort,asc')
})

test('getBooks supports newest-first metadata ordering', async () => {
  global.fetch = vi.fn().mockResolvedValue({
    ok: true, json: async () => ({ content: [] }),
  })

  await getBooks('s1', 'desc')

  expect(global.fetch.mock.calls[0][0]).toBe('/api/v1/series/s1/books?size=500&sort=metadata.numberSort,desc')
})

test('getSeriesById maps Komga series and aggregated metadata', async () => {
  global.fetch = vi.fn().mockResolvedValue({
    ok: true, json: async () => ({
      id: 's1',
      name: 'folder-name',
      booksCount: 3,
      booksReadCount: 10,
      booksUnreadCount: 173,
      booksInProgressCount: 1,
      metadata: {
        title: 'Mock Series',
        summary: ' Mock description ',
        publisher: 'Example Publisher',
        status: 'ONGOING',
        language: 'en',
        readingDirection: 'WEBTOON',
        ageRating: 15,
        totalBookCount: 3,
        genres: ['Genre A', 'Genre B'],
        tags: ['Tag A'],
        alternateTitles: [{ label: 'Alternate', title: 'Mock Series Alt' }],
        links: [
          { label: 'Example', url: 'https://example.com/series' },
          { label: 'unsafe', url: 'javascript:alert(1)' },
        ],
      },
      booksMetadata: {
        authors: [{ name: ' Writer A ', role: 'WRITER' }, { name: 'Artist B', role: 'PENCILLER' }],
      },
    }),
  })

  await expect(getSeriesById('s1')).resolves.toEqual({
    id: 's1',
    name: 'Mock Series',
    booksCount: 3,
    booksReadCount: 10,
    booksUnreadCount: 173,
    booksInProgressCount: 1,
    metadata: {
      summary: 'Mock description',
      publisher: 'Example Publisher',
      status: 'ONGOING',
      language: 'en',
      readingDirection: 'WEBTOON',
      ageRating: 15,
      totalBookCount: 3,
      genres: ['Genre A', 'Genre B'],
      tags: ['Tag A'],
      alternateTitles: [{ label: 'Alternate', title: 'Mock Series Alt' }],
      links: [{ label: 'Example', url: 'https://example.com/series' }],
    },
    authors: [{ name: 'Writer A', role: 'writer' }, { name: 'Artist B', role: 'penciller' }],
  })
  expect(global.fetch.mock.calls[0][0]).toBe('/api/v1/series/s1')
})

test('getSeriesById supplies empty metadata defaults', async () => {
  global.fetch = vi.fn().mockResolvedValue({
    ok: true, json: async () => ({ id: 's1', name: 'Folder title' }),
  })

  await expect(getSeriesById('s1')).resolves.toEqual({
    id: 's1',
    name: 'Folder title',
    booksCount: 0,
    booksReadCount: 0,
    booksUnreadCount: 0,
    booksInProgressCount: 0,
    metadata: {
      summary: '',
      publisher: '',
      status: '',
      language: '',
      readingDirection: '',
      ageRating: null,
      totalBookCount: null,
      genres: [],
      tags: [],
      alternateTitles: [],
      links: [],
    },
    authors: [],
  })
})

test('pageUrl and thumbUrl use the Komga cookie-scoped API path', () => {
  expect(pageUrl('b1', 3)).toBe('/komga/api/v1/books/b1/pages/3')
  expect(thumbUrl('series', 's1')).toBe('/komga/api/v1/series/s1/thumbnail')
  expect(thumbUrl('book', 'b1')).toBe('/komga/api/v1/books/b1/thumbnail')
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
    ok: true, json: async () => ({ id: 'b1', name: 'Mock Book 01', seriesId: 's1', media: { pagesCount: 20 }, readProgress: { page: 5, completed: false } }),
  })
  const b = await getBook('b1')
  expect(b).toEqual({ id: 'b1', name: 'Mock Book 01', seriesId: 's1', pagesCount: 20, readProgress: { page: 5, completed: false } })
})

test('getSeries uses the recommended POST search endpoint', async () => {
  global.fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ content: [] }) })
  await getSeries('Mock Series')
  const [url, options] = global.fetch.mock.calls[0]
  expect(url).toBe('/api/v1/series/list?size=500')
  expect(options.method).toBe('POST')
  expect(options.headers['Content-Type']).toBe('application/json')
  expect(JSON.parse(options.body)).toEqual({ fullTextSearch: 'Mock Series' })
})

test('buildSeriesSearch combines filters with OR inside each category and AND between categories', () => {
  expect(buildSeriesSearch(' Mock Series ', {
    libraryIds: ['l1'],
    genres: ['Genre A', 'Genre B'],
    tags: ['Tag A'],
    statuses: ['ONGOING'],
    readStatuses: ['UNREAD', 'IN_PROGRESS'],
  })).toEqual({
    fullTextSearch: 'Mock Series',
    condition: {
      allOf: [
        { anyOf: [{ libraryId: { operator: 'is', value: 'l1' } }] },
        { anyOf: [
          { genre: { operator: 'is', value: 'Genre A' } },
          { genre: { operator: 'is', value: 'Genre B' } },
        ] },
        { anyOf: [{ tag: { operator: 'is', value: 'Tag A' } }] },
        { anyOf: [{ seriesStatus: { operator: 'is', value: 'ONGOING' } }] },
        { anyOf: [
          { readStatus: { operator: 'is', value: 'UNREAD' } },
          { readStatus: { operator: 'is', value: 'IN_PROGRESS' } },
        ] },
      ],
    },
  })
})

test('getFilterOptions maps and sorts Komga referential metadata', async () => {
  global.fetch = vi.fn()
    .mockResolvedValueOnce({ ok: true, json: async () => [{ id: 'l2', name: 'Library B' }, { id: 'l1', name: 'Library A' }] })
    .mockResolvedValueOnce({ ok: true, json: async () => ['Genre B', 'Genre A', 'Genre A'] })
    .mockResolvedValueOnce({ ok: true, json: async () => ['Tag A'] })

  await expect(getFilterOptions()).resolves.toEqual({
    libraries: [{ id: 'l1', name: 'Library A' }, { id: 'l2', name: 'Library B' }],
    genres: ['Genre A', 'Genre B'],
    tags: ['Tag A'],
  })
  expect(global.fetch.mock.calls.map(([url]) => url)).toEqual([
    '/api/v1/libraries',
    '/api/v1/genres',
    '/api/v1/tags/series',
  ])
})

test('searchBooks maps id, name, seriesTitle, pagesCount', async () => {
  global.fetch = vi.fn().mockResolvedValue({
    ok: true, json: async () => ({ content: [
      { id: 'b1', name: 'Mock Book 01', seriesTitle: 'Mock Series', media: { pagesCount: 20 } },
    ] }),
  })
  const r = await searchBooks('Mock Series')
  expect(global.fetch.mock.calls[0][0]).toBe('/api/v1/books?search=' + encodeURIComponent('Mock Series') + '&size=50')
  expect(r).toEqual([{ id: 'b1', name: 'Mock Book 01', seriesTitle: 'Mock Series', pagesCount: 20 }])
})

test('getLastSync reads the shared simple-komga timestamp', async () => {
  global.fetch = vi.fn().mockResolvedValue({
    ok: true,
    json: async () => ({
      'simplekomga.sync.lastscan': { value: '2026-07-23T04:00:00.000Z', allowUnauthorized: false },
    }),
  })

  await expect(getLastSync()).resolves.toBe('2026-07-23T04:00:00.000Z')
  expect(global.fetch.mock.calls[0][0]).toBe('/api/v1/client-settings/global/list')
})

test('locale preference is read and saved through user client settings', async () => {
  global.fetch = vi.fn()
    .mockResolvedValueOnce({
      ok: true,
      json: async () => ({ 'simplekomga.locale': { value: 'en' } }),
    })
    .mockResolvedValueOnce({ ok: true, status: 204 })

  await expect(getLocalePreference()).resolves.toBe('en')
  await saveLocalePreference('ko')

  expect(global.fetch.mock.calls[0][0]).toBe('/api/v1/client-settings/user/list')
  const [url, options] = global.fetch.mock.calls[1]
  expect(url).toBe('/api/v1/client-settings/user')
  expect(options.method).toBe('PATCH')
  expect(JSON.parse(options.body)).toEqual({
    'simplekomga.locale': { value: 'ko' },
  })
})

test('syncLibraries scans every library and stores the accepted time', async () => {
  global.fetch = vi.fn()
    .mockResolvedValueOnce({ ok: true, json: async () => [{ id: 'l1' }, { id: 'l2' }] })
    .mockResolvedValueOnce({ ok: true, status: 202 })
    .mockResolvedValueOnce({ ok: true, status: 202 })
    .mockResolvedValueOnce({ ok: true, status: 204 })

  const timestamp = await syncLibraries()

  expect(Number.isNaN(Date.parse(timestamp))).toBe(false)
  expect(global.fetch.mock.calls.slice(1, 3).map(([url]) => url)).toEqual([
    '/api/v1/libraries/l1/scan',
    '/api/v1/libraries/l2/scan',
  ])
  const [settingsUrl, settingsOptions] = global.fetch.mock.calls[3]
  expect(settingsUrl).toBe('/api/v1/client-settings/global')
  expect(settingsOptions.method).toBe('PATCH')
  expect(JSON.parse(settingsOptions.body)).toEqual({
    'simplekomga.sync.lastscan': { value: timestamp, allowUnauthorized: false },
  })
})
