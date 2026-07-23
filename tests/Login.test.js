import { expect, test, vi, beforeEach } from 'vitest'
import { render, fireEvent, screen } from '@testing-library/svelte'
import Login from '../src/routes/Login.svelte'
import * as api from '../src/lib/api.js'
import { locale } from '../src/lib/i18n.js'

vi.mock('svelte-spa-router', () => ({ push: vi.fn() }))
beforeEach(() => { localStorage.clear(); vi.restoreAllMocks() })

test('shows error text on failed login', async () => {
  locale.set('ko')
  vi.spyOn(api, 'login').mockResolvedValue(false)
  render(Login)
  await fireEvent.input(screen.getByLabelText('이메일'), { target: { value: 'x@y.z' } })
  await fireEvent.input(screen.getByLabelText('비밀번호'), { target: { value: 'y' } })
  await fireEvent.click(screen.getByRole('button', { name: '로그인' }))
  expect(await screen.findByText('로그인 실패')).toBeTruthy()
})

test('exposes the standard password autofill fields', () => {
  locale.set('en')
  const view = render(Login)
  const form = view.container.querySelector('form')
  const username = screen.getByLabelText('Email')
  const password = screen.getByLabelText('Password')

  expect(form?.getAttribute('autocomplete')).toBe('on')
  expect(username.getAttribute('id')).toBe('username')
  expect(username.getAttribute('name')).toBe('username')
  expect(username.getAttribute('autocomplete')).toBe('username')
  expect(password.getAttribute('id')).toBe('password')
  expect(password.getAttribute('name')).toBe('password')
  expect(password.getAttribute('autocomplete')).toBe('current-password')
})
