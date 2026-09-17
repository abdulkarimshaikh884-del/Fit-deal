# Fit Deal (fitdeal.shop) — Site Plan

Tay kiya: 17 Sep 2026. Launch tak isi list par kaam hoga. Beech me aaya koi naya idea neeche "Baad me" list me jayega, V1 me nahi.

## Site kya karti hai (ek line)
User kapde ka screenshot daale ya product link chipkaye → Fit Deal wo kapda aur usse saste milte-julte kapde Indian stores par dhoondhe → user affiliate link se kharide.

## Stack (fix)
- Website: HTML/CSS/JS, Cloudflare Pages par (free, tez, commercial use allowed)
- API: Cloudflare Workers (free)
- Database aur vote pages: Supabase free
- Kapde ki pehchaan: Gemini Flash-Lite (bahut sasta)
- Kamai: Amazon Associates + Cuelinks jaisa affiliate network

## V1 pages (launch)
| # | Page | Address | Kaam |
|---|------|---------|------|
| 1 | Home | `/` | Screenshot upload ya link paste, Try a sample, How it works |
| 2 | Results | `/find/:id` | Pehchana hua kapda, sabse milta-julta product, saste options (price ke hisaab se), har store ka Buy button, Save, "Help me choose" |
| 3 | Vote | `/vote/:id` | Dosto ke liye share page: A/B/C look, vote, neeche "Apna look dhoondho" |
| 4 | Saved | `/saved` | Save kiye products (V1 me browser me hi save, login nahi) |
| 5 | About | `/about` | Fit Deal kya hai, kaun chala raha hai |
| 6 | How it works | `/how-it-works` | Upload → Find → Compare → Buy, affiliate kaise kaam karta hai |
| 7 | Contact | `/contact` | Form + email |
| 8 | Privacy Policy | `/privacy` | Photo kitni der rakhte hain (turant delete), DPDP |
| 9 | Terms + Affiliate Disclosure | `/terms` | Commission ki saaf jaankari (Amazon ki shart) |
| 10 | 404 | — | Galat link |

Mobile neeche ka tab bar (V1): Home · Find (upload) · Saved.
Desktop upar nav (V1): Home · How it works · Saved · "Upload Screenshot" button.

## V1 me nahi (sirf jab kaam kare tab dikhega)
Login/Profile, Alerts (price alert), Your Size, AI Try-On, Worth-It score. Design ke "Your Size" aur "AI Try-On" cards V1 home par nahi aayenge.

## Kaam ka kram
0. **Owner (aadha din):** fitdeal.shop domain (renewal price check), Cloudflare, Supabase, Google AI Studio key, Amazon Associates, Cuelinks accounts. 20 asli outfit screenshots.
1. **Engine test (1–2 din):** 20 screenshots par kapde ki pehchaan + store links. Kitne sahi aaye, wo number dekh kar aage badhenge.
2. **Results page + upload flow (3–4 din):** poora raasta end-to-end chale.
3. **Home page design ke hisaab se (2–3 din):** mobile + desktop.
4. **Vote page (2 din).**
5. **Saved + chhote pages + SEO + analytics (2–3 din).**
6. **Live + affiliate apply (1 din).**

Andaza: ~3 hafte, agar list nahi badli.

**Status (17 Sep 2026):** Home page (step 3) owner ke kehne par pehle bana: `public/index.html`, phone + desktop, mockup jaisa. Upload, link aur samples abhi "launching soon" batate hain; search step 1–2 me judega. Sample photos mockup se crop ki hain, asli photos aane par badalni hain. Chalane ke liye: `node dev-server.js` → http://localhost:5173

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
