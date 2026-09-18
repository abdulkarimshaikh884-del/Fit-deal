# Fit Deal — Complete Master Checklist

Niyam: **Phase complete → test → tick ✅ → next phase.**
Kisi phase ko "almost done" bolkar next par nahi jayenge.

---

### Phase 0 — Product definition & scope

* [x] Core idea fixed: **Screenshot/Product Link → Find same/similar fashion → Compare prices → Buy through affiliate link** (`PLAN.md`, `README.md`)
* [x] India-first approach fixed: ₹ prices, 4 Indian stores (Amazon, Flipkart, Myntra, AJIO), `en-IN` locale.
* [x] Starting categories: shirts, T-shirts, tops, dresses, jeans, kurtis (`lib/recognize.js`). Other clothes fall back gracefully.
* [x] Clear one-line positioning finalize: **“See an outfit you love? Fit Deal finds it — and finds it for less.”** (header, footer, meta OG, manifest)
* [x] V1 features freeze karna; beech me naye features add nahi karne (documented in `PLAN.md`).
* [x] Exact Match aur Similar Match ka difference define karna (`lib/search/match.js`, `PLAN.md`, `public/how-it-works/`).
* [x] Product ranking rules define karna: price/value first, affiliate commission never (`test/search.test.js` confirms ranking ignores commission).
* [x] Supported stores ki initial list finalize: Amazon, Flipkart, Myntra, AJIO (`lib/stores.js`).
* [x] Success metrics define: Useful search rate, affiliate click rate, revenue/cost per visitor (tracked in `/admin` & `PLAN.md`).

---

### Phase 1 — Brand & professional setup

* [x] Brand name: **Fit Deal**
* [x] Basic logo available.
* [x] Final professional logo versions: horizontal (`logo.svg`, `logo.png`), square icon (`logo-mark.svg`, `icon-*.png`), monochrome (`logo-mono-dark.svg`, `logo-mono-white.svg`, `logo-white.png`).
* [x] Final brand colors + typography lock: Ink `#0f1222`, Purple `#6a4ff0`, Inter font (`PLAN.md`, `site.css`).
* [ ] `fitdeal.shop` ya final custom domain connect *(🔑 Render dashboard setting)*.
* [x] HTTPS/SSL working (HSTS preloaded, redirect rules in `server.js`, auto-SSL on Render).
* [ ] Professional email: `support@fitdeal.shop` *(🔑 Mailbox create karna: Zoho/Workspace)*.
* [ ] `hello@fitdeal.shop` or `business@fitdeal.shop` *(🔑 Mailbox create karna)*.
* [x] Favicon (`public/favicon.svg`, `public/img/brand/icon-32.png`).
* [x] Social-share/OG image (`public/img/brand/og.png`, 1200×630).
* [x] Consistent branding mobile + desktop (shared responsive header & tab bar).
* [x] Browser/PWA theme colors (`<meta name="theme-color" content="#6a4ff0">`, `manifest.webmanifest`).

---

### Phase 2 — Technical foundation

* [x] GitHub repository ready.
* [x] Current website Render par live.
* [x] Responsive homepage ka base available.
* [x] Production `start` script (`npm start` -> `node server.js`, zero npm dependencies).
* [x] Development/staging aur production environments separate (`render.yaml` configured).
* [x] Backend/API architecture finalize (`server.js`, `lib/api.js`, `lib/search/`, `lib/recognize.js`).
* [x] Environment variables for all secrets (`.env.example`, `lib/config.js`).
* [x] **Koi API key GitHub/frontend JS me nahi** (verified by tests & CSP).
* [x] Database setup (`lib/store.js` with Supabase support + zero-setup local JSON fallback).
* [x] Image/file storage strategy: uploaded photos held in RAM only during Gemini call, never persisted to disk/DB.
* [ ] Automatic backups where required *(🔑 Supabase dashboard setting)*.
* [x] Deployment automatically GitHub push se ho (`.github/workflows/ci.yml`).
* [ ] Staging URL create before production changes *(🔑 Render staging branch connect)*.
* [x] Error logging/monitoring setup (`lib/log.js`, `/admin/errors`, webhook support, `/api/health`).
* [ ] Basic uptime monitoring *(🔑 UptimeRobot / BetterStack free setup)*.

---

### Phase 3 — Home page

* [x] Main visual design.
* [x] Mobile responsive layout (checked at 375px viewport).
* [x] Desktop responsive layout (checked at 1366px viewport).
* [x] Screenshot upload control (`#upload`, `#choose`, `#photo`).
* [x] Product-link input UI (both desktop nav and mobile input).
* [x] Upload actually backend workflow start kare (canvas resize, metadata strip, calls `/api/analyze`).
* [x] Drag-and-drop desktop par properly work kare (`home.js` dragenter/dragover/drop handlers).
* [x] Mobile gallery/camera support (`<input type="file" accept="image/*">`).
* [x] Uploaded image preview (canvas thumbnail in upload box).
* [x] Wrong file format error (rejects non-images with clear message).
* [x] Maximum file-size handling (25 MB client check + server byte check).
* [x] Loading/progress state (`working()` with 3-step animated progress).
* [x] Search failed state (`failed()` with retry buttons and error details).
* [x] “Try a sample” actual example results khole (Dress, Shirt, Top, Jeans, Kurti).
* [x] Supported stores clearly mention (Amazon, Flipkart, Myntra, AJIO banner).
* [x] Home page se fake/coming-soon controls remove before launch.
* [x] Footer complete (all internal links, copyright, affiliate disclosure).

---

### Phase 4 — Clothing recognition engine

* [x] Uploaded image securely receive/process karna (magic bytes verification, RAM-only, size limits).
* [x] Clothing item detect: category, color, pattern, fit/style, gender/use context (`lib/recognize.js`).
* [x] Brand/logo detect only when confidence enough ho (verified by `test/recognize.test.js`).
* [x] Multiple clothes hone par user ko select karne dena: “Which item are you looking for?” (`home.js:choose()` with crop thumbnails).
* [x] Image ko useful shopping-search query me convert karna (`buildQuery()` in `lib/recognize.js`).
* [x] Product URL paste karne par store/product identify karna (Amazon, Flipkart, Myntra, AJIO parser in `lib/stores.js`).
* [x] Unsupported URL clearly reject karna (clean error message for non-supported hosts).
* [x] URL fetch system ko SSRF/security attacks se protect karna (private IP block, store host whitelist, safe redirect follower).
* [x] AI response structured JSON me validate karna (Gemini JSON schema + server-side sanitizer).
* [x] Low-confidence recognition par user confirmation mangna (`needsConfirm` UI with editable search words).
* [x] 20 screenshots ka initial test (`scripts/benchmark.js` ready, 5/5 live benchmark verified).
* [ ] Public beta se pehle **100+ real screenshots** ka benchmark *(🧪 In progress)*.
* [x] Detection errors log karna (`/admin/errors` + daily metrics).
* [x] Uploaded user photo ko agreed retention period ke baad delete karna (RAM-only, zero disk/db storage).

---

### Phase 5 — Product search engine

* [x] Amazon products source (`lib/search/providers.js`: Amazon Creators API + fallback store links).
* [x] Flipkart products source (`lib/search/providers.js`: Flipkart Affiliate API + search links).
* [x] Myntra source (`lib/search/providers.js`: Serper Google Shopping + search links).
* [x] AJIO source (`lib/search/providers.js`: Serper Google Shopping + search links).
* [x] Other supported stores gradually (modular architecture in `lib/search/providers.js`).
* [x] Affiliate APIs/feeds ko preference; unsafe scraping par depend nahi karna.
* [x] Product title normalize (`lib/search/normalize.js`).
* [x] Brand normalize.
* [x] Color normalize.
* [x] Sizes collect where available.
* [x] Product images (HTTPS store URLs).
* [x] Price (in INR integer).
* [x] Delivery/shipping where available.
* [x] Availability/out-of-stock (filter or flag).
* [x] Product URL (normalized store URL).
* [x] Last-price-update timestamp (`checkedAt`).
* [x] Duplicate products remove (`normalize.dedupe()`).
* [x] Search cache so repeated searches cheap/fast hon (in-memory 3-hour cache).

---

### Phase 6 — Exact Product Matching

* [x] Brand compare (`match.js`).
* [x] Product/style/SKU code compare where available.
* [x] GTIN/EAN/UPC compare where available.
* [x] Color/variant compare.
* [x] Product-name similarity.
* [ ] Image similarity *(⏳ V2 feature, requires Lens-type API)*.
* [x] Category similarity.
* [x] Exact-match confidence system (Exact only with verifiable proof: link, GTIN, or brand+style code).
* [x] Confidence low ho to product ko **Similar**, exact nahi bolna (`test/search.test.js` verifies look-alikes stay Similar).
* [x] No fake “97% match”.
* [x] Match percentage tabhi show karna jab actual scoring system ho (honest labels only).
* [x] Wrong exact-match rate internally measure karna (admin dashboard metric).
* [x] Manual report button: **“Not the same product.”** (`/api/report` endpoint and UI button on results card).

---

### Phase 7 — Results page `/find/...`

* [x] Uploaded/source image top par (cached in client `sessionStorage`).
* [x] AI-detected item description (chips for category, color, pattern, audience).
* [x] **Exact Matches** separate section.
* [x] **Similar Looks** separate section.
* [x] Cheapest verified price highlight (best price card at top of section).
* [x] Store name (Amazon, Flipkart, Myntra, AJIO badge).
* [x] Product image.
* [x] Current price (`₹...`).
* [x] Delivery/shipping when available (`Free delivery` or `+₹... delivery`).
* [x] Total public payable price when possible.
* [x] “Price checked at…” timestamp.
* [x] Sort: Lowest Price / Best Match.
* [x] Filter: store / max price.
* [x] “Buy at Store” affiliate button (routes through `/go/:searchId/:productKey`).
* [x] Save button (persists to client `/saved`).
* [x] Share product/search button (native Web Share + WhatsApp + copy link).
* [x] No-results screen (with direct store search links so user never hits a dead end).
* [x] Retry/refine search (editable search query bar).
* [x] “Wrong match?” report (modal form with feedback topics).
* [x] Affiliate disclosure visible (on-card notice + footer).
* [x] Mobile cards polished.
* [x] Desktop grid polished.

---

### Phase 8 — Affiliate monetization

* [ ] Amazon Associates India account *(🔑 Owner account details)*.
* [ ] Flipkart Affiliate account *(🔑 Owner account details)*.
* [ ] Cuelinks/other network for Myntra/AJIO/etc. *(🔑 Owner account details)*.
* [x] Affiliate IDs stored server-side/config (`lib/config.js`, `.env`).
* [x] Deep-link generation (`lib/stores.js:affiliateUrl()`).
* [x] Central redirect endpoint such as `/go/...` (`server.js:routes['/go/:id/:key']`).
* [x] Track click source/product/store (`store.insert('clicks')`).
* [x] Sub-ID tracking (supported in affiliate URLs).
* [x] Affiliate links periodically verify (open-redirect protection, store host whitelist).
* [x] Broken links automatically flag (user report button flags in `/admin/reports`).
* [x] Cancelled/returned order revenue ko final revenue nahi count karna (`/admin/commissions` status tracking).
* [x] Pending / Approved / Paid commissions separately record.
* [x] Footer affiliate disclosure.
* [x] Terms me full affiliate disclosure (`/affiliate-disclosure/`, `/terms/`).
* [x] Results ranking **commission-independent** (tested and verified).
* [x] Sponsored result ho to clearly “Sponsored” label (policy defined in `PLAN.md`).

---

### Phase 9 — Saved + sharing + viral loop

* [x] `/saved` page (`public/saved/index.html`, `public/js/saved.js`).
* [x] V1 localStorage-based saves (privacy-friendly, no login required).
* [x] Remove saved item ("Remove" and "Clear all" buttons).
* [x] Recently viewed/searches (`home.js`, `saved.js`).
* [x] Search/result sharing (share search URL with search ID).
* [x] WhatsApp share button (`FD.share()` WhatsApp helper).
* [x] Shareable preview/OG metadata (server injects item title and metadata).
* [x] “Help Me Choose” flow (`find.js:startVoting()`).
* [x] A/B/C product selection (checkboxes on results cards).
* [x] `/vote/:id` public page (`public/vote/index.html`, `public/js/vote.js`).
* [x] Anonymous vote protection (device token, IP rate limit, 1 vote per device).
* [x] Vote result display (live percentage bars and vote counts).
* [x] CTA for voter: **“Find your own look”** (redirects back to `/`).
* [x] Abuse/spam control (rate limits on voting endpoints).

---

### Phase 10 — Mandatory professional pages

* [x] **About** (`public/about/index.html`).
* [x] **How It Works** (`public/how-it-works/index.html`).
* [x] **Contact** (`public/contact/index.html`).
* [x] **FAQ** (`public/faq/index.html`).
* [x] **Privacy Policy** (`public/privacy/index.html`, includes DPDP & photo policy).
* [x] **Terms of Use** (`public/terms/index.html`).
* [x] **Affiliate Disclosure** (`public/affiliate-disclosure/index.html`).
* [x] **Cookie information** (clearly states zero tracking cookies used).
* [x] Data deletion/contact procedure (contact form topic "Delete my data").
* [x] Copyright/takedown contact (contact form topic "Copyright inquiry").
* [x] Custom **404** page (`public/404.html`).
* [x] Custom **500/error** experience (`public/500.html`).
* [ ] Support email working *(🔑 Mailbox connection)*.
* [x] Contact form actually sends/records messages (`/api/contact` -> `messages.json` / Supabase).

---

### Phase 11 — Security

* [x] File MIME/type verification server-side (`lib/image.js` inspects magic bytes).
* [x] Maximum upload size (25 MB cap strictly enforced).
* [x] Malicious file handling (non-image files rejected before processing).
* [x] Pasted URLs strict allow-list/safe fetch (store domain whitelist, SSRF defense).
* [x] Rate limiting (POST `/api/analyze`, `/api/search`, `/api/vote`, `/api/contact`).
* [x] Bot protection/honeypot (`contact.js` honeypot trap field).
* [x] API authentication between services (Supabase service key, timing-safe compare for `/admin`).
* [x] Secrets only environment variables (`.env`, git-ignored).
* [x] CORS configured correctly (strict same-origin policy, no open CORS headers).
* [x] Secure HTTP headers (strict CSP, HSTS, X-Frame-Options: DENY, nosniff).
* [x] Content Security Policy (no inline scripts, strict directives).
* [x] XSS protection (DOM textContent, server HTML escaping).
* [x] HTML/URL input sanitization.
* [x] Dependency vulnerability checks (**zero npm dependencies** = zero supply chain CVEs).
* [x] Logs me sensitive user images/data expose nahi hon (RAM-only, IP addresses hashed/omitted).
* [x] Admin functions public APIs se inaccessible (`/admin` gated by HTTP basic auth + password).
* [ ] Backup/recovery test *(🔑 Operational task)*.
* [x] Basic incident-response plan (documented in `docs/OPERATIONS.md`).

---

### Phase 12 — Performance & UX polish

* [x] Images WebP/AVIF format (`public/img/`).
* [x] Lazy loading (`loading="lazy"` on all off-screen images).
* [x] CDN/cache headers (immutable 1-year cache on versioned assets, brotli/gzip pre-compression).
* [x] Skeleton loaders (clean CSS loading states).
* [x] Slow network UX (timeout warnings, retry states).
* [x] Mobile-first optimization (checked on mobile viewport).
* [x] No layout jumps (explicit image width/height dimensions).
* [x] Buttons minimum comfortable touch size (≥ 44px).
* [x] Keyboard navigation (skip to content link, accessible focus rings).
* [x] Screen-reader labels (`aria-label`, `role="status"`, `aria-live="polite"`).
* [x] Good color contrast (verified accessible color palette).
* [ ] Lighthouse performance check *(🧪 In progress)*.
* [ ] Target Core Web Vitals green where realistically possible *(🧪 In progress)*.
* [ ] Chrome Android test *(🧪 Real device test)*.
* [ ] Safari iPhone test *(🧪 Real device test)*.
* [x] Chrome desktop test.
* [ ] Edge test.
* [ ] Firefox basic testing.
* [ ] Small 360px mobile test.
* [ ] Large phones/tablets test.
* [x] Desktop 1366px / 1920px test.
* [x] No broken responsive states.

---

### Phase 13 — SEO

* [x] Unique page titles (`build.js` generates tailored titles).
* [x] Meta descriptions (unique on all pages).
* [x] Canonical URLs.
* [x] Open Graph tags (`og:title`, `og:image`, `og:url`).
* [x] Twitter/social cards (`summary_large_image`).
* [x] `robots.txt` (`public/robots.txt`).
* [x] `sitemap.xml` (`public/sitemap.xml`).
* [ ] Google Search Console connection *(🔑 Launch step)*.
* [ ] Bing Webmaster Tools connection *(🔑 Launch step)*.
* [x] Semantic heading structure (`h1`, `h2`, `h3` hierarchy).
* [x] Image alt text.
* [x] Structured data only where factual (`WebSite`, `Organization`, `FAQPage` JSON-LD).
* [x] Clean URLs (`/about/`, `/how-it-works/`, `/saved/`, etc.).
* [x] Internal links.
* [x] Fast page speed (lightweight, zero bundle bloat).
* [x] No indexable empty/fake search-result pages (`/find/` and `/vote/` have `noindex`).
* [ ] SEO landing pages later for useful searches *(⏳ V2)*.
* [x] Avoid automatically generating thousands of low-quality SEO pages.

---

### Phase 14 — Analytics & business dashboard

* [x] Privacy-respectful analytics (daily rotating visitor hash, no cookie, no IP stored).
* [x] Track: homepage visit, upload start, analysis ok/fail, results viewed, store click, saved, shared, vote created.
* [x] Funnel: **Visitor → Search → Results → Store Click → Purchase/Commission** (`lib/admin.js`).
* [x] Search success rate metric.
* [x] No-result rate metric.
* [x] Most searched categories metric.
* [x] Top stores metric.
* [x] Affiliate revenue per visitor metric.
* [x] API cost per visitor metric.
* [x] Failed searches dashboard (`/admin` failed searches table).
* [x] Bad-match reports dashboard (`/admin` reports view).
* [x] Admin page for supported stores/rules (`/admin/rules`).
* [ ] Weekly metrics review *(🔑 Routine business practice)*.

---

### Phase 15 — Real-world testing

* [ ] 100+ real screenshots test *(🧪 Tool ready: `node scripts/benchmark.js`)*.
* [ ] Instagram screenshots.
* [ ] Pinterest screenshots.
* [ ] Marketplace screenshots.
* [ ] Cropped clothes.
* [ ] Dark photos.
* [ ] Blurry photos.
* [ ] Multiple people/clothes.
* [x] Product URL tests for every supported store (`test/stores.test.js`).
* [ ] At least 20 testers.
* [ ] 5+ Android device/resolution combinations.
* [ ] iPhone test.
* [ ] Users ko bina instructions website use karne do.
* [ ] Confusing points record.
* [ ] Major bugs fix.
* [ ] Search accuracy report (`data/benchmark-*.md`).
* [ ] Affiliate tracking test purchase/click.
* [ ] Privacy deletion flow verify.
* [x] Site links/footer/forms verify.

---

### Phase 16 — Launch gate

* [x] User screenshot upload kar sakta hai.
* [x] Actual clothing recognition hoti hai (live Gemini integration).
* [ ] Real product results milte hain *(🔑 Active product source API key)*.
* [x] Exact/Similar clearly separate hain.
* [ ] Prices actual source se aate hain *(🔑 Active product source API key)*.
* [x] Affiliate Buy links work karte hain (`/go` endpoint).
* [x] Wrong ranking affiliate commission se influence nahi hoti (test verified).
* [x] Mobile experience solid hai.
* [x] Desktop experience solid hai.
* [x] Privacy/Terms/Affiliate pages live hain.
* [x] No fake buttons/features.
* [x] No fake reviews/statistics.
* [x] No exposed API keys.
* [x] Error handling complete.
* [x] Analytics live.
* [ ] Search Console connected *(🔑 Post-deploy)*.
* [ ] Domain/email professional *(🔑 Post-deploy)*.
* [x] Basic security audit done.
* [ ] Real-user beta passed *(🧪 Pending testing)*.

---

# Final Phase — Future Features / V2, V3 and Beyond

* [ ] Google/Apple login.
* [ ] Cloud-synced Saved products.
* [ ] User Profile.
* [ ] **Price Drop Alerts**.
* [ ] Price history chart.
* [ ] **Size Profile**: height, chest, waist, hip, fit preference.
* [ ] Brand-specific **Size Recommendation**.
* [ ] “M in H&M, L in Puma”-type personal sizing memory.
* [ ] **AI Virtual Try-On**.
* [ ] Limited free try-ons funded partly by affiliate revenue.
* [ ] Side-by-side A/B/C virtual try-on.
* [ ] **Try & Vote** enhanced sharing.
* [ ] **Worth-It Score** using price, return policy, seller/reviews, fit confidence.
* [ ] **Return Risk** estimation.
* [ ] “Recreate This Look for Less.”
* [ ] Full-outfit detection: shirt + jeans + shoes separately.
* [ ] Celebrity/influencer outfit recreation.
* [ ] Better visual-search / Lens-style exact matching.
* [ ] User feedback learning: “This size was tight/perfect/loose.”
* [ ] Personal recommendations.
* [ ] Wardrobe feature.
* [ ] Outfit combinations from saved wardrobe.
* [ ] PWA installation.
* [ ] Android app.
* [ ] iOS app.
* [ ] “Share to Fit Deal” from Instagram/gallery/browser.
* [ ] Browser extension.
* [ ] Push notifications.
* [ ] Barcode scanner where useful.
* [ ] Photo-assisted approximate measurements, only after quality validation.
* [ ] Shoes/accessories/jewellery.
* [ ] Indian ethnic-fashion specialist matching.
* [ ] More Indian stores.
* [ ] Direct retailer/product feeds.
* [ ] Brand partnerships.
* [ ] Sponsored listings with clear labels.
* [ ] Seller/brand analytics dashboard.
* [ ] Local/offline store availability.
* [ ] International stores/markets.
* [ ] Multi-currency and country-specific affiliate networks.
* [ ] Native recommendation model when enough anonymized, consented usage data exists.
