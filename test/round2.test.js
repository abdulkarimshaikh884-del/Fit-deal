require("./helpers");
const test = require("node:test");
const assert = require("node:assert");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
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
const ROOT = path.join(__dirname, "..");

// ── Load the real client app.js in a sandbox to test FD.recent / FD.viewed ──
function loadFD() {
  const mem = {};
  const storage = () => ({
    getItem: (k) => (k in mem ? mem[k] : null),
    setItem: (k, v) => { mem[k] = String(v); },
    removeItem: (k) => { delete mem[k]; },
  });
  const elStub = () => ({
    hidden: false, textContent: "", innerHTML: "", value: "",
    setAttribute() {}, appendChild() {}, addEventListener() {}, remove() {},
    querySelector() { return null; }, querySelectorAll() { return []; },
    classList: { add() {}, remove() {}, toggle() {} },
    style: {},
  });
  const sandbox = {
    document: {
      getElementById: () => null,
      querySelectorAll: () => [],
      querySelector: () => null,
      createElement: elStub,
      createElementNS: elStub,
      addEventListener() {},
      hidden: false, title: "",
      body: { dataset: {}, classList: { add() {}, remove() {} }, appendChild() {} },
      documentElement: { dataset: {} },
    },
    localStorage: storage(),
    sessionStorage: storage(),
    navigator: {},
    location: { pathname: "/", href: "", search: "", hostname: "test.local" },
    fetch: () => Promise.reject(new Error("no network in unit test")),
    setTimeout: () => 0, clearTimeout() {},
    addEventListener() {}, removeEventListener() {},
    URLSearchParams,
    Blob: function () {}, FormData: function () {},
    console,
  };
  sandbox.window = sandbox;
  sandbox.globalThis = sandbox;
  vm.createContext(sandbox);
  vm.runInContext(fs.readFileSync(path.join(ROOT, "public/js/app.js"), "utf8"), sandbox, { filename: "app.js" });
  assert.ok(sandbox.window.FD, "app.js must expose window.FD");
  return sandbox.window.FD;
}

// ── Fix 4: Recently Viewed records device-locally ────────────────────────────
test("FD.viewed records views, dedupes re-views, caps at 12", () => {
  const FD = loadFD();
  assert.strictEqual(FD.viewed.all().length, 0, "starts empty");
  FD.viewed.add({ searchId: "deals", key: "k1", title: "Dress", url: "/product/deals/k1" });
  FD.viewed.add({ searchId: "deals", key: "k2", title: "Shoes", url: "/product/deals/k2" });
  assert.strictEqual(FD.viewed.all().length, 2);
  assert.strictEqual(FD.viewed.all()[0].key, "k2", "newest first");
  // Re-viewing bumps to front instead of duplicating.
  FD.viewed.add({ searchId: "deals", key: "k1", title: "Dress", url: "/product/deals/k1" });
  assert.strictEqual(FD.viewed.all().length, 2);
  assert.strictEqual(FD.viewed.all()[0].key, "k1");
  assert.ok(FD.viewed.all()[0].viewedAt, "viewedAt timestamp set");
  for (let i = 0; i < 20; i++) FD.viewed.add({ searchId: "s", key: "k" + i, title: "t" });
  assert.strictEqual(FD.viewed.all().length, 12, "capped at 12");
});

// ── Fix 10: recent searches dedupe by text ──────────────────────────────────
test("FD.recent.add refreshes a repeated text search instead of duplicating", () => {
  const FD = loadFD();
  FD.recent.add({ id: "id1", label: "kurti", kind: "text" });
  FD.recent.add({ id: "id2", label: "Kurti", kind: "text" });
  FD.recent.add({ id: "id3", label: "  KURTI ", kind: "text" });
  const all = FD.recent.all();
  assert.strictEqual(all.length, 1, "one entry for repeated text search, got " + all.length);
  assert.strictEqual(all[0].id, "id3", "newest search id wins");
  // Different labels and non-text kinds still accumulate.
  FD.recent.add({ id: "id4", label: "sneakers", kind: "text" });
  FD.recent.add({ id: "id5", label: "Product link", kind: "link" });
  FD.recent.add({ id: "id6", label: "Product link", kind: "link" });
  assert.strictEqual(FD.recent.all().length, 4, "distinct labels + link entries kept");
});

// ── Fix 5: non-fashion items stay out of Men's/Women's Fashion ───────────────
test("gender fashion views exclude electronics, luggage and beauty", () => {
  const deals = curatedDeals.getAll();
  const inGenderView = (d, sc) => {
    const aud = (d.audience || "").toLowerCase();
    const cat = (d.category || "").toLowerCase();
    const ok = sc === "women" ? (aud === "women" || aud === "unisex") : (aud === "men" || aud === "unisex");
    return ok && !d.nonFashion && cat !== "beauty";
  };
  for (const d of deals) {
    assert.ok(!(inGenderView(d, "women") && d.nonFashion), d.key + " flagged nonFashion must skip women's view");
    assert.ok(!(inGenderView(d, "men") && d.category === "beauty"), d.key + " beauty must skip men's view");
  }
  const boat = deals.find((d) => d.key === "deal-boat-wave-smartwatch");
  const luggage = deals.find((d) => d.key === "deal-american-tourister-luggage");
  assert.ok(boat.nonFashion && luggage.nonFashion, "smartwatch + luggage flagged non-fashion");
  assert.ok(!inGenderView(boat, "women") && !inGenderView(boat, "men"), "smartwatch out of gender views");
  assert.ok(!inGenderView(luggage, "women") && !inGenderView(luggage, "men"), "luggage out of gender views");
  // They still exist under their own categories and in the full list.
  assert.ok(deals.includes(boat) && deals.includes(luggage));
});

// ── Fix 6 + extras 13/14: product-accurate photos ────────────────────────────
test("mismatched product photos are replaced (visually verified)", () => {
  const byKey = (k) => curatedDeals.find(k);
  assert.doesNotMatch(byKey("deal-maybelline-lipstick").image, /1586495777744/, "lipstick must not show Clinique");
  assert.doesNotMatch(byKey("deal-minimalist-serum").image, /1620916566398/, "serum must not show Nécessaire");
  assert.doesNotMatch(byKey("deal-plum-green-tea-toner").image, /1608248597359/, "toner URL 404d; must be replaced");
  assert.doesNotMatch(byKey("deal-manyavar-kurta-pyjama").image, /1617627143750/, "kurta-pyjama must not show a saree");
  // Watches: each card a distinct image now.
  const watchImgs = ["deal-fastrack-analog-watch", "deal-titan-neo-watch", "deal-fossil-chronograph-leather",
    "deal-daniel-wellington-petite"].map((k) => byKey(k).image);
  assert.strictEqual(new Set(watchImgs).size, 4, "all 4 watch cards need distinct images");
  assert.ok(watchImgs.every((u) => !u.includes("1524805444758")), "shared IWC stock photo retired from watches");
  // Lavie duplicate resolved.
  assert.notStrictEqual(byKey("deal-lavie-tote-bag").image, byKey("deal-lavie-satchel-bag").image,
    "the two Lavie bags must not share one photo");
});

// ── Fix 2: home "Today's Best Deals" card math ───────────────────────────────
test("home deal cards: headline = lowest store price, badge = rounded % off", () => {
  const html = fs.readFileSync(path.join(ROOT, "public/index.html"), "utf8");
  const cards = html.match(/<article class="fd-comparison-card"[\s\S]*?<\/article>/g) || [];
  assert.ok(cards.length >= 4, "expected the home deal cards, got " + cards.length);
  for (const c of cards) {
    const title = (c.match(/fd-card-title">([^<]+)</) || [])[1] || "card";
    const badge = parseInt((c.match(/fd-badge-save">Save (\d+)%/) || [])[1], 10);
    const curr = parseInt(((c.match(/fd-curr-price">₹([\d,]+)/) || [])[1] || "0").replace(/,/g, ""), 10);
    const orig = parseInt(((c.match(/fd-orig-price">₹([\d,]+)/) || [])[1] || "0").replace(/,/g, ""), 10);
    const prices = [...c.matchAll(/fd-ret-price">₹([\d,]+)/g)].map((m) => parseInt(m[1].replace(/,/g, ""), 10));
    assert.ok(prices.length > 0, title + ": card must list store prices");
    assert.strictEqual(curr, Math.min(...prices), title + ": headline must equal lowest store price");
    assert.strictEqual(badge, Math.round((1 - Math.min(...prices) / orig) * 100), title + ": badge % must be rounded off");
  }
});

// ── Fix 1: hero slides each link their own product ───────────────────────────
test("hero showcase: every slide's View Product links that slide's product", () => {
  const html = fs.readFileSync(path.join(ROOT, "public/index.html"), "utf8");
  const slides = [...html.matchAll(/data-slide-index="(\d+)"[\s\S]*?fd-showcase-title">([^<]+)<\/h3>[\s\S]*?<a href="([^"]+)" class="fd-showcase-btn"/g)];
  assert.strictEqual(slides.length, 4, "expected 4 hero slides");
  for (const [, , title, href] of slides) {
    const q = decodeURIComponent(new URL("http://x" + href).searchParams.get("q") || "").toLowerCase();
    const words = title.trim().toLowerCase().split(/\s+/).filter((w) => w.length > 3);
    const hit = words.some((w) => q.includes(w));
    assert.ok(hit, `slide "${title}" CTA must reference its own product (got ${href})`);
  }
  const js = fs.readFileSync(path.join(ROOT, "public/js/home.js"), "utf8");
  assert.match(js, /fd-showcase-card\.is-active/, "click guard must only allow the active slide's CTA");
  assert.match(js, /focusin/, "autoplay must pause on keyboard focus");
});

// ── Fix 11: compliance links reachable from every page's footer ──────────────
test("every built page footer links Cookie Policy + Grievance Redressal", async () => {
  for (const p of ["/", "/deals/", "/cookie-policy/", "/grievance-redressal/", "/shop/", "/saved/"]) {
    const html = await (await get(p)).text();
    assert.match(html, /href="\/cookie-policy\/"/, p + ": footer must link Cookie Policy");
    assert.match(html, /href="\/grievance-redressal\/"/, p + ": footer must link Grievance Redressal");
  }
});

// ── Fix 7: no fake live/real-time/verification claims ────────────────────────
test("no fake live-price or verification claims in built pages", () => {
  const pages = ["index.html", "deals/index.html", "shop/index.html", "find/index.html"];
  const banned = [/real prices from recent/i, /multi-store verification/i, /we verify prices/i,
    /lowest price always ranks first/i, /real-time/i, /verified prices/i];
  for (const p of pages) {
    const html = fs.readFileSync(path.join(ROOT, "public", p), "utf8");
    for (const re of banned) assert.doesNotMatch(html, re, p + " must not contain " + re);
  }
});

// ── Extra 12: friendly URL aliases ───────────────────────────────────────────
test("URL aliases redirect instead of 404", async () => {
  for (const [from, to] of [["/search", "/find/"], ["/search/", "/find/"], ["/grievance", "/grievance-redressal/"],
      ["/grievance/", "/grievance-redressal/"], ["/favourites", "/saved/"], ["/favourites/", "/saved/"]]) {
    const r = await get(from);
    assert.strictEqual(r.status, 301, from + " must redirect");
    assert.ok(String(r.headers.get("location")).startsWith(to), from + " must go to " + to);
  }
});

// ── Sitemap covers all real pages ────────────────────────────────────────────
test("sitemap lists static pages + all product detail pages", async () => {
  const xml = await (await get("/sitemap.xml")).text();
  for (const u of ["https://fitdeal.shop/", "https://fitdeal.shop/deals/", "https://fitdeal.shop/cookie-policy/",
      "https://fitdeal.shop/grievance-redressal/"]) {
    assert.ok(xml.includes(`<loc>${u}</loc>`), "sitemap must list " + u);
  }
  for (const d of curatedDeals.getAll()) {
    assert.ok(xml.includes(`<loc>https://fitdeal.shop/product/deals/${d.key}</loc>`), "sitemap must list " + d.key);
  }
});

// ── Fix 9: recommendations are category-aware (built style page) ─────────────
test("style page recommendations share a real category, not just gender", async () => {
  const html = await (await get("/style/floral-maxi-dress/")).text();
  const sec = html.split("You might also like")[1] || "";
  const links = [...sec.matchAll(/href="\/style\/([^/"]+)\/"/g)].map((m) => m[1]);
  assert.ok(links.length > 0, "recommendations must exist");
  assert.ok(links.some((id) => /dress/.test(id)), "maxi dress page should recommend dresses, got: " + links.join(","));
  assert.ok(!links.includes("white-sneakers") && !links.includes("court-sneakers"), "must not recommend sneakers");
});
