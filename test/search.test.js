const { fakeFetch, resetFetch } = require("./helpers");
const test = require("node:test");
const assert = require("node:assert");
const normalize = require("../lib/search/normalize");
const { classify } = require("../lib/search/match");
const providers = require("../lib/search/providers");
const search = require("../lib/search");
const config = require("../lib/config");

const item = { category: "shirt", colors: ["navy"], pattern: "checked", audience: "men", brand: "" };
function prod(p) {
  return normalize.product({ provider: "serper", title: "Men Navy Checked Casual Shirt", ...p });
}

test("products need a supported store and a title", () => {
  assert.strictEqual(prod({ url: "https://evil.example/x" }), null);
  assert.strictEqual(prod({ url: "https://www.myntra.com/1376577", title: "" }), null);
  const p = prod({ url: "https://www.myntra.com/shirts/x/y/1376577/buy", price: "₹1,299.00", mrp: 999, image: "http://insecure/img.jpg" });
  assert.strictEqual(p.store, "myntra");
  assert.strictEqual(p.url, "https://www.myntra.com/1376577");
  assert.strictEqual(p.price, 1299);
  assert.strictEqual(p.mrp, null, "an MRP below the price is dropped");
  assert.strictEqual(p.image, "", "only https images");
  assert.strictEqual(p.colorFamily, "blue");
});

test("Exact needs proof; look-alikes stay Similar", () => {
  const anchor = prod({ url: "https://www.amazon.in/dp/B0ABCDEF12", brand: "Roadster", styleCode: "RS-1001", gtin: "8901234567890" });
  const list = [
    anchor,
    prod({ url: "https://www.flipkart.com/x/p/itm1?pid=SHTAAAAAAAAAAAAA", brand: "Roadster", gtin: "8901234567890", price: 900 }),
    prod({ url: "https://www.myntra.com/1111111", brand: "Roadster", styleCode: "rs-1001", price: 950 }),
    // Same brand, same name, same colour, but no code: NOT exact.
    prod({ url: "https://www.ajio.com/p/222222_navy", brand: "Roadster", price: 500 }),
    prod({ url: "https://www.myntra.com/3333333", brand: "HRX", styleCode: "RS-1001", price: 400 }),
    prod({ url: "https://www.myntra.com/4444444", title: "Women Pink Leggings", price: 199 })
  ];
  const r = classify(list, { item, query: "men navy checked shirt", anchor });
  const exactKeys = r.exact.map((p) => p.store);
  assert.deepStrictEqual(r.exact.map((p) => p.reason).sort(), ["Same barcode (EAN)", "Same brand and style code", "The product from your link"].sort());
  assert.ok(!exactKeys.includes("ajio"), "name + brand + colour is not proof");
  assert.ok(r.similar.some((p) => p.store === "ajio"));
  assert.ok(r.similar.some((p) => p.brand === "HRX"), "same code, different brand is not exact");
  assert.ok(!r.similar.some((p) => /Leggings/.test(p.title)), "different garment dropped");
  assert.strictEqual(r.exact[0].price, 900, "cheapest exact first");
  assert.strictEqual(r.bestExact, r.exact[0].key);
});

test("screenshot searches never claim Exact", () => {
  const list = [prod({ url: "https://www.myntra.com/1376577", brand: "Roadster", price: 800 })];
  const r = classify(list, { item: { ...item, brand: "Roadster" }, query: "roadster navy checked shirt", anchor: null });
  assert.strictEqual(r.exact.length, 0);
  assert.strictEqual(r.similar.length, 1);
});

test("ranking ignores commission: adding one changes nothing", () => {
  const list = [
    prod({ url: "https://www.myntra.com/1000001", price: 1200 }),
    prod({ url: "https://www.myntra.com/1000002", price: 800 }),
    prod({ url: "https://www.ajio.com/p/1000003_x", price: 1000, title: "Men Navy Checked Casual Shirt Slim" })
  ];
  const a = classify(list, { item, query: "men navy checked shirt" }).similar.map((p) => p.key);
  const withCommission = list.map((p, i) => ({ ...p, commission: [50, 1, 99][i], commissionRate: [0.2, 0.01, 0.5][i] }));
  const b = classify(withCommission, { item, query: "men navy checked shirt" }).similar.map((p) => p.key);
  assert.deepStrictEqual(a, b);
  // Within the same closeness group, cheaper comes first.
  const same = classify(list.slice(0, 2), { item, query: "men navy checked shirt" }).similar;
  assert.ok(same[0].price <= same[1].price);
});

test("duplicates from two sources collapse into one", () => {
  const a = prod({ url: "https://www.myntra.com/1376577", price: null, provider: "serper" });
  const b = prod({ url: "https://www.myntra.com/shirts/r/s/1376577/buy", price: 799, provider: "serper" });
  const d = normalize.dedupe([a, b]);
  assert.strictEqual(d.length, 1);
  assert.strictEqual(d[0].price, 799);
});

test("Flipkart, Amazon and Serper answers map to one shape", async () => {
  resetFetch();
  config.providers.flipkart.id = "fk"; config.providers.flipkart.token = "tok";
  config.providers.amazon.clientId = "cid"; config.providers.amazon.clientSecret = "sec"; config.providers.amazon.partnerTag = "fitdeal-21";
  config.providers.serper.key = "sk";
  fakeFetch(/affiliate-api\.flipkart\.net\/affiliate\/1\.0\/search/, (url, init) => {
    assert.strictEqual(init.headers["Fk-Affiliate-Id"], "fk");
    return { json: { products: [{ productBaseInfoV1: {
      productId: "SHTAAAAAAAAAAAAA", title: "Roadster Men Navy Checked Shirt", productBrand: "Roadster",
      productUrl: "https://dl.flipkart.com/dl/roadster-shirt/p/itmabc?pid=SHTAAAAAAAAAAAAA&affid=fk",
      imageUrls: { "400x400": "https://rukminim1.flixcart.com/a.jpg" },
      flipkartSpecialPrice: { amount: 649, currency: "INR" }, maximumRetailPrice: { amount: 1499, currency: "INR" },
      inStock: true, attributes: { color: "Navy", size: "S,M,L" }
    }, productShippingInfoV1: { shippingCharges: { amount: 0, currency: "INR" } } }] } };
  });
  fakeFetch(/api\.amazon\.co\.uk\/auth\/o2\/token/, () => ({ json: { access_token: "t1", expires_in: 3600 } }));
  fakeFetch(/creatorsapi\.amazon\/catalog\/v1\/searchItems/, (url, init) => {
    assert.strictEqual(init.headers.Authorization, "Bearer t1");
    assert.strictEqual(init.headers["x-marketplace"], "www.amazon.in");
    const body = JSON.parse(init.body);
    assert.strictEqual(body.partnerTag, "fitdeal-21");
    return { json: { searchResult: { items: [{
      asin: "B0ABCDEF12", detailPageURL: "https://www.amazon.in/dp/B0ABCDEF12?tag=fitdeal-21",
      images: { primary: { large: { url: "https://m.media-amazon.com/a.jpg" } } },
      itemInfo: { title: { displayValue: "Men Navy Checked Shirt" }, byLineInfo: { brand: { displayValue: "Allen Solly" } }, externalIds: { eans: { displayValues: ["8901234567890"] } } },
      offersV2: { listings: [{ price: { money: { amount: 899, currency: "INR" }, savingBasis: { money: { amount: 1799 } } }, availability: { type: "IN_STOCK" } }] }
    }] } } };
  });
  fakeFetch(/google\.serper\.dev\/shopping/, () => ({ json: { shopping: [
    { title: "Men Navy Checked Shirt", source: "Myntra", link: "https://www.myntra.com/shirts/x/y/5555555/buy", price: "₹1,099.00", delivery: "Free delivery", imageUrl: "https://encrypted-tbn0.gstatic.com/x" },
    { title: "Men Navy Checked Shirt", source: "Some Shop", link: "https://someshop.in/p/1", price: "₹499.00" },
    { title: "Men Navy Checked Shirt", source: "AJIO", link: "https://www.google.com/url?url=https://www.ajio.com/p/666666_navy", price: "₹999", delivery: "₹49 delivery" }
  ] } }));

  const r = await search.run({ item, query: "men navy checked shirt", anchor: null });
  const byStore = {};
  r.similar.forEach((p) => { byStore[p.store] = p; });
  assert.strictEqual(byStore.flipkart.price, 649);
  assert.strictEqual(byStore.flipkart.mrp, 1499);
  assert.strictEqual(byStore.flipkart.shipping, 0);
  assert.strictEqual(byStore.flipkart.url, "https://www.flipkart.com/roadster-shirt/p/itmabc?pid=SHTAAAAAAAAAAAAA", "their affid is stripped");
  assert.strictEqual(byStore.amazon.price, 899);
  assert.strictEqual(byStore.amazon.gtin, "8901234567890");
  assert.strictEqual(byStore.amazon.inStock, true);
  assert.strictEqual(byStore.myntra.price, 1099);
  assert.strictEqual(byStore.ajio.shipping, 49);
  assert.ok(!r.similar.some((p) => /someshop/.test(p.url)), "unsupported stores are dropped");
  assert.strictEqual(r.sources.length, 3);
  assert.ok(r.sources.every((s) => s.ok));

  // A failing source is reported, not fatal.
  resetFetch();
  search._cache.clear();
  fakeFetch(/flipkart/, () => ({ status: 500, text: "boom" }));
  fakeFetch(/amazon/, () => ({ status: 401, text: "no" }));
  fakeFetch(/serper/, () => ({ json: { shopping: [] } }));
  const r2 = await search.run({ item, query: "men navy checked shirt 2", anchor: null });
  assert.deepStrictEqual(r2.sources.map((s) => s.ok), [false, false, true]);

  config.providers.flipkart.id = config.providers.flipkart.token = "";
  config.providers.amazon.clientId = config.providers.amazon.clientSecret = config.providers.amazon.partnerTag = "";
  config.providers.serper.key = "";
});
