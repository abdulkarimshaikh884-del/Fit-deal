// All settings come from environment variables. Secrets never live in the
// repo or in browser code. For local work, put them in a .env file (it is
// git-ignored); .env.example lists every variable.
const fs = require("fs");
const path = require("path");

function loadDotEnv(file) {
  if (!fs.existsSync(file)) return;
  for (const line of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (!m || process.env[m[1]] !== undefined) continue;
    const quoted = m[2].match(/^(['"])(.*)\1$/);
    // Unquoted values may carry a trailing "# comment".
    process.env[m[1]] = quoted ? quoted[2] : m[2].replace(/\s+#.*$/, "").trim();
  }
}
loadDotEnv(path.join(__dirname, "..", ".env"));

const env = process.env;
const list = (v) => (v || "").split(",").map((s) => s.trim()).filter(Boolean);

module.exports = {
  env: env.NODE_ENV === "production" ? "production" : env.APP_ENV || "development",
  port: Number(env.PORT) || 5173,
  // The public address of this deployment, used for canonical links, share
  // links and the Origin check on API calls.
  siteUrl: (env.SITE_URL || "http://localhost:" + (Number(env.PORT) || 5173)).replace(/\/+$/, ""),
  // Extra origins allowed to call the API (e.g. the Render preview address).
  extraOrigins: list(env.EXTRA_ORIGINS),
  // Keep search engines out of previews and staging.
  noindex: env.NOINDEX !== "false",
  trustProxy: env.TRUST_PROXY !== "false",
  sampleCatalog: env.ENABLE_SAMPLE_CATALOG === "true",

  gemini: {
    key: env.GEMINI_API_KEY || "",
    model: env.GEMINI_MODEL || "gemini-3.5-flash-lite",
    timeoutMs: Number(env.GEMINI_TIMEOUT_MS) || 25000
  },

  supabase: {
    url: (env.SUPABASE_URL || "").replace(/\/+$/, ""),
    key: env.SUPABASE_SERVICE_KEY || ""
  },

  providers: {
    flipkart: { id: env.FLIPKART_AFFILIATE_ID || "", token: env.FLIPKART_AFFILIATE_TOKEN || "" },
    // Amazon Creators API (replaced PA-API 5 in 2026). Amazon gives access
    // only after 10 qualifying sales in 30 days.
    amazon: {
      clientId: env.AMAZON_CREATORS_CLIENT_ID || "",
      clientSecret: env.AMAZON_CREATORS_CLIENT_SECRET || "",
      partnerTag: env.AMAZON_PARTNER_TAG || ""
    },
    serper: { key: env.SERPER_API_KEY || "" }
  },

  affiliate: {
    amazonTag: env.AMAZON_PARTNER_TAG || "",
    flipkartId: env.FLIPKART_AFFILIATE_ID || "",
    // Cuelinks (or a similar network) deep-link template for stores without
    // their own programme, e.g. https://linksredirect.com/?cid=12345&source=linkkit&subid={subid}&url={url}
    networkTemplate: env.AFFILIATE_NETWORK_TEMPLATE || ""
  },

  adminPassword: env.ADMIN_PASSWORD || "",
  // Salt for the daily visitor hash in analytics. Change it to rotate.
  analyticsSalt: env.ANALYTICS_SALT || "fitdeal-dev-salt",
  errorWebhook: env.ERROR_WEBHOOK_URL || "",
  dataDir: env.DATA_DIR || path.join(__dirname, "..", "data")
};
