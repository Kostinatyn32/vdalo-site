#!/usr/bin/env bash
# ponytail: питає пароль прихованим вводом, хешить через `caddy hash-password`,
# пише /etc/caddy/staging-auth.conf (root:caddy 640), валідація, reload caddy.
# На екран нічого секретного.
set -euo pipefail

[[ $EUID -eq 0 ]] || { echo "run with sudo" >&2; exit 1; }
command -v caddy >/dev/null || { echo "caddy not installed" >&2; exit 1; }

cat <<'MSG'
Set a staging HTTP basic-auth password for the user "staging".
MSG
echo
printf "Password (hidden): "
stty -echo
IFS= read -r pw
stty echo
echo
[[ -n "$pw" ]] || { echo "empty, abort" >&2; exit 1; }

# Hash via Caddy (reads one line from stdin on recent versions).
hash=$(printf "%s" "$pw" | caddy hash-password 2>/dev/null | tail -1) || { echo "hash failed" >&2; exit 1; }
unset pw
[[ "$hash" =~ ^\$2[aby]\$[0-9]+\$ ]] || { echo "unexpected hash format" >&2; exit 1; }

install -o root -g caddy -m 640 /dev/null /etc/caddy/staging-auth.conf
printf "staging %s\n" "$hash" >/etc/caddy/staging-auth.conf
chmod 640 /etc/caddy/staging-auth.conf

if ! caddy validate --config /etc/caddy/Caddyfile >/dev/null 2>&1; then
  echo "/etc/caddy/Caddyfile is invalid; not reloading" >&2
  exit 1
fi
systemctl reload caddy
echo "staging basic auth updated and caddy reloaded"
