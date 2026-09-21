# Home design — reference pass, 20 September 2026

Keep the existing Node/vanilla-JS app and working Find/Saved/Deals routes. Recreate the supplied desktop and mobile visual structure with HTML and CSS, rather than displaying the reference as a flat screenshot.

- Desktop: compact brand/navigation/search header, wide lavender fashion hero with striped outfit photograph, inset photo and three outfit-piece cards; overlapping retailer/value strip; eleven category thumbnails; four look cards beside four deal/style cards; quiet benefit footer.
- Mobile: brand/search/saved/profile header; model to the right of hero copy; two clear actions; retailer strip; six category cards visible on wider screens (scrollable on small phones); horizontal looks; four compact inspiration cards; Home / Find / Saved / Deals / Profile fixed navigation. Real offer cards use two columns below 370px.
- Reference pricing, discounts and user counts are illustrative, not source data. Keep sourced feed behavior. If empty, show clearly labelled style inspiration with working searches; do not fabricate prices or claim retailer availability.
- Generated photographs are editorial assets, never evidence of exact product matches. All text, links, buttons and cards remain editable. No new npm dependency or deployment.

## Generated assets

Built-in imagegen used, originals copied into `public/img/home/`:

1. `striped-outfit.png`: reference-based portrait of an adult Indian woman in sunglasses, cream/black striped knit, blue jeans and black shoulder bag, soft urban background. No text or UI.
2. `catalog-atlas.png`: 4×4 equal-cell catalog atlas. Rows: women/men/ethnic/blouse; dress/shirt/jeans/T-shirt; sneakers/bag/watch-and-sunglasses/striped knit; ruched pink top/black shirt/beige blazer/navy sweatshirt. No labels or prices.
3. `looks-atlas.png`: four equal editorial panels: College Casual, Office Ready, Date Night, Streetwear. No text or UI.

Full prompts are recorded in `docs/HOME-IMAGE-PROMPTS.json`. CSS selects atlas cells without modifying the generated originals.

## Validation

- `node build.js`: passed; generated public pages agree with source templates.
- `npm test`: 32 passed, 0 failed. Includes source/build consistency and existing search, feed, safety and API coverage.
- `git diff --check`: passed (Windows line-ending notices only).
- Browser visual review at 1536×1024, 1366×900, 900×900, 768×1024, 390×844 and 360×800. No horizontal document overflow. Checked hero cropping, category cells, look proportions, desktop navigation and fixed mobile navigation; corrected inherited main width and atlas row boundaries.
- Upload CTA opens Find with the photo button focused. Paste Product Link focuses its input. Women category opens a real local search with the intended words and the honest provider-unavailable state. Home navigation returns to the homepage.
- Both hero images loaded. Catalog and look atlases visually loaded. Browser console inspection returned no errors.
- The local preview has no live product providers: the feed therefore shows labelled inspiration. Real offer behavior is covered by the existing feed tests; live retailer pricing was not verified in this design pass.
- Preview: `http://localhost:5183/`, isolated temporary data directory. No deployment or push performed.
