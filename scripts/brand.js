// Renders the brand PNGs (app icons, share image, logo PNGs) from the SVGs
// in public/img/brand and src/brand/og.html, using Edge or Chrome in
// headless mode. Run after changing the logo:  node scripts/brand.js
const fs = require("fs");
const os = require("os");
const path = require("path");
const { execFileSync } = require("child_process");

const ROOT = path.join(__dirname, "..");
const OUT = path.join(ROOT, "public", "img", "brand");
const BROWSERS = [
  process.env.BROWSER_BIN,
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/usr/bin/google-chrome", "/usr/bin/chromium"
].filter(Boolean);
const bin = BROWSERS.find((b) => fs.existsSync(b));
if (!bin) throw new Error("No Edge/Chrome found. Set BROWSER_BIN.");

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "fitdeal-brand-"));
const mark = fs.readFileSync(path.join(OUT, "logo-mark.svg"), "utf8");
const spark = mark.match(/<g fill="#fff"[\s\S]*<\/g>/)[0];

function shot(html, file, w, h, transparent) {
  const src = path.join(tmp, path.basename(file) + ".html");
  fs.writeFileSync(src, html);
  // A throwaway profile, so a normally running Edge/Chrome can't take over.
  const args = ["--headless=new", "--disable-gpu", "--hide-scrollbars", "--force-device-scale-factor=1",
    "--no-first-run", "--no-default-browser-check", `--user-data-dir=${path.join(tmp, "profile")}`,
    `--window-size=${w},${h}`, `--screenshot=${file}`, "--virtual-time-budget=4000"];
  if (transparent) args.push("--default-background-color=00000000");
  execFileSync(bin, [...args, "file:///" + src.replace(/\\/g, "/")], { stdio: "pipe", timeout: 30000 });
  console.log("wrote", path.relative(ROOT, file));
}

const page = (w, h, body) => `<!doctype html><html><head><meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@700&display=block" rel="stylesheet">
<style>html,body{margin:0;width:${w}px;height:${h}px;overflow:hidden;background:transparent}svg{display:block}</style></head><body>${body}</body></html>`;

// Rounded app icon (home screen, favicon PNG)
for (const size of [32, 180, 192, 512]) {
  const name = size === 180 ? "apple-touch-icon.png" : `icon-${size}.png`;
  // iOS draws its own rounded corners, so the Apple icon is full-bleed.
  const svg = size === 180 ? mark.replace('rx="112"', 'rx="0"') : mark;
  shot(page(size, size, svg.replace("<svg ", `<svg width="${size}" height="${size}" `)), path.join(OUT, name), size, size, true);
}
// Android "maskable" icon: full-bleed, logo inside the safe circle.
shot(page(512, 512, `<svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#8b6cff"/><stop offset="1" stop-color="#5b3df0"/></linearGradient></defs><rect width="512" height="512" fill="url(#g)"/>${spark.replace("translate(76 76) scale(15)", "translate(136 136) scale(10)")}</svg>`),
  path.join(OUT, "icon-maskable-512.png"), 512, 512, false);
// Wordmark PNGs (colour and white), for places that don't take SVG.
const logo = fs.readFileSync(path.join(OUT, "logo.svg"), "utf8");
const white = fs.readFileSync(path.join(OUT, "logo-mono-white.svg"), "utf8");
shot(page(738, 216, logo.replace("<svg ", '<svg width="738" height="216" ')), path.join(OUT, "logo.png"), 738, 216, true);
shot(page(738, 216, white.replace("<svg ", '<svg width="738" height="216" ')), path.join(OUT, "logo-white.png"), 738, 216, true);
// Social share image
const og = fs.readFileSync(path.join(ROOT, "src", "brand", "og.html"), "utf8")
  .replace("../../public/img/hero-desktop.webp", "file:///" + path.join(ROOT, "public", "img", "hero-desktop.webp").replace(/\\/g, "/"));
shot(og, path.join(OUT, "og.png"), 1200, 630, false);
