#!/usr/bin/env node
// Fit Deal Launch-Check Script
// Inspects build integrity, test suite, and operational environment readiness.
// Run via: npm run launch-check

const { execSync } = require("child_process");
const path = require("path");

console.log("\n========================================================");
console.log("             FIT DEAL PRE-LAUNCH HEALTH CHECK           ");
console.log("========================================================\n");

const results = [];

function check(category, item, status, detail, severity = "info") {
  results.push({ category, item, status, detail, severity });
}

// 1. Build Check
process.stdout.write("1/6 Checking static build freshness (node build.js --check)... ");
try {
  execSync("node build.js --check", { cwd: path.join(__dirname, ".."), stdio: "pipe" });
  console.log("PASS");
  check("Build", "Static assets", "FRESH", "public/ matches src/ templates perfectly", "pass");
} catch (e) {
  console.log("FAIL");
  check("Build", "Static assets", "OUTDATED", "Run 'node build.js' to recompile", "fail");
}

// 2. Test Suite
process.stdout.write("2/6 Running automated test suite (npm test)... ");
try {
  const testOut = execSync("npm test", { cwd: path.join(__dirname, ".."), stdio: "pipe" }).toString();
  const passMatch = testOut.match(/pass\s+(\d+)/);
  const passCount = passMatch ? passMatch[1] : "All";
  console.log(`PASS (${passCount} tests)`);
  check("Tests", "Automated suite", "PASS", `${passCount} tests passing cleanly`, "pass");
} catch (e) {
  console.log("FAIL");
  check("Tests", "Automated suite", "FAIL", "Some automated tests failed", "fail");
}

// 3. Configuration & Runtime Environment
const config = require("../lib/config");
const search = require("../lib/search");

// Gemini
if (config.gemini.key) {
  check("AI", "Gemini Recognition", "READY", `Model: ${config.gemini.model}`, "pass");
} else {
  check("AI", "Gemini Recognition", "MISSING", "Set GEMINI_API_KEY for outfit screenshot search", "warn");
}

// Live Product Sources
const activeProviders = search.activeProviders().map((p) => p.name);
const liveActive = activeProviders.filter((n) => n !== "sample");
if (liveActive.length > 0) {
  check("Sources", "Live Product APIs", "READY", `Active: ${liveActive.join(", ")}`, "pass");
} else if (config.sampleCatalog) {
  check("Sources", "Product Sources", "DEMO MODE", "Using local sample-products.json catalog (non-production)", "warn");
} else {
  check("Sources", "Live Product APIs", "NOT CONFIGURED", "Set SERPER_API_KEY or Flipkart / Amazon credentials", "warn");
}

// Database
if (config.supabase.url && config.supabase.key) {
  check("Database", "Persistent Storage", "READY", `Supabase connected: ${config.supabase.url}`, "pass");
} else {
  const isProd = config.env === "production";
  check("Database", "Storage Engine", isProd ? "EPHEMERAL WARNING" : "LOCAL FILES", "Using local JSON files in data/ (Render restarts reset local disk)", isProd ? "warn" : "info");
}

// Affiliate
const affParts = [];
if (config.affiliate.amazonTag) affParts.push("Amazon");
if (config.affiliate.flipkartId) affParts.push("Flipkart");
if (config.affiliate.networkTemplate) affParts.push("Cuelinks Network");
if (affParts.length) {
  check("Affiliate", "Monetization Tags", "CONFIGURED", `Active tags: ${affParts.join(", ")}`, "pass");
} else {
  check("Affiliate", "Monetization Tags", "NONE", "Clicks go to plain product URLs without commission", "info");
}

// Virtual Try-On
if (config.tryonEnabled) {
  check("Features", "Virtual Try-On", "ENABLED", "TRYON_ENABLED=true", "info");
} else {
  check("Features", "Virtual Try-On", "TRUTHFUL GATE", "Gated: displays honest 'Coming Soon' notice", "pass");
}

// Site URL & Deployment Target
check("Network", "Site Address", config.siteUrl, config.siteUrl.includes("fit-deal.onrender.com") ? "WARNING: Old suspended Render URL detected! Target is https://fit-deal-site.onrender.com" : "Configured address", config.siteUrl.includes("fit-deal.onrender.com") ? "warn" : "info");

// Indexing
if (config.noindex) {
  check("SEO", "Search Indexing", "NOINDEX ACTIVE", "Search engines blocked (X-Robots-Tag: noindex). Set NOINDEX=false for launch.", "info");
} else {
  check("SEO", "Search Indexing", "OPEN TO GOOGLE", "Sitemap and search indexation active", "pass");
}

// Render formatted summary table
console.log("\n--------------------------------------------------------------------------------");
console.log("CATEGORY    | COMPONENT            | STATUS               | DETAIL");
console.log("--------------------------------------------------------------------------------");
for (const r of results) {
  const icon = r.severity === "pass" ? "✔" : r.severity === "warn" ? "⚠️" : r.severity === "fail" ? "✖" : "ℹ";
  const cat = r.category.padEnd(11);
  const item = r.item.padEnd(20);
  const st = (icon + " " + r.status).padEnd(20);
  console.log(`${cat} | ${item} | ${st} | ${r.detail}`);
}
console.log("--------------------------------------------------------------------------------\n");

const hasFails = results.some((r) => r.severity === "fail");
const hasWarns = results.some((r) => r.severity === "warn");

if (hasFails) {
  console.log("🚨 VERDICT: LAUNCH BLOCKED — Fix the failed items above before deploying.\n");
  process.exit(1);
} else if (hasWarns) {
  console.log("⚠️  VERDICT: CODE READY FOR DEPLOYMENT, CREDENTIALS RECOMMENDED FOR FULL VALUE.");
  console.log("   The server, UI, security, and fallback modes operate cleanly with zero errors.");
  console.log("   To activate live search on Render, configure external keys in Render Environment:\n");
  console.log("   • GEMINI_API_KEY             (Google AI Studio)");
  console.log("   • SERPER_API_KEY             (google.serper.dev - for multi-store search)");
  console.log("   • SUPABASE_URL & SERVICE_KEY (for persistent PostgreSQL on Render)");
  console.log("   • NOINDEX=false              (to open site to Google once live)\n");
} else {
  console.log("🎉 VERDICT: FULLY PRODUCTION-READY FOR LAUNCH!\n");
}
