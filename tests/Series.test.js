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
