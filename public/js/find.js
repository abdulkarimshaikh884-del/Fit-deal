/* Fit Deal — results page (/find/<id>). */
(function () {
  "use strict";
  var FD = window.FD;
  var el = FD.el;
  var $ = function (id) { return document.getElementById(id); };

  var CATEGORY = { shirt: "Shirt", t_shirt: "T-shirt", top: "Top", dress: "Dress", jeans: "Jeans", kurti: "Kurti", other: "" };
  var SOURCE = { flipkart: "Flipkart API", amazon: "Amazon", serper: "Google Shopping", link: "your link", sample: "demo data, not a real product" };

  var m = location.pathname.match(/^\/find\/([A-Za-z0-9_-]{4,40})\/?$/);
  var id = m ? m[1] : null;
  var data = null;
  var state = { store: "all", max: null, sort: "match", choosing: false, picked: [] };
  var initialBudget = Number(new URLSearchParams(location.search).get("max"));
  if (Number.isFinite(initialBudget) && initialBudget > 0 && initialBudget <= 1000000) {
    state.max = Math.round(initialBudget);
    $("priceMax").value = state.max;
  }

  function showState(name) {
    ["findLoading", "findMissing", "findReady"].forEach(function (s) { $(s).hidden = s !== name; });
  }

  if (!id) {
    showState("findMissing");
    return;
  }

  FD.api("/api/search/" + encodeURIComponent(id)).then(function (res) {
    data = res;
    render();
    showState("findReady");
    FD.track("results_view", { exact: res.exact.length, similar: res.similar.length, kind: res.kind });
    if (location.hash.indexOf("#p-") === 0) {
      var card = document.getElementById(location.hash.slice(1));
      if (card) setTimeout(function () { card.scrollIntoView({ block: "center" }); card.classList.add("is-best"); }, 100);
    }
  }).catch(function (e) {
    $("findMissingText").textContent = e.status === 404
      ? "We couldn't find these results. The link may be incomplete, or the search is more than 90 days old. Start a new search below."
      : e.message;
    showState("findMissing");
  });

  // ── Look card (what we searched for) ─────────────────────────────────────
  function renderLook() {
    var item = data.item || {};
    var img = FD.store.sessionGet("fd_img_" + id);
    var lookImg = $("lookImg");
    // A pasted link has no photo; show the linked product's own image.
    var linked = data.exact.filter(function (p) { return p.fromLink && p.image; })[0];
    if (!img && linked) {
      img = linked.image;
      lookImg.referrerPolicy = "no-referrer";
      lookImg.alt = linked.title;
    }
    if (img) {
      lookImg.src = img;
      lookImg.hidden = false;
    } else if (data.link) {
      $("lookStore").textContent = data.link.storeName;
      $("lookStore").hidden = false;
    } else {
      $("lookImgWrap").hidden = true;
      $("lookImgWrap").closest(".look-card").classList.add("text-look");
    }
    $("lookLabel").textContent = data.kind === "link" ? "From your " + (data.link ? data.link.storeName : "") + " link" : data.kind === "sample" ? "Sample search" : "We looked for";
    $("lookTitle").textContent = item.label || data.query;
    $("findTitle").textContent = item.label ? "Matches for: " + item.label : "Your matches";
    var chips = $("lookChips");
    var bits = [];
    if (CATEGORY[item.category]) bits.push(CATEGORY[item.category]);
    else if (item.otherCategory) bits.push(item.otherCategory);
    (item.colors || []).forEach(function (c) { bits.push(c); });
    if (item.pattern && item.pattern !== "solid") bits.push(item.pattern);
    if (item.fit) bits.push(item.fit);
    if (item.audience === "women" || item.audience === "men") bits.push(item.audience === "women" ? "Women" : "Men");
    if (item.brand) bits.push(item.brand);
    bits.forEach(function (b) { chips.appendChild(el("span.chip", { text: b })); });
    if (item.edited) chips.appendChild(el("span.chip", { text: "your words" }));
    if (item.category === "other") {
      $("similarNote").textContent = "We don't specialise in this kind of clothing yet, so matches may be rougher. " + $("similarNote").textContent;
    }

    // Other pieces from the same photo (kept on this device for 2 hours).
    var other = FD.store.sessionGet("fd_items_" + id);
    if (other && other.items && other.items.length > 1) {
      var oc = $("otherChips");
      other.items.forEach(function (x, i) {
        if (i === other.index) return;
        oc.appendChild(el("button.chip", { type: "button", on: { click: function () { searchOther(other, i, this); } } }, [x.label]));
      });
      $("otherItems").hidden = false;
    }
  }

  function searchOther(other, index, btn) {
    btn.disabled = true;
    FD.toast("Searching for " + other.items[index].label + "…", 6000);
    FD.api("/api/search", { json: { analysisId: other.analysisId, index: index, sample: other.sample } }).then(function (res) {
      FD.store.sessionSet("fd_img_" + res.id, FD.store.sessionGet("fd_img_" + id));
      FD.store.sessionSet("fd_items_" + res.id, { analysisId: other.analysisId, index: index, sample: other.sample, items: other.items });
      FD.recent.add({ id: res.id, label: other.items[index].label, kind: "photo" });
      location.href = "/find/" + res.id;
    }).catch(function (e) {
      btn.disabled = false;
      FD.toast(e.code === "expired" ? "That photo has timed out. Please upload it again." : e.message);
    });
  }

  // ── Refine ───────────────────────────────────────────────────────────────
  function openRefine() {
    $("refineForm").hidden = false;
    $("refineInput").value = data.query;
    $("refineInput").focus();
    $("refineForm").scrollIntoView({ block: "center", behavior: "smooth" });
  }
  $("refineOpen").addEventListener("click", openRefine);
  $("refineCancel").addEventListener("click", function () { $("refineForm").hidden = true; });
  Array.prototype.forEach.call(document.querySelectorAll("[data-refine]"), function (b) { b.addEventListener("click", openRefine); });
  $("refineForm").addEventListener("submit", function (ev) {
    ev.preventDefault();
    var q = $("refineInput").value.trim();
    if (q.length < 3) { FD.toast("Please describe it in a few words."); return; }
    var btn = ev.target.querySelector("button[type=submit]");
    btn.disabled = true;
    FD.track("refine", {});
    FD.api("/api/search", { json: { refine: id, query: q } }).then(function (res) {
      FD.store.sessionSet("fd_img_" + res.id, FD.store.sessionGet("fd_img_" + id));
      FD.recent.add({ id: res.id, label: q, kind: "photo" });
      location.href = "/find/" + res.id;
    }).catch(function (e) { btn.disabled = false; FD.toast(e.message); });
  });

  // ── Products ─────────────────────────────────────────────────────────────
  function allProducts() { return data.exact.concat(data.similar); }

  function filtered(list) {
    var out = list.filter(function (p) {
      if (state.store !== "all" && p.store !== state.store) return false;
      if (state.max && (p.price == null || p.price > state.max)) return false;
      return true;
    });
    if (state.sort === "price") {
      out = out.slice().sort(function (a, b) {
        if (a.price == null) return 1;
        if (b.price == null) return -1;
        return a.price - b.price;
      });
    }
    return out;
  }

  function card(p) {
    var isSaved = FD.saved.has(id, p.key);
    var picked = state.picked.indexOf(p.key);
    var best = data.bestExact === p.key;
    var off = p.mrp && p.price ? Math.round((1 - p.price / p.mrp) * 100) : 0;
    var goUrl = "/go/" + encodeURIComponent(id) + "/" + encodeURIComponent(p.key) + "?from=results";

    var imgBox = el("div.p-img", null, [
      p.image ? el("img", { src: p.image, alt: p.title, loading: "lazy", referrerpolicy: "no-referrer", on: { error: function () { this.replaceWith(el("span.p-noimg", null, [FD.icon("i-image")])); } } }) : el("span.p-noimg", null, [FD.icon("i-image")]),
      el("span.p-store", { text: p.storeName }),
      best ? el("span.p-best", { text: "Best price" }) : null,
      el("button.p-save", {
        type: "button", "aria-pressed": isSaved ? "true" : "false", "aria-label": (isSaved ? "Remove from saved: " : "Save: ") + p.title,
        on: { click: function () { toggleSave(p, this); } }
      }, [FD.icon(isSaved ? "i-heart-fill" : "i-heart")])
    ]);

    var priceRow = p.price != null
      ? el("p.p-price", null, [el("b", { text: FD.price(p.price) }), p.mrp ? el("s", { text: FD.price(p.mrp) }) : null, off >= 5 ? el("em", { text: off + "% off" }) : null])
      : el("p.p-noprice", { text: "See price at " + p.storeName });

    var meta = [];
    if (p.shipping === 0) meta.push(el("span", null, [FD.icon("i-truck"), "Free delivery"]));
    else if (p.shipping > 0 && p.price != null) meta.push(el("span", null, [FD.icon("i-truck"), "+" + FD.price(p.shipping) + " delivery · " + FD.price(p.price + p.shipping) + " total"]));
    if (p.inStock === false) meta.push(el("span.oos", { text: "Out of stock when checked" }));
    if (p.checkedAt && p.price != null) meta.push(el("span", null, [FD.icon("i-clock"), "Checked " + FD.time(p.checkedAt) + (SOURCE[p.provider] ? " · " + SOURCE[p.provider] : "")]));

    var node = el("article.p-card" + (best ? " is-best" : "") + (picked >= 0 ? " is-picked" : ""), { id: "p-" + p.key }, [
      imgBox,
      el("div.p-body", null, [
        p.match === "exact" ? el("p.p-exact", null, [el("span.badge badge-exact", { text: "Exact" }), p.reason || ""]) : null,
        p.brand ? el("p.p-brand", { text: p.brand }) : null,
        el("p.p-title", { text: p.title }),
        priceRow,
        meta.length ? el("p.p-meta", null, meta) : null,
        el("div.p-buy", null, [
          el("a.btn btn-primary", { href: goUrl, target: "_blank", rel: "sponsored noopener" }, ["Buy at " + p.storeName, FD.icon("i-external")])
        ]),
        el("div.p-tools", null, [
          el("button", { type: "button", on: { click: function () { shareProduct(p); } } }, [FD.icon("i-share"), "Share"]),
          el("button", { type: "button", on: { click: function () { openReport(p); } } }, [FD.icon("i-flag"), "Wrong match?"])
        ])
      ])
    ]);

    if (state.choosing) {
      node.appendChild(el("button.p-pick", {
        type: "button", "aria-pressed": picked >= 0 ? "true" : "false", "aria-label": "Pick for vote: " + p.title,
        on: { click: function () { togglePick(p.key); } }
      }, [el("span", { text: picked >= 0 ? String.fromCharCode(65 + picked) : "" })]));
    }
    return node;
  }

  function renderGrids() {
    var exact = filtered(data.exact);
    var similar = filtered(data.similar);
    var ex = $("exactGrid"), si = $("similarGrid");
    ex.textContent = "";
    si.textContent = "";
    exact.forEach(function (p) { ex.appendChild(card(p)); });
    similar.forEach(function (p) { si.appendChild(card(p)); });
    $("exactSection").hidden = !exact.length;
    $("similarSection").hidden = !similar.length;
    var none = !data.exact.length && !data.similar.length;
    $("noResults").hidden = !none;
    $("filteredOut").hidden = none || exact.length + similar.length > 0;
    $("findBar").hidden = none;
    Array.prototype.forEach.call(document.querySelectorAll("[data-choose]"), function (b) {
      b.closest(".card").hidden = allProducts().length < 2;
    });
  }

  function renderFilters() {
    var counts = {};
    allProducts().forEach(function (p) { counts[p.store] = (counts[p.store] || 0) + 1; });
    var names = {};
    allProducts().forEach(function (p) { names[p.store] = p.storeName; });
    var row = $("storeFilter");
    row.textContent = "";
    var keys = ["all"].concat(Object.keys(counts));
    if (keys.length <= 2) { row.hidden = true; return; }
    keys.forEach(function (k) {
      row.appendChild(el("button", {
        type: "button", "aria-pressed": state.store === k ? "true" : "false",
        on: { click: function () { state.store = k; renderFilters(); renderGrids(); } }
      }, [k === "all" ? "All stores" : names[k], k === "all" ? null : el("small", { text: String(counts[k]) })]));
    });
  }

  function renderDeal() {
    var deal = null, label = "Best price", note = "";
    if (data.bestExact) {
      deal = data.exact.filter(function (p) { return p.key === data.bestExact; })[0];
      note = "Same product · " + (deal ? deal.storeName : "");
    } else {
      var priced = data.similar.filter(function (p) { return p.price != null && p.inStock !== false; });
      priced.sort(function (a, b) { return a.price - b.price; });
      deal = priced[0];
      label = "Lowest price";
      note = "Similar look · " + (deal ? deal.storeName : "");
    }
    if (!deal) return;
    $("dealLabel").textContent = label;
    $("dealPrice").textContent = FD.price(deal.price);
    $("dealName").textContent = note;
    $("bestDeal").href = "#p-" + deal.key;
    $("bestDeal").hidden = false;
    $("bestDeal").addEventListener("click", function (ev) {
      var c = document.getElementById("p-" + deal.key);
      if (!c) return;
      ev.preventDefault();
      state.store = "all"; state.max = null; $("priceMax").value = "";
      renderFilters(); renderGrids();
      c = document.getElementById("p-" + deal.key);
      c.scrollIntoView({ behavior: "smooth", block: "center" });
      c.querySelector(".btn").focus({ preventScroll: true });
    });
  }

  function renderStores() {
    $("storeQuery").textContent = data.query;
    var row = $("storeLinks");
    (data.storeLinks || []).forEach(function (s) {
      row.appendChild(el("a", { href: "/go/" + encodeURIComponent(id) + "/store/" + s.store, target: "_blank", rel: "sponsored noopener" }, [s.name, FD.icon("i-external")]));
    });
  }

  function renderSources() {
    var s = data.sources || [];
    var text;
    if (!s.length) {
      text = "Live product search isn't connected yet, so we can only show store searches for now.";
    } else {
      var ok = s.filter(function (x) { return x.ok; }).map(function (x) { return x.label; });
      var bad = s.filter(function (x) { return !x.ok; }).map(function (x) { return x.label; });
      text = (ok.length ? "Prices from " + ok.join(", ") + ". " : "") + (bad.length ? bad.join(", ") + " didn't answer this time. " : "") + "Searched " + FD.time(data.searchedAt) + ".";
    }
    $("sources").textContent = text;
    if (!data.exact.length && !data.similar.length && !s.length) {
      $("noResultsText").textContent = "Live product search isn't connected yet. You can still search the stores directly with the same words below.";
    }
  }

  function render() {
    renderLook();
    renderFilters();
    renderGrids();
    renderDeal();
    renderStores();
    renderSources();
    var url = location.origin + "/find/" + id;
    FD.wireShare({ url: url, text: "Explore this look on Fit Deal: " + (data.item && data.item.label ? data.item.label : "outfit"), what: "results" });
  }

  $("priceMax").addEventListener("input", function () {
    var v = Number(this.value);
    state.max = v > 0 ? v : null;
    renderGrids();
  });
  $("sortBy").addEventListener("change", function () { state.sort = this.value; renderGrids(); });
  $("clearFilters").addEventListener("click", function () {
    state.store = "all"; state.max = null; $("priceMax").value = "";
    renderFilters(); renderGrids();
  });

  // ── Save / share ─────────────────────────────────────────────────────────
  function toggleSave(p, btn) {
    if (FD.saved.has(id, p.key)) {
      FD.saved.remove(id, p.key);
      FD.toast("Removed from Saved");
      FD.track("unsave", {});
    } else {
      var ok = FD.saved.add({
        searchId: id, key: p.key, title: p.title, brand: p.brand, store: p.store, storeName: p.storeName,
        image: p.image, price: p.price, checkedAt: p.checkedAt, match: p.match
      });
      FD.toast(ok ? "Saved on this device" : "Couldn't save: your browser is blocking storage.");
      FD.track("save", { match: p.match, store: p.store });
    }
    var on = FD.saved.has(id, p.key);
    btn.setAttribute("aria-pressed", on ? "true" : "false");
    btn.setAttribute("aria-label", (on ? "Remove from saved: " : "Save: ") + p.title);
    btn.replaceChild(FD.icon(on ? "i-heart-fill" : "i-heart"), btn.firstChild);
    FD.refreshDots();
  }

  function shareProduct(p) {
    var url = location.origin + "/find/" + id + "#p-" + p.key;
    var text = p.title + (p.price != null ? " for " + FD.price(p.price) : "") + " at " + p.storeName + ", found on Fit Deal";
    if (navigator.share) {
      navigator.share({ title: p.title, text: text, url: url }).then(function () { FD.track("share", { via: "native", what: "product" }); }, function () {});
    } else {
      FD.copy(url).then(function () { FD.toast("Link copied"); }, function () { FD.toast("Couldn't copy the link."); });
      FD.track("share", { via: "copy", what: "product" });
    }
  }

  // ── Wrong match report ───────────────────────────────────────────────────
  var reporting = null;
  function openReport(p) {
    reporting = p;
    $("reportProduct").textContent = p.title + " · " + p.storeName;
    $("reportForm").reset();
    var r = $("reportForm").querySelector('input[value="' + (p.match === "exact" ? "not_same" : "wrong_item") + '"]');
    if (r) r.checked = true;
    $("reportSheet").showModal();
  }
  $("reportClose").addEventListener("click", function () { $("reportSheet").close(); });
  $("reportForm").addEventListener("submit", function (ev) {
    ev.preventDefault();
    var f = new FormData(ev.target);
    $("reportSheet").close();
    FD.api("/api/report", { json: { searchId: id, key: reporting && reporting.key, reason: f.get("reason"), note: f.get("note") } })
      .then(function () { FD.toast("Thanks! We'll check this result."); }, function (e) { FD.toast(e.message); });
  });

  // ── Help me choose ───────────────────────────────────────────────────────
  function setChoosing(on) {
    state.choosing = on;
    state.picked = [];
    $("chooseBar").hidden = !on;
    updateChooseBar();
    renderGrids();
    if (on) {
      $("chooseBar").scrollIntoView({ behavior: "smooth", block: "start" });
      FD.toast("Tap 2 or 3 products to pick them");
    }
  }
  function togglePick(key) {
    var i = state.picked.indexOf(key);
    if (i >= 0) state.picked.splice(i, 1);
    else if (state.picked.length < 3) state.picked.push(key);
    else FD.toast("You can pick up to 3");
    updateChooseBar();
    renderGrids();
  }
  function updateChooseBar() {
    $("chooseCount").textContent = String(state.picked.length);
    $("chooseGo").disabled = state.picked.length < 2;
  }
  Array.prototype.forEach.call(document.querySelectorAll("[data-choose]"), function (b) {
    b.addEventListener("click", function () { setChoosing(true); });
  });
  $("chooseCancel").addEventListener("click", function () { setChoosing(false); });
  $("chooseGo").addEventListener("click", function () { $("voteSheet").showModal(); });
  $("voteSheetClose").addEventListener("click", function () { $("voteSheet").close(); });
  $("voteForm").addEventListener("submit", function (ev) {
    ev.preventDefault();
    var btn = ev.target.querySelector("button[type=submit]");
    btn.disabled = true;
    var name = new FormData(ev.target).get("name");
    FD.api("/api/vote", { json: { searchId: id, keys: state.picked, name: name } }).then(function (res) {
      var mine = FD.store.get("fd_myvotes", []);
      mine.unshift(res.id);
      FD.store.set("fd_myvotes", mine.slice(0, 50));
      location.href = "/vote/" + res.id + "?new=1";
    }).catch(function (e) {
      btn.disabled = false;
      FD.toast(e.message);
    });
  });
})();
