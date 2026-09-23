require("./helpers");
const test = require("node:test");
const assert = require("node:assert");
const auth = require("../lib/auth");
const curatedDeals = require("../lib/curated-deals");

test("authentication: signup, duplicate check, and login verification", async () => {
  const email = "shopper@example.com";
  const pass = "secret123";
  const name = "Priya Sharma";

  // 1. Sign up
  const signupRes = await auth.signUp(email, pass, name);
  assert.ok(signupRes.user);
  assert.strictEqual(signupRes.user.email, email);
  assert.strictEqual(signupRes.user.fullName, name);
  assert.ok(signupRes.token);

  // 2. Duplicate signup should be rejected
  await assert.rejects(
    async () => {
      await auth.signUp(email, pass, name);
    },
    (err) => err.code === "user_exists" && err.status === 409
  );

  // 3. Login with wrong password should fail
  await assert.rejects(
    async () => {
      await auth.signIn(email, "wrongpassword");
    },
    (err) => err.code === "invalid_credentials" && err.status === 401
  );

  // 4. Login with correct password should succeed
  const loginRes = await auth.signIn(email, pass);
  assert.ok(loginRes.user);
  assert.strictEqual(loginRes.user.email, email);
  assert.ok(loginRes.token);

  // 5. Verify user from request header
  const req = { headers: { authorization: `Bearer ${loginRes.token}` } };
  const authedUser = await auth.getUserFromRequest(req);
  assert.ok(authedUser);
  assert.strictEqual(authedUser.email, email);
});

test("cloud user progress sync: saved items, searches, and size preferences", async () => {
  const email = "fashionlover@example.com";
  const signupRes = await auth.signUp(email, "pass456", "Rahul Verma");
  const userId = signupRes.user.id;

  const itemToSave = {
    key: "prod-libas-123",
    title: "Libas Printed Anarkali Kurta",
    store: "flipkart",
    storeName: "Flipkart",
    price: 899,
    mrp: 2499,
    image: "https://example.com/img.jpg"
  };

  // Sync saved item and search
  const syncResult = await auth.syncUserProgress(userId, {
    saves: [itemToSave],
    searches: [{ query: "cotton kurta", searchId: "s123" }],
    preferences: { chest: 38, waist: 32, fit: "regular" }
  });

  assert.strictEqual(syncResult.saves.length, 1);
  assert.strictEqual(syncResult.saves[0].title, itemToSave.title);
  assert.strictEqual(syncResult.searches.length, 1);
  assert.strictEqual(syncResult.searches[0].query, "cotton kurta");
  assert.strictEqual(syncResult.preferences.chest, 38);

  // Retrieve user progress
  const retrieved = await auth.getUserProgress(userId);
  assert.strictEqual(retrieved.saves.length, 1);
  assert.strictEqual(retrieved.searches.length, 1);
});

test("curated deals hub provides multi-store price comparisons", () => {
  const deals = curatedDeals.getAll();
  assert.ok(deals.length >= 8, "hub provides at least 8 curated deals");
  assert.ok(deals.every((d) => d.key && d.title && d.price && d.mrp && d.stores && d.stores.length >= 2), "every deal has multi-store price comparisons");
  assert.ok(deals.some((d) => d.store === "flipkart"), "includes Flipkart deals");
  assert.ok(deals.some((d) => d.store === "amazon"), "includes Amazon deals");
  assert.ok(deals.some((d) => d.store === "myntra"), "includes Myntra deals");
});
