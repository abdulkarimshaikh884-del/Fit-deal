/* Fit Deal — home page: e-commerce shopping, photo upload, product link, samples.
   Flow: photo → shrink in the browser (drops EXIF & location data) → /api/analyze →
   pick item → /api/search → /find/<id>. */
(function () {
  "use strict";
  var FD = window.FD;
  var el = FD.el;

  var MAX_RAW = 25 * 1024 * 1024;   // what we accept from picker
  var MAX_SIDE = 1600;              // longest side sent for recognition
  var drop = document.getElementById("drop");
  var idle = document.getElementById("dropIdle");
  var flow = document.getElementById("flow");
  var status = document.getElementById("flowStatus");
  var photo = document.getElementById("photo");
  var busy = false;
  var lastRun = null;

  function announce(text) { if (status) status.textContent = text; }

  var modal = document.getElementById("uploadModal");

  function show(nodes) {
    if (!flow) return;
    flow.textContent = "";
    nodes.forEach(function (n) { if (n) flow.appendChild(n); });
    flow.hidden = false;
    if (modal) {
      if (typeof modal.showModal === "function" && !modal.open) {
        try { modal.showModal(); } catch (e) { modal.setAttribute("open", ""); }
      } else {
        modal.hidden = false;
      }
    }
  }

  function reset() {
    busy = false;
    if (flow) { flow.hidden = true; flow.textContent = ""; }
    if (modal) {
      if (typeof modal.close === "function" && modal.open) {
        try { modal.close(); } catch (e) { modal.removeAttribute("open"); }
      } else {
        modal.hidden = true;
      }
    }
    Array.prototype.forEach.call(document.querySelectorAll("[data-link-form].is-busy"), function (f) { f.classList.remove("is-busy"); });
    Array.prototype.forEach.call(document.querySelectorAll("[data-look][aria-busy]"), function (b) { b.removeAttribute("aria-busy"); });
  }

  // ── Screens inside upload box ─────────────────────────────────────────────
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
    buttons.push(el("button.btn " + (buttons.length ? "btn-ghost" : "btn-primary") + " btn-sm", { type: "button", on: { click: function () { reset(); if (photo) photo.click(); } } }, [FD.icon("i-camera-line"), "Choose another photo"]));
    buttons.push(el("button.btn btn-ghost btn-sm", { type: "button", on: { click: reset } }, ["Cancel"]));
    show([
      el("span.flow-err", null, [FD.icon("i-info")]),
      el("p.flow-title", { text: "That didn't work" }),
      el("p.flow-text", { text: message }),
      el("div.btn-row", null, buttons)
    ]);
    announce(message);
    var first = flow ? flow.querySelector("button") : null;
    if (first) first.focus();
  }

  // ── Browser-side image handling ──────────────────────────────────────────
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

  // ── Outfit recognition flow ──────────────────────────────────────────────
  var PHOTO_STEPS = ["Reading your photo", "Spotting the clothes", "Finding matches"];

  function startPhoto(file, opts) {
    if (busy) return;
    busy = true;
    opts = opts || {};
    lastRun = function () { busy = false; startPhoto(file, opts); };
    FD.track("upload_start", { sample: !!opts.sample, type: (file.type || "").slice(6, 12) });
    var up = document.getElementById("upload");
    if (up) up.hidden = false;
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
        el("span.pick-img", { "aria-hidden": "true", dataset: { bg: thumb } }),
        el("span", null, [el("b", { text: it.label }), el("small", { text: describe(it) })])
      ]);
    }));
    show([
      el("p.flow-title", { text: "Which item are you looking for?" }),
      el("p.flow-text", { text: "We found " + ctx.items.length + " pieces of clothing. Pick one to search for." }),
      list,
      el("button.link-btn", { type: "button", on: { click: reset } }, ["Start over"])
    ]);
    Array.prototype.forEach.call(list.querySelectorAll(".pick-img"), function (s) { s.style.backgroundImage = "url(" + s.dataset.bg + ")"; });
    announce("We found " + ctx.items.length + " pieces of clothing. Pick one to search for.");
    var firstBtn = list.querySelector("button");
    if (firstBtn) firstBtn.focus();
  }

  function describe(it) {
    var bits = [];
    if (it.colors && it.colors[0]) bits.push(it.colors[0]);
    if (it.pattern && it.pattern !== "solid") bits.push(it.pattern);
    var cat = it.category === "other" ? it.otherCategory : it.category.replace("_", "-");
    if (cat) bits.push(cat);
    return bits.join(" · ");
  }

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
    var up = document.getElementById("upload");
    if (up) up.hidden = false;
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

  // ── Photo upload trigger helpers ─────────────────────────────────────────
  function triggerPhotoPicker() {
    if (photo) photo.click();
  }

  // Header camera & Hero photo trigger buttons
  ["headerSnapBtn", "mobileSnapBtn", "heroUploadBtn"].forEach(function (id) {
    var btn = document.getElementById(id);
    if (btn) {
      btn.addEventListener("click", function (ev) {
        ev.preventDefault();
        triggerPhotoPicker();
      });
    }
  });

  // Section 9 Screenshot dropzone
  var secDrop = document.getElementById("sectionDropzone");
  var secInput = document.getElementById("sectionPhotoInput");
  if (secDrop) {
    secDrop.addEventListener("click", function () {
      if (secInput) secInput.click();
      else if (photo) photo.click();
    });
    secDrop.addEventListener("keydown", function (ev) {
      if (ev.key === "Enter" || ev.key === " ") {
        ev.preventDefault();
        if (secInput) secInput.click();
        else if (photo) photo.click();
      }
    });
    secDrop.addEventListener("dragover", function (ev) {
      ev.preventDefault();
      secDrop.style.borderColor = "#7041ff";
      secDrop.style.backgroundColor = "#f4efff";
    });
    secDrop.addEventListener("dragleave", function () {
      secDrop.style.borderColor = "";
      secDrop.style.backgroundColor = "";
    });
    secDrop.addEventListener("drop", function (ev) {
      ev.preventDefault();
      secDrop.style.borderColor = "";
      secDrop.style.backgroundColor = "";
      var file = ev.dataTransfer && ev.dataTransfer.files && ev.dataTransfer.files[0];
      if (file) {
        if (busy) reset();
        openUploadDrawer(false);
        startPhoto(file);
      }
    });
  }
  if (secInput) {
    secInput.addEventListener("change", function () {
      var file = secInput.files && secInput.files[0];
      secInput.value = "";
      if (file) {
        if (busy) reset();
        openUploadDrawer(false);
        startPhoto(file);
      }
    });
  }

  // Photo input listener
  if (photo) {
    photo.addEventListener("change", function () {
      var file = photo.files && photo.files[0];
      photo.value = "";
      if (file) { if (busy) reset(); startPhoto(file); }
    });
  }
  var chooseBtn = document.getElementById("choose");
  if (chooseBtn && photo) {
    chooseBtn.addEventListener("click", function () { photo.click(); });
  }

  // Link forms
  Array.prototype.forEach.call(document.querySelectorAll("[data-link-form]"), function (form) {
    form.addEventListener("submit", function (ev) {
      ev.preventDefault();
      var input = form.querySelector("input");
      var value = (input && input.value || "").trim();
      if (!value) {
        if (input) input.focus();
        FD.toast("Paste a product link from Amazon, Flipkart, Myntra or AJIO.");
        return;
      }
      if (busy) reset();
      openUploadDrawer(false);
      startLink(form, value);
    });
  });

  // Drag and drop & paste (Ctrl+V)
  var dragDepth = 0;
  function hasFiles(ev) { return ev.dataTransfer && Array.prototype.indexOf.call(ev.dataTransfer.types || [], "Files") >= 0; }
  document.addEventListener("dragenter", function (ev) { if (!hasFiles(ev)) return; dragDepth++; if (drop) drop.classList.add("is-over"); });
  document.addEventListener("dragleave", function () { dragDepth = Math.max(0, dragDepth - 1); if (!dragDepth && drop) drop.classList.remove("is-over"); });
  document.addEventListener("dragover", function (ev) { if (hasFiles(ev)) { ev.preventDefault(); ev.dataTransfer.dropEffect = "copy"; } });
  document.addEventListener("drop", function (ev) {
    if (!hasFiles(ev)) return;
    ev.preventDefault();
    dragDepth = 0;
    if (drop) drop.classList.remove("is-over");
    var file = ev.dataTransfer.files && ev.dataTransfer.files[0];
    if (!file) return;
    if (busy) reset();
    openUploadDrawer(false);
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
        openUploadDrawer(false);
        startPhoto(items[i].getAsFile());
        return;
      }
    }
  });

  // ── "Shop these looks" and sample product dupes ──────────────────────────
  function searchLook(url, name, btn) {
    if (busy) return;
    if (btn) btn.setAttribute("aria-busy", "true");
    FD.track("sample_click", { sample: name.slice(0, 40) });
    openUploadDrawer(false);
    fetch(url).then(function (r) {
      if (!r.ok) throw new Error("look");
      return r.blob();
    }).then(function (blob) {
      if (btn) btn.removeAttribute("aria-busy");
      startPhoto(new File([blob], "look.webp", { type: blob.type || "image/webp" }), { sample: true });
    }).catch(function () {
      if (btn) btn.removeAttribute("aria-busy");
      FD.toast("Couldn't load outfit sample. Please try again.");
    });
  }

  Array.prototype.forEach.call(document.querySelectorAll("[data-look]"), function (btn) {
    btn.addEventListener("click", function () {
      searchLook(btn.getAttribute("data-look"), btn.getAttribute("data-name") || "look", btn);
    });
  });

  var SAMPLE_URLS = {
    dress: "/img/samples/dress-m.webp",
    shirt: "/img/samples/shirt-m.webp",
    top: "/img/samples/top-m.webp",
    jeans: "/img/samples/jeans-m.webp",
    kurti: "/img/samples/kurti-m.webp"
  };
  Array.prototype.forEach.call(document.querySelectorAll("[data-sample]"), function (btn) {
    btn.addEventListener("click", function (ev) {
      ev.preventDefault();
      var s = btn.getAttribute("data-sample");
      var url = SAMPLE_URLS[s] || "/img/samples/dress-m.webp";
      searchLook(url, s + " sample dupe", btn);
    });
  });

  // ── Category Story Circles Strip Filtering ───────────────────────────────
  var activeCat = "";

  function filterAllProducts(cat) {
    activeCat = cat || "";
    Array.prototype.forEach.call(document.querySelectorAll("#catRow .cat-circle-card"), function (b) {
      var bCat = b.getAttribute("data-cat") || "";
      var isActive = bCat === activeCat;
      b.classList.toggle("is-active", isActive);
      b.setAttribute("aria-pressed", isActive ? "true" : "false");
    });

    var cards = document.querySelectorAll("#dealRow .p-card, #pickGrid .p-card");
    Array.prototype.forEach.call(cards, function (card) {
      if (!activeCat) {
        card.hidden = false;
        return;
      }
      var cardCat = card.getAttribute("data-cat") || "";
      var cardAud = card.getAttribute("data-audience") || "";
      var price = Number(card.getAttribute("data-price") || 9999);
      var show = false;

      if (activeCat === "women") show = cardAud === "women" || cardCat === "dresses" || cardCat === "ethnic";
      else if (activeCat === "men") show = cardAud === "men" || cardCat === "men";
      else if (activeCat === "under499") show = price <= 499;
      else if (activeCat === "streetwear") show = cardCat === "jeans" || cardCat === "tops" || cardAud === "men";
      else if (activeCat === "ethnic") show = cardCat === "ethnic";
      else if (activeCat === "dresses") show = cardCat === "dresses";
      else if (activeCat === "tops") show = cardCat === "tops";
      else if (activeCat === "jeans") show = cardCat === "jeans";
      else show = cardCat === activeCat;

      card.hidden = !show;
    });

    // Celebrity looks
    Array.prototype.forEach.call(document.querySelectorAll("#slRow .look-card"), function (look) {
      if (!activeCat) {
        look.hidden = false;
        return;
      }
      var cats = " " + (look.getAttribute("data-cats") || "") + " ";
      look.hidden = cats.indexOf(" " + activeCat + " ") < 0;
    });
  }

  Array.prototype.forEach.call(document.querySelectorAll("#catRow .cat-circle-card"), function (btn) {
    btn.addEventListener("click", function () {
      var cat = btn.getAttribute("data-cat") || "";
      filterAllProducts(cat);
      FD.track("category", { cat: cat || "all" });
    });
  });

  // ── Budget Corner Filter Tabs ─────────────────────────────────────────────
  Array.prototype.forEach.call(document.querySelectorAll("#budgetTabs .b-tab"), function (tab) {
    tab.addEventListener("click", function () {
      var budget = tab.getAttribute("data-budget");
      Array.prototype.forEach.call(document.querySelectorAll("#budgetTabs .b-tab"), function (t) {
        var isActive = t === tab;
        t.classList.toggle("is-active", isActive);
        t.setAttribute("aria-selected", isActive ? "true" : "false");
      });
      var cards = document.querySelectorAll("#budgetGrid .p-card");
      Array.prototype.forEach.call(cards, function (c) {
        if (budget === "all") {
          c.hidden = false;
        } else {
          var p = Number(c.getAttribute("data-price") || 9999);
          c.hidden = p > Number(budget);
        }
      });
    });
  });

  // ── Top Search Bar (Both Desktop in Nav & Mobile Strip) ───────────────────
  function setupSearchForm(form) {
    var input = form.querySelector("input[type='text']");
    if (!input) return;

    function handleSearch(query) {
      var q = (query || "").trim().toLowerCase();
      if (!q) {
        filterAllProducts("");
        return;
      }
      // If store link was pasted
      if (/^https?:\/\//i.test(q) || /flipkart\.com|amazon\.in|myntra\.com|ajio\.com/i.test(q)) {
        openUploadDrawer(false);
        var linkForm = document.querySelector("[data-link-form]");
        var linkIn = document.getElementById("linkInput");
        if (linkIn) linkIn.value = query.trim();
        if (linkForm) startLink(linkForm, query.trim());
        return;
      }
      // Use the real search flow for text; editorial cards are not inventory.
      location.href = "/find/?q=" + encodeURIComponent(query.trim());
      return;

    }

    form.addEventListener("submit", function (ev) {
      ev.preventDefault();
      handleSearch(input.value);
    });

    input.addEventListener("input", function () {
      if (!input.value.trim()) {
        filterAllProducts(activeCat);
      }
    });
  }

  Array.prototype.forEach.call(document.querySelectorAll("[data-search-form]"), setupSearchForm);

  // ── Wishlist Heart Toggles ────────────────────────────────────────────────
  Array.prototype.forEach.call(document.querySelectorAll(".p-card-wish, .fd-card-heart, .fd-showcase-heart"), function (btn) {
    var id = btn.getAttribute("data-save-id") || btn.getAttribute("data-wish-id");
    if (!id) return;
    if (FD.saved.has("deal", id)) {
      btn.classList.add("is-active");
      btn.innerHTML = '<svg aria-hidden="true"><use href="#i-heart-fill"/></svg>';
    }
    btn.addEventListener("click", function (ev) {
      ev.preventDefault();
      ev.stopPropagation();
      var card = btn.closest(".p-card, .fd-comparison-card, .fd-showcase-card, .fd-compare-featured-card");
      var title = card ? (card.querySelector(".p-card-name, .fd-card-title, .fd-showcase-title") || {}).textContent || id : id;
      var priceText = card ? (card.querySelector(".p-card-price, .fd-curr-price, .fd-showcase-main-price") || {}).textContent || "" : "";
      var price = Number(priceText.replace(/[^0-9]/g, "")) || 0;
      var brand = card ? (card.querySelector(".p-card-brand, .fd-card-brand, .fd-showcase-brand") || {}).textContent || "" : "";
      var storeEl = card ? card.querySelector(".store-badge, .fd-ret-store, .fd-store-name") : null;
      var storeName = storeEl ? storeEl.textContent.trim() : "Store";
      var img = card ? (card.querySelector("img") || {}).src || "" : "";

      if (FD.saved.has("deal", id)) {
        FD.saved.remove("deal", id);
        btn.classList.remove("is-active");
        btn.innerHTML = '<svg aria-hidden="true"><use href="#i-heart"/></svg>';
        FD.toast("Removed from Saved");
      } else {
        FD.saved.add({
          searchId: "deal",
          key: id,
          title: title,
          brand: brand,
          store: storeName.toLowerCase(),
          storeName: storeName,
          image: img,
          price: price,
          checkedAt: new Date().toISOString(),
          match: "exact"
        });
        btn.classList.add("is-active");
        btn.innerHTML = '<svg aria-hidden="true"><use href="#i-heart-fill"/></svg>';
        FD.toast("Saved on this device");
        FD.track("save", { from: "home_shelf" });
      }
      FD.refreshDots();
    });
  });

  function offerCard(p) {
    var saved = FD.saved.has(p.searchId, p.key);
    var button = el("button.p-card-wish", { type: "button", "aria-label": "Save: " + p.title, "aria-pressed": String(saved), on: { click: function () {
      var has = FD.saved.has(p.searchId, p.key);
      if (has) FD.saved.remove(p.searchId, p.key); else FD.saved.add(p);
      button.setAttribute("aria-pressed", String(!has));
      button.textContent = ""; button.appendChild(FD.icon(has ? "i-heart" : "i-heart-fill"));
      FD.refreshDots(); FD.toast(has ? "Removed from Saved" : "Saved on this device");
    } } }, [FD.icon(saved ? "i-heart-fill" : "i-heart")]);
    return el("article.p-card", null, [
      el("div.p-card-top", null, [el("div.p-card-img-wrap", null, [el("img", { src: p.image, alt: p.title, loading: "lazy", referrerpolicy: "no-referrer" })]), button]),
      el("div.p-card-details", null, [el("small", { text: p.storeName }), el("h3.p-card-name", { text: p.title }),
        el("div.p-card-price-row", null, [el("b.p-card-price", { text: FD.price(p.price) }), p.mrp ? el("s.p-card-mrp", { text: FD.price(p.mrp) }) : null]),
        el("p.editorial-card-note", { text: "Checked " + FD.ago(p.checkedAt) }),
        el("a.btn btn-primary p-card-buy-btn", { href: "/find/" + encodeURIComponent(p.searchId) + "#p-" + encodeURIComponent(p.key), text: "View offer" })
      ])
    ]);
  }
  // Sourced offers replace the editorial fallback only when available.
  FD.api("/api/feed").then(function (data) {
    var deals = data.deals || [];
    var grid = document.getElementById("homeLiveDeals");
    if (grid) {
      deals.slice(0, 8).forEach(function (p) { grid.appendChild(offerCard(p)); });
      grid.hidden = deals.length === 0;
      document.getElementById("dealRow").hidden = deals.length > 0;
      document.getElementById("homeFeedStatus").textContent = deals.length ? "Recent offers · prices may change at checkout" : "Style inspiration · explore matches to check available prices";
    }
    var newest = deals.reduce(function (m, x) { return x.checkedAt > m ? x.checkedAt : m; }, "");
    if (newest && newest > (FD.store.get("fd_deals_seen", "") || "")) {
      FD.store.set("fd_deals_new", true);
      FD.refreshDots();
    }
  }).catch(function () {
    var status = document.getElementById("homeFeedStatus");
    if (status) status.textContent = "Offers could not load. Explore the style searches below.";
  });

  // ── Recent searches on this device ────────────────────────────────────────
  var recent = FD.recent.all().slice(0, 4);
  if (recent.length) {
    var list = document.getElementById("recentList");
    if (list) {
      recent.forEach(function (r) {
        list.appendChild(el("li", null, [el("a", { href: "/find/" + encodeURIComponent(r.id) }, [
          FD.icon(r.kind === "link" ? "i-link" : "i-search"), el("b", { text: r.label }), el("small", { text: FD.ago(r.at) })
        ])]));
      });
      var recentSec = document.getElementById("recent");
      if (recentSec) recentSec.hidden = false;
      var recentClear = document.getElementById("recentClear");
      if (recentClear) {
        recentClear.addEventListener("click", function () {
          FD.recent.clear();
          if (recentSec) recentSec.hidden = true;
        });
      }
    }
  }

  // ── Hero Showcase Carousel Slider ──────────────────────────────────────────
  (function initHeroShowcaseSlider() {
    var wrap = document.getElementById("heroSliderWrap");
    if (!wrap) return;
    var cards = wrap.querySelectorAll(".fd-showcase-card");
    var dots = wrap.querySelectorAll(".fd-slider-dot");
    var prevBtn = document.getElementById("heroSlidePrev");
    var nextBtn = document.getElementById("heroSlideNext");
    if (!cards.length) return;

    var currentIndex = 0;
    var timer = null;

    function goToSlide(index) {
      if (index < 0) index = cards.length - 1;
      if (index >= cards.length) index = 0;
      currentIndex = index;

      for (var i = 0; i < cards.length; i++) {
        if (i === currentIndex) {
          cards[i].classList.add("is-active");
        } else {
          cards[i].classList.remove("is-active");
        }
      }

      for (var j = 0; j < dots.length; j++) {
        if (j === currentIndex) {
          dots[j].classList.add("is-active");
          dots[j].setAttribute("aria-selected", "true");
        } else {
          dots[j].classList.remove("is-active");
          dots[j].setAttribute("aria-selected", "false");
        }
      }
    }

    function startAutoPlay() {
      stopAutoPlay();
      timer = setInterval(function () {
        goToSlide(currentIndex + 1);
      }, 4500);
    }

    function stopAutoPlay() {
      if (timer) {
        clearInterval(timer);
        timer = null;
      }
    }

    Array.prototype.forEach.call(dots, function (dot) {
      dot.addEventListener("click", function () {
        var idx = parseInt(dot.getAttribute("data-dot"), 10);
        if (!isNaN(idx)) {
          goToSlide(idx);
          startAutoPlay();
        }
      });
    });

    if (prevBtn) {
      prevBtn.addEventListener("click", function () {
        goToSlide(currentIndex - 1);
        startAutoPlay();
      });
    }

    if (nextBtn) {
      nextBtn.addEventListener("click", function () {
        goToSlide(currentIndex + 1);
        startAutoPlay();
      });
    }

    wrap.addEventListener("mouseenter", stopAutoPlay);
    wrap.addEventListener("mouseleave", startAutoPlay);

    // Touch swipe for mobile
    var touchStartX = 0;
    wrap.addEventListener("touchstart", function (e) {
      if (e.changedTouches && e.changedTouches[0]) {
        touchStartX = e.changedTouches[0].clientX;
      }
      stopAutoPlay();
    }, { passive: true });

    wrap.addEventListener("touchend", function (e) {
      if (e.changedTouches && e.changedTouches[0]) {
        var touchEndX = e.changedTouches[0].clientX;
        var diff = touchStartX - touchEndX;
        if (Math.abs(diff) > 40) {
          if (diff > 0) goToSlide(currentIndex + 1);
          else goToSlide(currentIndex - 1);
        }
      }
      startAutoPlay();
    }, { passive: true });

    startAutoPlay();
  })();

  // Handle browser Back button and hash
  window.addEventListener("pageshow", function (ev) { if (ev.persisted) reset(); });
})();
