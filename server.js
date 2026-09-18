// Fit Deal web server: the pages in public/, the API, and the /go store
// redirect. No framework and no dependencies, so there is nothing to patch.
//   npm start            production (Render runs this)
//   npm run dev          same server, reads files fresh on every request
const http = require("http");
const fs = require("fs");
const path = require("path");
const zlib = require("zlib");
const crypto = require("crypto");
const config = require("./lib/config");
const log = require("./lib/log");
const api = require("./lib/api");
const admin = require("./lib/admin");
const { escapeHtml } = require("./lib/http");

const ROOT = path.join(__dirname, "public");
const DEV = config.env !== "production";
const TYPES = {
  ".html": "text/html; charset=utf-8", ".css": "text/css; charset=utf-8", ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8", ".webmanifest": "application/manifest+json; charset=utf-8",
  ".txt": "text/plain; charset=utf-8", ".xml": "application/xml; charset=utf-8",
  ".svg": "image/svg+xml", ".webp": "image/webp", ".avif": "image/avif", ".png": "image/png", ".jpg": "image/jpeg",
  ".ico": "image/x-icon", ".woff2": "font/woff2"
};
const COMPRESSIBLE = /^(text\/|application\/(json|manifest|xml)|image\/svg)/;

// ── Security headers on every response ─────────────────────────────────────
const CSP = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com",
  // Product photos come from the stores' own image servers.
  "img-src 'self' data: blob: https:",
  "connect-src 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "object-src 'none'",
  "manifest-src 'self'"
].join("; ");

function securityHeaders(req, res) {
  res.setHeader("Content-Security-Policy", CSP + (isHttps(req) ? "; upgrade-insecure-requests" : ""));
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=(), payment=(), usb=()");
  res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
  if (isHttps(req)) res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  if (config.noindex) res.setHeader("X-Robots-Tag", "noindex, nofollow");
}

function isHttps(req) {
  return req.headers["x-forwarded-proto"] === "https" || !!req.socket.encrypted;
}

// ── Static files (kept in memory, pre-compressed) ──────────────────────────
const fileCache = new Map();
function loadFile(file) {
  if (!DEV && fileCache.has(file)) return fileCache.get(file);
  let data;
  try {
    const st = fs.statSync(file);
    if (!st.isFile()) return null;
    data = fs.readFileSync(file);
  } catch (e) {
    return null;
  }
  const type = TYPES[path.extname(file).toLowerCase()] || "application/octet-stream";
  const entry = { data, type, etag: '"' + crypto.createHash("sha1").update(data).digest("base64").slice(0, 16) + '"' };
  if (COMPRESSIBLE.test(type) && data.length > 600) {
    entry.br = zlib.brotliCompressSync(data, { params: { [zlib.constants.BROTLI_PARAM_QUALITY]: DEV ? 4 : 11 } });
    entry.gzip = zlib.gzipSync(data, { level: 9 });
  }
  if (!DEV) fileCache.set(file, entry);
  return entry;
}

function cacheControl(urlPath, query, type) {
  if (type.startsWith("text/html")) return "no-cache";
  // CSS/JS links carry ?v=<version>, so they can be cached for a year.
  if (/[?&]v=/.test(query)) return "public, max-age=31536000, immutable";
  if (urlPath.startsWith("/img/") || urlPath.startsWith("/fonts/")) return "public, max-age=604800";
  return "public, max-age=3600";
}

function sendEntry(req, res, entry, status, urlPath, query, bodyOverride) {
  const data = bodyOverride || entry.data;
  const headers = { "Content-Type": entry.type, "Cache-Control": DEV ? "no-store" : cacheControl(urlPath, query, entry.type), Vary: "Accept-Encoding" };
  if (!bodyOverride) headers.ETag = entry.etag;
  if (!bodyOverride && status === 200 && req.headers["if-none-match"] === entry.etag) {
    res.writeHead(304, headers);
    return res.end();
  }
  const accept = String(req.headers["accept-encoding"] || "");
  let body = data;
  if (!bodyOverride && entry.br && /\bbr\b/.test(accept)) { body = entry.br; headers["Content-Encoding"] = "br"; }
  else if (!bodyOverride && entry.gzip && /\bgzip\b/.test(accept)) { body = entry.gzip; headers["Content-Encoding"] = "gzip"; }
  headers["Content-Length"] = body.length;
  res.writeHead(status, headers);
  res.end(req.method === "HEAD" ? undefined : body);
}

function sendPage(req, res, name, status) {
  const entry = loadFile(path.join(ROOT, name));
  if (!entry) {
    res.writeHead(status, { "Content-Type": "text/plain; charset=utf-8" });
    return res.end(status === 404 ? "Not found" : "Something went wrong");
  }
  sendEntry(req, res, entry, status, "/" + name, "");
}

// Result and vote pages share one HTML file each. The server fills in the
// title and preview image, so a link shared on WhatsApp shows a real preview.
async function sendDynamic(req, res, file, meta) {
  const entry = loadFile(path.join(ROOT, file));
  if (!entry) return sendPage(req, res, "404.html", 404);
  let html = entry.data.toString("utf8");
  if (meta) {
    const t = escapeHtml(meta.title);
    const d = escapeHtml(meta.desc);
    html = html
      .replace(/<title>[^<]*<\/title>/, `<title>${t}</title>`)
      .replace(/(<meta property="og:title" content=")[^"]*"/, `$1${t}"`)
      .replace(/(<meta name="twitter:title" content=")[^"]*"/, `$1${t}"`)
      .replace(/(<meta name="description" content=")[^"]*"/, `$1${d}"`)
      .replace(/(<meta property="og:description" content=")[^"]*"/, `$1${d}"`)
      .replace(/(<meta property="og:url" content=")[^"]*"/, `$1${escapeHtml(config.siteUrl + meta.path)}"`);
    if (meta.image) {
      html = html
        .replace(/(<meta property="og:image" content=")[^"]*"/, `$1${escapeHtml(meta.image)}"`)
        .replace(/(<meta name="twitter:image" content=")[^"]*"/, `$1${escapeHtml(meta.image)}"`);
    }
  }
  sendEntry(req, res, entry, 200, "/" + file, "", Buffer.from(html, "utf8"));
}

async function dynamicMeta(kind, id) {
  const store = require("./lib/store");
  try {
    if (kind === "find") {
      const s = await store.get("searches", id);
      if (!s) return null;
      const n = (s.exact || []).length + (s.similar || []).length;
      const first = (s.exact || [])[0] || (s.similar || [])[0];
      return {
        title: `${s.item && s.item.label ? s.item.label : "Outfit"}: ${n} options — Fit Deal`,
        desc: `See where to buy this for less across Amazon, Flipkart, Myntra and AJIO.`,
        image: first && first.image, path: "/find/" + id
      };
    }
    if (kind === "vote") {
      const v = await store.get("votes", id);
      if (!v) return null;
      return {
        title: `${v.asker ? v.asker + " needs" : "Help pick"} your vote: which one should they buy?`,
        desc: `Tap to vote on ${v.options.length} options. Takes 5 seconds.`,
        image: v.options[0] && v.options[0].image, path: "/vote/" + id
      };
    }
  } catch (e) {
    log.error("meta lookup failed", e, { kind });
  }
  return null;
}

// ── Router ─────────────────────────────────────────────────────────────────
async function route(req, res) {
  const url = new URL(req.url, "http://localhost");
  let pathname;
  try { pathname = decodeURIComponent(url.pathname); } catch (e) { return sendPage(req, res, "404.html", 404); }
  const query = url.search;

  // One address per page: https, and no "www.".
  if (!DEV) {
    const host = String(req.headers.host || "");
    const site = new URL(config.siteUrl);
    if (req.headers["x-forwarded-proto"] === "http" || host === "www." + site.host) {
      res.writeHead(301, { Location: config.siteUrl + url.pathname + url.search });
      return res.end();
    }
  }

  securityHeaders(req, res);

  if (await api.handle(req, res, pathname)) return;
  if (pathname === "/admin" || pathname.startsWith("/admin/")) return admin.handle(req, res, pathname, url);

  if (req.method !== "GET" && req.method !== "HEAD") {
    res.writeHead(405, { Allow: "GET, HEAD" });
    return res.end();
  }

  if (pathname === "/robots.txt" && config.noindex) {
    res.writeHead(200, { "Content-Type": "text/plain; charset=utf-8" });
    return res.end("User-agent: *\nDisallow: /\n");
  }

  const m = pathname.match(/^\/(find|vote)\/([A-Za-z0-9_-]{4,40})\/?$/);
  if (m) return sendDynamic(req, res, m[1] + "/index.html", await dynamicMeta(m[1], m[2]));

  const file = path.normalize(path.join(ROOT, pathname));
  if (!file.startsWith(ROOT)) return sendPage(req, res, "404.html", 404);
  // Hidden files are never served.
  if (pathname.includes("/.")) return sendPage(req, res, "404.html", 404);
  // One clean address per page: /about.html and /about/index.html → /about/
  if (pathname.endsWith(".html")) {
    res.writeHead(301, { Location: pathname.replace(/(index)?\.html$/, "").replace(/([^/])$/, "$1/") + query });
    return res.end();
  }

  let entry = loadFile(file);
  if (!entry) {
    const index = loadFile(path.join(file, "index.html"));
    if (index) {
      if (!pathname.endsWith("/")) {
        res.writeHead(301, { Location: pathname + "/" + query });
        return res.end();
      }
      entry = index;
    }
  }
  if (!entry) return sendPage(req, res, "404.html", 404);
  sendEntry(req, res, entry, 200, pathname, query);
}

const server = http.createServer((req, res) => {
  const started = Date.now();
  res.on("finish", () => {
    if (res.statusCode >= 500 || req.url.startsWith("/api/") || req.url.startsWith("/go/")) {
      log.info("req", { m: req.method, p: req.url.split("?")[0].slice(0, 80), s: res.statusCode, ms: Date.now() - started });
    }
  });
  route(req, res).catch((e) => {
    log.error("unhandled request error", e, { path: req.url.split("?")[0] });
    if (!res.headersSent) sendPage(req, res, "500.html", 500);
    else res.end();
  });
});
server.requestTimeout = 60000;
server.headersTimeout = 20000;

process.on("unhandledRejection", (e) => log.error("unhandledRejection", e));
process.on("uncaughtException", (e) => log.error("uncaughtException", e));
process.on("SIGTERM", () => {
  log.info("shutting down");
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(0), 8000).unref();
});

if (require.main === module) {
  require("./lib/retention").schedule();
  server.listen(config.port, () => {
    log.info("Fit Deal started", {
      url: `http://localhost:${config.port}`, env: config.env, store: require("./lib/store").kind,
      recognition: !!config.gemini.key, sources: require("./lib/search").activeProviders().map((p) => p.name)
    });
  });
}

module.exports = server;
