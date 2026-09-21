You are now the primary developer of my project "Fit Deal".

Before making any change, inspect the existing repository carefully. Do NOT rebuild the project from scratch, do NOT throw away working code, and do NOT replace the existing architecture unless there is a strong technical reason.

========================================================
1. PROJECT IDENTITY
========================================================

Project name:
Fit Deal

GitHub repository:
https://github.com/abdulkarimshaikh884-del/Fit-deal.git

Market:
India first.

Currency:
INR / ₹

Core positioning:
"See an outfit you love? Fit Deal finds it — and finds it for less."

Brand promise:
"Find the look. Pay less."

Alternative core line:
"Love the look. Not the price? Snap it."

The website is NOT just an AI image tool.
It must feel like a genuine, trustworthy fashion shopping website.

Main idea:

A user sees clothes/outfits on:
- Instagram
- YouTube Shorts
- Pinterest
- influencers
- shopping websites
- real life

The user can:
1. Upload a screenshot/photo
2. Paste a product link
3. Search by text

Fit Deal should then:
1. Understand the clothing item
2. Find the exact product when exact proof exists
3. Find similar/cheaper alternatives
4. Compare prices across trusted Indian stores
5. Recommend the best shopping option
6. Allow the user to save products
7. Eventually recommend size
8. Eventually offer AI virtual try-on
9. Redirect to the actual retailer through affiliate links

Important:
Fit Deal does NOT sell the products itself.
The final purchase happens on Amazon, Flipkart, Myntra, AJIO, etc.

========================================================
2. CORE USER JOURNEY
========================================================

Ideal complete journey:

Fashion screenshot / product link / search
        ↓
Identify clothing
        ↓
Exact match if verifiable
        +
Similar alternatives
        ↓
Compare stores and prices
        ↓
Show best verified deal
        ↓
Product detail
        ↓
Size recommendation
        ↓
Optional AI Try-On
        ↓
Save / Share / Help Me Choose
        ↓
Affiliate Buy button
        ↓
Official retailer

The website must be useful even if AI Try-On is unavailable.

The ACTUAL core utility is:

DISCOVERY
+
PRODUCT MATCHING
+
PRICE COMPARISON
+
SMART SHOPPING

AI Try-On is a "wow" feature, not the only reason the website exists.

========================================================
3. MOST IMPORTANT TRUST RULES
========================================================

Fit Deal must NEVER look like a scammy affiliate website.

Trust is more important than short-term affiliate revenue.

Hard rules:

1. Never show fake reviews.
2. Never show fake number of users.
3. Never show fake "97% match" values.
4. Never invent prices.
5. Never invent discounts.
6. Never invent delivery information.
7. Never call a product "Exact Match" without proof.
8. Never rank products based on affiliate commission.
9. Never make a higher-paying affiliate retailer look better just because it pays us more.
10. Sponsored items must always be labeled "Sponsored".
11. Show when prices were last checked when possible.
12. Clearly explain that final prices/offers may change on retailer websites.
13. User photos must not be presented as stored permanently unless explicitly necessary.
14. No user's photo should be used for AI training without explicit consent.
15. Redirect users only to legitimate retailer domains.

Exact Match definition:

Call a product "Exact" ONLY when there is evidence such as:
- user pasted that exact retailer product link
- same GTIN/EAN/UPC
- same brand + verified style/SKU code

A screenshot that only visually resembles something is NOT enough to call it Exact.

Everything else:
"Similar", "Very Similar", "Alternative", etc.

========================================================
4. BUSINESS MODEL
========================================================

Fit Deal should be mostly FREE for users.

Primary monetization:
Affiliate commissions.

Planned affiliate ecosystem:

Amazon India:
Amazon Associates / Creators API

Flipkart:
Flipkart Affiliate

Myntra / AJIO / other fashion stores:
Cuelinks or similar affiliate network

Every retailer Buy button may ultimately be an affiliate link.

Architecture should use a central redirect such as:

/go/:searchId/:productKey

Flow:

User clicks Buy
→ Fit Deal records click
→ generates/uses affiliate deep link
→ redirect to official retailer

Affiliate ranking rule:
Commission NEVER affects ranking.

Future revenue:
- affiliate commission
- sponsored listings (clearly marked)
- brand campaigns
- possibly premium features
- paid/extra AI try-on credits

Do not force subscription on normal shopping users.

========================================================
5. CURRENT TECHNICAL DIRECTION
========================================================

IMPORTANT:
Inspect repository before making assumptions.

Current project architecture is intentionally lightweight.

Current documented direction:
- Pure Node.js server
- server.js
- zero/minimal npm dependencies
- hosted on Render
- HTML/CSS/vanilla JavaScript frontend
- backend/API in same Node server
- Supabase supported for persistent storage
- local JSON fallback exists for development
- Gemini is used for clothing recognition
- Product-provider layer exists for stores/search providers
- secrets must remain in environment variables

Do NOT expose:
- Gemini API key
- affiliate secrets
- Supabase service role key
- Serper API key
- admin credentials
in frontend JS or GitHub.

Do not casually add React/Next/Vite/large frameworks just because they are popular.

Preserve the lightweight architecture unless there is a strong reason to change it.

If adding a dependency:
explain why it is necessary.

========================================================
6. CURRENT AI / PRODUCT DATA DIRECTION
========================================================

Clothing recognition:
Gemini Flash-Lite style model via structured JSON.

Recognition should ideally determine:

- category
- color
- pattern
- garment type
- style
- fit
- audience/gender when useful
- visible brand only when confidence is strong
- useful search terms

Supported V1 clothing focus:
- shirts
- T-shirts
- tops
- dresses
- jeans
- kurtis

Other fashion can still work as a fallback, but don't pretend accuracy is equally strong.

Initial stores:
- Amazon India
- Flipkart
- Myntra
- AJIO

Possible product sources already planned/current:
- Amazon product/creator affiliate APIs
- Flipkart affiliate API
- Google Shopping/Serper for stores like Myntra/AJIO
- fallback catalog/search links during development

Do not build the entire product around unsafe scraping.

========================================================
7. FINAL PRIMARY NAVIGATION
========================================================

LATEST PRODUCT DECISION:

Mobile bottom navigation MUST be:

1. Home
2. Find
3. Saved
4. Deals
5. Profile

This is the latest desired navigation.

If an older document says "Try On" should be a main bottom tab, treat that as outdated.

AI Try-On should exist as a feature/page accessed from products/results/profile, NOT take one of the five primary navigation positions.

Desktop navigation should roughly be:

Fit Deal logo

Home
Find
Deals
Saved
How It Works

Then on the right:
Search
Profile/avatar
and optionally a strong CTA:
"Find an Outfit"

========================================================
8. HOME PAGE — PURPOSE
========================================================

Home must answer:

"What fashion should I explore, and how does Fit Deal help me save money?"

The user should instantly feel:
THIS IS A SHOPPING WEBSITE.

It must NOT look like a plain upload utility.

Visual tone:
- professional ecommerce
- modern fashion
- clean white background
- subtle purple Fit Deal accents
- high-quality product/fashion imagery
- lots of whitespace
- genuine retailer-like UI
- not overly flashy
- no fake urgency

Recommended Home structure:

HEADER
Fit Deal logo
Search
Wishlist
Profile

HERO
Main line:
"Find the look. Pay less."

Supporting text:
Discover exact and similar fashion from trusted stores, compare prices, and shop smarter.

Primary actions:
[ Upload Screenshot ]
[ Paste Product Link ]

Hero visual:
fashion model/outfit plus small product/deal cards that demonstrate what the website does.

Then:

TRUSTED STORES STRIP
Amazon
Flipkart
Myntra
AJIO
and later more.

Text:
"Compare fashion across trusted stores."

SHOP BY CATEGORY
Women
Men
Ethnic
Tops
Dresses
Shirts
Jeans
T-shirts
Shoes
Bags
Accessories

TRENDING LOOKS
Examples:
- College Casual
- Office Ready
- Date Night
- Streetwear
- Minimal
etc.

A "look" may contain multiple products.

BEST DEALS TODAY
Real deal cards only.

Each card:
- image
- product
- store
- price
- original price only if genuine
- discount only if genuine
- save icon

LOOKS YOU MAY LOVE
Personalized later.
For new users, popular items.

RECENTLY VIEWED
Only when data exists.

Bottom trust/value area:
- Shop from trusted stores
- Compare prices easily
- Save favorite looks
- Official retailer checkout

========================================================
9. FIND PAGE — PURPOSE
========================================================

Route:
 /find/

Purpose:
"I know what I want to find."

This is the main search engine.

Top heading:
"What are you looking for?"

Three primary methods:

A. Text search
Example:
"black oversized shirt"

B. Screenshot/photo search

C. Product URL paste

For image upload:
If several clothing pieces exist in one photo, let the user select which item to search for.

For example:
- Top
- Jeans
- Shoes

Filters:
- Women / Men / Unisex
- category
- price
- store
- discount
- color
- size when supported

Sort:
- Best Match
- Lowest Price
- Biggest Discount
- Popular only if genuine data supports it

Also display:
Recent searches
Trending searches

========================================================
10. RESULTS PAGE
========================================================

Typical route:
 /find/:searchId

Results page should show:

1. Original/source image
2. What Fit Deal detected
3. Editable/refinable search description

Detected chips such as:
Beige
Blazer
Oversized
Women

Sections:

A. Exact Matches
ONLY if exact proof exists.

B. Similar Looks
Main search results.

C. Same Vibe, Lower Price
Strong Fit Deal feature.

Sort/filter available.

Product card:

- product image
- brand
- product name
- retailer
- current price
- original price if verified
- discount if verified
- delivery if known
- match label
- Save button
- View button
- Compare Prices

Important:
No fake match percentage.

Offer feedback:
"Not the same product?"
"Report wrong match"

No-results page should still be useful:
- refine search
- direct retailer search links
- upload another image

========================================================
11. PRODUCT DETAIL PAGE
========================================================

Suggested route:
 /product/:id

Should look like a genuine ecommerce product page.

Contains:

- product image/gallery
- brand
- product name
- price
- verified discount
- retailer
- available sizes if known
- delivery information if known

Main actions:

[ Buy at Myntra/Amazon/etc ]
[ Compare Prices ]
[ Save ]
[ Try On Me ]
[ Find My Size ]

Also show:

BEST VERIFIED PRICE

Example:
"Best verified public price: ₹1,199"

with last-checked time when possible.

Similar products:
"You may also like"

Complete the Look:
For example when viewing blazer:
- top
- jeans
- shoes

========================================================
12. PRICE COMPARISON PAGE / COMPONENT
========================================================

Suggested:
 /product/:id/prices

Table/card example:

Store | Price | Delivery | Final Public Price

Myntra
Amazon
AJIO
Flipkart

Show:
"Best verified price"

Important disclaimer:
Bank offers, memberships and personalized coupons may vary.

Never pretend final payable prices are guaranteed if they aren't.

========================================================
13. SAVED PAGE
========================================================

Route:
 /saved/

Purpose:
A real wishlist area.

It should not be only a list.

Sections/tabs eventually:

- All
- Products
- Looks
- Try-Ons
- Collections

Saved product:
- current price
- previous saved price if we know it
- real price drop indicator
- retailer
- Compare
- Buy
- Remove

Future collections:
- College outfits
- Wedding
- Wishlist
- Under ₹1000
etc.

Empty state:
"Your dream wardrobe starts here."
with Explore button.

V1 can store Saved items in localStorage without requiring login.

========================================================
14. DEALS PAGE
========================================================

Route:
 /deals/

Purpose:
"Show me good fashion offers now."

This can become a repeat-visit page.

Sections:

Hot Deals
Under ₹499
50%+ Off
Price Drops
Women
Men
Ethnic
Shoes

BEST DEALS TODAY

Real products only.

PRICE DROPS
More valuable than fake MRP discounts.

Example:
Previous tracked price:
₹1,799

Current:
₹1,299

"₹500 price drop"

DEALS BY STORE:
Myntra
Amazon
AJIO
Flipkart

Eventually:
"For You"
based on user's saved/search behavior.

IMPORTANT:
No invented sales.
No fabricated "limited time".
No fake countdown timers.

========================================================
15. PROFILE PAGE — FINAL UX DIRECTION
========================================================

Route:
 /profile/

The Profile must feel like a real trustworthy shopping account/settings page.

DO NOT make it look like:
- a colorful AI dashboard
- crypto/scam dashboard
- gamified stats page
- a screen filled with random cards

Keep it clean and familiar.

If logged out / local-only:
clearly explain what works without login.

Future signed-in profile:

TOP PROFILE CARD
- user photo
- name
- email
- Edit Profile
- member since

Small genuine stats if actual:
Saved
Searches
Price Alerts
Votes

Then:

MY ACCOUNT

Personal Details
Address Book
Preferences
Notifications
Privacy & Data

MY FIT PROFILE

Shopping for:
Women/Men/etc.

Height
Weight

Optional:
Chest
Waist
Hip

Fit preference:
Slim / Regular / Loose

Button:
View/Edit Measurements

STYLE PREFERENCES:
Casual
Streetwear
Ethnic
Minimal
Formal
etc.

MORE:
Saved Items
Price Alerts
Search History
Help

Account/security:
Privacy
Sign out

Do NOT show an address-book feature unless it actually makes sense; remember Fit Deal itself does not deliver products.

========================================================
16. SIZE RECOMMENDATION
========================================================

Future/advanced feature.

Do NOT claim an exact body size only from one photo.

Better approach:

User optionally provides:
- height
- weight
- chest
- waist
- hip
- preferred fit

Then compare with brand/product size chart.

Output example:

Recommended: M
Expected fit: Regular

Alternative:
L if you prefer loose fit.

Confidence must be based on actual available measurement/chart data.

Brand sizing memory later:
H&M = M
Puma = L
etc.

========================================================
17. AI VIRTUAL TRY-ON
========================================================

Suggested route:
 /try-on/

This is an enhancement, not the whole product.

Flow:

Product selected
+
User photo
↓
Generate AI preview

Result:
Before / Try-on result

Actions:
Save Look
Try Another
Buy This Look
Share

Always state:
"AI Preview — actual fit, fabric and appearance may differ."

Never market it as guaranteed real fit.

User photo privacy is extremely important.

Try-on may have quota because every generation costs money.

========================================================
18. TRY & VOTE VIRAL LOOP
========================================================

Feature:
"Help me choose"

User selects 2-4 products/looks.

Creates public vote link.

Public route:
 /vote/:id

Friend sees:

A
B
C

and votes.

No login required if safe.

After vote:
show results.

Then CTA:

"Want to find your own look?"
→ Fit Deal

This is one of the product's built-in sharing/viral loops.

========================================================
19. PRICE ALERTS — FUTURE
========================================================

Users can save a product and request:

"Notify me when this drops below ₹2,799"

Eventually:
email/push notification.

Do not fake historic prices.

========================================================
20. SUPPORTING PROFESSIONAL PAGES
========================================================

Must exist and be polished:

/about/
/how-it-works/
/contact/
/faq/
/privacy/
/terms/
/affiliate-disclosure/
/404
/500

About:
Explain Fit Deal mission professionally.

How It Works:
Upload
→ Find
→ Compare
→ Buy Smart

FAQ should clearly explain:

Does Fit Deal sell products?
No.

Who handles payment/delivery/refunds?
The retailer.

Does Fit Deal charge me more?
No.

How does Fit Deal earn money?
Affiliate commission.

Can prices change?
Yes.

Privacy:
Explain uploaded photos and image handling transparently.

Terms:
Explain Fit Deal is not retailer.

Affiliate Disclosure:
Clear, understandable disclosure.

========================================================
21. DESIGN SYSTEM
========================================================

Brand:
Fit Deal

Primary style:
clean, genuine, premium but friendly fashion ecommerce.

Core colors currently:
Ink/dark navy:
#0f1222

Fit Deal purple:
#6a4ff0

Background:
mostly white / extremely light lavender.

Typography:
Inter or current established project font.

Rules:

- White space is good.
- Avoid excessive gradients.
- Avoid excessive glow.
- Avoid huge amounts of purple.
- Avoid dashboards filled with cards everywhere.
- Avoid cheap neon styling.
- Avoid scam-looking "SALE SALE SALE" UI.
- Use subtle borders and shadows.
- Keep mobile extremely clear.
- Buttons need obvious hierarchy.
- Product imagery should dominate shopping sections.
- Retailer logos should be used appropriately.
- Shopping experience should feel closer to a trusted ecommerce product than an AI experiment.

========================================================
22. MOBILE UX
========================================================

Mobile is extremely important.

Bottom navigation fixed:

Home
Find
Saved
Deals
Profile

Only one should appear selected.

All main actions must work comfortably around 360px width.

Do not create horizontally broken desktop layouts.

Horizontal product rails are okay.

Avoid tiny buttons.

Avoid text-heavy home sections.

========================================================
23. DESKTOP UX
========================================================

Desktop should not simply be the stretched phone UI.

Use desktop space properly:

- wide hero
- multiple product columns
- visible navigation
- category rails
- Deals + Trending sections
- search field in header
- product comparison tables where suitable

========================================================
24. SEARCH / MATCHING PHILOSOPHY
========================================================

The product-search engine is more important than flashy AI.

Product normalization should consider:

Brand
Category
Title
Color
Style/SKU
GTIN if available
Variant
Price
Store

Deduplicate store results.

Confidence rules must remain conservative.

When uncertain:
say "Similar".

Do not confidently lie.

========================================================
25. SMART BUY / WORTH-IT IDEA
========================================================

Long-term optional scoring:

Smart Buy / Worth-It Score out of 100.

Possible components:

Price/value
Store reliability/returns
Match confidence
Fit confidence

But:
Do NOT expose a number until the scoring inputs are real and defensible.

Never invent an arbitrary score for visual effect.

========================================================
26. SECURITY & PRIVACY
========================================================

Keep current safety philosophy.

Image uploads:
- verify MIME/magic bytes
- size limits
- never trust filename
- remove metadata where possible
- don't permanently store unless needed

Product URL fetching:
- prevent SSRF
- whitelist supported stores
- block private/internal IPs
- sanitize redirects

Frontend:
- protect from XSS
- use textContent where appropriate
- CSP/security headers
- no keys in frontend

APIs:
- rate limiting
- validate structured responses
- safe errors
- don't leak stack traces/secrets

Admin:
must remain protected.

========================================================
27. ANALYTICS
========================================================

We need genuine business analytics, not surveillance.

Important events:

page_view
upload_start
analysis_success
analysis_failed
search_results
product_view
save
unsave
share
vote_create
vote
affiliate_click
try_on_start
try_on_success
deal_view

Main funnel:

Visitor
→ Search
→ Useful Results
→ Product Detail
→ Affiliate Store Click
→ Commission

Important metrics:

Search success rate
No-result rate
Affiliate click-through
Revenue per visitor
API cost per visitor
Saved rate
Share/vote rate
Wrong-match reports

========================================================
28. SEO
========================================================

Need:
titles
meta descriptions
canonical URLs
OG tags
robots.txt
sitemap
Search Console
semantic headings
alt text
fast pages

Do NOT mass-generate useless SEO pages.

Future useful pages can include:
- find dress from screenshot
- find cheaper outfit
- recreate celebrity look for less
- compare fashion prices
etc.

Only create them if they provide actual useful content.

========================================================
29. CURRENT PROJECT STATE
========================================================

The repository is NOT empty.

There is already substantial work.

Existing/current code includes areas/pages for things such as:
- Home
- Find
- Saved
- Deals
- Profile
- Vote
- Try-On
- About
- FAQ
- Contact
- Terms
- Affiliate Disclosure
- error pages
- API/backend
- search providers
- matching
- server-side affiliate redirect
- analytics/admin functionality

Therefore:

FIRST inspect existing implementation.

Do not say:
"I will start by creating a brand-new app."

Instead say:
"I'll audit what exists, identify gaps, then improve it incrementally."

========================================================
30. IMPORTANT DOCS TO READ FIRST
========================================================

Before doing major work, read:

PLAN.md
CHECKLIST.md
README.md
docs/OPERATIONS.md
package.json
server.js
lib/
public/

Treat those files as project context.

However:

If an older doc conflicts with THIS master brief,
THIS brief contains the latest UX/product decisions.

Important example:
Latest primary mobile nav is:

Home · Find · Saved · Deals · Profile

NOT:
Home · Find · Try-On · Saved · Profile

Try-On is now a feature/page, not a primary bottom-navigation tab.

========================================================
31. DEVELOPMENT RULES
========================================================

Whenever I ask you to change something:

1. Inspect relevant existing files first.
2. Explain briefly what currently exists.
3. Make the smallest clean change that solves the problem.
4. Reuse existing components/styles.
5. Do not break working routes.
6. Test mobile and desktop.
7. Run the existing test suite.
8. Fix failures before declaring completion.
9. Never commit secrets.
10. Do not add fake demo data to production without labeling it.
11. Do not silently change product strategy.
12. Do not add random features that I did not request.
13. Preserve affiliate ranking neutrality.
14. Preserve photo privacy.
15. Keep the website looking like a trusted shopping product.

For significant changes:
prefer working on a branch and show me what changed before merging.

========================================================
32. PRIORITY FROM NOW
========================================================

Do not spend most of the time polishing decorative pages while core shopping does not work.

Priority order:

1. Home shopping experience
2. Find/Search
3. Screenshot clothing recognition
4. Real Results page
5. Product matching quality
6. Product detail
7. Price comparison
8. Affiliate Buy flow
9. Saved
10. Deals
11. Profile
12. Sharing/Vote
13. Size profile
14. AI Try-On
15. Alerts
16. Future personalization/app features

The most important milestone is:

A real user uploads a screenshot
→ Fit Deal understands the clothing
→ finds real relevant products
→ shows real prices
→ user clicks a valid retailer affiliate link.

Until that works reliably, do not treat Fit Deal as finished.

========================================================
33. FUTURE ROADMAP
========================================================

After core V1 is genuinely working and has users:

- Google login
- cloud-synced Saved products
- price alerts
- email/push notifications
- brand-specific size recommendations
- personal fit profile
- AI virtual try-on
- price history
- Smart Buy / Worth-It score
- return-risk estimates
- Recreate This Look
- complete-the-look bundles
- multi-item outfit detection
- better visual search / Lens-type API
- barcode scanning
- browser extension
- PWA
- Android app
- iOS app
- "Share to Fit Deal"
- personalized homepage
- user wardrobe
- outfit recommendations
- direct retailer feeds
- brand partnerships
- clearly labeled sponsored listings
- international expansion much later

========================================================
34. YOUR ROLE
========================================================

You are not here just to write random code.

Act like the main engineer of Fit Deal.

Your responsibility is to:
- understand the existing codebase
- maintain consistency
- build features end-to-end
- catch technical problems
- protect user trust
- keep costs reasonable
- make the mobile and desktop UX professional
- tell me when an idea has a serious downside
- never fake functionality just to make the UI look finished

When I give you a task, do not ask me to re-explain the entire project.
Use this brief plus the repository as your source of truth.