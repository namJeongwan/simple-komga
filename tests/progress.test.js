import { expect, test } from 'vitest'
import { resumePage, percentRead, resumeLabel } from '../src/lib/progress.js'

test('resumePage: unread starts at 1', () => {
  expect(resumePage(null, 20)).toBe(1)
})
test('resumePage: in-progress returns saved page', () => {
  expect(resumePage({ page: 5, completed: false }, 20)).toBe(5)
})
test('resumePage: completed restarts at 1', () => {
  expect(resumePage({ page: 20, completed: true }, 20)).toBe(1)
})
test('percentRead', () => {
  expect(percentRead(null, 20)).toBe(0)
  expect(percentRead({ page: 10, completed: false }, 20)).toBe(50)
  expect(percentRead({ page: 20, completed: true }, 20)).toBe(100)
})
test('resumeLabel', () => {
  expect(resumeLabel(null)).toBe('안 읽음')
  expect(resumeLabel({ page: 3, completed: false })).toBe('읽는 중')
  expect(resumeLabel({ page: 20, completed: true })).toBe('완독')
})
