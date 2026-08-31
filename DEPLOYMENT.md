# Deployment Guide — Supabase + Render + Netlify

Deploy the Savio Bosco Alphas 2012 site on the three free-tier platforms:

1. **Supabase** — PostgreSQL database + file storage (images, PDFs)
2. **Render** — the Express API (all data access, admin auth, uploads)
3. **Netlify** — the React frontend (public site + admin panel)

> Total cost: **$0/month** on free tiers (Supabase Free, Render Free,
> Netlify Free). A Git repository (e.g. GitHub) is needed for Render + Netlify
> to build from.

---

## 0) Push the code to a Git repo

```bash
# from the sba2012-hosted folder
git init
git add -A
git commit -m "SBA 2012 — React + Supabase + Render + Netlify"
# create an empty repo on GitHub, then:
git remote add origin https://github.com/<you>/<repo>.git
git push -u origin main
```

---

## 1) Supabase — database + storage

1. Create an account at **https://supabase.com** → **New project**
   (pick a name, a strong database password, and a region close to your
   members — e.g. *Europe (Frankfurt)* or *Africa (Cape Town)* if available).
2. Wait for the project to be ready, then open **SQL Editor → New query**.
3. Paste the **entire contents of `supabase/schema.sql`** and click **Run**.
   You should see all 9 tables created (members, payments, news, blogs,
   gallery, documents, messages, settings, admins).
4. Create the public storage bucket:
   **Storage → New bucket** → name it exactly `uploads` → tick
   **Public bucket** → Create.
5. Grab the values you'll need later:
   - **Project URL**: *Project Settings → General* → `https://<ref>.supabase.co`
   - **Service role key**: *Project Settings → API* (server-only secret —
     it only lives on Render, never in the frontend)
   - **Connection string**: *Project Settings → Database* → *Connection
     string → Direct connection*, e.g.
     `postgresql://postgres.<ref>:<your-password>@db.<ref>.supabase.co:5432/postgres`

### 2) Seed the database + upload the seed files

From your computer (or any machine with Node 18+), in the `backend/` folder:

```bash
cd backend
cp .env.example .env
# edit .env — put in the three Supabase values + DATABASE_URL (direct connection)
# (leave SUPABASE_BUCKET=uploads; JWT_SECRET can stay for seeding)
npm install
npm run seed
```

The seed:
- creates/verifies all tables (safe to re-run),
- inserts the sample members (`SBA12P47`, `SBA12H29`, `SBA12E83`), their
  payments, news, blogs, gallery, the documents **including the full
  constitution**, and the default admin,
- uploads the seed images + constitution PDF into the `uploads` bucket.

Want a different initial admin password? Set it before seeding:

```bash
SEED_ADMIN_PASSWORD="YourStrongPassword123" npm run seed
```

> To start with a **completely empty** site (no sample members/documents),
> skip the seed and instead insert only the admin row — see the note at the
> bottom of this document.

---

## 2) Render — the API

1. Create an account at **https://render.com** (GitHub sign-in).
2. **New → Blueprint** (recommended — uses `render.yaml`) → select your repo.
   This creates a *Web Service* named `sba2012-api` with:
   - Root directory: `backend`
   - Build: `npm install` · Start: `npm start`
   - Health check: `/api/health`
   *(Alternatively: **New → Web Service**, then set Root Directory to
   `backend`, Build Command `npm install`, Start Command `npm start` — and
   add the env vars below manually.)*
3. In the service's **Environment** tab, set:

   | Variable                  | Value                                                        |
   |---------------------------|--------------------------------------------------------------|
   | `DATABASE_URL`            | the direct connection string from Supabase (step 1.5)        |
   | `DATABASE_SSL`            | `false` (switch to `true` if connections fail with SSL)      |
   | `SUPABASE_URL`            | `https://<ref>.supabase.co`                                  |
   | `SUPABASE_SERVICE_ROLE_KEY` | the service-role key from Supabase                         |
   | `SUPABASE_BUCKET`         | `uploads` (already in render.yaml)                            |
   | `JWT_SECRET`              | auto-generated (or your own long random string)              |
   | `FRONTEND_URL`            | your Netlify site URL (set after step 3 — then re-deploy)    |

4. **Deploy**. When it's green, open `https://<service>.onrender.com/api/health`
   in a browser — you should see `{"ok":true,"storage":"supabase"}`.

> **Free tier note:** Render's free instances sleep after ~15 min of inactivity.
> The first request after a sleep takes ~30 s to wake up. That's normal.

---

## 3) Netlify — the frontend

1. Create an account at **https://app.netlify.com** → **Add new site → Import
   an existing project** → connect the same GitHub repo.
2. Build settings (`netlify.toml` at the repo root already handles most of
   this — the build runs inside `frontend/`):
   - **Base directory:** `frontend`
   - **Build command:** `npm run build`
   - **Publish directory:** `dist`
3. In **Site configuration → Environment variables**, add:

   | Variable        | Value                                              |
   |-----------------|----------------------------------------------------|
   | `VITE_API_URL`  | your Render API URL, e.g. `https://sba2012-api.onrender.com` |

   (No trailing slash.)
4. **Deploy**.
5. Go back to Render → set `FRONTEND_URL` to your Netlify site URL →
   **redeploy** the API (this enables CORS for your site's origin).

Your site is live. 🎉

---

## 4) First-login checklist (important)

- [ ] Visit your site → `/admin` → sign in with `admin` / `sba12admin`
      (or the password you set with `SEED_ADMIN_PASSWORD`).
- [ ] **Change the admin password immediately**: Admin → Settings →
      *Change password*.
- [ ] If you seeded sample data you don't want, delete it:
      Admin → Dashboard (members), News/Blogs/Gallery/Documents pages.
- [ ] Test the member flow end-to-end:
      register a test member → approve it on the Dashboard → open the Audit
      Portal with the new ID.
- [ ] (Optional) tighten Supabase: *Project Settings → Database* — you can
      revoke unused connection strings; only the one Render uses is needed.

---

## Everyday operations

| Task | Where |
|------|-------|
| Approve/reject members | Admin → Dashboard |
| Record a payment | Admin → Payments (pick member + type + year, save) |
| Upload per-year documents | Admin → Documents (type + year + file or pasted text) |
| Read contact messages | Admin → Messages |
| Change contact details | Admin → Settings |
| View the raw database | Supabase → Table Editor / SQL Editor |
| View uploaded files | Supabase → Storage → `uploads` bucket |
| Restore/inspect data | Supabase → Database → Backups (free tier keeps 1 day) |

---

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| Page loads but shows "Loading…" forever | `VITE_API_URL` missing/wrong in Netlify env vars (then re-deploy Netlify). |
| API works locally but frontend gets CORS errors | Render's `FRONTEND_URL` doesn't exactly match the Netlify URL — set it and redeploy Render. |
| Images/PDFs don't load in the audit portal or admin | Bucket name must be exactly `uploads` **and public**; seed files present in Storage. |
| `{"error":"Your session has expired…"}` in the admin | Token expired (12 h) — sign in again. |
| API 500 on deploy | Check the connection string in `DATABASE_URL`; try `DATABASE_SSL=true`. |
| First request after idle is slow | Normal free-tier spin-down — wait once, it's fast again. |
| Want a blank site (no seed data) | After creating tables + bucket, insert just an admin row in the Supabase SQL editor: `INSERT INTO admins (username, name, password) VALUES ('admin','Administrator', '<bcrypt-hash>');` — generate the hash with: `node -e "console.log(require('bcryptjs').hashSync('YourPassword',10))"` |

---

## Local development (without Supabase)

Without `SUPABASE_URL`/`SUPABASE_SERVICE_ROLE_KEY`, the API stores files on its
own disk (`backend/uploads/`) and serves them at `/file/<name>` — the exact
same code path the browser uses, so development matches production. Use any
local PostgreSQL (or Docker: `docker run -e POSTGRES_PASSWORD=pw -e
POSTGRES_DB=sba -p 5432:5432 postgres:16`) with
`DATABASE_URL=postgres://postgres:pw@localhost:5432/sba`.
