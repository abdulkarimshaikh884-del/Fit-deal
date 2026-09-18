// Recognition benchmark (checklist Phase 4 and 15): runs every image in a
// folder through the same recognition the site uses and writes a report you
// then mark by hand (was the item right? colour? would you search this?).
//   GEMINI_API_KEY=... node scripts/benchmark.js path/to/screenshots
// Needs a billed Gemini key; each image is one API call.
const fs = require("fs");
const path = require("path");
const image = require("../lib/image");
const recognize = require("../lib/recognize");

const dir = process.argv[2];
if (!dir || !fs.existsSync(dir)) {
  console.error("Usage: node scripts/benchmark.js <folder of screenshots>");
  process.exit(1);
}
const files = fs.readdirSync(dir).filter((f) => /\.(jpe?g|png|webp|heic|heif)$/i.test(f)).sort();
if (!files.length) {
  console.error("No images found in " + dir);
  process.exit(1);
}

(async () => {
  const rows = [];
  let ok = 0, failed = 0, totalMs = 0;
  for (const f of files) {
    const buf = fs.readFileSync(path.join(dir, f));
    const started = Date.now();
    try {
      const info = image.check(buf, { maxBytes: 8 * 1024 * 1024 });
      const r = await recognize.analyzeImage(buf, info.type);
      const ms = Date.now() - started;
      totalMs += ms;
      if (r.items.length) ok++; else failed++;
      rows.push({ file: f, ms, issue: r.imageIssue, items: r.items });
      console.log(`${f}: ${r.items.map((i) => i.label).join(" | ") || "(nothing: " + r.imageIssue + ")"} [${ms} ms]`);
    } catch (e) {
      failed++;
      rows.push({ file: f, ms: Date.now() - started, error: e.code || e.message, items: [] });
      console.log(`${f}: ERROR ${e.code || e.message}`);
    }
  }
  const date = new Date().toISOString().slice(0, 10);
  const lines = [
    `# Recognition benchmark ${date}`,
    "",
    `Images: ${files.length} · recognised something: ${ok} · nothing/error: ${failed} · average ${Math.round(totalMs / Math.max(1, ok + failed))} ms`,
    "",
    "Mark each row: **Item OK?** (right garment type), **Colour OK?**, **Query useful?** (would it find this on Myntra), then count the ✓s.",
    "",
    "| Image | Found | Category · colours · pattern | Brand (evidence) | Confidence | Search words | Item OK? | Colour OK? | Query useful? |",
    "|---|---|---|---|---|---|---|---|---|"
  ];
  for (const r of rows) {
    if (!r.items.length) {
      lines.push(`| ${r.file} | ${r.error ? "ERROR " + r.error : "nothing (" + r.issue + ")"} | | | | | | | |`);
      continue;
    }
    r.items.forEach((it, i) => {
      lines.push(`| ${i ? "" : r.file} | ${it.label} | ${it.category}${it.otherCategory ? "/" + it.otherCategory : ""} · ${it.colors.join(", ")} · ${it.pattern} | ${it.brand ? it.brand + " (" + it.brandEvidence + ")" : "–"} | ${it.confidence}${it.needsConfirm ? " (asks user)" : ""} | ${it.query} | | | |`);
    });
  }
  const out = path.join(__dirname, "..", "data", `benchmark-${date}.md`);
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, lines.join("\n") + "\n");
  console.log("\nReport: " + out);
})();
