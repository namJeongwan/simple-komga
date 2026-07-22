# simple-komga

A minimal, self-hosted manga reader — a clean web / PWA front end on top of a stock [Komga](https://komga.org) server.

Off-the-shelf reader UIs felt clunky and needed too much library-setup fiddling. **simple-komga** hides all of that: log in and read. The admin configures everything once in Komga's own UI; everyone else just gets a fast, immersive reader.

## Features

- **Log in with your Komga account** — users are managed in Komga itself, no separate sign-up
- **Library grid + search** across series and volumes
- **Resume** where you left off (synced through Komga read-progress)
- **Immersive reader** — tap to reveal the top / bottom bars, tap again to hide
  - Reading modes: **vertical scroll**, **paged**, **half-page**, **half-page vertical scroll**
  - Direction: **left → right** or **right → left** (manga)
  - **Auto-splits two-page spreads** (detected by page aspect ratio); single pages stay whole
  - Swipe or edge-tap to turn pages
- **Installable PWA** — add to home screen on web and iOS
- Multi-stage Docker image with the static build and Caddy reverse proxy included

## Architecture

```
PWA (Svelte + Vite)  ──/api──▶  Komga REST API   (stock, unmodified)
         │
     served by caddy · /api/* reverse-proxied to Komga
```

Komga does the heavy lifting — library scanning, thumbnails, page serving, auth, read-progress. This repo is only the front end; Komga is never forked or modified.

## Tech

Svelte 5 · Vite · vite-plugin-pwa · lucide-svelte · Vitest

## Development

```bash
npm install
npm run dev      # Vite dev server (proxies /api to your Komga)
npm test         # Vitest
npm run build    # static build → dist/
```

Point the dev `/api` proxy at your Komga URL in `vite.config.js`.

## Deploy

The image builds the Svelte app, serves it with Caddy, and reverse-proxies
`/api/*` to `komga:25600`. The app container and Komga must share a Docker
network where the Komga service is reachable by the hostname `komga`.

```bash
docker build -t simple-komga .
```

Example Compose service alongside an existing `komga` service:

```yaml
services:
  simple-komga:
    build: ./simple-komga
    image: simple-komga:local
    ports:
      - "127.0.0.1:80:80"
    depends_on:
      - komga
```

For the macmini deployment, `deploy/deploy.sh` pulls merged `master` on the
server, rebuilds the Compose service, recreates it, and runs a public smoke
test.

## License

[MIT](LICENSE)
