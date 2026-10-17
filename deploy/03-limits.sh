#!/usr/bin/env bash
# ponytail: builds.slice with memory/cpu/io caps. Site container limits live in compose.yml.
set -euo pipefail
[[ $EUID -eq 0 ]] || { echo "run as root"; exit 1; }

echo "== builds.slice =="
install -d /etc/systemd/system
cat >/etc/systemd/system/builds.slice <<'EOF'
[Unit]
Description=VDALO build slice (CPU/IO/memory capped)
Before=slices.target

[Slice]
MemoryHigh=4.5G
MemoryMax=5G
CPUWeight=20
IOWeight=20
TasksMax=4096
EOF
systemctl daemon-reload
systemctl start builds.slice
systemctl status builds.slice --no-pager | head -8

echo "== DONE 03-limits =="
