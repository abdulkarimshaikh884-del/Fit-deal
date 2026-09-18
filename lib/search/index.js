// Runs one search across every switched-on product source, then cleans,
// de-duplicates, labels (Exact / Similar) and orders the results.
const log = require("../log");
const { STORES, STORE_KEYS } = require("../stores");
const { ALL } = require("./providers");
const normalize = require("./normalize");
const { classify } = require("./match");

// Same search again within a few hours → reuse the answer. Each product keeps
// the time its price was actually fetched, and the page shows that time.
const cache = new Map();
const CACHE_MS = 3 * 3600 * 1000;

async function fromProvider(p, query) {
  const key = p.name + "|" + query.toLowerCase();
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < CACHE_MS) return { list: hit.list, cached: true };
  const checkedAt = new Date().toISOString();
  const raw = await p.search(query);
  const list = raw.map((r) => normalize.product({ ...r, checkedAt })).filter(Boolean);
  cache.set(key, { at: Date.now(), list });
  if (cache.size > 2000) cache.delete(cache.keys().next().value);
  return { list, cached: false };
}

function activeProviders(providers) {
  return (providers || ALL).filter((p) => p.enabled());
}

// The product a pasted link points to, with live details when a source can
// look it up by ID; otherwise just what the link itself tells us.
async function lookupAnchor(link, providers) {
  const base = {
    store: link.store, storeName: link.storeName, productId: link.productId, url: link.url,
    title: link.titleHint || link.storeName + " product", brand: link.brandHint || ""
  };
  for (const p of activeProviders(providers)) {
    if (!p.lookup || !p.stores.includes(link.store)) continue;
    try {
      const raw = await p.lookup(link.store, link.productId);
      const prod = raw && normalize.product({ ...raw, checkedAt: new Date().toISOString() });
      if (prod) return { ...prod, fromLink: true };
    } catch (e) {
      log.warn("lookup failed", { provider: p.name, store: link.store, err: String(e.message).slice(0, 200) });
    }
  }
  const prod = normalize.product({ ...base, provider: "link", price: null });
  return prod ? { ...prod, fromLink: true, checkedAt: null } : null;
}

// Runs the search. `item` is the recognised garment, `anchor` the product
// from a pasted link (if any). Never throws for one failing source; the
// status of each source is returned so the page can be honest about gaps.
async function run({ item, query, anchor, providers }) {
  const active = activeProviders(providers);
  const settled = await Promise.allSettled(active.map((p) => fromProvider(p, query)));
  const status = [];
  let products = [];
  settled.forEach((r, i) => {
    const p = active[i];
    if (r.status === "fulfilled") {
      status.push({ source: p.name, label: p.label, ok: true, count: r.value.list.length, cached: r.value.cached });
      products = products.concat(r.value.list);
    } else {
      status.push({ source: p.name, label: p.label, ok: false, count: 0 });
      log.warn("provider failed", { provider: p.name, err: String(r.reason && r.reason.message).slice(0, 300) });
    }
  });
  if (anchor) products.unshift(anchor);
  products = normalize.dedupe(products);
  const { exact, similar, bestExact } = classify(products, { item, query, anchor });
  const storeLinks = STORE_KEYS.map((k) => ({ store: k, name: STORES[k].name }));
  return {
    query,
    exact: exact.slice(0, 12),
    similar: similar.slice(0, 36),
    bestExact,
    sources: status,
    storeLinks,
    searchedAt: new Date().toISOString()
  };
}

module.exports = { run, lookupAnchor, activeProviders, _cache: cache };
