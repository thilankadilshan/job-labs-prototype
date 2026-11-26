# ATS snapshot scripts (reference)

The `/ats/{role}/...` pages in `public/ats/` are **static snapshots of the real Job Labs ATS**,
rendered from the real Laravel views (main `job-labs` repo) with mock data. These scripts are
how they were made, kept here so the snapshot can be regenerated after ATS changes.

They are NOT run by the prototype build. To regenerate you need a copy of the main
`job-labs` Laravel app with its own **throw-away** MySQL database (never the live one),
`php artisan serve` on port 8099, Python 3 + Playwright (Chromium).

1. `seed.php`        - fills the throw-away DB with the same mock companies/jobs as `src/_data/`
                       (reads `tools/_mock_export.json`) plus candidates, applications, leads, audit logs.
                       Needs a dev-only route `/__t/x/login/{id}` that logs in as a user id.
2. `crawl.py`        - logs in as Super Admin (1), Account Manager (2) and Hiring Manager (3), opens
                       every reachable ATS page in Chromium and saves the HTML + AJAX responses.
3. `build_static.py` - rewrites links to `/ats/{role}/...`, turns forms/actions into prototype
                       actions, removes analytics, and writes `public/ats/` + `public/js/ats-mock-data-*.js`.
4. `shrink.py`       - strips indentation to keep the output small.

Paths inside the scripts point at the machine they were written on; adjust before use.
