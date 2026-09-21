const { fakeFetch, resetFetch, fakeJpeg } = require("./helpers");
const test = require("node:test");
const assert = require("node:assert");
const config = require("../lib/config");
const server = require("../server");
const store = require("../lib/store");

let base;
test.before(() => new Promise((resolve) => {
  server.listen(0, "127.0.0.1", () => {
    base = "http://127.0.0.1:" + server.address().port;
    config.extraOrigins.push(base);
    resolve();
  });
}));
test.after(() => new Promise((resolve) => server.close(resolve)));

const post = (path, body, headers = {}) => fetch(base + path, {
  method: "POST",
  headers: { Origin: base, "Content-Type": body instanceof Buffer ? "image/jpeg" : "application/json", ...headers },
  body: body instanceof Buffer ? body : JSON.stringify(body),
  redirect: "manual"
});

function geminiAnswer(items) {
  return { json: { candidates: [{ content: { parts: [{ text: JSON.stringify({ image_issue: "none", items }) }] } }], usageMetadata: { totalTokenCount: 100 } } };
}

test("pages, clean URLs and error pages", async () => {
  let r = await fetch(base + "/");
  assert.strictEqual(r.status, 200);
  const html = await r.text();
  assert.match(html, /<title>Fit Deal/);
  assert.doesNotMatch(html, /try-on|Try On|alerts/i, "V2 features are not on the V1 home page");
  assert.match(r.headers.get("content-security-policy"), /script-src 'self'/);
  assert.strictEqual(r.headers.get("x-frame-options"), "DENY");
  assert.strictEqual(r.headers.get("x-content-type-options"), "nosniff");
  r = await fetch(base + "/about", { redirect: "manual" });
  assert.strictEqual(r.status, 301);
  assert.strictEqual(r.headers.get("location"), "/about/");
  r = await fetch(base + "/no-such-page");
  assert.strictEqual(r.status, 404);
  assert.match(await r.text(), /went out of style/);
  r = await fetch(base + "/.env");
  assert.strictEqual(r.status, 404);
  r = await fetch(base + "/find/abcdef1234");
  assert.strictEqual(r.status, 200, "result pages are served for any id; the page handles missing ones");
  r = await fetch(base + "/robots.txt");
  assert.match(await r.text(), /Disallow: \//, "previews stay out of search engines");
});

test("API refuses cross-site and malformed requests", async () => {
  let r = await fetch(base + "/api/search", { method: "POST", headers: { "Content-Type": "application/json", Origin: "https://evil.example" }, body: "{}" });
  assert.strictEqual(r.status, 403);
  r = await fetch(base + "/api/search", { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" });
  assert.strictEqual(r.status, 403, "no Origin on a POST is refused");
  r = await post("/api/search", Buffer.from("{bad json"));
  assert.ok([400, 403].includes(r.status));
  r = await fetch(base + "/api/search", { method: "POST", headers: { Origin: base, "Content-Type": "application/json" }, body: "{bad" });
  assert.strictEqual(r.status, 400);
  r = await fetch(base + "/api/nope");
  assert.strictEqual(r.status, 404);
  r = await fetch(base + "/api/search", { method: "DELETE" });
  assert.strictEqual(r.status, 405);
  assert.strictEqual(r.headers.get("access-control-allow-origin"), null, "no CORS");
});

test("upload checks happen before any AI call", async () => {
  resetFetch(); // any outside call would throw
  let r = await post("/api/analyze", Buffer.from("GIF89a not really"));
  assert.strictEqual(r.status, 415);
  r = await post("/api/analyze", Buffer.alloc(9 * 1024 * 1024, 1));
  assert.strictEqual(r.status, 413);
  r = await post("/api/analyze", fakeJpeg());
  assert.strictEqual(r.status, 503, "no Gemini key → clear 'not switched on' answer");
  assert.strictEqual((await r.json()).error, "not_configured");
});

test("photo → items → search → results → /go, end to end", async () => {
  resetFetch();
  config.gemini.key = "test-key";
  config.providers.serper.key = "sk";
  config.affiliate.networkTemplate = "https://linksredirect.com/?cid=1&subid={subid}&url={url}";
  let sentImage = null;
  fakeFetch(/generativelanguage\.googleapis\.com/, (url, init) => {
    const body = JSON.parse(init.body);
    sentImage = body.contents[0].parts[0].inline_data;
    assert.strictEqual(init.headers["x-goog-api-key"], "test-key", "key goes in a header, not the URL");
    assert.ok(!/key=/.test(url));
    return geminiAnswer([
      { label: "Olive shirt", category: "shirt", audience: "men", colors: ["olive"], pattern: "solid", brand: "", brand_evidence: "none", confidence: 0.92, box: [0, 0, 600, 1000], search_query: "men olive casual shirt" },
      { label: "Beige chinos", category: "other", other_category: "chinos", audience: "men", colors: ["beige"], pattern: "solid", brand: "", brand_evidence: "none", confidence: 0.5, box: [600, 0, 1000, 1000], search_query: "men beige chinos" }
    ]);
  });
  fakeFetch(/google\.serper\.dev/, () => ({ json: { shopping: [
    { title: "Men Olive Solid Casual Shirt", link: "https://www.myntra.com/shirts/a/b/7000001/buy", price: "₹899", imageUrl: "https://img.example/1.jpg" },
    { title: "Men Olive Green Casual Shirt", link: "https://www.ajio.com/p/7000002_olive", price: "₹749", imageUrl: "https://img.example/2.jpg" },
    { title: "Men Olive Shirt Regular Fit", link: "https://www.myntra.com/shirts/a/c/7000003/buy", price: "₹1,299", imageUrl: "https://img.example/3.jpg" }
  ] } }));

  let r = await post("/api/analyze", fakeJpeg(300, 400));
  assert.strictEqual(r.status, 200);
  const a = await r.json();
  assert.strictEqual(sentImage.mime_type, "image/jpeg");
  assert.strictEqual(a.items.length, 2);
  assert.strictEqual(a.items[1].needsConfirm, true);

  r = await post("/api/search", { analysisId: a.id, index: 0 });
  assert.strictEqual(r.status, 200);
  const { id } = await r.json();

  r = await fetch(base + "/api/search/" + id);
  const s = await r.json();
  assert.strictEqual(s.exact.length, 0, "a screenshot alone never proves Exact");
  assert.strictEqual(s.similar.length, 3);
  assert.ok(s.similar.every((p) => p.url === undefined), "store URLs stay on the server");
  assert.deepStrictEqual(s.similar.map((p) => p.price).sort((x, y) => x - y), [749, 899, 1299]);

  // The photo itself is stored nowhere.
  const saved = JSON.stringify(await store.find("searches", {}));
  assert.ok(!saved.includes(sentImage.data.slice(0, 40)), "no image bytes in the database");

  // Result page gets a real preview title for WhatsApp.
  const page = await (await fetch(base + "/find/" + id)).text();
  assert.match(page, /<title>Olive shirt: 3 options — Fit Deal<\/title>/);

  // /go goes to the saved product with our affiliate wrapper, and counts it.
  const key = s.similar[0].key;
  r = await fetch(base + "/go/" + id + "/" + key + "?from=results", { redirect: "manual" });
  assert.strictEqual(r.status, 302);
  assert.match(r.headers.get("location"), /^https:\/\/linksredirect\.com\/\?cid=1&subid=/);
  const clicks = await store.find("clicks", { search_id: id });
  assert.strictEqual(clicks.length, 1);
  assert.strictEqual(clicks[0].affiliated, true);

  // The user corrects the words → a new search with their words.
  r = await post("/api/search", { refine: id, query: "men olive linen shirt" });
  const refined = await (await fetch(base + "/api/search/" + (await r.json()).id)).json();
  assert.strictEqual(refined.query, "men olive linen shirt");
  assert.strictEqual(refined.item.edited, true);

  // Wrong-match report is stored.
  r = await post("/api/report", { searchId: id, key, reason: "not_same", note: "different collar" });
  assert.strictEqual(r.status, 200);
  assert.strictEqual((await store.find("reports", { search_id: id }))[0].reason, "not_same");

  // Vote: create, vote once, second vote refused, counts are real.
  r = await post("/api/vote", { searchId: id, keys: s.similar.slice(0, 2).map((p) => p.key), name: "Riya<script>" });
  const vote = await r.json();
  const vpage = await (await fetch(base + "/vote/" + vote.id)).text();
  assert.match(vpage, /Riya script needs your vote/, "the name is cleaned");
  assert.doesNotMatch(vpage, /<script>alert/);
  const voterA = "a".repeat(32), voterB = "b".repeat(32);
  r = await post("/api/vote/" + vote.id + "/ballot", { option: "A" }, { "X-Voter": voterA });
  assert.strictEqual((await r.json()).total, 1);
  r = await post("/api/vote/" + vote.id + "/ballot", { option: "B" }, { "X-Voter": voterA });
  assert.strictEqual(r.status, 409);
  r = await post("/api/vote/" + vote.id + "/ballot", { option: "B" }, { "X-Voter": voterB });
  const v = await r.json();
  assert.deepStrictEqual(v.options.map((o) => o.votes), [1, 1]);
  assert.strictEqual(v.mine, "B");
  r = await post("/api/vote/" + vote.id + "/ballot", { option: "Z" }, { "X-Voter": "c".repeat(32) });
  assert.strictEqual(r.status, 400);

  config.gemini.key = "";
  config.providers.serper.key = "";
  config.affiliate.networkTemplate = "";
});

test("/go can't be used to send people to other sites", async () => {
  const rec = await store.insert("searches", { kind: "image", item: {}, query: "x", exact: [], similar: [{ key: "k1", store: "myntra", url: "https://evil.example/phish" }] });
  let r = await fetch(base + "/go/" + rec.id + "/k1", { redirect: "manual" });
  assert.strictEqual(r.headers.get("location"), "/404");
  r = await fetch(base + "/go/" + rec.id + "/store/evilstore", { redirect: "manual" });
  assert.strictEqual(r.headers.get("location"), "/404");
  r = await fetch(base + "/go/nope/k1?url=https://evil.example", { redirect: "manual" });
  assert.strictEqual(r.headers.get("location"), "/404");
});

test("contact form stores messages and drops bot posts", async () => {
  let r = await post("/api/contact", { name: "Asha", email: "asha@example.com", topic: "Delete my data", message: "Please delete my search." });
  assert.strictEqual(r.status, 200);
  r = await post("/api/contact", { name: "Bot", email: "b@example.com", message: "buy now", website: "http://spam" });
  assert.strictEqual(r.status, 200);
  r = await post("/api/contact", { name: "", email: "nope", message: "" });
  assert.strictEqual(r.status, 400);
  const msgs = await store.find("messages", {});
  assert.strictEqual(msgs.length, 1);
  assert.strictEqual(msgs[0].topic, "Delete my data");
});

test("analytics accepts only known events and keeps no IP", async () => {
  await post("/api/event", { name: "page_view", path: "/", props: { ref: "instagram.com" } });
  await post("/api/event", { name: "evil_event", props: {} });
  const ev = await store.find("events", { name: "page_view" });
  assert.ok(ev.length >= 1);
  assert.ok(!JSON.stringify(ev).includes("127.0.0.1"));
  assert.strictEqual((await store.find("events", { name: "evil_event" })).length, 0);
});

test("admin is hidden without a password and locked with one", async () => {
  let r = await fetch(base + "/admin");
  assert.strictEqual(r.status, 404);
  config.adminPassword = "correct horse";
  r = await fetch(base + "/admin");
  assert.strictEqual(r.status, 401);
  r = await fetch(base + "/admin", { headers: { Authorization: "Basic " + Buffer.from("x:wrong").toString("base64") } });
  assert.strictEqual(r.status, 401);
  r = await fetch(base + "/admin", { headers: { Authorization: "Basic " + Buffer.from("x:correct horse").toString("base64") } });
  assert.strictEqual(r.status, 200);
  assert.match(await r.text(), /Funnel/);
  config.adminPassword = "";
});

test("retention deletes old rows only", async () => {
  const retention = require("../lib/retention");
  const old = await store.insert("events", { name: "old", created_at: "2020-01-01T00:00:00.000Z" });
  const fresh = await store.insert("events", { name: "fresh" });
  await retention.run();
  assert.strictEqual(await store.get("events", old.id), null);
  assert.ok(await store.get("events", fresh.id));
});

test("rate limits stop floods", async () => {
  const http = require("../lib/http");
  http._buckets.clear();
  let last;
  for (let i = 0; i < 7; i++) last = await post("/api/contact", { name: "A", email: "a@example.com", message: "hello there" });
  assert.strictEqual(last.status, 429);
  http._buckets.clear();
});

test("text search works without an image and refinement replaces stale garment filters", async () => {
  resetFetch();
  const previous = config.providers.serper.key;
  config.providers.serper.key = "test-only";
  fakeFetch(/google\.serper\.dev/, () => ({ json: { shopping: [
    { title: "Women Black Oversized Shirt", link: "https://www.myntra.com/8000001", price: "₹900" },
    { title: "Women Red Floral Dress", link: "https://www.myntra.com/8000002", price: "₹1200" }
  ] } }));
  try {
    let r = await post("/api/search", { query: "women black oversized shirt" });
    assert.strictEqual(r.status, 200);
    const first = await r.json();
    let data = await (await fetch(base + "/api/search/" + first.id)).json();
    assert.strictEqual(data.kind, "text");
    assert.strictEqual(data.item.category, "shirt");
    assert.strictEqual(data.exact.length, 0);
    assert.strictEqual(data.similar.length, 1);
    assert.match(data.similar[0].title, /Shirt/);
    r = await post("/api/search", { refine: first.id, query: "women red floral dress" });
    assert.strictEqual(r.status, 200);
    const second = await r.json();
    data = await (await fetch(base + "/api/search/" + second.id)).json();
    assert.strictEqual(data.item.category, "dress");
    assert.deepStrictEqual(data.item.colors, ["red"]);
    assert.strictEqual(data.similar.length, 1);
    assert.match(data.similar[0].title, /Dress/);
    const page = await (await fetch(base + "/find/" + second.id)).text();
    assert.match(page, /id="findReady"/);
    for (const query of ["", " ", "a", "<>", 123, {}]) {
      const bad = await post("/api/search", { query });
      assert.strictEqual(bad.status, 400, "invalid query: " + JSON.stringify(query));
    }
  } finally { config.providers.serper.key = previous; resetFetch(); }
});

test("Home and Find expose honest shopping controls; Try-On cannot simulate a result", async () => {
  const home = await (await fetch(base + "/")).text();
  assert.match(home, /id="homeDeals"/);
  assert.doesNotMatch(home, /Ends in|70%|40%|data-wish-id|Trusted by thousands/);
  const start = await (await fetch(base + "/find/")).text();
  assert.match(start, /What are you looking for/);
  assert.match(start, /id="queryInput"/);
  assert.match(start, /id="photo"/);
  assert.match(start, /id="linkInput"/);
  assert.doesNotMatch(start, /id="findMissing"/);
  const tryon = await (await fetch(base + "/try-on/")).text();
  assert.match(tryon, /not available yet/);
  assert.doesNotMatch(tryon, /tryon\.js|type="file"|id="tryGo"/);
});
