# Job Labs — Front-end Prototype

A static, front-end-only copy of the Job Labs website (`job-labs` Laravel app) — the **public site and the ATS / dashboard** —
running entirely on **mock data**. No database, no PHP, no API — safe to host on Vercel.

## Tech stack

| | |
|---|---|
| Site generator | [Eleventy (11ty) v3](https://www.11ty.dev/) |
| Templates | Nunjucks (`.njk`) — 1:1 ports of the Blade views (same HTML, CSS and JS) |
| Styling / JS | Same hand-written CSS + vanilla JS as the live site; Font Awesome, Google Fonts, jQuery (sign-up page) via CDN |
| Data | Mock JSON-like JS modules in `src/_data/` |
| Hosting | Vercel (static output in `_site/`) |

## Run locally

```bash
npm install
npm run dev        # http://localhost:8080  (live reload)
npm run build      # outputs static site to _site/
```

Requires Node 18+.

## Run with Docker

```bash
docker compose up -d --build     # http://localhost:8081
docker compose logs -f           # view logs
docker compose down              # stop
```

The image only uses `node:20-alpine`: stage 1 builds the site with Eleventy, stage 2 serves `_site` with a tiny
zero-dependency Node server (`docker/server.mjs` — clean URLs like `/about-us`, the same redirects as `vercel.json`,
and the 404 page). `docker/nginx.conf` is an equivalent config if you'd rather serve `_site` with nginx.
Port **8081** is used so it can run next to the main `job-labs` app on 8000 — change it in `docker-compose.yml` if needed.
After editing templates or mock data, re-run `docker compose up -d --build`.

## Deploy to Vercel

1. Push this folder to a Git repo and import it in Vercel (framework preset **Eleventy** is detected;
   `vercel.json` already sets build command `npm run build` and output `_site`).
   Or from this folder: `npx vercel` then `npx vercel --prod`.
2. Optional: set env var `SITE_URL` (e.g. `https://job-labs-prototype.vercel.app`) — used for canonical
   and share links. Without it, the Vercel production domain is used automatically.

## Pages

| URL | Source (Blade) |
|---|---|
| `/` — Find Vacancies (search, filters, pagination, featured jobs) | `sl-jobs/sl-job-board` |
| `/employer` — Hire Talent | `sl-jobs/sl-landing-page` |
| `/about-us`, `/services`, `/contact`, `/faq` | `sl-jobs/*` |
| `/privacy-policy`, `/terms-of-service`, `/cookie-policy` | `sl-jobs/*` |
| `/{REF}/{slug}` — job details (one per mock job) | `sl-jobs/job-details` |
| `/{REF}/{slug}/apply` — application form | `sl-jobs/job-application` |
| `/company/{id}/{slug}` — company profile | `sl-jobs/company-profile` |
| `/cv-builder` — Resume Builder | `sl-jobs/cv-builder` |
| `/recruiters-signup` → `/signup/verify-otp` → `/signup/thankyou` | `hrportal/*` |
| `/login` — ATS sign-in with a **role picker** (Super Admin / Account Manager / Hiring Manager) | `auth/login` |
| `/ats/{role}/...` — the ATS / dashboard for that role (see below) | all dashboard views |
| `404` | `errors/404` |

## ATS / dashboard (`/ats/{role}/...`)

On `/login` pick **Super Admin**, **Account Manager** or **Hiring Manager** and click *Sign In*
(the demo e-mail and password are filled in). You land on `/ats/{role}/dashboard`.

- Roles: `superadmin` (everything), `account-manager` (staff, no role management),
  `hiring-manager` (Dilan Jayasuriya — Nuwara Digital Labs + Galle Coast Retail; only their vacancies).
- Pages: dashboard, Job Management (create / edit with **Preview**, my vacancies, archives),
  Track Vacancies + approval screen, applicants per vacancy (export to CSV/Excel), applicant edit,
  companies, users, roles, categories / labels, leads, support tickets, service payments, reports,
  activity log, Email & Vacancy audit logs — about 700 static pages in `public/ats/`.
- They are **snapshots of the real ATS views** rendered with the same mock companies and vacancies as
  the public site (plus mock candidates, applications, leads and audit history). See `tools/ats-snapshot/`.
- `public/js/ats-mock.js` fakes the back-end: saving a form shows "Saved — prototype only" and goes to the
  right list, AJAX calls get recorded/mock answers, delete/restore/export show a notice, and the vacancy
  **Preview** button shows the unsaved form on the real job page design.
- A "Prototype · {role} · Switch role" badge sits bottom-right on every ATS page.
- Limitations: search/filters don't filter, only the first 3 applicants per vacancy can be opened,
  closed vacancies from earlier in the year are listed but not all can be opened, and the snapshot
  dates are fixed (26 Nov 2026) — regenerate with the scripts in `tools/ats-snapshot/` when the ATS changes.

Candidate-account pages are not included.

## Mock data

- `src/_data/jobs.js` — 24 fictional vacancies (fields named like the Laravel query rows:
  `job_title`, `job_refno`, `jobtype`, `job_adv_salary`, `job_adv_closingdate`, …).
  Dates are relative to the build date, so jobs never expire. Edit / add rows here.
- `src/_data/companies.js` — 7 fictional companies (logos in `public/upload/`).
- `src/_data/lookups.js` — job types, sectors, work types, industries, cities (filter dropdowns).
- `src/_data/companyPages.js` — builds each company page (jobs + stats).

## How the "back-end" is faked

- **`public/js/job-board.js`** — does what `JobsBoardController@index` did on the server:
  reads the query string (`?search=&job_type=&city=&industry_sector=&salary_range=&page=`),
  filters the job cards, paginates (10 per page) and picks the search view or default view.
- **`public/js/mock-api.js`** (loaded first on every page) — answers the AJAX calls and form posts
  the Laravel app handled: job application, contact form, cookie preferences, CV PDF/Word download,
  recruiter sign-up → OTP → thank-you. Nothing is sent anywhere.

## Differences from the live site (on purpose)

- Google Analytics / AdSense / site-verification tags removed and pages marked `noindex`
  (so the prototype never pollutes production analytics or search results).
- reCAPTCHA removed from the recruiter sign-up form.
- "Resume Builder" links go to the live https://resume-builder.job-labs.lk/ (same as the live site).
  The old in-repo `/cv-builder` page is still included; its downloads produce a simple placeholder file.
- ATS sign-in is a role picker (no passwords are checked); password reset and candidate accounts are not part of the prototype.

## Notes

- `tools/blade2njk.py` is the one-off script used to convert the Blade views; templates were
  hand-finished afterwards, so don't re-run it over `src/`.
