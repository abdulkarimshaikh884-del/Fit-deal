// Clothing recognition. The photo goes to Gemini once, in memory, and is
// never written to disk or a database. The model must answer in a fixed JSON
// shape, and everything it says is checked again here before we use it.
const crypto = require("crypto");
const config = require("./config");
const log = require("./log");

// V1 categories. Anything else is still described, but marked "other" so
// the results page can say we don't cover it well yet.
const CATEGORIES = {
  shirt: { label: "Shirt", words: ["shirt", "shirts"] },
  t_shirt: { label: "T-shirt", words: ["t-shirt", "tshirt", "t shirt", "tee", "polo"] },
  top: { label: "Top", words: ["top", "tops", "blouse", "crop top", "tank", "camisole", "tunic"] },
  dress: { label: "Dress", words: ["dress", "dresses", "gown", "maxi", "midi"] },
  jeans: { label: "Jeans", words: ["jeans", "denim", "jean"] },
  kurti: { label: "Kurti", words: ["kurti", "kurta", "kurtis", "kurtas", "anarkali"] }
};
const CATEGORY_KEYS = Object.keys(CATEGORIES);

const COLORS = ["black", "white", "off white", "cream", "beige", "brown", "tan", "khaki", "olive", "green", "mint",
  "teal", "turquoise", "blue", "navy", "sky blue", "denim blue", "purple", "lavender", "lilac", "pink", "peach",
  "coral", "red", "maroon", "burgundy", "rust", "orange", "mustard", "yellow", "grey", "charcoal", "silver", "gold",
  "multicolour"];

const MIN_CONFIDENCE = 0.6; // below this we ask the user to confirm first

const SCHEMA = {
  type: "OBJECT",
  properties: {
    image_issue: { type: "STRING", enum: ["none", "blurry", "too_dark", "too_small", "no_clothing"] },
    items: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          label: { type: "STRING", description: "Short shopper-friendly name, e.g. 'Pink floral midi wrap dress'" },
          category: { type: "STRING", enum: [...CATEGORY_KEYS, "other"] },
          other_category: { type: "STRING", description: "If category is other, what it is, e.g. 'blazer'. Else empty." },
          audience: { type: "STRING", enum: ["women", "men", "unisex", "kids", "unknown"] },
          colors: { type: "ARRAY", items: { type: "STRING" }, description: "Main colours, most visible first, plain names" },
          pattern: { type: "STRING", description: "solid, floral, striped, checked, printed, embroidered, etc." },
          fit: { type: "STRING", description: "slim, regular, relaxed, oversized, wide-leg, straight, A-line, bodycon, etc. Empty if unclear." },
          details: { type: "ARRAY", items: { type: "STRING" }, description: "Up to 4 visible details: neckline, sleeves, length, fabric look" },
          brand: { type: "STRING", description: "Only if a logo or brand text is clearly readable ON the garment or its tag. Else empty." },
          brand_evidence: { type: "STRING", enum: ["none", "logo", "text", "tag"] },
          confidence: { type: "NUMBER", description: "0 to 1: how clearly this item and its details can be seen" },
          box: { type: "ARRAY", items: { type: "INTEGER" }, description: "[ymin, xmin, ymax, xmax] on a 0-1000 scale" },
          search_query: { type: "STRING", description: "3 to 8 words a shopper in India would type on Myntra or Amazon to find this item" }
        },
        required: ["label", "category", "audience", "colors", "pattern", "brand", "brand_evidence", "confidence", "box", "search_query"]
      }
    }
  },
  required: ["image_issue", "items"]
};

const PROMPT = `You help Indian shoppers find clothes they saw in a photo or screenshot.
List each distinct clothing item a person could want to buy, most prominent first, at most 4.
Ignore shoes, bags, jewellery, watches and background objects.
Rules:
- Describe only what you can see. Do not guess a brand from style alone. Fill "brand" only when a logo or brand name is readable on the garment or its label, and say which in brand_evidence; otherwise brand is "" and brand_evidence is "none".
- Use plain colour names (e.g. navy, beige, olive, maroon).
- search_query is what a shopper would type into an Indian store: include audience (women/men) when clear, colour, pattern, fit and garment type. Use Indian terms where natural (kurti, kurta).
- If the image has no clothing, return no items and image_issue "no_clothing". If it is too blurry, dark or small to tell, say so in image_issue.
- confidence is low (below 0.6) when the item is cut off, blurry, covered, or details are hard to see.`;

function clean(s, max) {
  return String(s == null ? "" : s).replace(/[\p{Cc}<>]/gu, " ").replace(/\s+/g, " ").trim().slice(0, max);
}

function buildQuery(item) {
  const parts = [];
  if (item.audience === "women" || item.audience === "men" || item.audience === "kids") parts.push(item.audience);
  if (item.brand) parts.push(item.brand);
  if (item.colors[0]) parts.push(item.colors[0]);
  if (item.pattern && item.pattern !== "solid") parts.push(item.pattern);
  if (item.fit) parts.push(item.fit);
  parts.push(item.category === "other" ? item.otherCategory || item.label : CATEGORIES[item.category].label.toLowerCase());
  return clean(parts.join(" "), 90);
}

// Turns whatever the model returned into a safe, predictable object.
function normalize(raw) {
  const issues = ["none", "blurry", "too_dark", "too_small", "no_clothing"];
  const out = { imageIssue: issues.includes(raw && raw.image_issue) ? raw.image_issue : "none", items: [] };
  const items = Array.isArray(raw && raw.items) ? raw.items.slice(0, 4) : [];
  for (const it of items) {
    if (!it || typeof it !== "object") continue;
    const category = CATEGORY_KEYS.includes(it.category) ? it.category : "other";
    const colors = (Array.isArray(it.colors) ? it.colors : []).map((c) => clean(c, 24).toLowerCase()).filter(Boolean).slice(0, 3);
    const evidence = ["logo", "text", "tag"].includes(it.brand_evidence) ? it.brand_evidence : "none";
    const conf = Math.max(0, Math.min(1, Number(it.confidence) || 0));
    let box = Array.isArray(it.box) && it.box.length === 4 ? it.box.map((n) => Math.max(0, Math.min(1000, Math.round(Number(n) || 0)))) : null;
    if (box && (box[2] <= box[0] || box[3] <= box[1])) box = null;
    const item = {
      label: clean(it.label, 70),
      category,
      otherCategory: category === "other" ? clean(it.other_category, 30).toLowerCase() : "",
      audience: ["women", "men", "unisex", "kids"].includes(it.audience) ? it.audience : "unknown",
      colors,
      pattern: clean(it.pattern, 24).toLowerCase(),
      fit: clean(it.fit, 24).toLowerCase(),
      details: (Array.isArray(it.details) ? it.details : []).map((d) => clean(d, 40)).filter(Boolean).slice(0, 4),
      // A brand is kept only with visible evidence, and only when the model
      // itself is fairly sure about the item.
      brand: evidence !== "none" && conf >= MIN_CONFIDENCE ? clean(it.brand, 40) : "",
      brandEvidence: evidence,
      confidence: Math.round(conf * 100) / 100,
      needsConfirm: conf < MIN_CONFIDENCE,
      box
    };
    if (!item.label) item.label = (colors[0] ? colors[0] + " " : "") + (category === "other" ? item.otherCategory || "clothing" : CATEGORIES[category].label.toLowerCase());
    const q = clean(it.search_query, 90);
    item.query = q && q.split(" ").length >= 2 ? q : buildQuery(item);
    out.items.push(item);
  }
  if (!out.items.length && out.imageIssue === "none") out.imageIssue = "no_clothing";
  return out;
}

async function callGemini(parts, schema) {
  if (!config.gemini.key) throw Object.assign(new Error("GEMINI_API_KEY is not set"), { code: "not_configured" });
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(config.gemini.model)}:generateContent`;
  const started = Date.now();
  const request = JSON.stringify({
    contents: [{ role: "user", parts }],
    generationConfig: { temperature: 0.1, responseMimeType: "application/json", responseSchema: schema }
  });
  // One quiet retry for a dropped connection or a hiccup on Google's side,
  // so a shopper on a patchy mobile network doesn't have to tap "Try again".
  let res;
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-goog-api-key": config.gemini.key },
        body: request,
        signal: AbortSignal.timeout(Math.round(config.gemini.timeoutMs / 2) + 2000)
      });
      if (res.status < 500 || attempt === 2) break;
      log.warn("gemini retry", { status: res.status });
    } catch (e) {
      if (attempt === 2) throw Object.assign(new Error("Gemini unreachable: " + e.message), { code: "engine_down" });
      log.warn("gemini retry", { err: String(e.message).slice(0, 120) });
    }
  }
  const body = await res.text();
  if (!res.ok) {
    const code = res.status === 429 ? "busy" : "engine_error";
    throw Object.assign(new Error(`Gemini ${res.status}: ${body.slice(0, 300)}`), { code });
  }
  let data;
  try { data = JSON.parse(body); } catch (e) { throw Object.assign(new Error("Gemini sent non-JSON"), { code: "engine_error" }); }
  const cand = data.candidates && data.candidates[0];
  const text = cand && cand.content && cand.content.parts && cand.content.parts.map((p) => p.text || "").join("");
  if (!text) {
    const reason = (cand && cand.finishReason) || (data.promptFeedback && data.promptFeedback.blockReason) || "empty";
    throw Object.assign(new Error("Gemini gave no answer: " + reason), { code: reason === "SAFETY" || reason === "PROHIBITED_CONTENT" ? "blocked" : "engine_error" });
  }
  log.info("gemini", { ms: Date.now() - started, model: config.gemini.model, tokens: data.usageMetadata && data.usageMetadata.totalTokenCount });
  try { return JSON.parse(text); } catch (e) { throw Object.assign(new Error("Gemini JSON did not parse"), { code: "engine_error" }); }
}

// Same image twice (e.g. a sample, or a retry) → answer from memory for a day.
const cache = new Map();
const CACHE_MS = 24 * 3600 * 1000;

async function analyzeImage(buf, type) {
  const key = crypto.createHash("sha256").update(buf).digest("hex");
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < CACHE_MS) return { ...hit.value, cached: true };
  const raw = await callGemini([{ inline_data: { mime_type: type, data: buf.toString("base64") } }, { text: PROMPT }], SCHEMA);
  const value = normalize(raw);
  cache.set(key, { at: Date.now(), value });
  if (cache.size > 500) cache.delete(cache.keys().next().value);
  return value;
}

// For a pasted product link we only have the words in its address. We read
// category and colour from them without calling the model.
function itemFromTitle(title, brandHint) {
  const t = " " + String(title || "").toLowerCase().replace(/[^a-z0-9 ]+/g, " ") + " ";
  let category = "other";
  // Check longer, more specific words first ("t shirt" before "shirt").
  const order = ["t_shirt", "kurti", "jeans", "dress", "shirt", "top"];
  for (const key of order) {
    if (CATEGORIES[key].words.some((w) => t.includes(" " + w + " "))) { category = key; break; }
  }
  const colors = COLORS.filter((c) => t.includes(" " + c + " ")).slice(0, 2);
  const audience = / women | womens | woman | girls | ladies /.test(t) ? "women" : / men | mens | man | boys /.test(t) ? "men" : "unknown";
  const label = clean(title, 70) || "Product from your link";
  return {
    label: label.replace(/\b\w/g, (c) => c.toUpperCase()),
    category,
    otherCategory: "",
    audience,
    colors,
    pattern: "",
    fit: "",
    details: [],
    brand: clean(brandHint, 40).replace(/\b\w/g, (c) => c.toUpperCase()),
    brandEvidence: brandHint ? "text" : "none",
    confidence: 1,
    needsConfirm: false,
    box: null,
    // Drop style codes like "AMSHOSRFY59264" from the search words.
    query: clean(String(title || "").replace(/\b(?=[a-z0-9]*\d)[a-z0-9]{6,}\b/gi, " "), 90)
  };
}

module.exports = { CATEGORIES, CATEGORY_KEYS, COLORS, MIN_CONFIDENCE, SCHEMA, normalize, buildQuery, analyzeImage, itemFromTitle, clean, _cache: cache };
