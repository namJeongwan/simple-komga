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
- **Korean and English UI** — follows Komga's same-origin WebUI locale, then
  syncs the selected language per user through Komga client settings
- Multi-stage Docker image with the static build and Caddy reverse proxy included

## Architecture

```
PWA (Svelte + Vite)  ──/api──▶  Komga REST API   (stock, unmodified)
         │
     served by caddy · /api/* and /komga/* reverse-proxied to Komga
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

The published image contains only the Svelte app and Caddy. Komga remains in
its official, independent container; `compose.yaml` connects the two and runs
Komga with its official `/komga` base URL. Caddy keeps the simple UI's `/api/*`
path stable and exposes the Komga dashboard at same-origin `/komga/`, so browser
and installed-PWA back navigation stays in one history context.

```bash
cp .env.example .env
# Set COMICS_PATH and KOMGA_CONFIG_PATH in .env, then:
docker compose up -d
```

If npm traffic is intercepted by a private CA, provide that certificate as an
ephemeral BuildKit secret. It is available only during dependency installation
and is not copied into the resulting image:

```bash
docker build \
  --secret id=npm_ca,src=/path/to/private-ca.pem \
  -t simple-komga .
```

The default deployment uses these images:

```text
jdk1107/simple-komga:1.0.8  # UI + Caddy
gotson/komga:latest          # official Komga backend
```

`SIMPLE_KOMGA_VERSION` pins the UI version. Komga data and configuration stay
in the host paths configured by `COMICS_PATH` and `KOMGA_CONFIG_PATH`.

## Release

Pull requests and pushes to `master` run tests and build the image for amd64
and arm64 without publishing it. Pushing a tag matching the version in
`package.json` (for example `v1.0.1`) publishes `1.0.1`, `1.0`, `1`, and
`latest` to Docker Hub with SBOM and provenance attestations.

The repository variable `DOCKERHUB_USERNAME` and Actions secret
`DOCKERHUB_TOKEN` provide Docker Hub authentication. `deploy/publish.sh`
remains available as a manually run fallback.

For the macmini deployment, `deploy/deploy.sh` pulls merged `master`, pulls the
versioned image, recreates only the `simple-komga` service, and runs a public
smoke test.

## License

[MIT](LICENSE)
