// Test setup shared by every test file: an empty data folder, no real API
// keys (so tests never spend money or call the internet), and a fake fetch
// for the outside services.
const fs = require("fs");
const os = require("os");
const path = require("path");

process.env.DATA_DIR = fs.mkdtempSync(path.join(os.tmpdir(), "fitdeal-test-"));
process.env.NODE_ENV = "test";
process.env.SITE_URL = "http://localhost";
for (const k of ["GEMINI_API_KEY", "SUPABASE_URL", "SUPABASE_SERVICE_KEY", "FLIPKART_AFFILIATE_ID", "FLIPKART_AFFILIATE_TOKEN",
  "AMAZON_CREATORS_CLIENT_ID", "AMAZON_CREATORS_CLIENT_SECRET", "AMAZON_PARTNER_TAG", "SERPER_API_KEY",
  "AFFILIATE_NETWORK_TEMPLATE", "ADMIN_PASSWORD", "ERROR_WEBHOOK_URL"]) {
  process.env[k] = "";
}

const realFetch = global.fetch;
const routes = [];
// fakeFetch(/host/, (url, init) => ({ status, json | text | headers }))
function fakeFetch(match, handler) {
  routes.push({ match, handler });
}
function resetFetch() {
  routes.length = 0;
}
global.fetch = async (url, init = {}) => {
  const u = String(url);
  // Calls to our own test server go through for real.
  if (/^http:\/\/127\.0\.0\.1:/.test(u)) return realFetch(url, init);
  const r = routes.find((x) => x.match.test(u));
  if (!r) throw new Error("Unexpected outside call in test: " + u);
  const out = await r.handler(u, init);
  const body = out.json !== undefined ? JSON.stringify(out.json) : out.text || "";
  return new Response(body, { status: out.status || 200, headers: out.headers || {} });
};

// A tiny valid JPEG header (100x100) followed by filler, enough for our
// byte checks.
function fakeJpeg(w = 100, h = 100) {
  const sof = Buffer.from([0xff, 0xc0, 0x00, 0x11, 0x08, h >> 8, h & 255, w >> 8, w & 255, 0x03, 1, 0x22, 0, 2, 0x11, 1, 3, 0x11, 1]);
  return Buffer.concat([Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10]), Buffer.alloc(14), sof, Buffer.alloc(200), Buffer.from([0xff, 0xd9])]);
}

module.exports = { fakeFetch, resetFetch, fakeJpeg, dataDir: process.env.DATA_DIR };
