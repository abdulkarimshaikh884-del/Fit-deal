require("./helpers");
const test = require("node:test");
const assert = require("node:assert");
const recognize = require("../lib/recognize");
const image = require("../lib/image");
const { fakeJpeg } = require("./helpers");

test("model output is cleaned and brands need visible proof", () => {
  const out = recognize.normalize({
    image_issue: "none",
    items: [
      { label: "Navy <b>checked</b> shirt", category: "shirt", audience: "men", colors: ["Navy", "White"], pattern: "checked", brand: "Zara", brand_evidence: "none", confidence: 0.9, box: [10, 20, 500, 600], search_query: "men navy checked shirt" },
      { label: "Blue jeans", category: "jeans", audience: "men", colors: ["blue"], pattern: "solid", brand: "Levi's", brand_evidence: "logo", confidence: 0.85, box: [500, 20, 1000, 600], search_query: "men blue straight jeans" },
      { label: "Top", category: "top", audience: "women", colors: ["red"], pattern: "solid", brand: "H&M", brand_evidence: "text", confidence: 0.4, box: [1, 2, 3, 4], search_query: "red top" },
      { label: "Blazer", category: "coat", other_category: "blazer", audience: "women", colors: ["beige"], pattern: "solid", brand: "", brand_evidence: "none", confidence: 0.8, box: [900, 900, 100, 100], search_query: "" }
    ]
  });
  assert.strictEqual(out.items.length, 4);
  assert.strictEqual(out.items[0].label, "Navy b checked /b shirt");
  assert.strictEqual(out.items[0].brand, "", "no brand without visible evidence");
  assert.strictEqual(out.items[1].brand, "Levi's", "brand kept with a visible logo");
  assert.strictEqual(out.items[2].brand, "", "no brand when the model is unsure");
  assert.strictEqual(out.items[2].needsConfirm, true);
  assert.strictEqual(out.items[3].category, "other");
  assert.strictEqual(out.items[3].otherCategory, "blazer");
  assert.strictEqual(out.items[3].box, null, "impossible box dropped");
  assert.ok(out.items[3].query.includes("blazer"), "query built when the model gave none");
});

test("no items means no clothing", () => {
  assert.strictEqual(recognize.normalize({ image_issue: "none", items: [] }).imageIssue, "no_clothing");
  assert.strictEqual(recognize.normalize(null).imageIssue, "no_clothing");
});

test("product-link titles give category, colour and audience", () => {
  const it = recognize.itemFromTitle("Allen Solly Women Navy Blue Regular Fit T Shirt AMSHOSRFY59264", "Allen Solly");
  assert.strictEqual(it.category, "t_shirt");
  assert.strictEqual(it.audience, "women");
  assert.ok(it.colors.includes("navy"));
  assert.ok(!/AMSHOSRFY59264/i.test(it.query), "style codes are not search words");
  assert.ok(/embroidered/.test(recognize.itemFromTitle("women embroidered kurti").query), "long plain words stay");
  assert.strictEqual(recognize.itemFromTitle("women embroidered kurti").category, "kurti");
});

test("uploads are checked by their bytes", () => {
  assert.strictEqual(image.check(fakeJpeg(), { maxBytes: 1e6 }).type, "image/jpeg");
  assert.deepStrictEqual(image.dimensions(fakeJpeg(640, 480), "image/jpeg"), { w: 640, h: 480 });
  assert.throws(() => image.check(Buffer.from("<html><script>alert(1)</script></html>"), { maxBytes: 1e6 }), (e) => e.code === "bad_type");
  assert.throws(() => image.check(fakeJpeg(40, 40), { maxBytes: 1e6 }), (e) => e.code === "too_small");
  assert.throws(() => image.check(fakeJpeg(), { maxBytes: 10 }), (e) => e.code === "too_large");
  assert.throws(() => image.check(Buffer.alloc(0), { maxBytes: 10 }), (e) => e.code === "empty");
});
