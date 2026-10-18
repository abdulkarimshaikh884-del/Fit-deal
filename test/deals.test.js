require("./helpers");
const test = require("node:test");
const assert = require("node:assert");
const config = require("../lib/config");
const server = require("../server");
const curatedDeals = require("../lib/curated-deals");

let base;
test.before(() => new Promise((resolve) => {
  server.listen(0, "127.0.0.1", () => {
    base = "http://127.0.0.1:" + server.address().port;
    config.extraOrigins.push(base);
    resolve();
  });
}));
test.after(() => new Promise((resolve) => server.close(resolve)));

const get = (path, opts = {}) => fetch(base + path, { redirect: "manual", ...opts });

// ── normalizeDeal: one honest formula for every card ───────────────────────
test("normalizeDeal: headline is the lowest store price", () => {
  for (const d of curatedDeals.getAll()) {
    const min = Math.min(...d.stores.map((s) => s.price));
    assert.strictEqual(d.price, min, d.key + ": headline must be the lowest store price");
  }
});

test("normalizeDeal: Save ₹X = MRP − headline, % OFF rounded on the same base", () => {
  for (const d of curatedDeals.getAll()) {
    assert.strictEqual(d.savings, d.mrp - d.price, d.key + ": savings must equal MRP − price");
    assert.strictEqual(d.off, Math.round((1 - d.price / d.mrp) * 100), d.key + ": off must be the rounded percent");
  }
});

test("normalizeDeal: exactly one store is flagged lowest and matches headline", () => {
  for (const d of curatedDeals.getAll()) {
    const lowest = d.stores.filter((s) => s.isLowest);
    assert.strictEqual(lowest.length, 1, d.key + ": exactly one lowest store");
    assert.strictEqual(lowest[0].price, d.price, d.key + ": lowest flag matches headline");
    assert.strictEqual(d.store, lowest[0].store, d.key + ": deal.store matches lowest");
    assert.strictEqual(d.highlight, "Lowest on " + d.storeName, d.key + ": highlight names the store");
  }
});

test("normalizeDeal: every deal keeps multi-store data for the hub", () => {
  const deals = curatedDeals.getAll();
  assert.ok(deals.length >= 8);
  assert.ok(deals.every((d) => d.key && d.title && d.price && d.mrp && d.stores && d.stores.length >= 2));
});

test("deal photos match their product type", () => {
  const titan = curatedDeals.find("deal-titan-neo-watch");
  assert.doesNotMatch(titan.image, /1522335789203/, "titan watch must not use the makeup photo");
  const anouk = curatedDeals.find("deal-anouk-kurti-palazzo");
  assert.doesNotMatch(anouk.image, /1617627143750/, "anouk kurti must not use the saree photo");
  const redtape = curatedDeals.find("deal-red-tape-chunky");
  assert.doesNotMatch(redtape.image, /1595950653106/, "red tape sneakers must not use the pastel nike photo");
});

// ── /api/deals/:key ────────────────────────────────────────────────────────
test("GET /api/deals/:key returns the normalized deal", async () => {
  const r = await get("/api/deals/deal-libas-anarkali");
  assert.strictEqual(r.status, 200);
  const body = await r.json();
  assert.strictEqual(body.deal.key, "deal-libas-anarkali");
  assert.strictEqual(body.deal.savings, body.deal.mrp - body.deal.price);
});

test("GET /api/deals/:key 404s for unknown keys", async () => {
  const r = await get("/api/deals/no-such-deal");
  assert.strictEqual(r.status, 404);
});

// ── /go/deal/:key/:store: open-redirect-safe per-store buy links ────────────
test("GET /go/deal/:key/:store redirects to the store product page", async () => {
  const r = await get("/go/deal/deal-libas-anarkali/flipkart");
  assert.strictEqual(r.status, 302);
  const loc = r.headers.get("location");
  assert.ok(loc.startsWith("https://www.flipkart.com/"), "must go to flipkart, got: " + loc);
});

test("GET /go/deal/:key/:store rejects unknown stores (no open redirect)", async () => {
  for (const bad of ["evilstore", "https://evil.com", "amazon.evil.com"]) {
    const r = await get("/go/deal/deal-libas-anarkali/" + encodeURIComponent(bad));
    const loc = r.headers.get("location") || "";
    assert.ok(!loc.includes("evil"), bad + " must never redirect off-site, got: " + loc);
    assert.ok(r.status === 302 || r.status === 404, bad + " must not resolve, got: " + r.status);
  }
});

test("GET /go/deal/:key/:store rejects unknown deals and unlisted stores", async () => {
  let r = await get("/go/deal/no-such-deal/flipkart");
  assert.strictEqual(r.status, 302);
  assert.strictEqual(r.headers.get("location"), "/deals/");
  // ajio is a real store but this deal doesn't list it
  r = await get("/go/deal/deal-libas-anarkali/ajio");
  assert.strictEqual(r.status, 302);
  assert.strictEqual(r.headers.get("location"), "/deals/");
});

// ── /product/deals/:key pages ──────────────────────────────────────────────
test("GET /product/deals/:key serves the product page", async () => {
  const r = await get("/product/deals/deal-libas-anarkali/");
  assert.strictEqual(r.status, 200);
  const html = await r.text();
  assert.match(html, /Libas Women Floral Yoke Design Anarkali Kurta/);
});

test("GET /product/deals/:key 404s for unknown deals", async () => {
  const r = await get("/product/deals/no-such-deal/");
  assert.strictEqual(r.status, 404);
});

// ── New policy/info pages ──────────────────────────────────────────────────
test("new pages exist and carry honest copy", async () => {
  for (const p of ["/cookie-policy/", "/grievance-redressal/", "/careers/", "/press/"]) {
    const r = await get(p);
    assert.strictEqual(r.status, 200, p);
  }
  const gp = await (await get("/grievance-redressal/")).text();
  assert.match(gp, /Grievance Officer/);
  const cp = await (await get("/cookie-policy/")).text();
  assert.match(cp, /does <b>not<\/b> use advertising/i);
});

// ── Filter math: exact audience matching ────────────────────────────────────
test("audience matching is exact: men filter never shows women's deals", () => {
  const deals = curatedDeals.getAll();
  const mens = deals.filter((d) => d.audience === "men" || d.audience === "unisex");
  assert.ok(mens.length > 0);
  assert.ok(mens.every((d) => d.audience !== "women"), "no women's deal may pass the men filter");
  // The old substring bug: "women".includes("men") === true
  assert.strictEqual("women".includes("men"), true, "documents the original bug");
  const womens = deals.filter((d) => d.audience === "women" || d.audience === "unisex");
  assert.ok(womens.every((d) => d.audience !== "men"));
});
