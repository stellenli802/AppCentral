# AppCentral

## Intro
AppCentral is a mini-app platform that brings multiple everyday services into one host app. Users can discover and launch mini-apps (transportation, shopping, entertainment), receive notifications and live activity updates, and route tasks through a smart intent-based search experience.

The core idea is to combine:
- A secure mini-app runtime (sandboxed iframes + bridge messaging)
- A governance model (manifest-defined app permissions/capabilities)
- A unified host UX (home feed, activity center, search, and app management)

This repository contains the full-stack implementation:
- Frontend: React + Vite
- Backend: Express + TypeScript
- Database: PostgreSQL + Drizzle ORM

## Run Locally

### 1. Prerequisites
- Node.js 20+ (LTS recommended)
- npm 10+
- PostgreSQL 14+

### 2. Clone and enter project
```bash
git clone <your-repo-url>
cd AppCentral
```

### 3. Create environment variables
Create a `.env` file in the project root:

```bash
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/appcentral
SESSION_SECRET=replace-with-a-long-random-string
REPL_ID=local-dev
ISSUER_URL=https://replit.com/oidc
PORT=5000
DEV_AUTH_BYPASS=true
```

Notes:
- `DATABASE_URL` is required at startup.
- `SESSION_SECRET` is required for Express session auth.
- `REPL_ID` is required by the OIDC setup code. For local development, `local-dev` is enough to boot the app.
- The npm scripts in this repo auto-load `.env` by sourcing the file before running commands.
- `DEV_AUTH_BYPASS=true` enables local mock auth and skips Replit sign-in on localhost.

### 4. Install dependencies
```bash
npm install
```

### 5. Create local database
```bash
createdb appcentral
```

If your PostgreSQL user is not `postgres`, update `DATABASE_URL` in `.env` accordingly.

### 6. Initialize database schema
```bash
npm run db:push
```

### 7. Start the app
```bash
npm run dev
```

Open:
- http://localhost:5000

## Useful Commands
- `npm run dev` - start development server
- `npm run check` - type-check
- `npm run build` - build app
- `npm run start` - run production build

## Troubleshooting
- `DATABASE_URL must be set`:
  - Make sure `.env` exists and includes `DATABASE_URL`.
- `tsx: command not found`:
  - Dependencies are not installed yet. Run `npm install`.
- PostgreSQL connection errors:
  - Verify your database is running and `DATABASE_URL` is correct.
- `database "appcentral" does not exist`:
  - Run `createdb appcentral` (or create the DB in your Postgres UI), then rerun `npm run db:push`.

## Project Notes
- Auth integration lives in `server/replit_integrations/auth/`.
- Many endpoints work without authentication; auth-required endpoints return `401` unless you log in through configured OIDC.
