import { expect, test, vi, beforeEach } from 'vitest'
import { render, fireEvent, screen } from '@testing-library/svelte'
import Login from '../src/routes/Login.svelte'
import * as api from '../src/lib/api.js'

vi.mock('svelte-spa-router', () => ({ push: vi.fn() }))
beforeEach(() => { localStorage.clear(); vi.restoreAllMocks() })

test('shows error text on failed login', async () => {
  vi.spyOn(api, 'login').mockResolvedValue(false)
  render(Login)
  await fireEvent.input(screen.getByLabelText('이메일'), { target: { value: 'x@y.z' } })
  await fireEvent.input(screen.getByLabelText('비밀번호'), { target: { value: 'y' } })
  await fireEvent.click(screen.getByRole('button', { name: '로그인' }))
  expect(await screen.findByText('로그인 실패')).toBeTruthy()
})
