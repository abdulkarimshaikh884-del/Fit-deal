// The /api/* and /go/* routes.
const config = require("./config");
const log = require("./log");
const store = require("./store");
const image = require("./image");
const recognize = require("./recognize");
const search = require("./search");
const { STORES, STORE_KEYS, parseProductLink, affiliateUrl, allowedHost } = require("./stores");
const { clientIp, rateLimit, readBody, readJson, sendJson, sameOrigin, dailyVisitor } = require("./http");

const MAX_UPLOAD = 8 * 1024 * 1024; // the page shrinks photos first; this is the hard cap
const VOTE_DAYS = 7;

// Recognised items wait here (in memory, no photo) until the shopper picks
// one to search for.
const analyses = new Map();
const ANALYSIS_MS = 2 * 3600 * 1000;
function keepAnalysis(value) {
  const id = store.newId(12);
  analyses.set(id, { at: Date.now(), value });
  for (const [k, v] of analyses) if (Date.now() - v.at > ANALYSIS_MS) analyses.delete(k);
  return id;
}

function fail(res, status, code, message, extra) {
  sendJson(res, status, { error: code, message, ...extra });
}

function limited(req, res, name, limit, windowMs) {
  const r = rateLimit(name + ":" + clientIp(req), limit, windowMs);
  if (!r.ok) {
    fail(res, 429, "rate_limited", "Too many tries. Please wait a little and try again.");
    return true;
  }
  return false;
}

function device(req) {
  return /Mobi|Android|iPhone/i.test(req.headers["user-agent"] || "") ? "mobile" : "desktop";
}

// Analytics: only whitelisted event names, short props, a daily visitor
// hash. No IP address, no full user agent, no cookies.
const CLIENT_EVENTS = new Set(["page_view", "upload_start", "results_view", "save", "unsave", "share", "sample_click", "link_submit", "vote_view", "refine", "category", "deals_view", "profile_clear"]);
async function track(req, name, props = {}, path = "") {
  try {
    const clean = {};
    for (const [k, v] of Object.entries(props || {}).slice(0, 8)) {
      if (["string", "number", "boolean"].includes(typeof v)) clean[String(k).slice(0, 24)] = typeof v === "string" ? v.slice(0, 80) : v;
    }
    await store.insert("events", { name, path: String(path || "").slice(0, 120), props: clean, visitor: dailyVisitor(req), device: device(req) });
  } catch (e) {
    log.error("track failed", e, { name });
  }
}

// What the page may see of a product: everything except the raw store
// address, so every "Buy" goes through /go and is counted.
function publicProduct(p) {
  const { url, ...rest } = p;
  return rest;
}

function publicSearch(s) {
  return {
    id: s.id,
    kind: s.kind,
    item: s.item,
    query: s.query,
    link: s.link ? { store: s.link.store, storeName: s.link.storeName } : null,
    exact: (s.exact || []).map(publicProduct),
    similar: (s.similar || []).map(publicProduct),
    bestExact: s.best_exact,
    sources: s.sources,
    storeLinks: s.store_links,
    searchedAt: s.searched_at
  };
}

async function saveSearch(req, kind, item, query, result, link) {
  const rec = await store.insert("searches", {
    kind, item, query, link: link || null,
    exact: result.exact, similar: result.similar, best_exact: result.bestExact,
    sources: result.sources, store_links: result.storeLinks, searched_at: result.searchedAt
  });
  await track(req, "search_done", {
    kind, category: item.category, exact: result.exact.length, similar: result.similar.length,
    empty: !result.exact.length && !result.similar.length
  });
  return rec;
}

// ── Handlers ───────────────────────────────────────────────────────────────
const routes = {};

routes["GET /api/health"] = async (req, res) => {
  sendJson(res, 200, { ok: true, time: new Date().toISOString() });
};

// What the pages need to know to be honest about what works right now.
routes["GET /api/status"] = async (req, res) => {
  const sources = search.activeProviders().map((p) => ({ source: p.name, label: p.label, stores: p.stores }));
  sendJson(res, 200, {
    recognition: !!config.gemini.key,
    sources,
    stores: STORE_KEYS.map((k) => ({ key: k, name: STORES[k].name })),
    maxUploadMb: MAX_UPLOAD / 1024 / 1024
  });
};

routes["POST /api/analyze"] = async (req, res) => {
  if (limited(req, res, "analyze", 30, 3600 * 1000)) return;
  const buf = await readBody(req, MAX_UPLOAD);
  let info;
  try {
    info = image.check(buf, { maxBytes: MAX_UPLOAD });
  } catch (e) {
    await track(req, "analysis_fail", { reason: e.code });
    const msg = {
      empty: "The file was empty. Please choose a photo.",
      too_large: "That photo is too large. Try a screenshot instead.",
      bad_type: "That file isn't a photo we can read. Use a JPG, PNG or WebP screenshot.",
      too_small: "That image is too small to see the clothes. Try a bigger screenshot."
    }[e.code] || "We couldn't read that photo.";
    return fail(res, e.code === "too_large" ? 413 : 415, e.code, msg);
  }
  let result;
  try {
    result = await recognize.analyzeImage(buf, info.type);
  } catch (e) {
    await track(req, "analysis_fail", { reason: e.code || "error" });
    if (e.code === "not_configured") return fail(res, 503, "not_configured", "Outfit search isn't switched on yet. Please check back soon.");
    if (e.code === "busy") return fail(res, 503, "busy", "We're getting a lot of searches right now. Please try again in a minute.");
    if (e.code === "blocked") return fail(res, 422, "blocked", "We can't search with this image. Please try a different photo.");
    log.error("analyze failed", e);
    return fail(res, 502, "engine_error", "Something went wrong while reading your photo. Please try again.");
  }
  const id = keepAnalysis(result);
  await track(req, result.items.length ? "analysis_ok" : "analysis_fail", {
    reason: result.imageIssue, items: result.items.length, category: result.items[0] ? result.items[0].category : ""
  });
  sendJson(res, 200, { id, imageIssue: result.imageIssue, items: result.items });
};

routes["POST /api/search"] = async (req, res) => {
  if (limited(req, res, "search", 60, 3600 * 1000)) return;
  const body = await readJson(req);
  let item, kind, link = null, anchor = null;

  if (body.analysisId) {
    const a = analyses.get(String(body.analysisId));
    if (!a) return fail(res, 410, "expired", "This search has expired. Please upload the photo again.");
    const it = a.value.items[Number(body.index) || 0];
    if (!it) return fail(res, 400, "bad_request", "Please choose an item.");
    item = { ...it };
    kind = body.sample ? "sample" : "image";
  } else if (body.link) {
    try {
      link = await parseProductLink(String(body.link));
    } catch (e) {
      const msg = {
        invalid: "That doesn't look like a link. Copy the product's address from the store and paste it here.",
        unsupported: "We support links from Amazon, Flipkart, Myntra and AJIO for now.",
        not_product: "That link isn't a single product page. Open the product in the store and copy its link.",
        unresolved: "We couldn't open that short link. Try the full product link from the store."
      }[e.code] || "We couldn't read that link.";
      await track(req, "link_fail", { reason: e.code || "error" });
      return fail(res, 400, e.code || "invalid", msg);
    }
    anchor = await search.lookupAnchor(link);
    item = recognize.itemFromTitle(anchor ? anchor.title : link.titleHint, (anchor && anchor.brand) || link.brandHint);
    kind = "link";
  } else if (body.refine) {
    const prev = await store.get("searches", String(body.refine));
    if (!prev) return fail(res, 404, "not_found", "That search no longer exists.");
    item = { ...prev.item };
    link = prev.link;
    anchor = (prev.exact || []).find((p) => p.fromLink) || null;
    kind = "refine";
  } else {
    return fail(res, 400, "bad_request", "Nothing to search for.");
  }

  // The shopper may correct what we recognised ("it's a kurta, not a top").
  if (typeof body.query === "string" && body.query.trim()) {
    item.query = recognize.clean(body.query, 90);
    item.edited = true;
  }
  const query = item.query || recognize.buildQuery(item);
  if (!query) return fail(res, 400, "bad_request", "Please describe what you're looking for.");

  const result = await search.run({ item, query, anchor });
  const rec = await saveSearch(req, kind, item, query, result, link);
  sendJson(res, 200, { id: rec.id });
};

// Home and Deals pages: real products from recent searches on Fit Deal.
// Only live sources count (never demo data, never a pasted link without a
// price), every item keeps the time its price was checked, and "% off" is
// worked out from the store's own MRP. Empty when there's nothing real yet.
const LIVE_SOURCES = new Set(["flipkart", "amazon", "serper"]);
const FRESH_HOURS = 48;
let feedCache = { at: 0, value: null };
async function buildFeed() {
  const since = new Date(Date.now() - 7 * 86400000).toISOString();
  const searches = await store.find("searches", { created_at: { gte: since } }, { limit: 300 });
  const fresh = Date.now() - FRESH_HOURS * 3600000;
  const seen = new Set();
  const items = [];
  for (const s of searches) {
    let fromThis = 0;
    for (const p of (s.exact || []).concat(s.similar || [])) {
      if (fromThis >= 3 || seen.has(p.key)) continue;
      if (!LIVE_SOURCES.has(p.provider) || p.price == null || !p.image || p.inStock === false) continue;
      if (!p.checkedAt || Date.parse(p.checkedAt) < fresh) continue;
      seen.add(p.key);
      fromThis++;
      items.push({
        searchId: s.id, key: p.key, title: p.title, brand: p.brand, store: p.store, storeName: p.storeName,
        image: p.image, price: p.price, mrp: p.mrp, off: p.mrp ? Math.round((1 - p.price / p.mrp) * 100) : 0,
        checkedAt: p.checkedAt, match: p.match,
        category: s.item ? s.item.category : "", audience: s.item ? s.item.audience : ""
      });
    }
  }
  const deals = items.filter((x) => x.off >= 20).sort((a, b) => b.off - a.off || a.price - b.price).slice(0, 24);
  const dealKeys = new Set(deals.map((x) => x.key));
  const picks = items.filter((x) => !dealKeys.has(x.key)).slice(0, 24);
  return { deals, picks, updatedAt: new Date().toISOString() };
}

routes["GET /api/feed"] = async (req, res) => {
  if (!feedCache.value || Date.now() - feedCache.at > 5 * 60 * 1000) {
    feedCache = { at: Date.now(), value: await buildFeed() };
  }
  sendJson(res, 200, feedCache.value);
};

routes["GET /api/search/:id"] = async (req, res, p) => {
  const s = await store.get("searches", p.id);
  if (!s) return fail(res, 404, "not_found", "We couldn't find that search. It may have expired.");
  sendJson(res, 200, publicSearch(s));
};

// Reports of a wrong match or a bad result.
routes["POST /api/report"] = async (req, res) => {
  if (limited(req, res, "report", 20, 3600 * 1000)) return;
  const b = await readJson(req);
  const reasons = ["not_same", "wrong_item", "bad_price", "broken_link", "other"];
  const reason = reasons.includes(b.reason) ? b.reason : "other";
  const s = b.searchId ? await store.get("searches", String(b.searchId)) : null;
  if (!s) return fail(res, 404, "not_found", "Search not found.");
  const all = (s.exact || []).concat(s.similar || []);
  const prod = all.find((x) => x.key === b.key) || null;
  await store.insert("reports", {
    search_id: s.id, product_key: prod ? prod.key : null, match: prod ? prod.match : null, store: prod ? prod.store : null,
    reason, note: recognize.clean(b.note, 300), query: s.query, category: s.item && s.item.category
  });
  await track(req, "report", { reason, match: prod ? prod.match : "" });
  sendJson(res, 200, { ok: true });
};

// ── Votes ("Help me choose") ───────────────────────────────────────────────
routes["POST /api/vote"] = async (req, res) => {
  if (limited(req, res, "vote_create", 20, 3600 * 1000)) return;
  const b = await readJson(req);
  const s = b.searchId ? await store.get("searches", String(b.searchId)) : null;
  if (!s) return fail(res, 404, "not_found", "Search not found.");
  const keys = Array.isArray(b.keys) ? [...new Set(b.keys.map(String))].slice(0, 3) : [];
  const all = (s.exact || []).concat(s.similar || []);
  const picks = keys.map((k) => all.find((x) => x.key === k)).filter(Boolean);
  if (picks.length < 2) return fail(res, 400, "bad_request", "Pick 2 or 3 products for your friends to vote on.");
  const letters = ["A", "B", "C"];
  const vote = await store.insert("votes", {
    search_id: s.id,
    asker: recognize.clean(b.name, 20),
    question: "Which one should I buy?",
    options: picks.map((p, i) => ({
      key: letters[i], productKey: p.key, title: p.title, brand: p.brand, storeName: p.storeName, store: p.store,
      image: p.image, price: p.price, checkedAt: p.checkedAt
    })),
    closes_at: new Date(Date.now() + VOTE_DAYS * 86400000).toISOString()
  });
  await track(req, "vote_create", { options: picks.length });
  sendJson(res, 200, { id: vote.id });
};

async function voteView(v, voter) {
  const ballots = await store.find("ballots", { vote_id: v.id }, { limit: 5000 });
  const counts = {};
  let mine = null;
  for (const b of ballots) {
    counts[b.option] = (counts[b.option] || 0) + 1;
    if (voter && b.voter === voter) mine = b.option;
  }
  return {
    id: v.id,
    searchId: v.search_id,
    asker: v.asker,
    question: v.question,
    closesAt: v.closes_at,
    closed: Date.now() > Date.parse(v.closes_at),
    options: v.options.map((o) => ({ ...o, votes: counts[o.key] || 0 })),
    total: ballots.length,
    mine
  };
}

function voterToken(req) {
  const t = String(req.headers["x-voter"] || "");
  return /^[a-zA-Z0-9-]{16,64}$/.test(t) ? t : "";
}

routes["GET /api/vote/:id"] = async (req, res, p) => {
  const v = await store.get("votes", p.id);
  if (!v) return fail(res, 404, "not_found", "This vote doesn't exist or has been removed.");
  sendJson(res, 200, await voteView(v, voterToken(req)));
};

routes["POST /api/vote/:id/ballot"] = async (req, res, p) => {
  if (limited(req, res, "ballot", 60, 3600 * 1000)) return;
  const b = await readJson(req);
  const voter = voterToken(req);
  if (!voter) return fail(res, 400, "bad_request", "Please reload the page and try again.");
  const v = await store.get("votes", p.id);
  if (!v) return fail(res, 404, "not_found", "This vote doesn't exist.");
  if (Date.now() > Date.parse(v.closes_at)) return fail(res, 409, "closed", "Voting has closed.");
  if (!v.options.some((o) => o.key === b.option)) return fail(res, 400, "bad_request", "Pick one of the looks.");
  const existing = await store.find("ballots", { vote_id: v.id }, { limit: 5000 });
  if (existing.some((x) => x.voter === voter)) return fail(res, 409, "already_voted", "You've already voted.", { vote: await voteView(v, voter) });
  // One household can share an IP, so allow a few votes per network per day.
  const net = dailyVisitor(req, { network: true });
  if (existing.filter((x) => x.net === net).length >= 5) return fail(res, 429, "rate_limited", "Too many votes from this network.");
  await store.insert("ballots", { vote_id: v.id, option: b.option, voter, net });
  await track(req, "vote_cast", {});
  sendJson(res, 200, await voteView(v, voter));
};

// ── Contact form ───────────────────────────────────────────────────────────
routes["POST /api/contact"] = async (req, res) => {
  if (limited(req, res, "contact", 5, 3600 * 1000)) return;
  const b = await readJson(req);
  // Hidden field that people never fill in, but form-spamming bots do.
  if (b.website) return sendJson(res, 200, { ok: true });
  const name = recognize.clean(b.name, 80);
  const email = String(b.email || "").trim().slice(0, 120);
  // Keep line breaks and tabs, drop every other control character.
  const message = String(b.message || "").replace(/(?![\n\t])\p{Cc}/gu, "").trim().slice(0, 4000);
  const topics = ["General question", "Wrong or missing result", "Add a store", "Delete my data", "Copyright or takedown", "Partnership"];
  const topic = topics.includes(b.topic) ? b.topic : "General question";
  if (!name || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email) || message.length < 5) {
    return fail(res, 400, "bad_request", "Please fill in your name, a valid email and a message.");
  }
  await store.insert("messages", { name, email, topic, message, status: "new" });
  log.info("contact message", { topic });
  sendJson(res, 200, { ok: true });
};

routes["POST /api/event"] = async (req, res) => {
  if (limited(req, res, "event", 300, 3600 * 1000)) return;
  const b = await readJson(req, 4096);
  if (!CLIENT_EVENTS.has(b.name)) return sendJson(res, 200, { ok: false });
  await track(req, b.name, b.props, b.path);
  sendJson(res, 200, { ok: true });
};

// ── /go: the only way out to a store ───────────────────────────────────────
// Looks the product up in our own saved search (never takes a URL from the
// address bar, so it can't be used as an open redirect), adds our affiliate
// ID, counts the click, and sends the shopper on.
routes["GET /go/:id/:key"] = async (req, res, p) => {
  const s = await store.get("searches", p.id);
  const all = s ? (s.exact || []).concat(s.similar || []) : [];
  const prod = all.find((x) => x.key === p.key);
  if (!prod || !allowedHost(new URL(prod.url).hostname)) {
    res.writeHead(302, { Location: "/404" });
    return res.end();
  }
  const from = String(new URL(req.url, "http://x").searchParams.get("from") || "results").slice(0, 20);
  const subid = `${s.id}-${prod.key}`;
  const target = affiliateUrl(prod.store, prod.url, subid);
  store.insert("clicks", {
    search_id: s.id, product_key: prod.key, store: prod.store, match: prod.match, price: prod.price,
    placement: from, subid, affiliated: target !== prod.url, visitor: dailyVisitor(req), device: device(req)
  }).catch((e) => log.error("click log failed", e));
  res.writeHead(302, { Location: target, "Cache-Control": "no-store", "Referrer-Policy": "no-referrer-when-downgrade" });
  res.end();
};

// "See more on Myntra": the store's own search for the same words.
routes["GET /go/:id/store/:store"] = async (req, res, p) => {
  const s = await store.get("searches", p.id);
  if (!s || !STORES[p.store]) {
    res.writeHead(302, { Location: "/404" });
    return res.end();
  }
  const subid = `${s.id}-search`;
  const target = affiliateUrl(p.store, STORES[p.store].search(s.query), subid);
  store.insert("clicks", {
    search_id: s.id, product_key: null, store: p.store, match: "store_search", price: null,
    placement: "store_search", subid, affiliated: target !== STORES[p.store].search(s.query), visitor: dailyVisitor(req), device: device(req)
  }).catch((e) => log.error("click log failed", e));
  res.writeHead(302, { Location: target, "Cache-Control": "no-store" });
  res.end();
};

// Turns the table above into a matcher.
const compiled = Object.keys(routes).map((k) => {
  const [method, pattern] = k.split(" ");
  const names = [];
  const re = new RegExp("^" + pattern.replace(/:[a-z]+/g, (m) => { names.push(m.slice(1)); return "([A-Za-z0-9_-]{1,64})"; }) + "/?$");
  return { method, re, names, fn: routes[k] };
});

async function handle(req, res, pathname) {
  if (!pathname.startsWith("/api/") && !pathname.startsWith("/go/")) return false;
  const found = compiled.find((r) => r.re.test(pathname) && (r.method === req.method || (r.method === "GET" && req.method === "HEAD")));
  if (!found) {
    const anyMethod = compiled.some((r) => r.re.test(pathname));
    fail(res, anyMethod ? 405 : 404, anyMethod ? "method_not_allowed" : "not_found", "Not found.");
    return true;
  }
  if (req.method === "POST" && !sameOrigin(req)) {
    fail(res, 403, "forbidden", "Requests must come from Fit Deal.");
    return true;
  }
  const m = pathname.match(found.re);
  const params = {};
  found.names.forEach((n, i) => { params[n] = m[i + 1]; });
  try {
    await found.fn(req, res, params);
  } catch (e) {
    if (res.headersSent) return true;
    if (e.status) fail(res, e.status, e.code || "bad_request", e.status === 413 ? "That file is too large." : "Bad request.");
    else {
      log.error("api error", e, { path: pathname });
      fail(res, 500, "server_error", "Something went wrong on our side. Please try again.");
    }
  }
  return true;
}

module.exports = { handle, track, publicSearch, voteView, buildFeed, _analyses: analyses, _resetFeed: () => { feedCache = { at: 0, value: null }; } };
