#!/usr/bin/env bash
# ponytail: Docker CE + compose plugin. Caddy via official binary (no repo mystery), systemd unit.
# Caddy terminates HTTPS and reverse-proxies to the site containers on 127.0.0.1.
# Docker log rotation at daemon level — no per-container config needed.
set -euo pipefail
[[ $EUID -eq 0 ]] || { echo "run as root"; exit 1; }

export DEBIAN_FRONTEND=noninteractive

echo "== Docker CE =="
if ! command -v docker >/dev/null; then
  apt-get install -y -qq ca-certificates curl gnupg
  install -m 0755 -d /etc/apt/keyrings
  curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
  chmod a+r /etc/apt/keyrings/docker.gpg
  . /etc/os-release
  # Fallback: if Docker has no package list for this Ubuntu codename yet (e.g. very new release),
  # pin to the latest LTS codename (jammy/noble) that Docker publishes for.
  codename="$VERSION_CODENAME"
  if ! curl -fsI "https://download.docker.com/linux/ubuntu/dists/${codename}/Release" >/dev/null; then
    codename=noble
    echo "docker: no index for $VERSION_CODENAME, pinning to $codename"
  fi
  echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $codename stable" \
    >/etc/apt/sources.list.d/docker.list
  apt-get update -qq
  apt-get install -y -qq docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
fi
usermod -aG docker deploy || true

echo "== Docker daemon: log rotation + live restore =="
install -d /etc/docker
cat >/etc/docker/daemon.json <<'EOF'
{
  "log-driver": "json-file",
  "log-opts": { "max-size": "10m", "max-file": "5" },
  "live-restore": true
}
EOF
systemctl enable --now docker
systemctl restart docker

echo "== Caddy =="
if ! command -v caddy >/dev/null; then
  apt-get install -y -qq debian-keyring debian-archive-keyring apt-transport-https curl
  curl -fsSL https://dl.cloudsmith.io/public/caddy/stable/gpg.key | gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
  curl -fsSL https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt >/etc/apt/sources.list.d/caddy-stable.list
  apt-get update -qq
  apt-get install -y -qq caddy
fi

install -d -m 755 -o caddy -g caddy /etc/caddy /var/lib/caddy /var/log/caddy
if [[ -f /opt/vdalo/deploy/Caddyfile ]]; then
  install -m 644 /opt/vdalo/deploy/Caddyfile /etc/caddy/Caddyfile
fi
systemctl enable --now caddy
systemctl reload caddy || systemctl restart caddy

echo "== DONE 02-docker-caddy =="
