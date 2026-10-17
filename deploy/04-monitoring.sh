#!/usr/bin/env bash
# ponytail: /etc/vdalo/alerts.env (empty, owner fills), /opt/vdalo/deploy/vdalo-alerts.sh, 3 timers:
#  - vdalo-health (site reachable)
#  - vdalo-disk (>=80% warn)
#  - vdalo-docker-prune (daily, keeps last cache)
set -euo pipefail
[[ $EUID -eq 0 ]] || { echo "run as root"; exit 1; }

install -d -m 755 /etc/vdalo
if [[ ! -f /etc/vdalo/alerts.env ]]; then
  install -m 600 -o deploy -g deploy /dev/null /etc/vdalo/alerts.env
  cat >/etc/vdalo/alerts.env <<'EOF'
# Fill via: sudo /usr/local/sbin/vdalo-alerts setup
# (The command hides the bot token on input, pulls chat_id from Telegram getUpdates,
#  writes this file, and sends a test alert. Nothing secret prints to screen.)
TG_BOT_TOKEN=
TG_CHAT_ID=
EOF
  chmod 600 /etc/vdalo/alerts.env
  chown deploy:deploy /etc/vdalo/alerts.env
fi

install -m 755 /opt/vdalo/deploy/vdalo-alerts.sh /usr/local/sbin/vdalo-alerts

echo "== systemd units =="
cat >/etc/systemd/system/vdalo-health.service <<'EOF'
[Unit]
Description=VDALO site reachability check
[Service]
Type=oneshot
ExecStart=/usr/local/sbin/vdalo-alerts health
EOF
cat >/etc/systemd/system/vdalo-health.timer <<'EOF'
[Unit]
Description=Run VDALO health check every 2 minutes
[Timer]
OnBootSec=2min
OnUnitActiveSec=2min
AccuracySec=15s
[Install]
WantedBy=timers.target
EOF

cat >/etc/systemd/system/vdalo-disk.service <<'EOF'
[Unit]
Description=VDALO disk usage check
[Service]
Type=oneshot
ExecStart=/usr/local/sbin/vdalo-alerts disk
EOF
cat >/etc/systemd/system/vdalo-disk.timer <<'EOF'
[Unit]
Description=Run VDALO disk check hourly
[Timer]
OnBootSec=10min
OnUnitActiveSec=1h
AccuracySec=1min
[Install]
WantedBy=timers.target
EOF

cat >/etc/systemd/system/vdalo-docker-prune.service <<'EOF'
[Unit]
Description=VDALO docker build cache prune (keeps latest layers)
[Service]
Type=oneshot
Slice=builds.slice
ExecStart=/usr/bin/docker buildx prune --filter until=168h --force
ExecStart=/usr/bin/docker image prune --filter until=168h --force
EOF
cat >/etc/systemd/system/vdalo-docker-prune.timer <<'EOF'
[Unit]
Description=Daily docker prune at 03:00 UTC
[Timer]
OnCalendar=*-*-* 03:00:00
Persistent=true
[Install]
WantedBy=timers.target
EOF

systemctl daemon-reload
systemctl enable --now vdalo-health.timer vdalo-disk.timer vdalo-docker-prune.timer

echo "== DONE 04-monitoring =="
