# Fit Deal — Operations

How the site runs, how to deploy, and what to do when something breaks.

## How it's built

```
Browser ──> Render web service (node server.js, no npm dependencies)
              ├─ public/            pages, CSS, JS, images (built by build.js)
              ├─ /api/analyze       photo → Gemini (in memory, never stored)
              ├─ /api/search        search words → Flipkart API · Amazon Creators API · Google Shopping (Serper)
              ├─ /go/<search>/<product>   adds affiliate ID, counts the click, redirects
              ├─ /api/vote, /api/report, /api/contact, /api/event
              └─ /admin             owner dashboard (ADMIN_PASSWORD)
            Supabase Postgres (searches, votes, clicks, events, reports, messages, commissions)
```

- **Photos are never stored.** The browser shrinks the photo and strips its EXIF/location, the server checks the bytes, sends it once to Gemini, and forgets it.
- **Secrets** are only environment variables (`.env` locally, Render → Environment in production). See `.env.example`.
- **Without Supabase settings** the server keeps data in `data/*.json`. That's fine for local work, but not for Render: its disk is wiped on every deploy.

## Environments

| | Branch | Address | Database |
|---|---|---|---|
| Production | `main` | https://fitdeal.shop | Supabase `fitdeal` |
| Staging | `staging` | https://fitdeal-staging.onrender.com | Supabase `fitdeal-staging` (separate) |
| Local | any | http://localhost:5173 | `data/` files |

`render.yaml` defines both Render services. Every push deploys automatically, but the build runs `npm test` first, so a failing test stops the deploy.

**Release flow:** work on a branch → merge to `staging` → check the staging site → merge `staging` to `main`.

## Everyday commands

```
npm run dev                          build pages and start on :5173
npm test                             all tests (no real API calls, no cost)
node build.js                        rebuild public/ after editing src/ or CSS/JS
node scripts/brand.js                re-render icons and the share image from the logo SVGs
node scripts/benchmark.js <folder>   recognition report for a folder of screenshots (uses Gemini)
```

## Monitoring

- **Uptime:** point UptimeRobot (free) at `https://fitdeal.shop/api/health` every 5 minutes, with alerts to email or WhatsApp.
- **Errors:** set `ERROR_WEBHOOK_URL` to a Discord or Slack webhook, and every server error is posted there. The latest 100 errors are also on `/admin/errors`. Full logs are in Render → Logs; each log line is JSON and never contains photos or personal details.
- **Weekly review (every Monday):** look at `/admin?days=7` for the funnel, no-result rate, wrong-match reports, failed searches and cost per visitor. Read `/admin/reports` and `/admin/messages`.

## Backups and recovery

- Supabase: check that daily backups are included in your plan (Project → Database → Backups). Once a month, also take your own copy with `supabase db dump --db-url "<connection string>" > backup-YYYY-MM.sql` and keep it off Render.
- **Test a restore once before launch:** create a scratch Supabase project, run `supabase/schema.sql`, load the dump, point a local `.env` at it, run `npm run dev`, and open a saved `/find/<id>` link.
- The code is in GitHub, and pages are rebuilt from `src/` by `build.js`. Nothing else needs a backup: photos are never stored.

## Incident response

1. **Notice:** an UptimeRobot alert, the error webhook, or a user message.
2. **Check:** Render → Events (did a deploy just happen?) and Render → Logs. Also check `/api/health` and `/api/status`.
3. **Contain:**
   - Bad deploy → Render → Deploys → "Rollback" to the last good one.
   - An API key has leaked → revoke it at the provider **first** (Google AI Studio, Supabase, Flipkart, Serper), then set the new value in Render.
   - Abuse or a cost spike → lower the limits in `lib/api.js` (`limited(...)`), or temporarily remove `GEMINI_API_KEY`. The site then shows a clear "not switched on" message instead of breaking.
   - Wrong exact matches reported → check `/admin/reports`. The rules are in `lib/search/match.js`.
4. **Fix and test:** write a test that reproduces the bug, fix it, and let `npm test` pass on staging.
5. **Tell people:** if user data was exposed, notify affected users and the Data Protection Board of India as the DPDP Act requires, without delay.
6. **Write it down:** add a short note (what happened, why, what changed) to `docs/incidents/YYYY-MM-DD.md`.

## Launch-day switches

1. Connect `fitdeal.shop` in Render → Settings → Custom Domains. Render issues HTTPS automatically, and the server redirects http and www.
2. Set `NOINDEX=false` on production only.
3. Submit `https://fitdeal.shop/sitemap.xml` in Google Search Console and Bing Webmaster Tools.
4. Check that `/admin` works, that UptimeRobot is green, and that one real purchase shows up in each affiliate report.
