#!/usr/bin/env bash
# ponytail: Один скрипт на всі тривоги. Коли TG_* порожні — тихо логує у /var/log/vdalo/alerts.log.
set -euo pipefail

ENV_FILE=/etc/vdalo/alerts.env
STATE_DIR=/var/lib/vdalo
LOG=/var/log/vdalo/alerts.log
mkdir -p "$STATE_DIR" "$(dirname "$LOG")"

[[ -r "$ENV_FILE" ]] && . "$ENV_FILE" || true

notify() {
  local kind="$1" msg="$2"
  local stamp; stamp=$(date -u +%FT%TZ)
  echo "[$stamp] $kind $msg" >>"$LOG"
  if [[ -n "${TG_BOT_TOKEN:-}" && -n "${TG_CHAT_ID:-}" ]]; then
    curl -sS -m 10 "https://api.telegram.org/bot${TG_BOT_TOKEN}/sendMessage" \
      --data-urlencode "chat_id=${TG_CHAT_ID}" \
      --data-urlencode "text=[VDALO/${kind}] ${msg}" \
      >/dev/null || true
  fi
}

# Deduplicate: do not re-fire within 30 min for the same key.
should_fire() {
  local key="$1"
  local f="$STATE_DIR/alert-$key"
  local now=$(date +%s) last=0
  [[ -f "$f" ]] && last=$(cat "$f" 2>/dev/null || echo 0)
  (( now - last >= 1800 )) || return 1
  echo "$now" >"$f"
}
clear_fire() { rm -f "$STATE_DIR/alert-$1"; }

cmd="${1:-}"
case "$cmd" in
  health)
    url="${HEALTH_URL:-http://127.0.0.1:8080/}"
    if ! curl -fsS -m 10 -o /dev/null "$url"; then
      should_fire site && notify DOWN "site unreachable at $url"
    else
      clear_fire site
    fi
    ;;
  disk)
    pct=$(df -P / | awk 'NR==2{sub("%","",$5); print $5}')
    if (( pct >= 80 )); then
      should_fire disk && notify DISK "root filesystem at ${pct}%"
    else
      clear_fire disk
    fi
    ;;
  deploy-failed)
    shift
    notify DEPLOY-FAIL "${*:-site deploy failed}"
    ;;
  deploy-ok)
    shift
    notify DEPLOY-OK "${*:-site deploy ok}"
    ;;
  test)
    notify TEST "alerts pipeline test"
    ;;
  *)
    echo "usage: $0 {health|disk|deploy-failed MSG|deploy-ok MSG|test}" >&2
    exit 2
    ;;
esac
