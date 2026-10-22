# FitLife

A mobile-first nutrition and training app: onboarding, calorie and macro targets, meal
plans and recipes, strength programming, cardio scheduling, and progress tracking —
all scoped to an authenticated account.

Every number the app shows is an estimate, not medical advice.

## Stack

- Next.js (App Router) + React + TypeScript
- Tailwind CSS 4
- SQLite via Node's built-in `node:sqlite` (no native build step)
- bcryptjs for password hashing, cookie-backed sessions
- Recharts for progress charts
- Vitest for unit tests

Requires Node 24+ (for `node:sqlite`).

## Getting started

```bash
npm install
npm run dev
```

Open http://localhost:3000, create an account, and complete onboarding.

The database is created on first use at `data/fitlife.db`. Override with
`DATABASE_FILE`. Set `ADMIN_EMAIL` before signing up to give that account the admin
role. Email delivery is not configured, so active password-reset links are listed
on the admin page (`/admin`) for the admin to pass on.

## Sign-in protection

- After 5 failed sign-ins for an email within 15 minutes, further attempts for that
  email are refused until the oldest failure is 15 minutes old. A successful sign-in or
  a password reset clears the counter.
- Password-reset requests are limited to 3 per email per hour. Extra requests get the
  same response as normal ones, so the page never reveals whether an account exists.
- Completing a password reset signs the account out on every device and marks the link
  used. Reset links are never written to logs; admins see active ones on `/admin`.
- Attempts are stored in the `auth_attempts` table (created automatically on startup;
  rows older than a day are pruned). Limits are per email, not per IP, so someone who
  knows an email can delay that user's sign-in by 15 minutes; the reset flow still works.

Rollout: deploy as usual; the table is created on startup. Rollback: redeploy the
previous build (it ignores the table), optionally `DROP TABLE auth_attempts`.

## Checks

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

## Structure

- `src/lib/calc` — BMR, TDEE, macros, BMI, body fat, weight trends, adaptive
  suggestions, unit conversion (pure functions, unit tested)
- `src/lib/content` — recipes, exercises, cardio activities, foods, supplements
- `src/lib/content/usda-foods.json` — ~7,800 everyday foods (nutrition per 100 g) from USDA FoodData
  Central SR Legacy (public domain). Regenerate with `node scripts/build-usda-foods.mjs <unzipped-csv-folder>`
- `src/lib/planner` — meal plan, workout program and cardio schedule generators
- `src/lib/db.ts`, `auth.ts`, `profile.ts`, `logs.ts` — persistence, sessions, logging
- `src/app/actions.ts` — server actions (each re-checks the session)
- `src/app/(app)` — authenticated screens: dashboard, food, recipes, meal plan, train,
  cardio, progress, profile, favorites, admin

## Notes on the recommendations

- Mifflin-St Jeor by default; Katch-McArdle when body fat is known.
- Calorie targets are floored (1500 kcal male / 1200 kcal female, and never below
  1.05 × BMR) and paces are conservative.
- Weight decisions use rolling averages, never a single weigh-in.
- Adaptive calorie changes are surfaced as suggestions and only applied if you accept.
