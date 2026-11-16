#!/bin/bash
# One-time server setup for an Ubuntu 24.04 Lightsail instance. Run as root:
#   sudo FITLIFE_DOMAIN=fitlife.example.com bash setup.sh
set -euo pipefail
: "${FITLIFE_DOMAIN:?Set FITLIFE_DOMAIN to the hostname that points at this server}"
here="$(cd "$(dirname "$0")" && pwd)"

if ! swapon --show | grep -q /swapfile; then
  fallocate -l 1G /swapfile && chmod 600 /swapfile && mkswap /swapfile && swapon /swapfile
  echo '/swapfile none swap sw 0 0' >> /etc/fstab
fi

apt-get update
apt-get install -y ca-certificates curl gnupg debian-keyring debian-archive-keyring apt-transport-https unattended-upgrades
curl -fsSL https://deb.nodesource.com/setup_24.x | bash -
curl -1sLf https://dl.cloudsmith.io/public/caddy/stable/gpg.key | gpg --dearmor --yes -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt > /etc/apt/sources.list.d/caddy-stable.list
apt-get update
apt-get install -y nodejs caddy

id fitlife >/dev/null 2>&1 || useradd --system --home /opt/fitlife --shell /usr/sbin/nologin fitlife
install -d -o fitlife -g fitlife -m 750 /opt/fitlife /opt/fitlife/releases /var/lib/fitlife /var/lib/fitlife/backups

if [ ! -f /etc/fitlife.env ]; then
  cat > /etc/fitlife.env <<ENV
DATABASE_FILE=/var/lib/fitlife/fitlife.db
ADMIN_EMAIL=
ALLOWED_SIGNUP_EMAILS=
ENV
fi
chown root:fitlife /etc/fitlife.env && chmod 640 /etc/fitlife.env

install -m 644 "$here/fitlife.service" "$here/fitlife-backup.service" "$here/fitlife-backup.timer" /etc/systemd/system/
install -m 755 "$here/fitlife-backup" /usr/local/bin/fitlife-backup
sed "s/FITLIFE_DOMAIN/$FITLIFE_DOMAIN/" "$here/Caddyfile" > /etc/caddy/Caddyfile
install -d -o caddy -g caddy /var/log/caddy

systemctl daemon-reload
systemctl enable fitlife.service fitlife-backup.timer
systemctl start fitlife-backup.timer
systemctl reload-or-restart caddy
echo "Setup done. Edit /etc/fitlife.env, then deploy a release with deploy.sh."
