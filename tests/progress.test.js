import { expect, test } from 'vitest'
import { resumePage, pageLoadPriority, percentRead, resumeLabelKey } from '../src/lib/progress.js'

test('resumePage: unread starts at 1', () => {
  expect(resumePage(null, 20)).toBe(1)
})
test('resumePage: in-progress returns saved page', () => {
  expect(resumePage({ page: 5, completed: false }, 20)).toBe(5)
})
test('resumePage: completed restarts at 1', () => {
  expect(resumePage({ page: 20, completed: true }, 20)).toBe(1)
})
test('pageLoadPriority loads resume page, remaining pages, then earlier pages', () => {
  const pages = Array.from({ length: 6 }, (_, i) => i + 1)
  const ordered = pages.toSorted((a, b) => pageLoadPriority(a, 4, 6) - pageLoadPriority(b, 4, 6))
  expect(ordered).toEqual([4, 5, 6, 1, 2, 3])
})
test('percentRead', () => {
  expect(percentRead(null, 20)).toBe(0)
  expect(percentRead({ page: 10, completed: false }, 20)).toBe(50)
  expect(percentRead({ page: 20, completed: true }, 20)).toBe(100)
})
test('resumeLabelKey', () => {
  expect(resumeLabelKey(null)).toBe('progress.unread')
  expect(resumeLabelKey({ page: 3, completed: false })).toBe('progress.reading')
  expect(resumeLabelKey({ page: 20, completed: true })).toBe('progress.completed')
})
