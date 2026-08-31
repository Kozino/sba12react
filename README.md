# Savio Bosco Alphas 2012 — Hosted Version (React + Supabase + Render + Netlify)

The complete association website as a **three-platform, production-hostable** stack:

| Platform  | What it runs                                   | Folder       |
|-----------|------------------------------------------------|--------------|
| **Supabase** | PostgreSQL database + file Storage          | `supabase/`  |
| **Render**   | Express API (all data, admin auth, uploads) | `backend/`   |
| **Netlify**  | React (Vite) frontend (public site + admin) | `frontend/`  |

Everything else is identical to the earlier versions of the site:

- **Public pages** — Home, About, Executives & Leadership, News, Blogs, Gallery,
  Contact, Member Registration, Member Audit Portal.
- **Registration** — members get a unique 8-character ID (`SBA12…`), created in
  `pending` status; the ID only works on the Audit Portal after the executives
  **approve** it in the admin panel.
- **Audit Portal** — strictly ID-gated: wrong/unknown ID → error, pending or
  rejected → locked out, active member → payments with totals, the constitution,
  minutes, financial reports, attendance and financial-presence documents (by year).
- **Payments** — the four types: Annual Due, Financial Presence, Burial
  Contribution, Wedding Contribution; status computed (Paid / Partially Paid /
  Owing / Contribution).
- **Admin panel** — dashboard (approve / reject / edit / delete members),
  payments, news, blogs, gallery, documents (per-year uploads), messages,
  settings, change password.
- **Design** — same navy `#001D69` / gold `#FDBF2E` identity, Playfair Display +
  Inter, same page structure as the other site versions.

## How the pieces talk

```
Browser ──► Netlify (React SPA)
   │
   ├─ /api/*  ──► Render (Express API)  ──► Supabase Postgres
   └─ uploads  ──► Render /file/<name> ──► Supabase Storage (public bucket "uploads")
```

Admin auth uses a **JWT** returned at login (stored in the browser, sent as a
`Bearer` token) — this works across the Netlify→Render origin boundary, with
CORS enabled on the API.

## Database (9 tables)

`members`, `payments`, `news`, `blogs`, `gallery`, `documents`, `messages`,
`settings`, `admins` — see [`supabase/schema.sql`](supabase/schema.sql) for the
full DDL with comments (including the payment-status rules and the document
type list).

## Quick start (local)

Requires Node 18+ and a local PostgreSQL (any recent version).

```bash
# 1. API
cd backend
cp .env.example .env          # set DATABASE_URL to your local Postgres
npm install
npm run seed                  # creates tables + seed data + seed files
npm start                     # http://localhost:8081

# 2. Frontend
cd ../frontend
cp .env.example .env.local    # VITE_API_URL=http://localhost:8081
npm install
npm run dev                   # http://localhost:5173
```

Seed members: `SBA12P47`, `SBA12H29`, `SBA12E83` · Admin: `admin` / `sba12admin`
(change it after first login).

## Deploying

**Follow [`DEPLOYMENT.md`](DEPLOYMENT.md)** — step-by-step for Supabase →
Render → Netlify, including env vars, the seed command and first-login
checklist.
