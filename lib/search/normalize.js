// Every provider returns products in its own shape. They are turned into
// one shape here, so ranking and matching never depend on where a product
// came from.
const crypto = require("crypto");
const { STORES, identify } = require("../stores");

const COLOR_WORDS = {
  navy: "blue", "navy blue": "blue", "sky blue": "blue", "light blue": "blue", "dark blue": "blue", denim: "blue", indigo: "blue",
  "off white": "white", ivory: "white", cream: "white", ecru: "white",
  beige: "beige", khaki: "beige", camel: "beige", tan: "brown", brown: "brown", coffee: "brown",
  black: "black", charcoal: "grey", grey: "grey", gray: "grey", silver: "grey",
  red: "red", maroon: "red", burgundy: "red", wine: "red",
  pink: "pink", peach: "pink", coral: "pink", rose: "pink", fuchsia: "pink", magenta: "pink",
  purple: "purple", lavender: "purple", lilac: "purple", mauve: "purple", violet: "purple",
  green: "green", olive: "green", mint: "green", teal: "green", "sea green": "green", emerald: "green",
  yellow: "yellow", mustard: "yellow", lemon: "yellow", gold: "yellow",
  orange: "orange", rust: "orange", white: "white", blue: "blue", multicolour: "multi", multicolor: "multi", multi: "multi"
};

function colorFamily(s) {
  const t = " " + String(s || "").toLowerCase().replace(/[^a-z ]+/g, " ") + " ";
  // Longest names first so "navy blue" wins over "blue".
  const names = Object.keys(COLOR_WORDS).sort((a, b) => b.length - a.length);
  for (const n of names) if (t.includes(" " + n + " ")) return COLOR_WORDS[n];
  return "";
}

function normBrand(s) {
  return String(s || "").toLowerCase()
    .replace(/&/g, " and ").replace(/['’`.]/g, "").replace(/[^a-z0-9]+/g, " ")
    .replace(/\b(the|clothing|fashion|apparel|india|official|store)\b/g, " ").replace(/\s+/g, " ").trim();
}

function normTitle(s) {
  return String(s || "").replace(/[\p{Cc}<>]/gu, " ").replace(/\s+/g, " ").trim().slice(0, 160);
}

function tokens(s) {
  const stop = new Set(["for", "and", "the", "with", "of", "in", "a", "an", "women", "womens", "men", "mens", "size", "pack"]);
  return new Set(String(s || "").toLowerCase().replace(/[^a-z0-9 ]+/g, " ").split(/\s+/).filter((w) => w.length > 1 && !stop.has(w)));
}

// Dice similarity of title words, 0..1.
function titleSimilarity(a, b) {
  const A = tokens(a), B = tokens(b);
  if (!A.size || !B.size) return 0;
  let both = 0;
  for (const w of A) if (B.has(w)) both++;
  return (2 * both) / (A.size + B.size);
}

function money(v) {
  if (v == null || v === "") return null;
  if (typeof v === "number") return isFinite(v) && v > 0 ? Math.round(v * 100) / 100 : null;
  const m = String(v).replace(/,/g, "").match(/(\d+(?:\.\d+)?)/);
  const n = m ? Number(m[1]) : NaN;
  return isFinite(n) && n > 0 ? Math.round(n * 100) / 100 : null;
}

function httpsImage(u) {
  try {
    const x = new URL(u);
    return x.protocol === "https:" ? x.toString() : "";
  } catch (e) {
    return "";
  }
}

// Builds a product in Fit Deal's shape, or returns null when it is missing
// something we need to show it honestly (a store we support, a title, a
// product page address).
function product(p) {
  const id = identify(p.url || "");
  if (!id || id.short) return null;
  const store = id.store;
  const title = normTitle(p.title);
  if (!title) return null;
  const parsed = STORES[store].parse(id.url);
  const url = parsed ? parsed.url : id.url.toString();
  const price = money(p.price);
  const mrp = money(p.mrp);
  return {
    key: crypto.createHash("sha1").update(store + ":" + (parsed ? parsed.productId : url)).digest("hex").slice(0, 12),
    store,
    storeName: STORES[store].name,
    productId: parsed ? parsed.productId : "",
    title,
    brand: normTitle(p.brand).slice(0, 40),
    color: normTitle(p.color).slice(0, 30),
    colorFamily: colorFamily(p.color || title),
    sizes: Array.isArray(p.sizes) ? p.sizes.map(String).slice(0, 12) : [],
    image: httpsImage(p.image),
    price,
    mrp: mrp && price && mrp > price ? mrp : null,
    shipping: p.shipping == null ? null : money(p.shipping) || 0,
    inStock: typeof p.inStock === "boolean" ? p.inStock : null,
    gtin: String(p.gtin || "").replace(/\D/g, "").slice(0, 14),
    styleCode: String(p.styleCode || "").replace(/[^A-Za-z0-9-]/g, "").slice(0, 40),
    url,
    provider: p.provider,
    checkedAt: p.checkedAt || new Date().toISOString()
  };
}

// Same product from two providers → keep one, preferring the one with a
// price and the most recent check.
function dedupe(list) {
  const byKey = new Map();
  for (const p of list) {
    const prev = byKey.get(p.key);
    if (!prev || (p.price != null && prev.price == null)) byKey.set(p.key, p);
  }
  return [...byKey.values()];
}

module.exports = { product, dedupe, colorFamily, normBrand, normTitle, titleSimilarity, money, tokens };
