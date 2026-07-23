import { beforeEach, expect, test, vi } from 'vitest'
import { cleanup, fireEvent, render, waitFor } from '@testing-library/svelte'
import Home from '../src/routes/Home.svelte'
import * as api from '../src/lib/api.js'

beforeEach(() => {
  cleanup()
  vi.restoreAllMocks()
  vi.spyOn(api, 'getSeries').mockResolvedValue([])
  vi.spyOn(api, 'getMe').mockResolvedValue({ roles: ['ADMIN'] })
  vi.spyOn(api, 'getLastSync').mockResolvedValue('2026-07-23T04:00:00.000Z')
  vi.spyOn(api, 'syncLibraries').mockResolvedValue('2026-07-23T05:00:00.000Z')
})

test('dashboard opens in the current history context', async () => {
  const view = render(Home)
  const dashboard = await view.findByTitle('관리자 설정 (Komga)')

  expect(dashboard.getAttribute('target')).toBeNull()
  expect(dashboard.getAttribute('href')).toContain(':25600')
})

test('admin can start a sync and sees the shared timestamp', async () => {
  const view = render(Home)
  await waitFor(() => expect(view.getByText(/최근 수동 동기화:/)).toBeTruthy())

  await fireEvent.click(view.getByRole('button', { name: '라이브러리 동기화' }))

  expect(api.syncLibraries).toHaveBeenCalledOnce()
  await waitFor(() => expect(view.getByText(/최근 수동 동기화:/).textContent).not.toContain('없음'))
})
