#!/usr/bin/env bash
# Deploy simple-komga PWA static build to macmini's caddy stack.
# Prereq (one-time): caddy service in ~/app/experiments/webdav/docker-compose.yml
# must bind-mount  ./pwa:/srv/pwa:ro  (see docs/plans task 8, step 3).
set -euo pipefail

REMOTE=macmini
STACK='~/app/experiments/webdav'

echo "==> build"
npm run build

echo "==> ship static build"
ssh "$REMOTE" "mkdir -p $STACK/pwa"
rsync -az --delete dist/ "$REMOTE:$STACK/pwa/"

echo "==> ship caddy config"
scp deploy/Caddyfile "$REMOTE:$STACK/Caddyfile"

echo "==> reload caddy"
ssh "$REMOTE" 'export PATH=$PATH:/opt/homebrew/bin; docker exec caddy caddy reload --config /etc/caddy/Caddyfile'

echo "==> done. smoke test:"
echo "   curl -s -o /dev/null -w '%{http_code}\\n' https://macmini.tail993f0c.ts.net/"
