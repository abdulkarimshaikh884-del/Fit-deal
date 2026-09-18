# FitDeal (fitdeal.shop) — Site Plan

Tay kiya: 18 Sep 2026 (Final Concept Lock).

## Site kya karti hai (Core Journey)
User ne Instagram Reel, YouTube Short, Pinterest, influencer ya real life me koi outfit dekha → Screenshot upload kiya ya product link chipkaya:

```text
        Upload Fashion Screenshot
                   ↓
          AI detects clothing
                   ↓
       Exact Product Search
            + Similar Dupes
                   ↓
        Compare Store Prices
                   ↓
          Find Your Size
                   ↓
            TRY ON ME
                   ↓
       AI Virtual Try-On
                   ↓
       Worth-It / Fit Check
                   ↓
             BUY NOW
                   ↓
          Affiliate Store
```

**Positioning:** "Snap it. Find it. Try it. Buy it smarter."
**Core Promise:** "Love the look. Not the price? Snap it."
**Main Differentiator:** "See something you like anywhere → find it → find a cheaper version → know your size → see yourself wearing it → buy it."

## Stack (18 Sep 2026 update)
- Website + API: Pure Node server (`server.js`, zero npm dependencies) Render par.
- Database aur vote pages: Supabase (Postgres) + local JSON file fallback.
- Kapde ki pehchaan: Gemini `gemini-3.5-flash-lite` (structured JSON schema).
- Products: Flipkart Affiliate API, Amazon Creators API, Serper Google Shopping (Myntra/AJIO) + local sample catalog fallback.
- Kamai: 100% affiliate commission (Amazon Associates + Flipkart + Cuelinks/network).
- Detail: `docs/OPERATIONS.md`. Checklist: `CHECKLIST.md`.

## Phase 0 faisle
**Categories (V1):** shirt, T-shirt, top, dress, jeans, kurti. Baaki kapde "other": search chalta hai, par page batata hai ki match kamzor ho sakta hai.

**Stores (V1):** Amazon.in, Flipkart, Myntra, AJIO. Inke product links bhi chalte hain.

**Exact vs Similar:**
- *Exact* = proof ke saath wahi product: (1) paste kiye link ka product, ya (2) same GTIN/EAN barcode, ya (3) same brand + same style code.
- *Similar* = baaki sab. Naam, colour aur brand milna proof nahi hai. Sirf screenshot se Exact kabhi nahi.

**Ranking & Trust Rule:**
- Pehle exact (sasta pehle), phir similar (closest deal pehle, har tier me sasta pehle).
- **Affiliate commission ranking ka input hi nahi hai.** Cheaper/better deal hamesha #1 rahega.
- Honest disclosure footer aur cards par.

**Worth-It Score (Smart Buy Score out of 100):**
- Price savings vs MRP (up to 40 pts)
- Store reliability & return policy (up to 30 pts)
- Fit & match confidence (up to 30 pts)

**Size Recommendation:**
- Height, weight, chest, waist, hip, fit preference (slim/regular/loose) standard size chart se match hokar card par "Recommended: M (87% confidence)" show karta hai.

## V1 pages (launch)
| # | Page | Address | Kaam |
|---|------|---------|------|
| 1 | Home | `/` | Screenshot upload, link paste, 3 steps, Live comparison card, Recreate Look, Try sample |
| 2 | Results | `/find/:id` | Pehchana hua outfit, Exact & Similar dupes, Lowest price card, Worth-It score, Size recommendation, Buy at store, Try on me |
| 3 | Try-On | `/try-on/` | User photo upload + outfit select + before/after side-by-side (2 free daily try-ons quota) |
| 4 | Vote | `/vote/:id` | "Help me choose": A/B/C looks, friends vote, viral "Find your own look" CTA |
| 5 | Size Profile | `/profile/` | Height/weight/measurements form, standard size chart calculation, localStorage save |
| 6 | Saved | `/saved/` | Saved items (localStorage based, no login required) |
| 7 | About | `/about/` | FitDeal kya hai, kaun chala raha hai |
| 8 | How it works | `/how-it-works/` | Upload → Find → Try → Buy Smart |
| 9 | Contact | `/contact/` | Form + honeypot + spam protection |
| 10 | Privacy Policy | `/privacy/` | Photo zero retention policy, DPDP compliance |
| 11 | Terms + Affiliate Disclosure | `/terms/` & `/affiliate-disclosure/` | Commission disclosure (Amazon requirement) |
| 12 | 404 & 500 | `/404`, `/500` | Custom error pages |

Mobile tab bar (V1): Home · Find · Try-On · Saved · Profile.
Desktop nav (V1): Home · Try-On · How it works · Saved · Size Profile · "Upload Screenshot" CTA.

## V2 me (V1 launch ke baad)
- Cloud-synced user account (Google sign-in)
- Price drop alerts (email/push)
- Lens-style custom visual-search embedding API
- Automated photo measurement assistant
- Barcode scanner


## Kaam ka kram
0. **Owner (aadha din):** fitdeal.shop domain (renewal price check), Cloudflare, Supabase, Google AI Studio key, Amazon Associates, Cuelinks accounts. 20 asli outfit screenshots.
1. **Engine test (1–2 din):** 20 screenshots par kapde ki pehchaan + store links. Kitne sahi aaye, wo number dekh kar aage badhenge.
2. **Results page + upload flow (3–4 din):** poora raasta end-to-end chale.
3. **Home page design ke hisaab se (2–3 din):** mobile + desktop.
4. **Vote page (2 din).**
5. **Saved + chhote pages + SEO + analytics (2–3 din).**
6. **Live + affiliate apply (1 din).**

Andaza: ~3 hafte, agar list nahi badli.

**Status (18 Sep 2026):** Step 2–5 ka code poora hai aur tested hai (28 automated tests, live Gemini test 5/5). V1 nav: desktop Home · How it works · Saved + "Upload Screenshot"; mobile Home · Find · Saved. Extra pages: FAQ, Affiliate Disclosure, 500, `/admin`. Real products ke liye product-source keys aur Supabase chahiye (owner). Poora hisaab: `CHECKLIST.md`.

**Purana status (17 Sep 2026):** Home page (step 3) owner ke kehne par pehle bana: `public/index.html`, phone + desktop, mockup jaisa. Upload, link aur samples abhi "launching soon" batate hain; search step 1–2 me judega. Sample photos mockup se crop ki hain, asli photos aane par badalni hain. Chalane ke liye: `node dev-server.js` → http://localhost:5173

## Rules (3–4 mahine wali galti dobara nahi)
1. Launch tak scope freeze. Naya idea = "Baad me" list.
2. Page ka design pehle pakka, phir code. Home ka design hai; Results aur Vote ka design Home ki style me pehle dikhaunga, aapke OK ke baad banega.
3. Ek step poora aur live-test hone ke baad hi agla.
4. Koi fake number, fake review ya fake "% match" nahi. Jo number dikhe, wo asli ho.
5. Affiliate commission ranking tay nahi karega. Sasta/behtar deal hi upar.

## Baad me (V2+)
- Google login, Profile, saved sync
- Price alerts (Alerts tab)
- Size profile + brand size charts (Your Size)
- "Recreate this look" SEO pages (Shorts/Reels marketing)
- Lens-type exact match API (jab kamai aaye)
- AI Try-On (limit ke saath)
- Worth-It score, browser extension, app
