import { beforeEach, expect, test } from 'vitest'
import { setCredentials, clearCredentials, getAuthHeader, hasCredentials } from '../src/lib/auth.js'

beforeEach(() => localStorage.clear())

test('no credentials by default', () => {
  expect(hasCredentials()).toBe(false)
  expect(getAuthHeader()).toBe(null)
})

test('setCredentials builds Basic header and persists', () => {
  setCredentials('jwnam', 'pw')
  expect(hasCredentials()).toBe(true)
  expect(getAuthHeader()).toBe('Basic ' + btoa('jwnam:pw'))
})

test('clearCredentials removes them', () => {
  setCredentials('a', 'b'); clearCredentials()
  expect(hasCredentials()).toBe(false)
})
