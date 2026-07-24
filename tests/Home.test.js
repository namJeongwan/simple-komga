import { beforeEach, expect, test, vi } from 'vitest'
import { cleanup, fireEvent, render, waitFor } from '@testing-library/svelte'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import Home from '../src/routes/Home.svelte'
import * as api from '../src/lib/api.js'
import { locale } from '../src/lib/i18n.js'

beforeEach(() => {
  cleanup()
  vi.restoreAllMocks()
  locale.set('ko')
  vi.spyOn(api, 'getSeries').mockResolvedValue([])
  vi.spyOn(api, 'getMe').mockResolvedValue({ roles: ['ADMIN'] })
  vi.spyOn(api, 'getLastSync').mockResolvedValue('2026-07-23T04:00:00.000Z')
  vi.spyOn(api, 'syncLibraries').mockResolvedValue('2026-07-23T05:00:00.000Z')
  vi.spyOn(api, 'saveLocalePreference').mockResolvedValue()
  vi.spyOn(api, 'logout').mockResolvedValue()
})

test('language button switches locale and saves the user preference', async () => {
  const view = render(Home)
  await fireEvent.click(await view.findByRole('button', { name: '언어 변경' }))

  expect(api.saveLocalePreference).toHaveBeenCalledWith('en')
  await waitFor(() => expect(view.getByText('My comics')).toBeTruthy())
})

test('dashboard opens on the same origin in the current history context', async () => {
  const view = render(Home)
  const dashboard = await view.findByTitle('관리자 설정 (Komga)')

  expect(dashboard.getAttribute('target')).toBeNull()
  expect(dashboard.getAttribute('href')).toBe('/komga/')
})

test('admin can start a sync and sees the shared timestamp', async () => {
  const view = render(Home)
  await waitFor(() => expect(view.getByText(/최근 수동 동기화:/)).toBeTruthy())

  await fireEvent.click(view.getByRole('button', { name: '라이브러리 동기화' }))

  expect(api.syncLibraries).toHaveBeenCalledOnce()
  await waitFor(() => expect(view.getByText(/최근 수동 동기화:/).textContent).not.toContain('없음'))
})

test('uses a neutral item count for a series', async () => {
  api.getSeries.mockResolvedValue([{ id: 's1', name: '백XX', booksCount: 184 }])
  const view = render(Home)
  expect(await view.findByText('184개')).toBeTruthy()
})

test('keeps the iOS search field at a non-zooming font size', () => {
  const source = readFileSync(resolve('src/routes/Home.svelte'), 'utf8')

  expect(source).toMatch(/\.searchbar input\s*\{[^}]*font-size:\s*16px/s)
})

test('user can sign out from the home screen', async () => {
  const view = render(Home)
  await fireEvent.click(await view.findByRole('button', { name: '로그아웃' }))
  expect(api.logout).toHaveBeenCalledOnce()
})
