import { readFileSync } from 'node:fs'
import { expect, test } from 'vitest'

const caddyfile = readFileSync('deploy/Caddyfile', 'utf8')
const compose = readFileSync('compose.yaml', 'utf8')

test('proxies the dashboard and keeps the simple API path compatible', () => {
  expect(caddyfile).toContain('handle /komga/*')
  expect(caddyfile).toContain('rewrite * /komga{uri}')
  expect(caddyfile).toContain('redir * /komga/ 308')
})

test('runs Komga with the matching dashboard base URL', () => {
  expect(compose).toContain('SERVER_SERVLET_CONTEXTPATH: /komga')
})
