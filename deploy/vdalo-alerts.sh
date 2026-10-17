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

check_url() {
  local label="$1" key="$2" url="$3"
  if ! curl -fsS -m 10 -o /dev/null "$url"; then
    should_fire "$key" && notify DOWN "$label unreachable at $url"
  else
    clear_fire "$key"
  fi
}

cmd="${1:-}"
case "$cmd" in
  health)
    check_url site    site    "${SITE_URL:-http://127.0.0.1:8080/}"
    check_url staging staging "${STAGING_URL:-http://127.0.0.1:8081/}"
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
    echo "test alert emitted (check Telegram and $LOG)"
    ;;
  setup)
    [[ $EUID -eq 0 ]] || { echo "run with sudo" >&2; exit 1; }
    install -d -m 755 /etc/vdalo
    install -d -m 755 /var/log/vdalo
    cat <<'MSG'
Setup VDALO alerts to Telegram.

Before continuing:
  1. Create a NEW bot in @BotFather (separate from the PMS bot) and copy its token.
  2. Open the new bot in your Telegram and send it any message (e.g. "hi").
  3. Paste the token at the next prompt (hidden input).
MSG
    echo
    printf "Bot token (hidden): "
    stty -echo
    IFS= read -r token
    stty echo
    echo
    [[ "$token" =~ ^[0-9]+:[A-Za-z0-9_-]+$ ]] || { echo "Invalid token format" >&2; exit 1; }

    resp=$(curl -sS -m 15 "https://api.telegram.org/bot${token}/getUpdates") \
      || { echo "Failed to reach Telegram API" >&2; exit 1; }
    echo "$resp" | grep -q '"ok":true' \
      || { echo "Telegram API error (token wrong?)" >&2; exit 1; }

    chat_id=$(echo "$resp" | grep -oE '"chat":\{"id":-?[0-9]+' | tail -1 | grep -oE '\-?[0-9]+$')
    if [[ -z "$chat_id" ]]; then
      echo "No message to the bot found. Open the bot in Telegram, send any text, then rerun this setup." >&2
      exit 1
    fi

    umask 177
    cat >/etc/vdalo/alerts.env <<ENV
TG_BOT_TOKEN=$token
TG_CHAT_ID=$chat_id
ENV
    unset token
    chown deploy:deploy /etc/vdalo/alerts.env
    chmod 600 /etc/vdalo/alerts.env
    "$0" test >/dev/null
    echo "setup OK; a test alert was sent to the configured chat"
    ;;
  *)
    echo "usage: $0 {health|disk|deploy-failed MSG|deploy-ok MSG|test|setup}" >&2
    exit 2
    ;;
esac
