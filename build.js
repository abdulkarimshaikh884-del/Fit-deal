// Builds every page in public/ from one layout, so the header, tab bar and
// footer are written once. Also writes sitemap.xml, robots.txt and the web
// app manifest.
//   node build.js           build
//   node build.js --check   fail if public/ is out of date (used by tests)
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const shopping = require("./src/home-shopping");

const ROOT = __dirname;
const OUT = path.join(ROOT, "public");
const SITE = "https://fitdeal.shop";
const CHECK = process.argv.includes("--check");
const SPRITE = fs.readFileSync(path.join(ROOT, "src", "sprite.svg"), "utf8").trim();

// Asset version from the CSS and JS contents, so browsers refetch exactly
// when something changed.
const V = crypto.createHash("sha1")
  .update(["css/site.css", "css/home.css"].concat(fs.readdirSync(path.join(OUT, "js")).filter((f) => f.endsWith(".js")).sort().map((f) => "js/" + f))
    .map((f) => fs.readFileSync(path.join(OUT, f))).join("|"))
  .digest("hex").slice(0, 10);

const POSITIONING = "See an outfit you love? Fit Deal finds it — and finds it for less.";

// Navigation from the owner's mobile mockup (18 Sep 2026): phone tab bar
// Home · Find · Saved · Deals · Profile; desktop links to match.
const NAV = [
  { key: "home", href: "/", label: "Home" },
  { key: "find", href: "/find/", label: "Find" },
  { key: "deals", href: "/deals/", label: "Deals" },
  { key: "saved", href: "/saved/", label: "Saved" },
  { key: "how", href: "/how-it-works/", label: "How it works" }
];
const TABS = [
  { key: "home", href: "/", label: "Home", icon: "i-home" },
  { key: "find", href: "/find/", label: "Find", icon: "i-search" },
  { key: "saved", href: "/saved/", label: "Saved", icon: "i-heart" },
  { key: "deals", href: "/deals/", label: "Deals", icon: "i-tag", dot: "dealsDot" },
  { key: "profile", href: "/profile/", label: "Profile", icon: "i-user" }
];

// index: listed in the sitemap and open to search engines (on the live site).
const PAGES = [
  { out: "index.html", src: "home", page: "home", nav: "home", tab: "home", head: "home", path: "/", index: true, script: "home",
    title: "Fit Deal — Find any outfit from a screenshot, for less",
    desc: "Upload a screenshot or paste a product link. Fit Deal finds the same or similar clothes on Amazon, Flipkart, Myntra and AJIO and shows the best price." },
  { out: "find/index.html", src: "find-start", page: "find-start", nav: "find", tab: "find", head: "brand", path: "/find/", script: "search-input",
    title: "Find your look — Fit Deal", desc: "Search fashion by description, screenshot or product link across Indian stores." },
  { out: "find/results.html", src: "find", page: "find", nav: "find", tab: "find", head: "back", heading: "Results", path: "/find/", script: "find",
    title: "Your matches — Fit Deal", desc: "Same and similar products for your look, and the best price to buy them." },
  { out: "product/index.html", src: "product", page: "product", head: "back", heading: "Product details", path: "/product/", script: "product",
    title: "Product details — Fit Deal", desc: "Compare prices and view verified product details across Amazon, Flipkart, Myntra and AJIO." },
  { out: "vote/index.html", src: "vote", page: "vote", head: "back", heading: "Help me choose", path: "/vote/", script: "vote",
    title: "Which one should I buy? — Fit Deal", desc: "Vote for the one you like most." },
  { out: "saved/index.html", src: "saved", page: "saved", nav: "saved", tab: "saved", head: "brand", path: "/saved/", script: "saved",
    title: "Saved — Fit Deal", desc: "Products you saved on Fit Deal, kept on this device." },
  { out: "deals/index.html", src: "deals", page: "deals", nav: "deals", tab: "deals", head: "brand", path: "/deals/", script: "deals", index: true,
    title: "Deals — real prices from recent Fit Deal searches", desc: "The biggest real discounts people found on Fit Deal in the last two days, across Amazon, Flipkart, Myntra and AJIO." },
  { out: "profile/index.html", src: "profile", page: "profile", nav: "profile", tab: "profile", head: "brand", path: "/profile/", script: "profile",
    title: "Your Fit Deal — Profile", desc: "Your saved items, searches, votes and size notes, kept on this device." },
  { out: "try-on/index.html", src: "try-on", page: "tryon", head: "back", heading: "Virtual Try-On", path: "/try-on/",
    title: "AI Virtual Try-On (Coming Soon) — Fit Deal", desc: "Genuine AI outfit fitting is coming soon to Fit Deal. Find and compare prices across Indian stores now." },
  { out: "how-it-works/index.html", src: "how-it-works", page: "info", nav: "how", head: "back", heading: "How it works", path: "/how-it-works/", index: true,
    title: "How Fit Deal works — screenshot to best price", desc: "Upload a screenshot, we find the same or similar clothes, compare prices across Indian stores, and you buy from the store directly." },
  { out: "faq/index.html", src: "faq", page: "info", head: "back", heading: "FAQ", path: "/faq/", index: true, faq: true,
    title: "FAQ — Fit Deal", desc: "Answers about exact and similar matches, stores, prices, your photos and how Fit Deal earns." },
  { out: "about/index.html", src: "about", page: "info", head: "back", heading: "About", path: "/about/", index: true,
    title: "About Fit Deal", desc: POSITIONING + " An independent Indian shopping helper that ranks the best deal first." },
  { out: "contact/index.html", src: "contact", page: "contact", head: "back", heading: "Contact", path: "/contact/", index: true, script: "contact",
    title: "Contact — Fit Deal", desc: "Questions, a wrong result, a store we should add, or a data request." },
  { out: "privacy/index.html", src: "privacy", page: "info", head: "back", heading: "Privacy", path: "/privacy/", index: true,
    title: "Privacy Policy — Fit Deal", desc: "How Fit Deal handles your photos and data: photos are processed once and never stored." },
  { out: "terms/index.html", src: "terms", page: "info", head: "back", heading: "Terms", path: "/terms/", index: true,
    title: "Terms of Use — Fit Deal", desc: "The terms for using Fit Deal." },
  { out: "affiliate-disclosure/index.html", src: "affiliate-disclosure", page: "info", head: "back", heading: "Affiliate disclosure", path: "/affiliate-disclosure/", index: true,
    title: "Affiliate Disclosure — Fit Deal", desc: "How Fit Deal earns from store links, and why it never changes the order of results." },
  { out: "404.html", src: "404", page: "notfound", head: "back", heading: "Page not found", path: "/404",
    title: "Page not found — Fit Deal", desc: "This page doesn't exist." },
  { out: "500.html", src: "500", page: "notfound", head: "back", heading: "Something went wrong", path: "/500",
    title: "Something went wrong — Fit Deal", desc: "Please try again in a moment." }
];

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const brand = `<a href="/" class="brand" aria-label="Fit Deal home">
      <span class="brand-name">Fit Deal</span><svg class="brand-spark" aria-hidden="true"><use href="#i-sparkle"/></svg>
    </a>`;

function desktopNav(p) {
  const links = NAV.map((n) => `      <a href="${n.href}"${n.key === p.nav ? ' aria-current="page"' : ""}>${n.label}</a>`).join("\n");
  const searchBox = `    <form class="shop-search-box header-search-box" data-search-form role="search" action="/find/">
      <span class="search-lens-ico" aria-hidden="true"><svg><use href="#i-search"/></svg></span>
      <input type="text" id="shopSearchInput" name="q" placeholder="Search fashion (e.g. kurti, floral dress, olive shirt) or paste store link..." aria-label="Search clothes or paste product link" autocomplete="off">
      <div class="search-actions">
        <button type="button" class="search-cam-btn" id="headerSnapBtn" title="Search by Photo or Screenshot" aria-label="Upload photo or screenshot">
          <svg aria-hidden="true"><use href="#i-camera-line"/></svg>
          <span class="cam-btn-text">Visual Search</span>
        </button>
        <button type="submit" class="search-go-btn" aria-label="Search">
          <span>Search</span>
          <svg aria-hidden="true"><use href="#i-arrow"/></svg>
        </button>
      </div>
    </form>`;
  const cta = `<a href="#upload" class="d-cta" id="headerUploadCta" aria-label="Upload photo or screenshot"><svg aria-hidden="true"><use href="#i-camera-line"/></svg><span>Upload Screenshot</span></a>`;
  return `<header class="d-nav">
  <div class="d-nav-in">
    ${brand}
${searchBox}
    <nav class="d-links" aria-label="Main">
${links}
    </nav>
    ${cta}
  </div>
</header>`;
}

function mobileHead(p) {
  const find = `<a href="/find/" class="m-icon" aria-label="Find a look"><svg aria-hidden="true"><use href="#i-search"/></svg></a>`;
  const heart = `<a href="/saved/" class="m-icon m-heart" aria-label="Saved items"><svg aria-hidden="true"><use href="#i-heart"/></svg><i class="dot" id="savedDot" hidden></i></a>`;
  const profile = `<a href="/profile/" class="m-icon" aria-label="Your profile"><svg aria-hidden="true"><use href="#i-user"/></svg></a>`;
  if (p.head === "back") {
    return `<header class="m-head m-back">
  <a href="/" class="m-back-btn" data-back aria-label="Back"><svg aria-hidden="true"><use href="#i-back"/></svg></a>
  <p class="m-title">${p.heading}</p>
  <div class="m-icons">
    ${find}
    ${heart}
  </div>
</header>`;
  }
  return `<header class="m-head${p.head === "brand" ? " m-brandonly" : ""}">
  <div class="m-brand">
    ${brand}
${p.head === "home" ? `    <p class="m-tag">Same look. Smarter prices.</p>` : ""}
  </div>
  <div class="m-icons">
    ${heart}
    ${profile}
  </div>
</header>`;
}

function tabs(p) {
  return `<nav class="tabs" aria-label="Main">
${TABS.map((t) => `  <a href="${t.href}" class="tab"${t.action ? ` data-action="${t.action}"` : ""}${t.key === p.tab ? ' aria-current="page"' : ""}><span class="tab-ico"><svg aria-hidden="true"><use href="#${t.icon}"/></svg>${t.dot ? `<i class="dot" id="${t.dot}" hidden></i>` : ""}</span><span>${t.label}</span></a>`).join("\n")}
</nav>`;
}

const footer = `<footer class="foot">
  <div class="foot-in">
    <div class="foot-brand">
      ${brand}
      <p>${esc(POSITIONING)}</p>
      <p class="foot-stores">Searching Amazon · Flipkart · Myntra · AJIO</p>
    </div>
    <nav class="foot-links" aria-label="Fit Deal">
      <a href="/how-it-works/">How it works</a>
      <a href="/faq/">FAQ</a>
      <a href="/about/">About</a>
      <a href="/contact/">Contact</a>
      <a href="/privacy/">Privacy</a>
      <a href="/terms/">Terms</a>
      <a href="/affiliate-disclosure/">Affiliate disclosure</a>
    </nav>
  </div>
  <p class="foot-note">We may earn a commission when you buy through affiliate links, at no extra cost to you. Commission never changes which products we rank first. Prices and availability can change; confirm them at the retailer. Store names and logos belong to their owners.</p>
  <p class="foot-copy">© 2026 Fit Deal</p>
</footer>`;

function jsonLd(p) {
  if (p.page === "home") {
    return [{
      "@context": "https://schema.org", "@type": "WebSite", name: "Fit Deal", url: SITE + "/",
      description: POSITIONING
    }, {
      "@context": "https://schema.org", "@type": "Organization", name: "Fit Deal", url: SITE + "/",
      logo: SITE + "/img/brand/icon-512.png", email: "support@fitdeal.shop"
    }];
  }
  if (p.faq) {
    // Built from the page's own questions, so the data always matches the page.
    const body = fs.readFileSync(path.join(ROOT, "src", "pages", p.src + ".html"), "utf8");
    const qa = [...body.matchAll(/<summary>([\s\S]*?)<svg[\s\S]*?<\/summary>\s*<div class="faq-a">([\s\S]*?)<\/div>/g)].map((m) => ({
      "@type": "Question",
      name: m[1].replace(/<[^>]+>/g, "").trim(),
      acceptedAnswer: { "@type": "Answer", text: m[2].replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim() }
    }));
    return qa.length ? [{ "@context": "https://schema.org", "@type": "FAQPage", mainEntity: qa }] : [];
  }
  return [];
}

function render(p) {
  let body = fs.readFileSync(path.join(ROOT, "src", "pages", p.src + ".html"), "utf8").trim();
  if (p.page === "home") body = body.replace('<!-- SHOP_NAV -->', shopping.navigation())
    .replace('<!-- SHOP_CAMPAIGNS -->', shopping.campaigns()).replace('<!-- SHOP_EXPANSION -->', shopping.expansion());
  const home = p.page === "home";
  const url = SITE + (p.path === "/404" || p.path === "/500" ? "/" : p.path);
  const ld = jsonLd(p).map((o) => `<script type="application/ld+json">${JSON.stringify(o)}</script>`).join("\n");
  return `<!doctype html>
<html lang="en-IN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${esc(p.title)}</title>
<meta name="description" content="${esc(p.desc)}">
${p.index ? `<link rel="canonical" href="${url}">` : '<meta name="robots" content="noindex">'}
<meta property="og:type" content="website">
<meta property="og:site_name" content="Fit Deal">
<meta property="og:locale" content="en_IN">
<meta property="og:title" content="${esc(p.title)}">
<meta property="og:description" content="${esc(p.desc)}">
<meta property="og:url" content="${url}">
<meta property="og:image" content="${SITE}/img/brand/og.png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="Fit Deal: see an outfit you love? We'll find it for less.">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(p.title)}">
<meta name="twitter:description" content="${esc(p.desc)}">
<meta name="twitter:image" content="${SITE}/img/brand/og.png">
<meta name="theme-color" content="#6a4ff0">
<meta name="color-scheme" content="light">
<link rel="icon" type="image/svg+xml" href="/favicon.svg">
<link rel="icon" type="image/png" sizes="32x32" href="/img/brand/icon-32.png">
<link rel="apple-touch-icon" href="/img/brand/apple-touch-icon.png">
<link rel="manifest" href="/manifest.webmanifest">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
${home ? '<link href="https://fonts.googleapis.com/css2?family=Caveat:wght@500;600&display=swap" rel="stylesheet">\n' : ""}<link rel="stylesheet" href="/css/site.css?v=${V}">
${home ? `<link rel="stylesheet" href="/css/home.css?v=${V}">\n` : ""}
${ld ? ld + "\n" : ""}</head>
<body data-page="${p.page}">

${SPRITE}

<a class="skip" href="#main">Skip to content</a>

${desktopNav(p)}

${mobileHead(p)}

${body.replace(/^<main\b/, '<main id="main"')}

${footer}

${tabs(p)}

<div class="toast" id="toast" role="status" aria-live="polite" hidden></div>

<script src="/js/app.js?v=${V}" defer></script>
${p.script ? `<script src="/js/${p.script}.js?v=${V}" defer></script>\n` : ""}</body>
</html>
`;
}

function sitemap() {
  const today = new Date().toISOString().slice(0, 10);
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${PAGES.filter((p) => p.index).map((p) => `  <url><loc>${SITE}${p.path}</loc><lastmod>${today}</lastmod></url>`).join("\n")}
</urlset>
`;
}

// Used on the live site. Previews and staging answer robots.txt from the
// server with "Disallow: /" instead (NOINDEX=true).
const robots = `User-agent: *
Disallow: /find/
Disallow: /vote/
Disallow: /go/
Disallow: /api/
Disallow: /admin
Allow: /

Sitemap: ${SITE}/sitemap.xml
`;

const manifest = JSON.stringify({
  name: "Fit Deal",
  short_name: "Fit Deal",
  description: POSITIONING,
  start_url: "/?source=pwa",
  scope: "/",
  display: "standalone",
  background_color: "#ffffff",
  theme_color: "#6a4ff0",
  icons: [
    { src: "/img/brand/icon-192.png", sizes: "192x192", type: "image/png" },
    { src: "/img/brand/icon-512.png", sizes: "512x512", type: "image/png" },
    { src: "/img/brand/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" }
  ]
}, null, 2) + "\n";

const outputs = PAGES.map((p) => [p.out, render(p)]).concat([
  ["sitemap.xml", sitemap()],
  ["robots.txt", robots],
  ["manifest.webmanifest", manifest]
]);

let stale = [];
for (const [rel, content] of outputs) {
  const file = path.join(OUT, rel);
  if (CHECK) {
    let old = "";
    try { old = fs.readFileSync(file, "utf8"); } catch (e) { /* missing */ }
    // lastmod dates in the sitemap change daily; ignore them in the check.
    const norm = (s) => s.replace(/<lastmod>[^<]*<\/lastmod>/g, "");
    if (norm(old) !== norm(content)) stale.push(rel);
    continue;
  }
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, content, "utf8");
  console.log("wrote public/" + rel);
}
if (CHECK) {
  if (stale.length) {
    console.error("public/ is out of date. Run: node build.js\n  " + stale.join("\n  "));
    process.exit(1);
  }
  console.log("public/ is up to date");
}

module.exports = { PAGES };
