#!/usr/bin/env bash
# ponytail: deploy user + sudo, SSH hardening (passwords off), swap, UTC time, journal cap, unattended-upgrades.
# НЕ закриває root — це робить окремий крок після перевірки, що deploy заходить і має sudo.
set -euo pipefail

[[ $EUID -eq 0 ]] || { echo "run as root (or sudo bash $0)"; exit 1; }

echo "== deploy user =="
if ! id deploy >/dev/null 2>&1; then
  useradd --create-home --shell /bin/bash --groups sudo deploy
fi
install -d -m 700 -o deploy -g deploy /home/deploy/.ssh
if [[ ! -s /home/deploy/.ssh/authorized_keys ]]; then
  cp /root/.ssh/authorized_keys /home/deploy/.ssh/authorized_keys
  chown deploy:deploy /home/deploy/.ssh/authorized_keys
  chmod 600 /home/deploy/.ssh/authorized_keys
fi
install -d -m 440 /etc/sudoers.d
cat >/etc/sudoers.d/90-deploy <<'EOF'
deploy ALL=(ALL) NOPASSWD:ALL
EOF
chmod 440 /etc/sudoers.d/90-deploy
visudo -c -f /etc/sudoers.d/90-deploy >/dev/null

echo "== sshd: keys only, no passwords =="
install -d -m 755 /etc/ssh/sshd_config.d
cat >/etc/ssh/sshd_config.d/50-vdalo.conf <<'EOF'
PasswordAuthentication no
KbdInteractiveAuthentication no
ChallengeResponseAuthentication no
PermitEmptyPasswords no
PubkeyAuthentication yes
# PermitRootLogin remains until deploy sudo is verified; a separate step flips it to no.
EOF
sshd -t
systemctl reload ssh

echo "== swap 4G =="
if ! swapon --show | grep -q '^/swapfile'; then
  fallocate -l 4G /swapfile || dd if=/dev/zero of=/swapfile bs=1M count=4096
  chmod 600 /swapfile
  mkswap /swapfile
  swapon /swapfile
  grep -q '^/swapfile' /etc/fstab || echo '/swapfile none swap sw 0 0' >>/etc/fstab
fi
sysctl -w vm.swappiness=10 >/dev/null
grep -q '^vm.swappiness' /etc/sysctl.d/99-vdalo.conf 2>/dev/null || \
  echo 'vm.swappiness=10' >/etc/sysctl.d/99-vdalo.conf

echo "== timezone UTC + NTP =="
timedatectl set-timezone UTC
timedatectl set-ntp true

echo "== journal cap 500M =="
install -d /etc/systemd/journald.conf.d
cat >/etc/systemd/journald.conf.d/50-vdalo.conf <<'EOF'
[Journal]
SystemMaxUse=500M
SystemKeepFree=1G
RuntimeMaxUse=100M
EOF
systemctl restart systemd-journald

echo "== unattended-upgrades (security only) =="
export DEBIAN_FRONTEND=noninteractive
apt-get update -qq
apt-get install -y -qq unattended-upgrades apt-listchanges
cat >/etc/apt/apt.conf.d/50vdalo-security <<'EOF'
Unattended-Upgrade::Allowed-Origins {
    "${distro_id}:${distro_codename}-security";
    "${distro_id}ESMApps:${distro_codename}-apps-security";
    "${distro_id}ESM:${distro_codename}-infra-security";
};
Unattended-Upgrade::Automatic-Reboot "false";
Unattended-Upgrade::Remove-Unused-Dependencies "true";
Unattended-Upgrade::MinimalSteps "true";
EOF
cat >/etc/apt/apt.conf.d/20auto-upgrades <<'EOF'
APT::Periodic::Update-Package-Lists "1";
APT::Periodic::Unattended-Upgrade "1";
APT::Periodic::AutocleanInterval "7";
EOF
systemctl enable --now unattended-upgrades.service >/dev/null

echo "== /etc/vdalo + /opt/vdalo =="
install -d -m 755 /etc/vdalo
install -d -m 755 -o deploy -g deploy /opt/vdalo
install -d -m 755 -o deploy -g deploy /opt/vdalo/releases
install -d -m 755 -o deploy -g deploy /var/log/vdalo

echo "== DONE 00-bootstrap =="
