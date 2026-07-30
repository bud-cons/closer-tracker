# Closer Tracker

A web app version of the team's sales tracker spreadsheet. Each closer gets their
own page with a stats box and appointment log; the home dashboard shows every
closer's numbers at a glance plus a Setter/Origin rollup across the whole team.

## What's here

- **Dashboard (`/`)** — a box per closer with that month's stats, plus a
  Setter/Origin breakdown table you can filter to one setter at a time.
- **Closer page (`/closer/[id]`)** — the three stat boxes from the sheet
  (Calls & Deals, Shows & Cancels, Setter/Origin — with its own dropdown
  filter), plus the appointment log with add/edit/delete.
- **Single shared password** gate (`SITE_PASSWORD` env var) protects the whole
  site.
- **Editable roster** — closer names and the Setter/Origin dropdown options
  both come from [`lib/constants.ts`](./lib/constants.ts). Edit that file and
  re-run the seed script to add or remove people.
- **Commission bonus tiers** — every $100k of Cash Collected in a month bumps
  the bonus rate by +1% (100k = 1%, 200k = 2%, 300k = 3%, ...). Cash
  Collected decides which tier a closer is in for the whole month (cliff, not
  marginal), and that rate is applied to that same **Cash Collected** total.
  The resulting dollar amount is added on top of Commission. Edit the tier
  size/step in [`lib/bonus.ts`](./lib/bonus.ts) if the plan changes.

## Local development

```bash
npm install
npm run seed      # creates the 8 closers in the database
npm run dev
```

Open http://localhost:3000 — the local password is set in `.env`
(`SITE_PASSWORD=changeme`). Change it before you rely on this for anything
real.

Locally the app uses a SQLite file (`prisma/dev.db`) so there's nothing to
provision. This does **not** work on Vercel (serverless functions don't have
persistent disk) — see deployment below.

## Deploying to Vercel

1. **Push this project to a GitHub repo.**
   ```bash
   cd closer-tracker
   git remote add origin <your-repo-url>
   git push -u origin main
   ```

2. **Switch the database to Postgres.** Vercel's serverless functions can't
   use the local SQLite file, so you need a real Postgres database. In
   `prisma/schema.prisma`, change:
   ```prisma
   datasource db {
     provider = "sqlite"
     url      = env("DATABASE_URL")
   }
   ```
   to:
   ```prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }
   ```

3. **Create a Postgres database.** In the Vercel dashboard: your project →
   Storage tab → Create Database → Postgres (Neon-backed, free tier is
   plenty for this). Vercel will offer to add the `DATABASE_URL` env var for
   you automatically.

4. **Import the project on Vercel** (vercel.com/new), pointing at the GitHub
   repo. Before the first deploy, add these environment variables in the
   Vercel project settings (Settings → Environment Variables):
   - `DATABASE_URL` — from step 3 (or added automatically)
   - `SITE_PASSWORD` — the password you want to gate the site with
   - `SESSION_SECRET` — any long random string (e.g. `openssl rand -base64 32`)

5. **Create the database tables.** After adding `DATABASE_URL` locally (in a
   `.env.local` pointing at the same Postgres DB, or by pulling env vars with
   `vercel env pull`), run once from your machine:
   ```bash
   npx prisma db push
   npm run seed
   ```
   This creates the tables and seeds the 8 closers. You only need to do this
   once (or again later if you add closers to `lib/constants.ts`).

6. **Deploy.** Push to `main` (or click Deploy in the Vercel dashboard). Visit
   your Vercel URL and log in with `SITE_PASSWORD`.

### Updating the roster later

Add or remove names in `lib/constants.ts`, then run `npm run seed` again
(locally, with `DATABASE_URL` pointed at the production database, or via
`vercel env pull` first). Existing appointment history for removed closers is
kept in the database but won't show a dashboard box anymore.
