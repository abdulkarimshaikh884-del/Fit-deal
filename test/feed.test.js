require("./helpers");
const test = require("node:test");
const assert = require("node:assert");
const store = require("../lib/store");
const api = require("../lib/api");

const now = new Date().toISOString();
const old = new Date(Date.now() - 5 * 86400000).toISOString();
function p(key, extra) {
  return { key, store: "myntra", storeName: "Myntra", title: "Women Pink Dress " + key, brand: "", image: "https://img.example/" + key + ".jpg", price: 500, mrp: 1000, inStock: true, provider: "serper", checkedAt: now, match: "similar", ...extra };
}

test("deals feed shows only real, fresh, in-stock products with a real discount", async () => {
  await store.insert("searches", {
    kind: "image", item: { category: "dress", audience: "women" }, query: "women pink dress",
    exact: [],
    similar: [
      p("real1"),
      p("demo", { provider: "sample" }),
      p("linkonly", { provider: "link", price: null }),
      p("stale", { checkedAt: old }),
      p("oos", { inStock: false }),
      p("noimg", { image: "" }),
      p("small", { price: 950 }), // 5% off: a pick, not a deal
      p("amz", { provider: "amazon", store: "amazon", storeName: "Amazon", price: 300 })
    ]
  });
  api._resetFeed();
  const feed = await api.buildFeed();
  const dealKeys = feed.deals.map((x) => x.key);
  assert.deepStrictEqual(dealKeys, ["amz", "real1"], "biggest real discount first; demo, stale, out-of-stock, no-image and no-price items never appear");
  assert.strictEqual(feed.deals[0].off, 70);
  assert.ok(feed.deals.every((x) => x.checkedAt && x.searchId), "every deal says when it was checked and links to its search");
  assert.deepStrictEqual(feed.picks.map((x) => x.key), ["small"]);
  assert.strictEqual(feed.deals[0].audience, "women");
});
