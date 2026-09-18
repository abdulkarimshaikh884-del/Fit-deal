// /admin: the owner's dashboard. Locked with ADMIN_PASSWORD (HTTP Basic,
// any user name). Without that setting the page does not exist at all.
const crypto = require("crypto");
const config = require("./config");
const store = require("./store");
const log = require("./log");
const search = require("./search");
const { STORES, STORE_KEYS } = require("./stores");
const { readBody, sameOrigin, escapeHtml: h, rateLimit, clientIp } = require("./http");

const STATUSES = ["pending", "approved", "paid", "cancelled"];

function authorised(req) {
  if (!config.adminPassword) return false;
  const m = String(req.headers.authorization || "").match(/^Basic (.+)$/);
  if (!m) return false;
  const pass = Buffer.from(m[1], "base64").toString("utf8").split(":").slice(1).join(":");
  const a = crypto.createHash("sha256").update(pass).digest();
  const b = crypto.createHash("sha256").update(config.adminPassword).digest();
  return crypto.timingSafeEqual(a, b);
}

function page(title, body) {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow"><title>${h(title)} — Fit Deal admin</title>
<link rel="stylesheet" href="/css/admin.css"></head><body>
<header><b>Fit Deal admin</b><nav><a href="/admin">Dashboard</a><a href="/admin/reports">Reports</a><a href="/admin/messages">Messages</a><a href="/admin/commissions">Commissions</a><a href="/admin/stores">Stores &amp; rules</a><a href="/admin/errors">Errors</a></nav></header>
<main>${body}</main></body></html>`;
}

function send(res, status, html) {
  res.writeHead(status, { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store", "X-Robots-Tag": "noindex" });
  res.end(html);
}

function pct(a, b) {
  return b ? Math.round((a / b) * 1000) / 10 + "%" : "–";
}

function since(days) {
  return new Date(Date.now() - days * 86400000).toISOString();
}

async function dashboard(days) {
  const from = since(days);
  const [events, clicks, commissions, reports] = await Promise.all([
    store.find("events", { created_at: { gte: from } }, { limit: 100000 }),
    store.find("clicks", { created_at: { gte: from } }, { limit: 100000 }),
    store.find("commissions", {}, { limit: 5000 }),
    store.find("reports", { created_at: { gte: from } }, { limit: 5000 })
  ]);
  const count = (name) => events.filter((e) => e.name === name).length;
  const visitors = new Set(events.map((e) => e.created_at.slice(0, 10) + e.visitor)).size;
  const starters = new Set(events.filter((e) => ["upload_start", "link_submit", "sample_click"].includes(e.name)).map((e) => e.created_at.slice(0, 10) + e.visitor)).size;
  const resultViewers = new Set(events.filter((e) => e.name === "results_view").map((e) => e.created_at.slice(0, 10) + e.visitor)).size;
  const clickers = new Set(clicks.map((c) => c.created_at.slice(0, 10) + c.visitor)).size;
  const searches = events.filter((e) => e.name === "search_done");
  const empty = searches.filter((e) => e.props && e.props.empty).length;
  const withExact = searches.filter((e) => e.props && e.props.exact > 0).length;
  const analysesOk = count("analysis_ok");
  const analysesFail = count("analysis_fail");

  const tally = (list, fn) => {
    const m = new Map();
    for (const x of list) { const k = fn(x); if (k) m.set(k, (m.get(k) || 0) + 1); }
    return [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10);
  };
  const cats = tally(searches, (e) => e.props && e.props.category);
  const stores = tally(clicks, (c) => (STORES[c.store] ? STORES[c.store].name : c.store));
  const failReasons = tally(events.filter((e) => e.name === "analysis_fail" || e.name === "link_fail"), (e) => e.name + ": " + ((e.props && e.props.reason) || "?"));

  const inPeriod = commissions.filter((c) => c.order_date >= from.slice(0, 10));
  const sum = (st) => inPeriod.filter((c) => c.status === st).reduce((a, c) => a + (Number(c.amount) || 0), 0);
  const earned = sum("approved") + sum("paid"); // cancelled and pending never count as revenue

  const costPerAnalysis = Number(process.env.COST_PER_ANALYSIS_INR) || 0;
  const costPerSearch = Number(process.env.COST_PER_SEARCH_INR) || 0;
  const apiCost = analysesOk * costPerAnalysis + searches.length * costPerSearch;

  const rows = (pairs) => pairs.length ? pairs.map(([k, v]) => `<tr><td>${h(k)}</td><td>${v}</td></tr>`).join("") : `<tr><td colspan="2" class="muted">No data yet</td></tr>`;
  const stat = (label, value, note) => `<div class="stat"><span>${h(label)}</span><b>${value}</b>${note ? `<small>${h(note)}</small>` : ""}</div>`;

  return `
<div class="period">Last <a href="/admin?days=1"${days === 1 ? ' class="on"' : ""}>1 day</a> <a href="/admin?days=7"${days === 7 ? ' class="on"' : ""}>7 days</a> <a href="/admin?days=30"${days === 30 ? ' class="on"' : ""}>30 days</a></div>
<h2>Funnel</h2>
<div class="stats">
  ${stat("Visitors", visitors, "unique per day")}
  ${stat("Started a search", starters, pct(starters, visitors) + " of visitors")}
  ${stat("Saw results", resultViewers, pct(resultViewers, starters) + " of starters")}
  ${stat("Clicked to a store", clickers, pct(clickers, resultViewers) + " of result viewers")}
  ${stat("Earned (approved + paid)", "₹" + earned.toFixed(0), "₹" + (visitors ? (earned / visitors).toFixed(2) : "0") + " per visitor")}
</div>
<h2>Search quality</h2>
<div class="stats">
  ${stat("Photos read OK", analysesOk, pct(analysesOk, analysesOk + analysesFail) + " success")}
  ${stat("Searches", searches.length, "")}
  ${stat("No results", empty, pct(empty, searches.length) + " of searches")}
  ${stat("Had an exact match", withExact, pct(withExact, searches.length))}
  ${stat("Wrong-match reports", reports.length, pct(reports.length, searches.length) + " of searches")}
</div>
<h2>Activity</h2>
<div class="stats">
  ${stat("Page views", count("page_view"))}
  ${stat("Store clicks", clicks.length, clicks.filter((c) => c.affiliated).length + " with affiliate ID")}
  ${stat("Saves", count("save"))}
  ${stat("Shares", count("share"))}
  ${stat("Votes created", count("vote_create"), count("vote_cast") + " votes cast")}
  ${stat("Est. API cost", "₹" + apiCost.toFixed(0), costPerAnalysis || costPerSearch ? "₹" + (visitors ? (apiCost / visitors).toFixed(2) : "0") + " per visitor" : "set COST_PER_* in env")}
</div>
<div class="cols">
  <section><h3>Top categories searched</h3><table>${rows(cats)}</table></section>
  <section><h3>Store clicks</h3><table>${rows(stores)}</table></section>
  <section><h3>Failed searches</h3><table>${rows(failReasons)}</table></section>
</div>`;
}

async function reportsPage() {
  const list = await store.find("reports", {}, { limit: 200 });
  return `<h2>Wrong-match and result reports</h2><table class="wide"><tr><th>When</th><th>Reason</th><th>Match type</th><th>Store</th><th>Search</th><th>Note</th></tr>
${list.map((r) => `<tr><td>${h(r.created_at.slice(0, 16).replace("T", " "))}</td><td>${h(r.reason)}</td><td>${h(r.match || "")}</td><td>${h(r.store || "")}</td><td><a href="/find/${h(r.search_id)}" target="_blank">${h(r.query || r.search_id)}</a></td><td>${h(r.note || "")}</td></tr>`).join("") || `<tr><td colspan="6" class="muted">No reports yet</td></tr>`}</table>`;
}

async function messagesPage() {
  const list = await store.find("messages", {}, { limit: 200 });
  return `<h2>Contact messages</h2>${list.map((m) => `<article class="msg"><p><b>${h(m.name)}</b> &lt;<a href="mailto:${h(m.email)}">${h(m.email)}</a>&gt; · ${h(m.topic)} · ${h(m.created_at.slice(0, 16).replace("T", " "))}</p><pre>${h(m.message)}</pre></article>`).join("") || `<p class="muted">No messages yet.</p>`}`;
}

async function commissionsPage() {
  const list = await store.find("commissions", {}, { limit: 1000 });
  const total = (st) => list.filter((c) => c.status === st).reduce((a, c) => a + (Number(c.amount) || 0), 0);
  return `<h2>Commissions</h2>
<p class="muted">Copy these from each network's report (Amazon Associates, Flipkart, Cuelinks). Only <b>approved</b> and <b>paid</b> count as revenue. Cancelled and returned orders never do.</p>
<div class="stats">${STATUSES.map((s) => `<div class="stat"><span>${s}</span><b>₹${total(s).toFixed(0)}</b></div>`).join("")}</div>
<form method="post" action="/admin/commissions" class="form">
  <label>Network <select name="network"><option>Amazon Associates</option><option>Flipkart Affiliate</option><option>Cuelinks</option><option>Other</option></select></label>
  <label>Order date <input type="date" name="order_date" required></label>
  <label>Store <select name="store">${STORE_KEYS.map((k) => `<option value="${k}">${STORES[k].name}</option>`).join("")}</select></label>
  <label>Amount ₹ <input type="number" name="amount" step="0.01" min="0" required></label>
  <label>Status <select name="status">${STATUSES.map((s) => `<option>${s}</option>`).join("")}</select></label>
  <label>Sub-ID / order ref <input name="ref" maxlength="80"></label>
  <button type="submit">Add</button>
</form>
<table class="wide"><tr><th>Order date</th><th>Network</th><th>Store</th><th>Amount</th><th>Status</th><th>Ref</th><th></th></tr>
${list.map((c) => `<tr><td>${h(c.order_date)}</td><td>${h(c.network)}</td><td>${h(c.store)}</td><td>₹${h(c.amount)}</td><td>${h(c.status)}</td><td>${h(c.ref || "")}</td>
<td><form method="post" action="/admin/commissions" class="inline"><input type="hidden" name="id" value="${h(c.id)}"><select name="status">${STATUSES.map((s) => `<option${s === c.status ? " selected" : ""}>${s}</option>`).join("")}</select><button type="submit">Update</button></form></td></tr>`).join("") || `<tr><td colspan="7" class="muted">Nothing recorded yet</td></tr>`}</table>`;
}

function storesPage() {
  const active = search.activeProviders().map((p) => p.name);
  return `<h2>Stores and rules</h2>
<table class="wide"><tr><th>Store</th><th>Product links accepted from</th><th>Affiliate</th></tr>
${STORE_KEYS.map((k) => {
    const s = STORES[k];
    const aff = k === "amazon" ? !!config.affiliate.amazonTag : k === "flipkart" ? !!config.affiliate.flipkartId : !!config.affiliate.networkTemplate;
    return `<tr><td>${s.name}</td><td>${h(s.hosts.concat(s.shortHosts).join(", "))}</td><td>${aff ? "ID set" : '<span class="warn">not set</span>'}</td></tr>`;
  }).join("")}</table>
<h3>Switched on</h3>
<ul><li>Photo recognition (Gemini ${h(config.gemini.model)}): ${config.gemini.key ? "on" : '<span class="warn">off: set GEMINI_API_KEY</span>'}</li>
<li>Product sources: ${active.length ? h(active.join(", ")) : '<span class="warn">none: set Flipkart / Amazon / Serper keys</span>'}</li>
<li>Database: ${h(store.kind)}${store.kind === "file" ? ' <span class="warn">(local files: set SUPABASE_URL and SUPABASE_SERVICE_KEY in production)</span>' : ""}</li></ul>
<h3>Rules (in code: lib/search/match.js)</h3>
<ul>
<li><b>Exact</b> only with proof: the product from the pasted link, the same barcode (EAN), or the same brand and style code.</li>
<li>Everything else is <b>Similar</b>. No match percentages are shown.</li>
<li>Order: closest group first, then lowest price. Affiliate commission is never an input.</li>
<li>Results that are clearly a different garment (e.g. leggings for a kurti search) are dropped.</li>
</ul>
<p class="muted">Changing a store or a rule is a code change, so it is reviewed and tested before it goes live.</p>`;
}

function errorsPage() {
  const list = log.recentErrors();
  return `<h2>Recent server errors</h2><p class="muted">Since the last restart. Full logs are in the Render dashboard.</p>
${list.map((e) => `<article class="msg"><p><b>${h(e.msg)}</b> · ${h(e.t)}</p><pre>${h(e.err || "")}\n${h(e.stack || "")}</pre></article>`).join("") || `<p class="muted">No errors.</p>`}`;
}

async function handle(req, res, pathname, url) {
  if (!config.adminPassword) {
    res.writeHead(404, { "Content-Type": "text/plain" });
    return res.end("Not found");
  }
  if (!rateLimit("admin:" + clientIp(req), 120, 600000).ok) {
    res.writeHead(429);
    return res.end();
  }
  if (!authorised(req)) {
    res.writeHead(401, { "WWW-Authenticate": 'Basic realm="Fit Deal admin", charset="UTF-8"', "Content-Type": "text/plain" });
    return res.end("Login required");
  }
  try {
    if (req.method === "POST" && pathname === "/admin/commissions") {
      if (!sameOrigin(req)) { res.writeHead(403); return res.end(); }
      const form = new URLSearchParams((await readBody(req, 8192)).toString("utf8"));
      const status = STATUSES.includes(form.get("status")) ? form.get("status") : "pending";
      if (form.get("id")) {
        await store.update("commissions", form.get("id"), { status });
      } else {
        await store.insert("commissions", {
          network: String(form.get("network") || "").slice(0, 40),
          order_date: /^\d{4}-\d{2}-\d{2}$/.test(form.get("order_date")) ? form.get("order_date") : new Date().toISOString().slice(0, 10),
          store: STORES[form.get("store")] ? form.get("store") : "other",
          amount: Math.max(0, Number(form.get("amount")) || 0),
          status,
          ref: String(form.get("ref") || "").slice(0, 80)
        });
      }
      res.writeHead(303, { Location: "/admin/commissions" });
      return res.end();
    }
    if (req.method !== "GET") { res.writeHead(405); return res.end(); }
    const days = [1, 7, 30].includes(Number(url.searchParams.get("days"))) ? Number(url.searchParams.get("days")) : 7;
    const pages = {
      "/admin": ["Dashboard", () => dashboard(days)],
      "/admin/reports": ["Reports", reportsPage],
      "/admin/messages": ["Messages", messagesPage],
      "/admin/commissions": ["Commissions", commissionsPage],
      "/admin/stores": ["Stores", storesPage],
      "/admin/errors": ["Errors", errorsPage]
    };
    const p = pages[pathname.replace(/\/$/, "")];
    if (!p) return send(res, 404, page("Not found", "<p>Not found.</p>"));
    send(res, 200, page(p[0], await p[1]()));
  } catch (e) {
    log.error("admin error", e);
    send(res, 500, page("Error", `<p>Something went wrong: ${h(e.message)}</p>`));
  }
}

module.exports = { handle, authorised };
