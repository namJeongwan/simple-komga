import { beforeEach, expect, test, vi } from 'vitest'
import { cleanup, render } from '@testing-library/svelte'
import Series from '../src/routes/Series.svelte'
import * as api from '../src/lib/api.js'
import { locale } from '../src/lib/i18n.js'

beforeEach(() => {
  cleanup()
  vi.restoreAllMocks()
  locale.set('en')
  vi.spyOn(api, 'getSeriesById').mockResolvedValue({ id: 's1', name: 'Bleach' })
  vi.spyOn(api, 'getBooks').mockResolvedValue([{
    id: 'b1', name: 'Volume 1', pagesCount: 100, readProgress: null,
  }])
})

test('shows the Komga series name and translated progress', async () => {
  const view = render(Series, { props: { params: { id: 's1' } } })

  expect(await view.findByRole('heading', { name: 'Bleach' })).toBeTruthy()
  expect(await view.findByText('Unread')).toBeTruthy()
})

test('shows available series metadata and hides missing fields', async () => {
  api.getSeriesById.mockResolvedValue({
    id: 's1',
    name: 'Baek XX',
    booksCount: 1,
    metadata: {
      summary: 'A former agent confronts a criminal organization.',
      publisher: 'Naver Webtoon',
      status: 'ONGOING',
      language: 'ko',
      readingDirection: 'WEBTOON',
      ageRating: 15,
      totalBookCount: 184,
      genres: ['Action', 'Thriller'],
      tags: [],
      alternateTitles: [{ label: 'Korean', title: '백XX' }],
      links: [{ label: 'Naver', url: 'https://comic.naver.com/example' }],
    },
    authors: [{ name: 'Park Tae-jun', role: 'writer' }, { name: 'Sergeant', role: 'penciller' }],
  })

  const view = render(Series, { props: { params: { id: 's1' } } })

  expect(await view.findByText('A former agent confronts a criminal organization.')).toBeTruthy()
  expect(view.getByText('Park Tae-jun')).toBeTruthy()
  expect(view.getByText('Artist')).toBeTruthy()
  expect(view.getByText('Naver Webtoon')).toBeTruthy()
  expect(view.getByText('Ongoing')).toBeTruthy()
  expect(view.getByText('Korean')).toBeTruthy()
  expect(view.getByText('Ages 15+')).toBeTruthy()
  expect(view.getByText('184 items')).toBeTruthy()
  expect(view.getByText('Action')).toBeTruthy()
  expect(view.getByRole('link', { name: 'Naver' }).getAttribute('href')).toBe('https://comic.naver.com/example')
  expect(view.queryByText('Tags')).toBeNull()
})
