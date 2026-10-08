# Shopping pages and navigation — 29 September 2026

Built on the current checkout and existing sidebar/homepage design. No deployment or credential changes were made.

## Page map

| Destination | Purpose |
| --- | --- |
| `/shop/` | Searchable, category-filtered editorial catalog; name sorting, reset and empty state |
| `/categories/` | All 15 catalog categories |
| `/collections/` | Everyday, casual, festive and footwear edits |
| `/brands/` | Brand search entry points |
| `/stores/` | Official retailer discovery links |
| `/style/<slug>/` | 19 permanent editorial detail pages with save, share, related styles and retailer searches |
| `/product/<searchId>/<key>` | Existing sourced offer details, retailer link and comparison results |
| `/find/`, `/find/<id>` | Existing text, screenshot and product-link searches and results |
| `/saved/` | Both editorial styles and sourced offers open their corresponding detail pages |
| `/deals/` | Genuine sourced offers; catalog/store discovery remains available when no deals exist |
| `/profile/`, `/login/`, `/signup/` | Existing account and profile pages preserved |
| About, how-it-works, FAQ, contact, privacy, terms, disclosure | Existing support/legal pages preserved and link-checked |

## Corrected behavior

- Homepage product buttons and product images lead to matching permanent detail pages instead of automatically launching a search.
- Categories no longer route through unrelated Deals filters. Collections, brands and store directories have dedicated destinations.
- Search and photo-entry controls work beyond the homepage. Pasted store links use the product-link search flow.
- Removed references to a deleted upload-drawer function in homepage drag/drop and paste handlers.
- Fixed missing `FD.esc` helper that caused sourced product comparison rendering to fail.
- Cross-store price differences require matching GTINs; other search results are not presented as confirmed identical products.
- Removed fabricated curated offers, placeholder retailer product URLs, invented ratings and prices. Existing editorial imagery remains identified as inspiration, not inventory.
- Corrected mobile back-header sizing and permanent editorial Saved destinations. Legacy editorial saves no longer present their old prices as live offers.

## Verification

- 39 automated tests passed, including all built internal page destinations and every editorial detail route/image.
- Build freshness and Git whitespace checks passed.
- Browser verified homepage product-image navigation, category filtering, empty-state/reset, saving and reopening the same style.
- Desktop and 390 px mobile catalog/detail pages checked; mobile document width stays within viewport.
- Sourced detail rendering and four-store comparison verified using a separate test-only server with mocked provider responses; no paid/provider search was used for this test.
- Evidence: `qa/product-desktop.png`, `qa/product-mobile.png`.

## Live activation boundary

The editorial catalog deliberately contains no retailer inventory, prices or affiliate offers. Adding credentials does not convert an editorial photo into a verified SKU. The existing search/provider pipeline supplies actual results, and those results use `/product/<searchId>/<key>` and `/go/...`.

After affiliate approval, configure the applicable existing provider/affiliate settings from `.env.example`, verify a real product search and outbound affiliate attribution, and run production smoke tests. This pass did not validate the external account/OAuth configuration, email delivery, real affiliate acceptance or production deployment. Optional virtual try-on remains explicitly unavailable rather than simulating results.

Preview on port 5183 uses isolated local data with external sources and recognition disabled to demonstrate the API-free browsing experience. The user's `.env`, existing provider edits and prior checklist edits remain untouched.
