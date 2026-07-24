#!/usr/bin/env bash
# Pull merged code and recreate simple-komga in a remote Docker Compose stack.
set -euo pipefail

: "${SIMPLE_KOMGA_DEPLOY_HOST:?Set SIMPLE_KOMGA_DEPLOY_HOST to an SSH host}"
: "${SIMPLE_KOMGA_DEPLOY_DIR:?Set SIMPLE_KOMGA_DEPLOY_DIR to the remote Compose directory}"
: "${SIMPLE_KOMGA_HEALTHCHECK_URL:?Set SIMPLE_KOMGA_HEALTHCHECK_URL to the public app URL}"

REPOSITORY=${SIMPLE_KOMGA_REPOSITORY:-https://github.com/namJeongwan/simple-komga.git}
REMOTE_REPOSITORY_DIR=${SIMPLE_KOMGA_REMOTE_REPOSITORY_DIR:-app/simple-komga}
BRANCH=${SIMPLE_KOMGA_BRANCH:-master}

echo "==> pull merged $BRANCH and image on $SIMPLE_KOMGA_DEPLOY_HOST"
ssh "$SIMPLE_KOMGA_DEPLOY_HOST" "
  set -e
  export PATH=/opt/homebrew/bin:/usr/local/bin:\$PATH
  repository_dir=\"\$HOME/$REMOTE_REPOSITORY_DIR\"
  if [ ! -d \"\$repository_dir/.git\" ]; then
    git clone '$REPOSITORY' \"\$repository_dir\"
  fi
  git -C \"\$repository_dir\" checkout '$BRANCH'
  git -C \"\$repository_dir\" pull --ff-only origin '$BRANCH'
  cd '$SIMPLE_KOMGA_DEPLOY_DIR'
  docker compose pull simple-komga
  docker compose up -d --no-deps simple-komga
"

echo "==> smoke test"
status=$(curl -sS -o /dev/null -w '%{http_code}' "$SIMPLE_KOMGA_HEALTHCHECK_URL")
test "$status" = 200
echo "==> deployed ($status)"
