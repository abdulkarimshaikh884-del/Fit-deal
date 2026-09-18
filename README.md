# Fit Deal

**fitdeal.shop**: See an outfit you love? Fit Deal finds it, and finds it for less.

Upload a screenshot or paste a product link. Fit Deal recognises the clothing, finds the same or similar products on Amazon, Flipkart, Myntra and AJIO, and ranks them by how close they are and by price, never by commission.

## Run it locally

Needs Node 20 or newer. There's nothing to install: the project has no npm dependencies.

```
cp .env.example .env      # add your keys; everything works without them, just with less
npm run dev               # http://localhost:5173
npm test                  # 28 tests, no real API calls
```

What each key switches on:

| Setting | What it turns on |
|---|---|
| `GEMINI_API_KEY` | Photo recognition (use a key with billing on) |
| `FLIPKART_AFFILIATE_*`, `AMAZON_CREATORS_*`, `SERPER_API_KEY` | Real product results with prices |
| `AMAZON_PARTNER_TAG`, `FLIPKART_AFFILIATE_ID`, `AFFILIATE_NETWORK_TEMPLATE` | Affiliate IDs on Buy links |
| `SUPABASE_URL`, `SUPABASE_SERVICE_KEY` | The real database (otherwise `data/*.json`) |
| `ADMIN_PASSWORD` | The `/admin` dashboard |

## Where things are

| Path | What |
|---|---|
| `src/pages/*.html` | Page content. `build.js` wraps each one in the shared header, footer and tab bar and writes `public/` |
| `public/css/site.css`, `public/js/*.js` | Styles and page scripts |
| `server.js` | Web server: pages, security headers, `/api`, `/go`, `/admin` |
| `lib/recognize.js` | Clothing recognition (Gemini) and its checks |
| `lib/stores.js` | Supported stores, product-link parsing, affiliate links |
| `lib/search/` | Product sources, normalising, Exact/Similar rules, ranking |
| `lib/api.js`, `lib/admin.js` | API routes and the owner dashboard |
| `supabase/schema.sql` | Database tables |
| `test/` | Automated tests |
| `src/later/` | V2 designs kept out of V1 (Try-On, Alerts, Profile) |

After editing anything in `src/`, `site.css` or `public/js/`, run `node build.js`. A test fails if you forget.

## More

- `PLAN.md`: what we're building and the rules
- `CHECKLIST.md`: the master checklist and where each item stands
- `docs/OPERATIONS.md`: deploys, staging, monitoring, backups, incident response
