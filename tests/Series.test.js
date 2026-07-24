import { beforeEach, expect, test, vi } from 'vitest'
import { cleanup, fireEvent, render, waitFor } from '@testing-library/svelte'
import Series from '../src/routes/Series.svelte'
import * as api from '../src/lib/api.js'
import { locale } from '../src/lib/i18n.js'

beforeEach(() => {
  cleanup()
  vi.restoreAllMocks()
  locale.set('en')
  vi.spyOn(api, 'getSeriesById').mockResolvedValue({ id: 's1', name: 'Mock Series' })
  vi.spyOn(api, 'getBooks').mockResolvedValue([{
    id: 'b1', name: 'Volume 1', pagesCount: 100, readProgress: null,
  }])
})

test('shows the Komga series name and translated progress', async () => {
  const view = render(Series, { props: { params: { id: 's1' } } })

  expect(await view.findByRole('heading', { name: 'Mock Series' })).toBeTruthy()
  expect(await view.findByText('Unread')).toBeTruthy()
  expect(api.getBooks).toHaveBeenCalledWith('s1', 'desc')
})

test('switches between latest and first-episode ordering', async () => {
  const view = render(Series, { props: { params: { id: 's1' } } })
  const latest = await view.findByRole('button', { name: 'Latest' })
  const first = view.getByRole('button', { name: 'First episode' })

  expect(latest.getAttribute('aria-pressed')).toBe('true')
  await fireEvent.click(first)

  await waitFor(() => expect(api.getBooks).toHaveBeenLastCalledWith('s1', 'asc'))
  expect(first.getAttribute('aria-pressed')).toBe('true')
})

test('shows available series metadata and hides missing fields', async () => {
  api.getSeriesById.mockResolvedValue({
    id: 's1',
    name: 'Mock Series',
    booksCount: 1,
    metadata: {
      summary: 'A description for a mock series.',
      publisher: 'Example Publisher',
      status: 'ONGOING',
      language: 'en',
      readingDirection: 'WEBTOON',
      ageRating: 15,
      totalBookCount: 3,
      genres: ['Genre A', 'Genre B'],
      tags: [],
      alternateTitles: [{ label: 'Alternate', title: 'Mock Series Alt' }],
      links: [{ label: 'Example', url: 'https://example.com/series' }],
    },
    authors: [{ name: 'Writer A', role: 'writer' }, { name: 'Artist B', role: 'penciller' }],
  })

  const view = render(Series, { props: { params: { id: 's1' } } })

  expect(await view.findByText('A description for a mock series.')).toBeTruthy()
  expect(view.getByText('Writer A')).toBeTruthy()
  expect(view.getByText('Artist')).toBeTruthy()
  expect(view.getByText('Example Publisher')).toBeTruthy()
  expect(view.getByText('Ongoing')).toBeTruthy()
  expect(view.getByText('English')).toBeTruthy()
  expect(view.getByText('Ages 15+')).toBeTruthy()
  expect(view.getByText('3 items')).toBeTruthy()
  expect(view.getByText('Genre A')).toBeTruthy()
  expect(view.getByRole('link', { name: 'Example' }).getAttribute('href')).toBe('https://example.com/series')
  expect(view.queryByText('Tags')).toBeNull()
})
