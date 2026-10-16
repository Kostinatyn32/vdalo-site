#!/usr/bin/env bash
# ponytail: ufw + fail2ban. Only 22/80/443 inbound.
set -euo pipefail
[[ $EUID -eq 0 ]] || { echo "run as root"; exit 1; }

export DEBIAN_FRONTEND=noninteractive
apt-get install -y -qq ufw fail2ban

echo "== ufw =="
ufw --force reset >/dev/null
ufw default deny incoming
ufw default allow outgoing
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
# IPv6 off is fine too, Hetzner CX33 has IPv6 — keep it on for consistency with v4.
yes | ufw --force enable
ufw status verbose

echo "== fail2ban (ssh jail) =="
cat >/etc/fail2ban/jail.d/vdalo-ssh.local <<'EOF'
[sshd]
enabled = true
port    = 22
backend = systemd
maxretry = 5
findtime = 10m
bantime  = 1h
EOF
systemctl enable --now fail2ban
systemctl restart fail2ban
fail2ban-client status sshd || true

echo "== DONE 01-firewall =="
