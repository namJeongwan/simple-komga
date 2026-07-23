import { beforeEach, expect, test } from 'vitest'
import {
  getKomgaStoredLocale, normalizeLocale, resolveInitialLocale, saveKomgaStoredLocale,
} from '../src/lib/i18n.js'

beforeEach(() => localStorage.clear())

test('normalizes supported regional locales', () => {
  expect(normalizeLocale('ko-KR')).toBe('ko')
  expect(normalizeLocale('en-US')).toBe('en')
  expect(normalizeLocale('ja-JP')).toBeNull()
})

test('uses the Komga dashboard locale before the browser locale', () => {
  localStorage.setItem('vuex', JSON.stringify({
    persistedState: { locale: 'ko', theme: 'system' },
  }))

  expect(getKomgaStoredLocale()).toBe('ko')
  expect(resolveInitialLocale(localStorage, ['en-US'])).toBe('ko')
})

test('falls back to a supported browser language', () => {
  expect(resolveInitialLocale(localStorage, ['ja-JP', 'en-US'])).toBe('en')
})

test('updates an existing Komga dashboard locale without replacing other settings', () => {
  localStorage.setItem('vuex', JSON.stringify({
    persistedState: { locale: 'ko', theme: 'dark' },
  }))

  expect(saveKomgaStoredLocale('en')).toBe(true)
  expect(JSON.parse(localStorage.getItem('vuex')).persistedState).toEqual({
    locale: 'en',
    theme: 'dark',
  })
})
