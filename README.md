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
- `src/lib/planner` — meal plan, workout program and cardio schedule generators
- `src/lib/db.ts`, `auth.ts`, `profile.ts`, `logs.ts` — persistence, sessions, logging
- `src/app/actions.ts` — server actions (each re-checks the session)
- `src/app/(app)` — authenticated screens: dashboard, food, recipes, meal plan, train,
  cardio, progress, profile, search, favorites, admin

## Notes on the recommendations

- Mifflin-St Jeor by default; Katch-McArdle when body fat is known.
- Calorie targets are floored (1500 kcal male / 1200 kcal female, and never below
  1.05 × BMR) and paces are conservative.
- Weight decisions use rolling averages, never a single weigh-in.
- Adaptive calorie changes are surfaced as suggestions and only applied if you accept.
