const { fakeFetch, resetFetch } = require("./helpers");
const test = require("node:test");
const assert = require("node:assert");
const { parseProductLink, identify, resolveShort, affiliateUrl } = require("../lib/stores");

test("reads product links from each supported store", async () => {
  const cases = [
    ["https://www.amazon.in/Allen-Solly-Regular-Shirt-AMSHOSRFY59264_Blue/dp/B0ABCDEF12/ref=sr_1_3?keywords=x", "amazon", "B0ABCDEF12", "https://www.amazon.in/dp/B0ABCDEF12"],
    ["https://m.amazon.in/gp/product/b0abcdef12?th=1", "amazon", "B0ABCDEF12", "https://www.amazon.in/dp/B0ABCDEF12"],
    ["https://www.flipkart.com/roadster-men-checkered-casual-shirt/p/itm123abc456?pid=SHTFY7XZQ9ABCDEF&lid=x", "flipkart", "SHTFY7XZQ9ABCDEF", "https://www.flipkart.com/roadster-men-checkered-casual-shirt/p/itm123abc456?pid=SHTFY7XZQ9ABCDEF"],
    ["https://dl.flipkart.com/dl/roadster-shirt/p/itmabc?pid=SHTFY7XZQ9ABCDEF", "flipkart", "SHTFY7XZQ9ABCDEF", "https://www.flipkart.com/roadster-shirt/p/itmabc?pid=SHTFY7XZQ9ABCDEF"],
    ["https://www.myntra.com/shirts/roadster/roadster-men-navy-checked-casual-shirt/1376577/buy", "myntra", "1376577", "https://www.myntra.com/1376577"],
    ["https://www.ajio.com/dnmx-checked-slim-fit-shirt/p/441126578_navy", "ajio", "441126578_navy", "https://www.ajio.com/p/441126578_navy"]
  ];
  for (const [url, store, pid, canonical] of cases) {
    const r = await parseProductLink(url);
    assert.strictEqual(r.store, store, url);
    assert.strictEqual(r.productId, pid, url);
    assert.strictEqual(r.url, canonical, url);
  }
});

test("takes the words from a store link as a title hint", async () => {
  const r = await parseProductLink("https://www.myntra.com/shirts/roadster/roadster-men-navy-checked-casual-shirt/1376577/buy");
  assert.strictEqual(r.titleHint, "roadster men navy checked casual shirt");
  assert.strictEqual(r.brandHint, "roadster");
});

test("finds the link inside pasted share text", async () => {
  const r = await parseProductLink("Check out this dress on AJIO! https://www.ajio.com/some-dress/p/700452351002 via app");
  assert.strictEqual(r.productId, "700452351002");
});

test("rejects unsupported, unsafe and non-product links", async () => {
  const bad = [
    ["https://www.zara.com/in/en/p1.html", "unsupported"],
    ["http://169.254.169.254/latest/meta-data/", "unsupported"],
    ["http://localhost:5173/admin", "unsupported"],
    ["https://user:pass@www.amazon.in/dp/B0ABCDEF12", "unsupported"],
    ["https://www.amazon.in:8443/dp/B0ABCDEF12", "unsupported"],
    ["https://amazon.in.evil.com/dp/B0ABCDEF12", "unsupported"],
    ["javascript:alert(1)", "invalid"],
    ["not a link at all", "invalid"],
    ["https://www.myntra.com/dresses", "not_product"],
    ["https://www.flipkart.com/search?q=shirt", "not_product"]
  ];
  for (const [url, code] of bad) {
    await assert.rejects(parseProductLink(url), (e) => e.code === code, url);
  }
});

test("short links are followed only while they stay on store hosts", async () => {
  resetFetch();
  fakeFetch(/amzn\.to\/abc/, () => ({ status: 301, headers: { location: "https://www.amazon.in/dp/B0ABCDEF12?tag=someone-21" } }));
  fakeFetch(/amzn\.to\/evil/, () => ({ status: 302, headers: { location: "http://10.0.0.5/internal" } }));
  fakeFetch(/fkrt\.it\/loop/, () => ({ status: 302, headers: { location: "https://fkrt.it/loop" } }));
  const ok = await parseProductLink("https://amzn.to/abc");
  assert.strictEqual(ok.url, "https://www.amazon.in/dp/B0ABCDEF12");
  await assert.rejects(resolveShort("https://amzn.to/evil"), (e) => e.code === "unsupported");
  await assert.rejects(resolveShort("https://fkrt.it/loop"), (e) => e.code === "unresolved");
});

test("affiliate IDs are only added to store addresses", () => {
  const config = require("../lib/config");
  config.affiliate.amazonTag = "fitdeal-21";
  config.affiliate.flipkartId = "fitdealaff";
  config.affiliate.networkTemplate = "https://linksredirect.com/?cid=1&subid={subid}&url={url}";
  assert.strictEqual(affiliateUrl("amazon", "https://www.amazon.in/dp/B0ABCDEF12?tag=other-21", "s1"), "https://www.amazon.in/dp/B0ABCDEF12?tag=fitdeal-21");
  assert.match(affiliateUrl("flipkart", "https://www.flipkart.com/x/p/itm1?pid=SHTFY7XZQ9ABCDEF", "s1"), /affid=fitdealaff&affExtParam1=s1/);
  assert.strictEqual(affiliateUrl("myntra", "https://www.myntra.com/1376577", "s1"), "https://linksredirect.com/?cid=1&subid=s1&url=https%3A%2F%2Fwww.myntra.com%2F1376577");
  assert.strictEqual(affiliateUrl("amazon", "https://evil.example/dp/x", "s1"), "https://evil.example/dp/x");
  config.affiliate.amazonTag = config.affiliate.flipkartId = config.affiliate.networkTemplate = "";
});

test("identify ignores look-alike hosts", () => {
  assert.strictEqual(identify("https://myntra.com.evil.io/1234567"), null);
  assert.strictEqual(identify("https://notmyntra.com/1234567"), null);
  assert.ok(identify("https://www.myntra.com/1234567"));
});
