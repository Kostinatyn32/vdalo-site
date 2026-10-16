#!/usr/bin/env bash
# ponytail: щохвилини перевіряє main/staging; за новим SHA — build у builds.slice,
# прогонить тести, валідацію схеми, оновлює контейнер, smoke, за помилки — відкат і тривога.
set -euo pipefail

REPO=/opt/vdalo/repo
STATE=/var/lib/vdalo
LOG=/var/log/vdalo/update.log
ALERT=/usr/local/sbin/vdalo-alerts
install -d "$STATE" "$(dirname "$LOG")"

exec >>"$LOG" 2>&1
echo "---- $(date -u +%FT%TZ) check ----"

[[ -d "$REPO/.git" ]] || { echo "repo missing at $REPO"; exit 0; }

run_update() {
  local branch="$1" image_tag="$2" service="$3"
  local last_file="$STATE/last-$branch"
  cd "$REPO"
  git fetch --quiet origin "$branch" || { echo "fetch $branch failed"; return 0; }
  local new; new=$(git rev-parse "origin/$branch")
  local last=""; [[ -f "$last_file" ]] && last=$(cat "$last_file")
  if [[ "$new" == "$last" ]]; then return 0; fi
  echo "[$branch] $last -> $new"

  # Checkout a disposable worktree so we never touch the main one.
  local wt=/opt/vdalo/releases/"$branch"-"$new"
  rm -rf "$wt"
  git worktree add --detach "$wt" "$new"

  # Build + validate inside builds.slice.
  if ! systemd-run --quiet --wait --slice=builds.slice --unit="vdalo-build-$branch-$$" \
        --working-directory="$wt" \
        /bin/sh -c "
          set -e
          docker build -f deploy/Dockerfile -t vdalo/site:$image_tag-$new -t vdalo/site:$image_tag .
          node --test tests/
          node scripts/validate-schema.mjs
        "; then
    echo "build/test failed for $branch@$new"
    "$ALERT" deploy-failed "build/test failed on $branch@$new"
    git worktree remove --force "$wt"
    return 1
  fi

  # Roll new container.
  local tag_var
  case "$branch" in
    main)    tag_var="SITE_TAG=$image_tag-$new" ;;
    staging) tag_var="STAGING_TAG=$image_tag-$new" ;;
    *) echo "unknown branch $branch"; return 1 ;;
  esac
  if ! (cd /opt/vdalo && env "$tag_var" docker compose -f deploy/compose.yml up -d --no-deps "$service"); then
    "$ALERT" deploy-failed "compose up failed on $branch@$new"
    git worktree remove --force "$wt"
    return 1
  fi

  # Smoke (10s warmup window).
  sleep 4
  local port=8080
  [[ "$service" == site-staging ]] && port=8081
  if ! /opt/vdalo/deploy/vdalo-smoke.sh "http://127.0.0.1:$port"; then
    echo "smoke failed, rolling back"
    "$ALERT" deploy-failed "smoke failed on $branch@$new"
    # Rollback to previous tag if we have one.
    if [[ -n "$last" ]]; then
      (cd /opt/vdalo && env "$tag_var=$image_tag-$last" docker compose -f deploy/compose.yml up -d --no-deps "$service") || true
    fi
    git worktree remove --force "$wt"
    return 1
  fi

  echo "$new" >"$last_file"
  "$ALERT" deploy-ok "$branch@$new live"
  # Keep this release, prune older release worktrees for this branch (keep 3).
  (cd /opt/vdalo/releases && ls -1dt "$branch"-* 2>/dev/null | tail -n +4 | xargs -r rm -rf)
}

run_update main    main    site        || true
run_update staging staging site-staging || true

echo "done"
