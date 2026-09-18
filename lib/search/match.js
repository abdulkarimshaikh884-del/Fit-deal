// Exact or Similar, and the order results are shown in.
//
// "Exact" is a promise that it is the same product, so it needs hard proof:
//   1. it is the product from the pasted link itself, or
//   2. the barcode (GTIN/EAN) is the same, or
//   3. the brand and the brand's style code are both the same.
// A similar name, colour and brand is NOT proof: one brand sells dozens of
// "navy checked casual shirts". Those stay "Similar". We show no match
// percentage, because we have no measured score to back one up.
//
// Ranking uses only how well a product fits the search and its price.
// Affiliate commission is not an input anywhere in this file.
const { normBrand, titleSimilarity, colorFamily, tokens } = require("./normalize");
const { CATEGORIES } = require("../recognize");

function exactReason(p, anchor) {
  if (!anchor) return null;
  if (anchor.store === p.store && anchor.productId && anchor.productId === p.productId) return "The product from your link";
  if (anchor.gtin && p.gtin && anchor.gtin === p.gtin) return "Same barcode (EAN)";
  const ab = normBrand(anchor.brand), pb = normBrand(p.brand);
  if (ab && pb && ab === pb && anchor.styleCode && p.styleCode && anchor.styleCode.toLowerCase() === p.styleCode.toLowerCase()) {
    return "Same brand and style code";
  }
  return null;
}

function categoryFits(p, item) {
  if (!item || item.category === "other" || !CATEGORIES[item.category]) return true;
  const t = " " + p.title.toLowerCase().replace(/[^a-z0-9 ]+/g, " ") + " ";
  return CATEGORIES[item.category].words.some((w) => t.includes(" " + w + " "));
}

// 0..1, used only to group results into "closest" and "also similar".
function relevance(p, item, query) {
  let s = 0.5 * titleSimilarity(p.title, query);
  const want = item && item.colors && item.colors[0] ? colorFamily(item.colors[0]) : "";
  if (want && p.colorFamily === want) s += 0.25;
  if (item && item.pattern && item.pattern !== "solid" && tokens(p.title).has(item.pattern.split(" ")[0])) s += 0.1;
  if (item && item.brand && normBrand(item.brand) === normBrand(p.brand)) s += 0.15;
  return Math.min(1, s);
}

function byPrice(a, b) {
  if (a.price == null && b.price == null) return 0;
  if (a.price == null) return 1;
  if (b.price == null) return -1;
  return a.price - b.price;
}

// Splits products into exact and similar, drops ones that are clearly a
// different kind of garment, and orders each list.
function classify(products, { item, query, anchor }) {
  const exact = [];
  const similar = [];
  for (const p of products) {
    const reason = exactReason(p, anchor);
    if (reason) {
      exact.push({ ...p, match: "exact", reason });
      continue;
    }
    if (!categoryFits(p, item)) continue;
    const r = relevance(p, item, query);
    similar.push({ ...p, match: "similar", tier: r >= 0.55 ? 1 : r >= 0.3 ? 2 : 3 });
  }
  exact.sort(byPrice);
  // Closest group first; inside a group, the cheaper deal first.
  similar.sort((a, b) => a.tier - b.tier || byPrice(a, b));
  const priced = exact.filter((p) => p.price != null && p.inStock !== false);
  const bestExact = priced.length ? priced[0].key : null;
  return { exact, similar, bestExact };
}

module.exports = { classify, exactReason, relevance, categoryFits, byPrice };
