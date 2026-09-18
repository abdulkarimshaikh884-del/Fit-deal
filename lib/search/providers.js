// Product sources. Each one is switched on only when its keys are set, and
// each one returns products in a raw common shape that normalize.product()
// turns into Fit Deal's shape. Official affiliate APIs come first; Google
// Shopping (through Serper) fills in stores that have no API of their own.
// Nothing here scrapes store pages.
const config = require("../config");
const { identify } = require("../stores");

const TIMEOUT = 9000;

async function getJson(url, opts = {}) {
  const res = await fetch(url, { ...opts, signal: AbortSignal.timeout(opts.timeout || TIMEOUT) });
  const text = await res.text();
  if (!res.ok) throw new Error(`${res.status} ${text.slice(0, 200)}`);
  try { return JSON.parse(text); } catch (e) { throw new Error("Bad JSON from " + new URL(url).hostname); }
}

// Finds a key regardless of case, since some APIs changed casing over time
// (e.g. "EANs" → "eans").
function pick(obj, ...names) {
  if (!obj || typeof obj !== "object") return undefined;
  for (const n of names) {
    if (n in obj) return obj[n];
    const k = Object.keys(obj).find((x) => x.toLowerCase() === n.toLowerCase());
    if (k) return obj[k];
  }
  return undefined;
}

// ── Flipkart Affiliate API ─────────────────────────────────────────────────
const flipkart = {
  name: "flipkart",
  label: "Flipkart Affiliate API",
  stores: ["flipkart"],
  enabled: () => !!(config.providers.flipkart.id && config.providers.flipkart.token),
  headers: () => ({ "Fk-Affiliate-Id": config.providers.flipkart.id, "Fk-Affiliate-Token": config.providers.flipkart.token }),
  map(entry) {
    const b = entry.productBaseInfoV1 || entry;
    const ship = entry.productShippingInfoV1 || {};
    const imgs = b.imageUrls || {};
    const attrs = b.attributes || {};
    return {
      provider: "flipkart",
      url: b.productUrl,
      title: b.title,
      brand: b.productBrand,
      color: attrs.color,
      sizes: attrs.size ? String(attrs.size).split(/[,/]/).map((s) => s.trim()).filter(Boolean) : [],
      image: imgs["400x400"] || imgs["800x800"] || imgs["200x200"] || Object.values(imgs)[0],
      price: (b.flipkartSpecialPrice && b.flipkartSpecialPrice.amount) || (b.flipkartSellingPrice && b.flipkartSellingPrice.amount),
      mrp: b.maximumRetailPrice && b.maximumRetailPrice.amount,
      shipping: ship.shippingCharges ? ship.shippingCharges.amount : null,
      inStock: typeof b.inStock === "boolean" ? b.inStock : null
    };
  },
  async search(q) {
    const data = await getJson("https://affiliate-api.flipkart.net/affiliate/1.0/search.json?resultCount=10&query=" + encodeURIComponent(q), { headers: flipkart.headers() });
    return (data.products || []).map(flipkart.map);
  },
  async lookup(store, productId) {
    if (store !== "flipkart") return null;
    const data = await getJson("https://affiliate-api.flipkart.net/affiliate/1.0/product.json?id=" + encodeURIComponent(productId), { headers: flipkart.headers() });
    return data && data.productBaseInfoV1 ? flipkart.map(data) : null;
  }
};

// ── Amazon Creators API ────────────────────────────────────────────────────
let amazonToken = { value: "", until: 0 };
const AMAZON_RESOURCES = [
  "itemInfo.title", "itemInfo.byLineInfo", "itemInfo.externalIds", "itemInfo.manufactureInfo",
  "images.primary.large", "offersV2.listings.price", "offersV2.listings.availability"
];
const amazon = {
  name: "amazon",
  label: "Amazon Creators API",
  stores: ["amazon"],
  enabled: () => !!(config.providers.amazon.clientId && config.providers.amazon.clientSecret && config.providers.amazon.partnerTag),
  async token() {
    if (amazonToken.value && Date.now() < amazonToken.until) return amazonToken.value;
    // amazon.in is served by the EU token endpoint.
    const data = await getJson("https://api.amazon.co.uk/auth/o2/token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        grant_type: "client_credentials",
        client_id: config.providers.amazon.clientId,
        client_secret: config.providers.amazon.clientSecret,
        scope: "creatorsapi::default"
      })
    });
    amazonToken = { value: data.access_token, until: Date.now() + Math.max(60, (data.expires_in || 3600) - 120) * 1000 };
    return amazonToken.value;
  },
  async call(op, body) {
    const token = await amazon.token();
    return getJson("https://creatorsapi.amazon/catalog/v1/" + op, {
      method: "POST",
      headers: { Authorization: "Bearer " + token, "Content-Type": "application/json", "x-marketplace": "www.amazon.in" },
      body: JSON.stringify({ marketplace: "www.amazon.in", partnerTag: config.providers.amazon.partnerTag, resources: AMAZON_RESOURCES, ...body })
    });
  },
  map(it) {
    const info = pick(it, "itemInfo") || {};
    const listing = ((pick(pick(it, "offersV2"), "listings")) || [])[0] || {};
    const price = pick(listing, "price") || {};
    const avail = String(pick(pick(listing, "availability"), "type") || "").toUpperCase();
    const ext = pick(info, "externalIds") || {};
    const eans = pick(pick(ext, "eans", "EANs"), "displayValues") || [];
    const manu = pick(info, "manufactureInfo") || {};
    const large = pick(pick(pick(it, "images"), "primary"), "large") || {};
    return {
      provider: "amazon",
      url: pick(it, "detailPageURL", "detailPageUrl"),
      title: pick(pick(info, "title"), "displayValue"),
      brand: pick(pick(pick(info, "byLineInfo"), "brand"), "displayValue"),
      image: pick(large, "url"),
      price: pick(pick(price, "money"), "amount"),
      mrp: pick(pick(pick(price, "savingBasis"), "money"), "amount"),
      shipping: null,
      inStock: avail ? /IN_STOCK|NOW|AVAILABLE/.test(avail) && !/OUT/.test(avail) : null,
      gtin: eans[0],
      styleCode: pick(pick(manu, "model"), "displayValue") || pick(pick(manu, "itemPartNumber"), "displayValue")
    };
  },
  async search(q) {
    const data = await amazon.call("searchItems", { keywords: q, searchIndex: "Fashion", itemCount: 10 });
    return ((pick(data, "searchResult") || {}).items || []).map(amazon.map);
  },
  async lookup(store, productId) {
    if (store !== "amazon") return null;
    const data = await amazon.call("getItems", { itemIds: [productId], itemIdType: "ASIN" });
    const items = (pick(data, "itemsResult") || {}).items || [];
    return items[0] ? amazon.map(items[0]) : null;
  }
};

// ── Google Shopping via Serper ─────────────────────────────────────────────
// Only offers whose link goes straight to a supported store are kept, so we
// always know the store and can send the shopper to the real product page.
function storeLink(link) {
  if (!link) return "";
  if (identify(link)) return link;
  try {
    const u = new URL(link);
    for (const k of ["url", "q", "adurl"]) {
      const inner = u.searchParams.get(k);
      if (inner && identify(inner)) return inner;
    }
  } catch (e) { /* not a URL */ }
  return "";
}

function deliveryCost(s) {
  if (!s) return null;
  if (/free/i.test(s)) return 0;
  const m = String(s).replace(/,/g, "").match(/₹\s*(\d+(?:\.\d+)?)/);
  return m ? Number(m[1]) : null;
}

const serper = {
  name: "serper",
  label: "Google Shopping",
  stores: ["amazon", "flipkart", "myntra", "ajio"],
  enabled: () => !!config.providers.serper.key,
  async search(q) {
    const data = await getJson("https://google.serper.dev/shopping", {
      method: "POST",
      headers: { "X-API-KEY": config.providers.serper.key, "Content-Type": "application/json" },
      body: JSON.stringify({ q, gl: "in", hl: "en", num: 30 })
    });
    const out = [];
    for (const s of data.shopping || []) {
      const url = storeLink(s.link);
      if (!url) continue;
      out.push({
        provider: "serper",
        url,
        title: s.title,
        brand: "",
        image: s.imageUrl,
        price: s.price,
        mrp: null,
        shipping: deliveryCost(s.delivery),
        inStock: null
      });
    }
    return out;
  },
  lookup: null
};

const fs = require("fs");
const path = require("path");

let cachedCatalog = null;
function loadSampleCatalog() {
  if (cachedCatalog) return cachedCatalog;
  try {
    const f = path.join(__dirname, "..", "..", "data", "sample-products.json");
    if (fs.existsSync(f)) {
      cachedCatalog = JSON.parse(fs.readFileSync(f, "utf8"));
    } else {
      cachedCatalog = [];
    }
  } catch (e) {
    cachedCatalog = [];
  }
  return cachedCatalog;
}

// Local demo data (data/sample-products.json) for previewing the pages
// without API keys. Its products and prices are made up, so it never runs in
// production, and every item is tagged "sample" so it can't pass for a live
// source (the results page and the deals feed treat it as demo data).
const sampleCatalog = {
  name: "sample",
  label: "Demo catalog (not real products)",
  stores: ["amazon", "flipkart", "myntra", "ajio"],
  enabled: () => config.env !== "production" && !flipkart.enabled() && !amazon.enabled() && !serper.enabled() && loadSampleCatalog().length > 0,
  async search(q) {
    return (await sampleSearch(q)).map((p) => ({ ...p, provider: "sample" }));
  },
  lookup: null
};

async function sampleSearch(q) {
  const list = loadSampleCatalog();
  const query = (q || "").toLowerCase();
  const words = query.split(/\s+/).filter((w) => w.length > 2);
  const matched = list.filter((p) => {
    const text = (p.title + " " + (p.category || "") + " " + (p.color || "") + " " + (p.brand || "")).toLowerCase();
    return words.some((w) => text.includes(w)) || (p.category && query.includes(p.category));
  });
  return (matched.length ? matched : list).slice(0, 12);
}

const ALL = [flipkart, amazon, serper, sampleCatalog];

module.exports = { ALL, flipkart, amazon, serper, sampleCatalog, storeLink, deliveryCost, pick };

