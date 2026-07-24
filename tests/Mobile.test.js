import { expect, test } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

test('uses the device-width viewport without disabling pinch zoom', () => {
  const html = readFileSync(resolve('index.html'), 'utf8')
  const viewport = html.match(/<meta name="viewport" content="([^"]+)"/)?.[1] ?? ''

  expect(viewport).toContain('width=device-width')
  expect(viewport).toContain('initial-scale=1')
  expect(viewport).toContain('minimum-scale=1')
  expect(viewport).toContain('viewport-fit=cover')
  expect(viewport).not.toContain('user-scalable=no')
  expect(viewport).not.toContain('maximum-scale=1')
})
