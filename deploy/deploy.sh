#!/usr/bin/env bash
# Pull the versioned simple-komga image in macmini's Docker Compose stack.
set -euo pipefail

REMOTE=macmini
REPOSITORY=https://github.com/namJeongwan/simple-komga.git

echo "==> pull merged master and image on $REMOTE"
ssh "$REMOTE" "
  set -e
  export PATH=/opt/homebrew/bin:/usr/local/bin:\$PATH
  if [ ! -d ~/app/simple-komga/.git ]; then
    git clone '$REPOSITORY' ~/app/simple-komga
  fi
  git -C ~/app/simple-komga checkout master
  git -C ~/app/simple-komga pull --ff-only origin master
  cd ~/app/experiments/webdav
  docker compose pull simple-komga
  docker compose up -d --no-deps simple-komga
"

echo "==> smoke test"
status=$(curl -sS -o /dev/null -w '%{http_code}' https://macmini.tail993f0c.ts.net/)
test "$status" = 200
echo "==> deployed ($status)"
