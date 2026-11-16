#!/bin/bash
# Builds FitLife locally and ships it to the server as a new release.
#   ./deploy/lightsail/deploy.sh ubuntu@<server-ip> [ssh-key]
# Rollback: ./deploy/lightsail/deploy.sh --rollback ubuntu@<server-ip> [ssh-key]
set -euo pipefail
rollback=0
if [ "${1:-}" = "--rollback" ]; then rollback=1; shift; fi
host="${1:?usage: deploy.sh [--rollback] user@host [ssh-key]}"
ssh_opts=(-o StrictHostKeyChecking=accept-new)
[ -n "${2:-}" ] && ssh_opts+=(-i "$2")

remote() { ssh "${ssh_opts[@]}" "$host" "$@"; }

if [ "$rollback" = 1 ]; then
  remote 'set -e; cd /opt/fitlife/releases; cur=$(readlink -f /opt/fitlife/current); prev=$(ls -1d */ | sed "s#/##" | sort | grep -B1 "$(basename "$cur")" | head -1)
    [ "$prev" != "$(basename "$cur")" ] || { echo "No earlier release"; exit 1; }
    sudo ln -sfn "/opt/fitlife/releases/$prev" /opt/fitlife/current && sudo systemctl restart fitlife && echo "Rolled back to $prev"'
  exit 0
fi

root="$(git rev-parse --show-toplevel)"
cd "$root"
release="$(date -u +%Y%m%d%H%M%S)-$(git rev-parse --short HEAD)"
npm run build
tarball="$(mktemp -d)/fitlife.tgz"
tar czf "$tarball" --exclude=.next/cache .next public package.json package-lock.json next.config.ts
scp "${ssh_opts[@]}" "$tarball" "$host:/tmp/fitlife-$release.tgz"

remote "set -e
  dir=/opt/fitlife/releases/$release
  sudo -u fitlife mkdir -p \$dir
  sudo -u fitlife tar xzf /tmp/fitlife-$release.tgz -C \$dir
  rm /tmp/fitlife-$release.tgz
  cd \$dir && sudo -u fitlife HOME=/tmp npm ci --omit=dev --no-audit --no-fund
  if [ -f /var/lib/fitlife/fitlife.db ]; then sudo systemctl start fitlife-backup.service; fi
  sudo ln -sfn \$dir /opt/fitlife/current
  sudo systemctl restart fitlife
  for i in \$(seq 1 30); do curl -fsS http://127.0.0.1:3000/api/health && exit 0; sleep 2; done
  echo 'Health check failed'; exit 1"
echo "Deployed $release"
