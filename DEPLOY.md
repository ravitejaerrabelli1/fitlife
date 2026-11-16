# Deploying FitLife on Railway

FitLife is one Next.js server with a SQLite file. On Railway that means **one service with
one volume**. Build and deploy settings live in `railway.json`, and Node 24 is pinned by
`engines.node` in `package.json`.

## 1. Create the service
1. In Railway, create a project and add a service from this GitHub repo.
2. Add a **volume** to the service, mounted at `/data`.
3. Set these service variables:

| Variable | Value | Why |
|---|---|---|
| `DATABASE_FILE` | `/data/fitlife.db` | Keeps the database on the volume, so it survives restarts and redeploys |
| `ADMIN_EMAIL` | your email | That account becomes admin when it signs up |
| `ALLOWED_SIGNUP_EMAILS` | comma-separated emails | Optional. Only these emails can sign up (use it for staging or a private launch) |
| `NEXT_TELEMETRY_DISABLED` | `1` | Turns off Next.js telemetry |

No other secrets are needed: sessions are random tokens stored in the database.

4. Under Networking, generate a Railway domain. Railway serves it over HTTPS, and the
   session cookie is `Secure` because `next start` runs with `NODE_ENV=production`.

## 2. Things to know
- **Do not add replicas.** SQLite is a single file, and Railway doesn't allow replicas on
  services with a volume.
- **Redeploys have a short downtime** (seconds). Railway stops the old deployment before it
  mounts the volume on the new one.
- **The volume is only there at runtime**, not during the build. The app creates the database
  and runs its additive migrations on the first request.
- **Healthcheck:** `/api/health` runs `SELECT 1` and returns 200, or 503 if the database
  can't be opened. A deploy only goes live after it returns 200.

## 3. Backups
- In the service's **Backups** tab, turn on a **daily** schedule (and weekly if you want to
  keep backups longer). These are volume snapshots, billed at volume storage rates for the
  data that changed.
- Before each production deploy, create a manual backup.
- Restore: Backups tab → **Restore** on a dated backup → review the staged change → deploy.
  Test a restore on staging once before launch.
- Users can also download their own data from Profile → Export.

## 4. Logs and monitoring
- Railway keeps the server's stdout and stderr in the **Logs** tab. `next start` doesn't
  log request URLs, and the app never logs reset tokens.
- Reset links look like `/reset#<token>` (after #9 is merged). The token is in the URL
  fragment, so it never reaches Railway's edge or HTTP logs.
- The restart policy restarts the server up to 5 times if it crashes.
- External error tracking (such as Sentry) isn't set up. Adding it is a separate decision
  because it sends error data to a third party.

## 5. Staging → production
Use a Railway **environment** (e.g. `staging`) with its own volume and variables, and set
`ALLOWED_SIGNUP_EMAILS` there. Promote by deploying the same commit to `production`.

**Rollback:** redeploy the previous deployment from the Deployments tab. Schema changes are
additive, so older builds can read the newer database. If data has to go back as well,
restore the backup taken before the deploy.
