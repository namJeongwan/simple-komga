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
- Static build, served behind your own reverse proxy / Tailscale HTTPS

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

Build and serve `dist/` as static files, reverse-proxying `/api/*` to Komga. See [`deploy/`](deploy/) for a caddy config and deploy script.

## License

[MIT](LICENSE)
