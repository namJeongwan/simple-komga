import { readFileSync } from 'node:fs'
import { expect, test } from 'vitest'

const caddyfile = readFileSync('deploy/Caddyfile', 'utf8')
const compose = readFileSync('compose.yaml', 'utf8')
const html = readFileSync('index.html', 'utf8')
const viteConfig = readFileSync('vite.config.js', 'utf8')

test('proxies the dashboard and keeps the simple API path compatible', () => {
  expect(caddyfile).toContain('handle /komga/*')
  expect(caddyfile).toContain('rewrite * /komga{uri}')
  expect(caddyfile).toContain('redir * /komga/ 308')
})

test('runs Komga with the matching dashboard base URL', () => {
  expect(compose).toContain('SERVER_SERVLET_CONTEXTPATH: /komga')
})

test('publishes named iOS and PWA icons with the expected dimensions', () => {
  expect(html).toContain('rel="apple-touch-icon" href="/simple-komga-icon-180.png"')
  expect(viteConfig).toContain("short_name: 'simple-komga'")
  expect(viteConfig).toContain("purpose: 'maskable'")

  for (const [path, size] of [
    ['public/simple-komga-icon-180.png', 180],
    ['public/simple-komga-icon-192.png', 192],
    ['public/simple-komga-icon-512.png', 512],
    ['public/simple-komga-maskable-512.png', 512],
  ]) {
    const png = readFileSync(path)
    expect(png.subarray(1, 4).toString()).toBe('PNG')
    expect(png.readUInt32BE(16)).toBe(size)
    expect(png.readUInt32BE(20)).toBe(size)
  }
})
