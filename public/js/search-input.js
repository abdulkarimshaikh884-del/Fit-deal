/* Fit Deal — home page: photo upload, product link, samples.
   Flow: photo → shrink in the browser (this also drops hidden details such
   as location) → /api/analyze → pick the item (if there are several) →
   /api/search → /find/<id>. */
(function () {
  "use strict";
  var FD = window.FD;
  var el = FD.el;

  var MAX_RAW = 25 * 1024 * 1024;   // what we accept from the picker
  var MAX_SIDE = 1600;              // longest side sent for recognition
  var drop = document.getElementById("drop");
  var idle = document.getElementById("dropIdle");
  var flow = document.getElementById("flow");
  var status = document.getElementById("flowStatus");
  var photo = document.getElementById("photo");
  var busy = false;
  var lastRun = null; // to retry the same thing

  function announce(text) { status.textContent = text; }

  function show(nodes) {
    flow.textContent = "";
    nodes.forEach(function (n) { if (n) flow.appendChild(n); });
    idle.hidden = true;
    flow.hidden = false;
    drop.classList.add("is-busy");
  }
  function reset() {
    busy = false;
    flow.hidden = true;
    flow.textContent = "";
    idle.hidden = false;
    drop.classList.remove("is-busy");
    Array.prototype.forEach.call(document.querySelectorAll("[data-link-form].is-busy"), function (f) { f.classList.remove("is-busy"); });
    Array.prototype.forEach.call(document.querySelectorAll("[data-look][aria-busy]"), function (b) { b.removeAttribute("aria-busy"); });
  }

  // ── Screens inside the upload box ────────────────────────────────────────
  function working(thumbUrl, steps, active, msg) {
    var list = el("ol.flow-steps", null, steps.map(function (s, i) {
      return el("li", { class: i < active ? "done" : i === active ? "active" : "" }, [s]);
    }));
    var top = el("div.flow-top", null, [
      thumbUrl ? el("div.flow-thumb scan", null, [el("img", { src: thumbUrl, alt: "" })]) : null,
      list
    ]);
    show([top, el("div.flow-bar", { "aria-hidden": "true" }, [el("i")]), el("p.flow-msg", { text: msg || "This usually takes a few seconds." })]);
    announce(steps[active] || "");
  }

  function failed(message, canRetry) {
    busy = false;
    var buttons = [];
    if (canRetry && lastRun) buttons.push(el("button.btn btn-primary btn-sm", { type: "button", on: { click: function () { lastRun(); } } }, [FD.icon("i-refresh"), "Try again"]));
    buttons.push(el("button.btn " + (buttons.length ? "btn-ghost" : "btn-primary") + " btn-sm", { type: "button", on: { click: function () { reset(); photo.click(); } } }, [FD.icon("i-camera-line"), "Choose another photo"]));
    buttons.push(el("button.btn btn-ghost btn-sm", { type: "button", on: { click: reset } }, ["Cancel"]));
    show([
      el("span.flow-err", null, [FD.icon("i-info")]),
      el("p.flow-title", { text: "That didn't work" }),
      el("p.flow-text", { text: message }),
      el("div.btn-row", null, buttons)
    ]);
    announce(message);
    var first = flow.querySelector("button");
    if (first) first.focus();
  }

  // ── Image handling (all in the browser) ──────────────────────────────────
  function decode(file) {
    if (window.createImageBitmap) {
      return createImageBitmap(file, { imageOrientation: "from-image" }).catch(function () { return decodeWithImg(file); });
    }
    return decodeWithImg(file);
  }
  function decodeWithImg(file) {
    return new Promise(function (resolve, reject) {
      var url = URL.createObjectURL(file);
      var img = new Image();
      img.onload = function () { resolve(img); setTimeout(function () { URL.revokeObjectURL(url); }, 1000); };
      img.onerror = function () { URL.revokeObjectURL(url); reject(new Error("decode")); };
      img.src = url;
    });
  }
  function draw(src, maxSide, quality, crop) {
    var sw = crop ? crop.w : src.width, sh = crop ? crop.h : src.height;
    var scale = Math.min(1, maxSide / Math.max(sw, sh));
    var c = document.createElement("canvas");
    c.width = Math.max(1, Math.round(sw * scale));
    c.height = Math.max(1, Math.round(sh * scale));
    var ctx = c.getContext("2d");
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, c.width, c.height);
    ctx.drawImage(src, crop ? crop.x : 0, crop ? crop.y : 0, sw, sh, 0, 0, c.width, c.height);
    return c;
  }
  function toBlob(canvas, quality) {
    return new Promise(function (resolve, reject) {
      canvas.toBlob(function (b) { b ? resolve(b) : reject(new Error("encode")); }, "image/jpeg", quality);
    });
  }
  // Re-drawing the photo on a canvas and saving it as a new JPEG leaves out
  // every bit of hidden data (EXIF, GPS location, camera details).
  function prepare(file) {
    if (!file || !/^image\//.test(file.type || "image/")) {
      return Promise.reject(new Error("Please choose a photo or screenshot (JPG, PNG, WebP or HEIC)."));
    }
    if (file.size > MAX_RAW) return Promise.reject(new Error("That file is over 25 MB. Please use a screenshot instead."));
    return decode(file).then(function (img) {
      if (img.width < 80 || img.height < 80) throw new Error("That image is too small to see the clothes. Try a bigger screenshot.");
      var big = draw(img, MAX_SIDE, 0.86);
      return toBlob(big, 0.86).then(function (blob) {
        return { img: img, blob: blob, thumb: draw(img, 480).toDataURL("image/jpeg", 0.78) };
      });
    }, function () {
      throw new Error("We can't open this type of photo in your browser. Take a screenshot of it and upload that instead.");
    });
  }
  function cropThumb(img, box) {
    if (!box) return draw(img, 160).toDataURL("image/jpeg", 0.75);
    var pad = 0.04;
    var y0 = Math.max(0, box[0] / 1000 - pad), x0 = Math.max(0, box[1] / 1000 - pad);
    var y1 = Math.min(1, box[2] / 1000 + pad), x1 = Math.min(1, box[3] / 1000 + pad);
    var crop = { x: x0 * img.width, y: y0 * img.height, w: (x1 - x0) * img.width, h: (y1 - y0) * img.height };
    return draw(img, 200, 0.8, crop).toDataURL("image/jpeg", 0.78);
  }

  // ── The flow ─────────────────────────────────────────────────────────────
  var PHOTO_STEPS = ["Reading your photo", "Spotting the clothes", "Finding matches"];

  function startPhoto(file, opts) {
    if (busy) return;
    busy = true;
    opts = opts || {};
    lastRun = function () { busy = false; startPhoto(file, opts); };
    FD.track("upload_start", { sample: !!opts.sample, type: (file.type || "").slice(6, 12) });
    working(null, PHOTO_STEPS, 0, "Preparing your photo…");
    prepare(file).then(function (p) {
      working(p.thumb, PHOTO_STEPS, 1);
      return FD.api("/api/analyze", { method: "POST", body: p.blob, headers: { "Content-Type": "image/jpeg" } }).then(function (res) {
        return { p: p, res: res };
      });
    }).then(function (r) {
      var res = r.res;
      if (!res.items || !res.items.length) {
        var why = {
          no_clothing: "We couldn't spot any clothing in this photo. Try a screenshot where the outfit is clearly visible.",
          blurry: "This photo is too blurry to recognise the clothes. Try a sharper screenshot.",
          too_dark: "This photo is too dark to recognise the clothes. Try a brighter one.",
          too_small: "The clothes are too small in this photo. Crop the screenshot to the outfit and try again."
        }[res.imageIssue] || "We couldn't recognise the clothing in this photo. Try another screenshot.";
        return failed(why, false);
      }
      var ctx = { analysisId: res.id, items: res.items, thumb: r.p.thumb, img: r.p.img, sample: !!opts.sample };
      if (res.items.length > 1) return choose(ctx);
      return confirmOrSearch(ctx, 0);
    }).catch(function (e) {
      failed(e.message, e.code === "network" || e.code === "busy" || e.code === "engine_error" || e.status >= 500);
    });
  }

  function choose(ctx) {
    busy = false;
    var list = el("div.pick-list", { role: "list" }, ctx.items.map(function (it, i) {
      var thumb = cropThumb(ctx.img, it.box);
      return el("button.pick", { type: "button", role: "listitem", on: { click: function () { busy = true; confirmOrSearch(ctx, i); } } }, [
        el("span.pick-img", { style: null, "aria-hidden": "true", dataset: { bg: thumb } }),
        el("span", null, [el("b", { text: it.label }), el("small", { text: describe(it) })])
      ]);
    }));
    show([
      el("p.flow-title", { text: "Which item are you looking for?" }),
      el("p.flow-text", { text: "We found " + ctx.items.length + " pieces of clothing. Pick one to search for." }),
      list,
      el("button.link-btn", { type: "button", on: { click: reset } }, ["Start over"])
    ]);
    // Background images set through the DOM (no inline style attributes, so
    // the page's security policy can stay strict).
    Array.prototype.forEach.call(list.querySelectorAll(".pick-img"), function (s) { s.style.backgroundImage = "url(" + s.dataset.bg + ")"; });
    announce("We found " + ctx.items.length + " pieces of clothing. Pick one to search for.");
    list.querySelector("button").focus();
  }

  function describe(it) {
    var bits = [];
    if (it.colors && it.colors[0]) bits.push(it.colors[0]);
    if (it.pattern && it.pattern !== "solid") bits.push(it.pattern);
    var cat = it.category === "other" ? it.otherCategory : it.category.replace("_", "-");
    if (cat) bits.push(cat);
    return bits.join(" · ");
  }

  // Low confidence → ask before searching, and let the shopper fix the words.
  function confirmOrSearch(ctx, index) {
    var it = ctx.items[index];
    if (!it.needsConfirm) return search(ctx, index);
    busy = false;
    var input = el("input", { type: "text", maxlength: "90", value: it.query, "aria-label": "Search words" });
    var box = el("form.confirm-box", { on: { submit: function (ev) { ev.preventDefault(); busy = true; search(ctx, index, input.value.trim()); } } }, [
      el("p.flow-text", { text: "We're not fully sure. Does this describe it? Fix the words if not." }),
      el("label.field", null, [el("span", { text: "We'll search for" }), input]),
      el("div.btn-row", null, [
        el("button.btn btn-primary btn-sm", { type: "submit" }, [FD.icon("i-search"), "Search"]),
        el("button.btn btn-ghost btn-sm", { type: "button", on: { click: reset } }, ["Start over"])
      ])
    ]);
    show([
      el("div.flow-top", null, [el("div.flow-thumb", null, [el("img", { src: cropThumb(ctx.img, it.box), alt: "" })]), el("div", null, [
        el("p.flow-title", { text: it.label }),
        el("p.flow-text", { text: describe(it) })
      ])]),
      box
    ]);
    announce("Please confirm what to search for.");
    input.focus();
  }

  function search(ctx, index, query) {
    var it = ctx.items[index];
    lastRun = function () { busy = true; search(ctx, index, query); };
    working(cropThumb(ctx.img, it.box), PHOTO_STEPS, 2, "Checking prices at Amazon, Flipkart, Myntra and AJIO…");
    var body = { analysisId: ctx.analysisId, index: index, sample: ctx.sample };
    if (query && query !== it.query) body.query = query;
    FD.api("/api/search", { json: body }).then(function (res) {
      // The photo stays on this device: the results page shows it from here.
      FD.store.sessionSet("fd_img_" + res.id, ctx.thumb);
      FD.store.sessionSet("fd_items_" + res.id, { analysisId: ctx.analysisId, index: index, sample: ctx.sample, items: ctx.items.map(function (x) { return { label: x.label }; }) });
      FD.recent.add({ id: res.id, label: it.label, kind: "photo" });
      location.href = "/find/" + res.id;
    }).catch(function (e) {
      if (e.code === "expired") return failed("This search timed out. Please upload the photo again.", false);
      failed(e.message, true);
    });
  }

  function startLink(form, value) {
    if (busy) return;
    busy = true;
    form.classList.add("is-busy");
    lastRun = function () { busy = false; startLink(form, value); };
    FD.track("link_submit", {});
    working(null, ["Reading the link", "Finding prices"], 0, "Checking the stores…");
    setTimeout(function () { if (busy) working(null, ["Reading the link", "Finding prices"], 1, "Checking the stores…"); }, 900);
    FD.api("/api/search", { json: { link: value } }).then(function (res) {
      FD.recent.add({ id: res.id, label: "Product link", kind: "link" });
      location.href = "/find/" + res.id;
    }).catch(function (e) {
      form.classList.remove("is-busy");
      var retry = e.code === "network" || e.status >= 500;
      failed(e.message, retry);
    });
  }

  // ── Wiring ───────────────────────────────────────────────────────────────
  document.getElementById("choose").addEventListener("click", function () { photo.click(); });
  photo.addEventListener("change", function () {
    var file = photo.files && photo.files[0];
    photo.value = "";
    if (file) { if (busy) reset(); startPhoto(file); }
  });

  Array.prototype.forEach.call(document.querySelectorAll("[data-link-form]"), function (form) {
    form.addEventListener("submit", function (ev) {
      ev.preventDefault();
      var input = form.querySelector("input");
      var value = input.value.trim();
      if (!value) { input.focus(); FD.toast("Paste a product link from Amazon, Flipkart, Myntra or AJIO."); return; }
      if (busy) reset();
      document.getElementById("upload").scrollIntoView({ behavior: "smooth", block: "center" });
      startLink(form, value);
    });
  });

  // Drag and drop anywhere on the page (desktop), and paste (Ctrl+V).
  var dragDepth = 0;
  function hasFiles(ev) { return ev.dataTransfer && Array.prototype.indexOf.call(ev.dataTransfer.types || [], "Files") >= 0; }
  document.addEventListener("dragenter", function (ev) { if (!hasFiles(ev)) return; dragDepth++; drop.classList.add("is-over"); });
  document.addEventListener("dragleave", function () { dragDepth = Math.max(0, dragDepth - 1); if (!dragDepth) drop.classList.remove("is-over"); });
  document.addEventListener("dragover", function (ev) { if (hasFiles(ev)) { ev.preventDefault(); ev.dataTransfer.dropEffect = "copy"; } });
  document.addEventListener("drop", function (ev) {
    if (!hasFiles(ev)) return;
    ev.preventDefault();
    dragDepth = 0;
    drop.classList.remove("is-over");
    var file = ev.dataTransfer.files && ev.dataTransfer.files[0];
    if (!file) return;
    if (busy) reset();
    document.getElementById("upload").scrollIntoView({ behavior: "smooth", block: "center" });
    startPhoto(file);
  });
  document.addEventListener("paste", function (ev) {
    var t = ev.target;
    if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA")) return;
    var items = (ev.clipboardData && ev.clipboardData.items) || [];
    for (var i = 0; i < items.length; i++) {
      if (items[i].kind === "file" && /^image\//.test(items[i].type)) {
        ev.preventDefault();
        if (busy) reset();
        startPhoto(items[i].getAsFile());
        return;
      }
    }
  });


  var textForm = document.getElementById("textSearch");
  var queryInput = document.getElementById("queryInput");
  function searchText(value) {
    if (busy) return;
    var query = value.trim();
    if (query.length < 2) { queryInput.focus(); return; }
    if (/https?:\/\/|(?:amazon\.in|flipkart\.com|myntra\.com|ajio\.com)\//i.test(query)) {
      startLink(document.querySelector("[data-link-form]"), query);
      return;
    }
    busy = true;
    lastRun = function () { busy = false; searchText(query); };
    working(null, ["Searching the stores", "Finding your options"], 0);
    FD.api("/api/search", { json: { query: query } }).then(function (res) {
      FD.recent.add({ id: res.id, label: query, kind: "text" });
      var budget = Number(new URLSearchParams(location.search).get("max"));
      var budgetSuffix = Number.isFinite(budget) && budget > 0 && budget <= 1000000 ? "?max=" + Math.round(budget) : "";
      location.href = "/find/" + res.id + budgetSuffix;
    }).catch(function (e) { failed(e.message, e.code === "network" || e.status >= 500); });
  }
  textForm.addEventListener("submit", function (ev) { ev.preventDefault(); searchText(queryInput.value); });
  FD.api("/api/status").then(function (s) {
    var live = (s.sources || []).some(function (p) { return p.source !== "sample"; });
    document.getElementById("searchStatus").textContent = live
      ? "Prices are checked with available sources. Exact matches need product evidence."
      : "Live product prices are not available yet. You can still open a product link or search the stores directly.";
  }).catch(function () { document.getElementById("searchStatus").textContent = "Service status unavailable. You can still try a search."; });
  // ── Recent searches on this device ────────────────────────────────────────
  var recent = FD.recent.all().slice(0, 4);
  if (recent.length) {
    var list = document.getElementById("recentList");
    recent.forEach(function (r) {
      list.appendChild(el("li", null, [el("a", { href: "/find/" + encodeURIComponent(r.id) }, [
        FD.icon(r.kind === "link" ? "i-link" : "i-search"), el("b", { text: r.label }), el("small", { text: FD.ago(r.at) })
      ])]));
    });
    document.getElementById("recent").hidden = false;
    document.getElementById("recentClear").addEventListener("click", function () {
      FD.recent.clear();
      document.getElementById("recent").hidden = true;
    });
  }


  window.addEventListener("pageshow", function (ev) { if (ev.persisted) reset(); });
  var params = new URLSearchParams(location.search);
  var initial = params.get("q");
  if (initial) { queryInput.value = initial.slice(0, 2000); searchText(queryInput.value); }
  if (params.get("mode") === "link") document.getElementById("linkInput").focus();
  if (params.get("mode") === "photo") document.getElementById("choose").focus();
})();
