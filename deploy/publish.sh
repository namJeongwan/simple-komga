#!/usr/bin/env bash
set -euo pipefail

IMAGE=${SIMPLE_KOMGA_IMAGE:-jdk1107/simple-komga}
APP_VERSION=$(node -p "require('./package.json').version")
APP_MINOR_VERSION=${APP_VERSION%.*}
APP_MAJOR_VERSION=${APP_VERSION%%.*}
GIT_REVISION=$(git rev-parse HEAD)
EXPECTED_TAG="v$APP_VERSION"

test -z "$(git status --porcelain)"
test "$(git describe --exact-match --tags HEAD)" = "$EXPECTED_TAG"

docker buildx build \
  --platform linux/amd64,linux/arm64 \
  --build-arg "APP_VERSION=$APP_VERSION" \
  --build-arg "VCS_REF=$GIT_REVISION" \
  --tag "$IMAGE:$APP_VERSION" \
  --tag "$IMAGE:$APP_MINOR_VERSION" \
  --tag "$IMAGE:$APP_MAJOR_VERSION" \
  --tag "$IMAGE:latest" \
  --provenance=true \
  --sbom=true \
  --push \
  .
