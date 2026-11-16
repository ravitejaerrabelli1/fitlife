# Deploying FitLife on AWS Lightsail

FitLife is one Next.js server with a SQLite file, so it runs on **one Lightsail Linux
server** with the database on the server's own disk. Nothing about the app or database
changes. The files used here live in [`deploy/lightsail/`](deploy/lightsail/).

| Piece | What it does |
|---|---|
| `setup.sh` | One-time server setup: 1 GB swap, Node 24, Caddy, a `fitlife` system user, systemd units, automatic security updates |
| `fitlife.service` | Runs `next start` on `127.0.0.1:3000` and restarts it if it crashes |
| `Caddyfile` | Public HTTPS (automatic Let's Encrypt certificate) proxied to the app |
| `fitlife-backup` + timer | Nightly consistent copy of the database (`VACUUM INTO`), kept 14 days |
| `deploy.sh` | Builds locally, uploads a new release, backs up the database, switches over, runs the health check; `--rollback` returns to the previous release |

## 1. Create the server (Lightsail console or CLI)
1. Create an instance: **Linux/Unix → OS only → Ubuntu 24.04**, smallest bundle with a
   public IPv4 address (512 MB memory). Pick the region closest to your users.
2. Attach a **static IP** (free while it's attached to a running instance).
3. Networking → IPv4 firewall: allow **SSH 22, HTTP 80, HTTPS 443**.
4. Turn on **automatic snapshots** (daily). These are your whole-server backups.
5. Point a domain at the static IP (an `A` record). For staging without a domain you can
   use `<ip-with-dashes>.sslip.io`.

## 2. Set up the server
```bash
scp -r deploy/lightsail ubuntu@<ip>:/tmp/
ssh ubuntu@<ip> 'sudo FITLIFE_DOMAIN=<domain> bash /tmp/lightsail/setup.sh'
ssh ubuntu@<ip> 'sudo nano /etc/fitlife.env'
```

`/etc/fitlife.env` (readable only by root and the app):

| Variable | Value | Why |
|---|---|---|
| `DATABASE_FILE` | `/var/lib/fitlife/fitlife.db` | The database lives on the server disk and survives restarts and redeploys |
| `ADMIN_EMAIL` | your email | That account becomes admin when it signs up |
| `ALLOWED_SIGNUP_EMAILS` | comma-separated emails | Optional. Only these emails can sign up (staging or a private launch) |

No other secrets are needed: sessions are random tokens stored in the database. The
session cookie is `Secure` because the service runs with `NODE_ENV=production`.

## 3. Deploy
From a checkout of the commit you want to ship (Node 24 installed locally):
```bash
./deploy/lightsail/deploy.sh ubuntu@<ip> ~/.ssh/<key>.pem
```
The build runs on your machine because 512 MB is too little memory for `next build`. Each
release goes to `/opt/fitlife/releases/<time>-<commit>`, and `/opt/fitlife/current` points
at the live one. Restarts take a few seconds.

**Rollback:** `./deploy/lightsail/deploy.sh --rollback ubuntu@<ip> ~/.ssh/<key>.pem`.
Schema changes are additive, so an older release can read the newer database. If data has
to go back too, restore a backup (below).

## 4. Backups and restore
- **Nightly database copies** in `/var/lib/fitlife/backups` (14 days), plus one before
  every deploy. Run one now with `sudo systemctl start fitlife-backup`.
- **Lightsail automatic snapshots** keep daily copies of the whole server disk.
- **Restore a database copy:**
  ```bash
  sudo systemctl stop fitlife
  sudo -u fitlife cp /var/lib/fitlife/backups/<file>.db /var/lib/fitlife/fitlife.db
  sudo rm -f /var/lib/fitlife/fitlife.db-wal /var/lib/fitlife/fitlife.db-shm
  sudo systemctl start fitlife
  ```
- **Restore a snapshot:** create a new instance from the snapshot, then move the static IP
  to it.
- Users can download their own data from Profile → Export.

## 5. Logs and monitoring
- App output: `journalctl -u fitlife`. `next start` doesn't log request URLs, and the app
  never logs reset tokens.
- Caddy access log: `/var/log/caddy/fitlife.log`. Reset links look like `/reset#<token>`,
  and the browser never sends the part after `#`, so tokens can't appear in it.
- Lightsail shows CPU and network metrics and can send alarm emails. External error
  tracking (such as Sentry) isn't set up; adding it is a separate decision because it
  sends error data to a third party.

## 6. Staging → production
Use a separate staging server with its own database and `ALLOWED_SIGNUP_EMAILS` set.
Never copy production data to staging. Promote by deploying the same commit to production.
