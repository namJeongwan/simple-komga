import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { basename, extname } from 'node:path'

const files = execFileSync('git', [
  'ls-files', '--cached', '--others', '--exclude-standard', '-z',
], { encoding: 'utf8' })
  .split('\0')
  .filter(Boolean)
  .filter(existsSync)
  .filter((file) => !file.startsWith('.omc/'))
  .filter((file) => file !== 'package-lock.json')

const textExtensions = new Set([
  '', '.css', '.example', '.html', '.js', '.json', '.md', '.mjs', '.sh',
  '.svelte', '.svg', '.txt', '.yaml', '.yml',
])
const rules = [
  ['private Tailscale hostname', /\b[a-z0-9-]+\.ts\.net\b/i],
  ['user-specific absolute home path', /\/(?:Users|home)\/[^/\s"'`]+(?:\/|$)/],
  ['private IPv4 address', /\b(?:10\.\d{1,3}\.\d{1,3}\.\d{1,3}|192\.168\.\d{1,3}\.\d{1,3}|172\.(?:1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3})\b/],
  ['private key material', /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/],
]

const violations = []
for (const file of files) {
  if (!textExtensions.has(extname(file)) && basename(file) !== 'Dockerfile') continue
  const source = readFileSync(file, 'utf8')
  for (const [label, pattern] of rules) {
    if (pattern.test(source)) violations.push(`${file}: ${label}`)
  }
}

if (violations.length) {
  console.error('Repository privacy check failed:')
  for (const violation of violations) console.error(`- ${violation}`)
  process.exit(1)
}

console.log(`Repository privacy check passed (${files.length} files checked).`)
