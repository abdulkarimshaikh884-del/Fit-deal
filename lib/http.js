// Small helpers shared by the server's routes.
const crypto = require("crypto");
const config = require("./config");

function clientIp(req) {
  if (config.trustProxy) {
    const xf = req.headers["x-forwarded-for"];
    if (xf) return String(xf).split(",")[0].trim();
  }
  return req.socket.remoteAddress || "";
}

// Fixed-window counters per key (usually IP + route). In memory, which is
// right for one server; move to Redis/Supabase if we ever run several.
const buckets = new Map();
function rateLimit(key, limit, windowMs) {
  const now = Date.now();
  let b = buckets.get(key);
  if (!b || now > b.reset) {
    b = { count: 0, reset: now + windowMs };
    buckets.set(key, b);
  }
  b.count++;
  if (buckets.size > 50000) {
    for (const [k, v] of buckets) if (now > v.reset) buckets.delete(k);
  }
  return { ok: b.count <= limit, retryAfter: Math.ceil((b.reset - now) / 1000) };
}

function readBody(req, maxBytes) {
  return new Promise((resolve, reject) => {
    const declared = Number(req.headers["content-length"] || 0);
    if (declared > maxBytes) return reject(Object.assign(new Error("Too large"), { code: "too_large", status: 413 }));
    const chunks = [];
    let size = 0;
    req.on("data", (c) => {
      size += c.length;
      if (size > maxBytes) {
        reject(Object.assign(new Error("Too large"), { code: "too_large", status: 413 }));
        req.destroy();
        return;
      }
      chunks.push(c);
    });
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
  });
}

async function readJson(req, maxBytes = 16 * 1024) {
  const buf = await readBody(req, maxBytes);
  try {
    const v = JSON.parse(buf.toString("utf8") || "{}");
    if (!v || typeof v !== "object" || Array.isArray(v)) throw new Error("not an object");
    return v;
  } catch (e) {
    throw Object.assign(new Error("Bad JSON"), { code: "bad_request", status: 400 });
  }
}

function sendJson(res, status, obj, extraHeaders) {
  const body = JSON.stringify(obj);
  res.writeHead(status, { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store", ...extraHeaders });
  res.end(body);
}

// API calls that change something must come from our own pages. Browsers
// always send Origin on cross-site POSTs, so a missing or foreign Origin on a
// POST is refused. This, plus no CORS headers, keeps other sites out.
function sameOrigin(req) {
  const origin = req.headers.origin;
  if (!origin) return req.method === "GET";
  const host = req.headers["x-forwarded-host"] || req.headers.host;
  const proto = req.headers["x-forwarded-proto"] || (req.socket.encrypted ? "https" : "http");
  const allowed = new Set([config.siteUrl, `${proto}://${host}`, ...config.extraOrigins]);
  return allowed.has(origin);
}

// A visitor ID for analytics that can't be traced back to a person: a hash
// of IP + browser + today's date + a secret salt. It changes every day and we
// never store the IP itself.
// With { network: true } the browser is left out, so it identifies the
// network (a home's wifi) for the day rather than the device.
function dailyVisitor(req, opts = {}) {
  const day = new Date().toISOString().slice(0, 10);
  const agent = opts.network ? "" : req.headers["user-agent"] || "";
  return crypto.createHash("sha256")
    .update(config.analyticsSalt + "|" + day + "|" + clientIp(req) + "|" + agent)
    .digest("hex").slice(0, 16);
}

function escapeHtml(s) {
  return String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

module.exports = { clientIp, rateLimit, readBody, readJson, sendJson, sameOrigin, dailyVisitor, escapeHtml, _buckets: buckets };
