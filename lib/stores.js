// The stores Fit Deal supports in V1, how to read their product links, how
// to build a search link, and how to add our affiliate ID. A store that is
// not in this list is rejected: we never fetch arbitrary addresses.
const config = require("./config");

const STORES = {
  amazon: {
    name: "Amazon",
    hosts: ["amazon.in", "www.amazon.in", "m.amazon.in"],
    shortHosts: ["amzn.in", "amzn.to", "amzn.eu", "a.co"],
    search: (q) => "https://www.amazon.in/s?k=" + encodeURIComponent(q),
    parse(u) {
      const m = u.pathname.match(/\/(?:dp|gp\/product|gp\/aw\/d|exec\/obidos\/ASIN)\/([A-Z0-9]{10})(?:[/?]|$)/i);
      if (!m) return null;
      const slug = u.pathname.split(/\/(?:dp|gp)\//i)[0].split("/").filter(Boolean).pop() || "";
      return { productId: m[1].toUpperCase(), url: "https://www.amazon.in/dp/" + m[1].toUpperCase(), slug };
    }
  },
  flipkart: {
    name: "Flipkart",
    hosts: ["flipkart.com", "www.flipkart.com", "dl.flipkart.com"],
    shortHosts: ["fkrt.it", "fkrt.cc", "fkrt.co"],
    search: (q) => "https://www.flipkart.com/search?q=" + encodeURIComponent(q),
    parse(u) {
      const pid = (u.searchParams.get("pid") || "").toUpperCase();
      const m = u.pathname.match(/^(?:\/dl)?\/([^/]+)\/p\/(itm[a-z0-9]+)/i);
      if (!m || !/^[A-Z0-9]{16}$/.test(pid)) return null;
      return { productId: pid, url: `https://www.flipkart.com/${m[1]}/p/${m[2]}?pid=${pid}`, slug: m[1] };
    }
  },
  myntra: {
    name: "Myntra",
    hosts: ["myntra.com", "www.myntra.com"],
    shortHosts: ["myntr.it"],
    search: (q) => {
      const slug = q.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "clothing";
      return `https://www.myntra.com/${slug}?rawQuery=${encodeURIComponent(q)}`;
    },
    parse(u) {
      const parts = u.pathname.split("/").filter(Boolean);
      const idx = parts.findIndex((p) => /^\d{5,10}$/.test(p));
      if (idx < 0) return null;
      const slug = idx > 0 ? parts[idx - 1] : "";
      const brand = idx > 1 ? parts[idx - 2] : "";
      return { productId: parts[idx], url: "https://www.myntra.com/" + parts[idx], slug, brand };
    }
  },
  ajio: {
    name: "AJIO",
    hosts: ["ajio.com", "www.ajio.com"],
    shortHosts: [],
    search: (q) => "https://www.ajio.com/search/?text=" + encodeURIComponent(q),
    parse(u) {
      const m = u.pathname.match(/^\/(?:([^/]+)\/)?p\/([a-z0-9_]{6,40})\/?$/i);
      if (!m) return null;
      return { productId: m[2], url: "https://www.ajio.com/p/" + m[2], slug: m[1] || "" };
    }
  }
};

const STORE_KEYS = Object.keys(STORES);

function hostOf(value) {
  try {
    const u = new URL(value);
    return u.hostname.toLowerCase();
  } catch (e) {
    return "";
  }
}

// Returns { store, short } for a URL we recognise, otherwise null.
function identify(urlString) {
  let u;
  try { u = new URL(urlString); } catch (e) { return null; }
  if (u.protocol !== "https:" && u.protocol !== "http:") return null;
  if (u.username || u.password || (u.port && u.port !== "443" && u.port !== "80")) return null;
  const host = u.hostname.toLowerCase();
  for (const key of STORE_KEYS) {
    const s = STORES[key];
    if (s.hosts.includes(host)) return { store: key, short: false, url: u };
    if (s.shortHosts.includes(host)) return { store: key, short: true, url: u };
  }
  return null;
}

function allowedHost(host) {
  host = host.toLowerCase();
  return STORE_KEYS.some((k) => STORES[k].hosts.includes(host) || STORES[k].shortHosts.includes(host));
}

// Follows a store's short link (amzn.to/…, fkrt.it/…) to the product page.
// Every hop must stay on https and on a store host in the list above, so a
// pasted link can never make our server call an internal or unknown address.
async function resolveShort(urlString, fetchImpl = fetch) {
  let current = urlString;
  for (let hop = 0; hop < 5; hop++) {
    const u = new URL(current);
    if (u.protocol !== "https:" || !allowedHost(u.hostname) || (u.port && u.port !== "443") || u.username) {
      throw Object.assign(new Error("Link left the supported stores"), { code: "unsupported" });
    }
    const id = identify(current);
    if (id && !id.short) return current;
    const res = await fetchImpl(current, {
      method: "GET",
      redirect: "manual",
      headers: { "User-Agent": "Mozilla/5.0 (compatible; FitDealBot/1.0; +https://fitdeal.shop/about/)" },
      signal: AbortSignal.timeout(5000)
    });
    if (res.body && res.body.cancel) res.body.cancel().catch(() => {});
    const loc = res.headers.get("location");
    if (res.status < 300 || res.status > 399 || !loc) {
      throw Object.assign(new Error("Short link did not redirect"), { code: "unresolved" });
    }
    current = new URL(loc, current).toString();
  }
  throw Object.assign(new Error("Too many redirects"), { code: "unresolved" });
}

// Parses a pasted product link. Returns
// { store, storeName, productId, url, titleHint, brandHint } or throws with a
// user-facing code: invalid | unsupported | not_product | unresolved.
async function parseProductLink(input, fetchImpl) {
  let text = String(input || "").trim();
  // People often paste "Check out this product… https://…": take the URL.
  const found = text.match(/https?:\/\/[^\s<>"']+/i);
  if (found) text = found[0];
  else if (/^[a-z0-9.-]+\.[a-z]{2,}\//i.test(text)) text = "https://" + text;
  if (text.length > 2000) throw Object.assign(new Error("Too long"), { code: "invalid" });
  let id = identify(text);
  if (!id) {
    if (!hostOf(text)) throw Object.assign(new Error("Not a link"), { code: "invalid" });
    throw Object.assign(new Error("Store not supported"), { code: "unsupported" });
  }
  if (id.short) {
    const full = await resolveShort(id.url.toString(), fetchImpl);
    id = identify(full);
    if (!id || id.short) throw Object.assign(new Error("Short link did not resolve"), { code: "unresolved" });
  }
  const parsed = STORES[id.store].parse(id.url);
  if (!parsed) throw Object.assign(new Error("Not a product page"), { code: "not_product" });
  const words = decodeURIComponent(parsed.slug || "").replace(/[-_+]+/g, " ").replace(/\s+/g, " ").trim();
  return {
    store: id.store,
    storeName: STORES[id.store].name,
    productId: parsed.productId,
    url: parsed.url,
    titleHint: /[a-z]{3}/i.test(words) ? words.slice(0, 140) : "",
    brandHint: parsed.brand ? parsed.brand.replace(/-/g, " ") : ""
  };
}

// Adds our affiliate ID to a store address. Rankings never see this: it is
// applied only in the /go redirect, after the user has chosen a product.
function affiliateUrl(store, url, subid) {
  const a = config.affiliate;
  let u;
  try { u = new URL(url); } catch (e) { return url; }
  if (!allowedHost(u.hostname)) return url;
  if (store === "amazon" && a.amazonTag) {
    u.searchParams.set("tag", a.amazonTag);
    return u.toString();
  }
  if (store === "flipkart" && a.flipkartId) {
    u.searchParams.set("affid", a.flipkartId);
    if (subid) u.searchParams.set("affExtParam1", subid);
    return u.toString();
  }
  if ((store === "myntra" || store === "ajio") && a.networkTemplate) {
    return a.networkTemplate.replace("{url}", encodeURIComponent(u.toString())).replace("{subid}", encodeURIComponent(subid || ""));
  }
  return u.toString();
}

module.exports = { STORES, STORE_KEYS, identify, allowedHost, resolveShort, parseProductLink, affiliateUrl };
