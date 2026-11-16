#!/bin/bash
# Builds FitLife locally and ships it to the server as a new release.
#   ./deploy/lightsail/deploy.sh ubuntu@<server-ip> [ssh-key]
# Rollback to the previous successful release:
#   ./deploy/lightsail/deploy.sh --rollback ubuntu@<server-ip> [ssh-key]
set -euo pipefail
rollback=0
if [ "${1:-}" = "--rollback" ]; then rollback=1; shift; fi
host="${1:?usage: deploy.sh [--rollback] user@host [ssh-key]}"
ssh_opts=(-o StrictHostKeyChecking=accept-new)
if [ -n "${2:-}" ]; then ssh_opts+=(-i "$2"); fi

# Runs a script from stdin on the server as root; extra arguments become $1, $2, ...
as_root() { ssh "${ssh_opts[@]}" "$host" sudo bash -s -- "$@"; }

if [ "$rollback" = 1 ]; then
  as_root <<'EOF'
set -euo pipefail
cur=$(basename "$(readlink -f /opt/fitlife/current)")
prev=""
for d in /opt/fitlife/releases/*/; do
  name=$(basename "$d")
  if [ -f "$d.deployed" ] && [[ "$name" < "$cur" ]]; then prev=$name; fi
done
if [ -z "$prev" ]; then echo "No earlier successful release"; exit 1; fi
ln -sfn "/opt/fitlife/releases/$prev" /opt/fitlife/current
systemctl restart fitlife
echo "Rolled back to $prev"
EOF
  exit 0
fi

root="$(git rev-parse --show-toplevel)"
cd "$root"
release="$(date -u +%Y%m%d%H%M%S)-$(git rev-parse --short HEAD)"
npm run build
tarball="$(mktemp -d)/fitlife.tgz"
tar czf "$tarball" --exclude=.next/cache .next public package.json package-lock.json next.config.ts
scp "${ssh_opts[@]}" "$tarball" "$host:/tmp/fitlife-$release.tgz"

as_root "$release" <<'EOF'
set -euo pipefail
release=$1
dir=/opt/fitlife/releases/$release
tgz=/tmp/fitlife-$release.tgz
trap 'rm -f "$tgz"' EXIT

install -d -o fitlife -g fitlife -m 750 "$dir"
if ! runuser -u fitlife -- env HOME=/opt/fitlife sh -c \
    'cd "$1" && tar xzf "$2" && npm ci --omit=dev --no-audit --no-fund' sh "$dir" "$tgz"; then
  rm -rf "$dir"
  echo "Install failed; the live release was not changed"
  exit 1
fi

if [ -f /var/lib/fitlife/fitlife.db ]; then systemctl start fitlife-backup.service; fi

prev=""
if [ -L /opt/fitlife/current ]; then prev=$(readlink -f /opt/fitlife/current); fi
ln -sfn "$dir" /opt/fitlife/current
systemctl restart fitlife
for _ in $(seq 1 30); do
  if curl -fs -o /dev/null http://127.0.0.1:3000/api/health; then
    touch "$dir/.deployed"
    echo "Health check passed"
    exit 0
  fi
  sleep 2
done

echo "Health check failed"
if [ -n "$prev" ]; then
  ln -sfn "$prev" /opt/fitlife/current
  systemctl restart fitlife
  echo "Restored $(basename "$prev")"
fi
exit 1
EOF
echo "Deployed $release"
