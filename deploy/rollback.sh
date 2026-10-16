#!/usr/bin/env bash
# ponytail: ./rollback.sh <sha> [branch=main]
# Швидкий відкат production-контейнера на попередній образ vdalo/site:main-<sha>.
set -euo pipefail

SHA="${1:?usage: rollback.sh <sha> [branch]}"
BRANCH="${2:-main}"

case "$BRANCH" in
  main)    TAG_VAR=SITE_TAG;    SERVICE=site;         IMG="vdalo/site:main-$SHA" ;;
  staging) TAG_VAR=STAGING_TAG; SERVICE=site-staging;  IMG="vdalo/site:staging-$SHA" ;;
  *) echo "unknown branch: $BRANCH"; exit 2 ;;
esac

if ! docker image inspect "$IMG" >/dev/null 2>&1; then
  echo "image $IMG is not on this host — cannot roll back to it"
  docker image ls 'vdalo/site' | head -20
  exit 1
fi

cd /opt/vdalo
env "$TAG_VAR=$BRANCH-$SHA" docker compose -f deploy/compose.yml up -d --no-deps "$SERVICE"
echo "rolled $SERVICE to $IMG"
/opt/vdalo/deploy/vdalo-smoke.sh "http://127.0.0.1:$([[ $SERVICE == site ]] && echo 8080 || echo 8081)"
