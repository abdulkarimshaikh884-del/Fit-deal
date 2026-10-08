/* Fit Deal — Upgraded Deals & Multi-Store Comparison Dashboard */
(function () {
  "use strict";
  var FD = window.FD;
  var el = FD.el;
  var $ = function (id) { return document.getElementById(id); };

  var state = {
    deals: [],
    store: "all",
    category: "all",
    priceRange: "all",
    sortBy: "discount"
  };

  var STORE_NAMES = {
    flipkart: "Flipkart",
    amazon: "Amazon",
    myntra: "Myntra",
    ajio: "AJIO"
  };

  function formatPrice(p) {
    if (p == null) return "Check Store";
    return FD.price ? FD.price(p) : ("₹" + p);
  }

  function createDealCard(d) {
    var isSaved = FD.saved && FD.saved.has ? (d.searchId ? FD.saved.has(d.searchId, d.key) : FD.saved.all().some(function(s) { return s.key === d.key; })) : false;
    var lowestStore = d.store || "flipkart";
    var lowestStoreName = d.storeName || STORE_NAMES[lowestStore] || "Store";
    var buyUrl = d.searchId ? ("/go/" + encodeURIComponent(d.searchId) + "/" + encodeURIComponent(d.key) + "?from=deals") : ("/go/deal/" + encodeURIComponent(d.key));

    var detailUrl = d.searchId ? "/product/" + encodeURIComponent(d.searchId) + "/" + encodeURIComponent(d.key) : buyUrl;

    // Store comparison chips
    var storeChips = [];
    if (d.stores && Array.isArray(d.stores) && d.stores.length > 0) {
      storeChips = d.stores.map(function (s) {
        var storeClass = "fd-store-chip " + (s.isLowest ? "is-lowest" : "is-other");
        return el("div", { className: storeClass }, [
          el("span.chip-name", { text: s.storeName || STORE_NAMES[s.store] || s.store }),
          el("span.chip-price", { text: formatPrice(s.price) }),
          s.isLowest ? el("span.chip-tag", { text: "Lowest" }) : null
        ]);
      });
    }

    var cardEl = el("div.fd-deal-card", { "data-key": d.key }, [
      // Top image container
      el("div.fd-dc-media", null, [
        el("a.fd-dc-img-link", { href: detailUrl }, [
          el("img.fd-dc-img", {
            src: d.image,
            alt: d.title,
            loading: "lazy",
            referrerpolicy: "no-referrer",
            on: {
              error: function () {
                this.src = "https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=600&auto=format&fit=crop&q=80";
              }
            }
          })
        ]),
        d.off ? el("span.fd-dc-badge", { text: d.off + "% OFF" }) : null,
        d.highlight ? el("span.fd-dc-highlight", { text: d.highlight }) : null,
        el("button.fd-dc-heart", {
          type: "button",
          "aria-label": isSaved ? "Remove from saved" : "Save deal",
          "aria-pressed": isSaved ? "true" : "false",
          className: "fd-dc-heart" + (isSaved ? " is-active" : ""),
          on: {
            click: function (e) {
              e.preventDefault();
              e.stopPropagation();
              var currentlySaved = this.classList.contains("is-active");
              if (currentlySaved) {
                this.classList.remove("is-active");
                this.setAttribute("aria-pressed", "false");
                if (FD.saved) FD.saved.remove(d.searchId || "deals", d.key);
                FD.toast("Removed from Saved");
              } else {
                this.classList.add("is-active");
                this.setAttribute("aria-pressed", "true");
                if (FD.saved) {
                  FD.saved.add({
                    searchId: d.searchId || "deals",
                    key: d.key,
                    title: d.title,
                    brand: d.brand,
                    store: d.store,
                    storeName: lowestStoreName,
                    image: d.image,
                    price: d.price,
                    mrp: d.mrp,
                    url: buyUrl
                  });
                }
                FD.toast("Saved to your looks!");
              }
              if (FD.auth && FD.auth.syncLocalToCloud) {
                FD.auth.syncLocalToCloud();
              }
              if (FD.refreshDots) FD.refreshDots();
            }
          }
        }, [
          el("svg", { "aria-hidden": "true" }, [el("use", { href: "#i-heart" })])
        ])
      ]),

      // Content section
      el("div.fd-dc-body", null, [
        d.brand ? el("span.fd-dc-brand", { text: d.brand }) : null,
        el("h3.fd-dc-title", null, [
          el("a", { href: detailUrl, text: d.title })
        ]),

        // Price block
        el("div.fd-dc-price-row", null, [
          el("span.fd-dc-price", { text: formatPrice(d.price) }),
          d.mrp ? el("s.fd-dc-mrp", { text: formatPrice(d.mrp) }) : null,
          d.savings ? el("span.fd-dc-savings", { text: "Save " + formatPrice(d.savings) }) : null
        ]),

        // Multi-store comparison block
        storeChips.length > 0 ? el("div.fd-dc-compare-box", null, [
          el("p.compare-box-label", { text: "Compare Store Prices:" }),
          el("div.compare-box-chips", null, storeChips)
        ]) : null,

        // CTA Button
        el("div.fd-dc-footer", null, [
          el("a.btn.btn-primary.btn-block.fd-dc-buy-btn", {
            href: buyUrl,
            target: "_blank",
            rel: "noopener sponsored"
          }, [
            el("span", { text: "Buy on " + lowestStoreName }),
            el("svg.buy-ext-ico", { "aria-hidden": "true" }, [el("use", { href: "#i-external" })])
          ]),
          el("div.fd-dc-meta-strip", null, [
            el("span.fd-dc-check", null, [
              el("svg", { "aria-hidden": "true" }, [el("use", { href: "#i-check-plain" })]),
              el("span", { text: "Verified price" })
            ]),
            el("span.fd-dc-store-tag", { text: lowestStoreName })
          ])
        ])
      ])
    ]);

    return cardEl;
  }

  function filterDeals() {
    var list = state.deals.slice();

    // 1. Store Filter
    if (state.store !== "all") {
      list = list.filter(function (d) {
        if (d.store === state.store) return true;
        if (d.stores && Array.isArray(d.stores)) {
          return d.stores.some(function (s) { return s.store === state.store; });
        }
        return false;
      });
    }

    // 2. Category Filter
    if (state.category !== "all") {
      list = list.filter(function (d) {
        var cat = (d.category || "").toLowerCase();
        var aud = (d.audience || "").toLowerCase();
        var tit = (d.title || "").toLowerCase();
        var sc = state.category.toLowerCase();

        if (sc === "women") return aud === "women" || cat.includes("women") || cat.includes("dress") || cat.includes("ethnic") || cat.includes("saree") || cat.includes("kurti") || tit.includes("women") || tit.includes("dress");
        if (sc === "men") return aud === "men" || cat.includes("men") || tit.includes("men") || tit.includes("shirt");
        if (sc === "ethnic") return cat.includes("ethnic") || cat.includes("kurta") || cat.includes("kurti") || cat.includes("saree") || tit.includes("kurta") || tit.includes("saree") || tit.includes("anarkali");
        if (sc === "western" || sc === "dresses") return cat.includes("western") || cat.includes("dress") || cat.includes("jean") || cat.includes("top") || tit.includes("dress") || tit.includes("jeans") || tit.includes("top") || tit.includes("jacket");
        if (sc === "shoes" || sc === "footwear") return cat.includes("shoe") || cat.includes("sneaker") || cat.includes("footwear") || tit.includes("sneaker") || tit.includes("shoe");
        if (sc === "bags" || sc === "luggage") return cat.includes("bag") || cat.includes("luggage") || cat.includes("tote") || cat.includes("satchel") || cat.includes("trolley") || tit.includes("bag") || tit.includes("trolley") || tit.includes("handbag");
        if (sc === "watches") return cat.includes("watch") || tit.includes("watch");
        if (sc === "sunglasses") return cat.includes("sunglass") || tit.includes("sunglass") || tit.includes("aviator");
        if (sc === "accessories") return cat.includes("access") || cat.includes("watch") || cat.includes("sunglass") || cat.includes("bag") || tit.includes("pendant") || tit.includes("jewellery") || tit.includes("wallet");
        if (sc === "beauty") return cat.includes("beauty") || cat.includes("makeup") || cat.includes("lipstick") || cat.includes("serum") || tit.includes("lipstick") || tit.includes("serum") || tit.includes("beard");
        if (sc === "sportswear") return cat.includes("sport") || cat.includes("track") || cat.includes("gym") || tit.includes("track") || tit.includes("training") || tit.includes("running");
        if (sc === "brands") return !!d.brand;
        return cat.includes(sc) || tit.includes(sc);
      });
    }

    // 3. Price Filter
    if (state.priceRange !== "all") {
      list = list.filter(function (d) {
        var p = d.price || 0;
        if (state.priceRange === "under500") return p < 500;
        if (state.priceRange === "under1000") return p < 1000;
        if (state.priceRange === "under2000") return p < 2000;
        return true;
      });
    }

    // 4. Sort
    list.sort(function (a, b) {
      if (state.sortBy === "discount") {
        return (b.off || 0) - (a.off || 0);
      }
      if (state.sortBy === "price-asc") {
        return (a.price || 0) - (b.price || 0);
      }
      if (state.sortBy === "price-desc") {
        return (b.price || 0) - (a.price || 0);
      }
      if (state.sortBy === "savings") {
        return (b.savings || 0) - (a.savings || 0);
      }
      return 0;
    });

    return list;
  }

  var CAT_LABELS = {
    all: "All Fashion",
    women: "Women's Fashion",
    men: "Men's Fashion",
    ethnic: "Ethnic Wear",
    western: "Western Wear",
    dresses: "Western Dresses",
    footwear: "Footwear & Shoes",
    shoes: "Footwear & Shoes",
    bags: "Bags & Luggage",
    watches: "Watches",
    sunglasses: "Sunglasses",
    accessories: "Fashion Accessories",
    beauty: "Beauty & Grooming",
    sportswear: "Sportswear",
    brands: "Top Brands"
  };

  function updateUrlParams() {
    try {
      var p = new URLSearchParams();
      if (state.category && state.category !== "all") p.set("cat", state.category);
      if (state.store && state.store !== "all") p.set("store", state.store);
      if (state.priceRange && state.priceRange !== "all") p.set("price", state.priceRange);
      var qs = p.toString();
      var newUrl = location.pathname + (qs ? ("?" + qs) : "");
      window.history.replaceState(null, "", newUrl);
    } catch (e) {}
  }

  function syncFilterPillStates() {
    Array.prototype.forEach.call(document.querySelectorAll("#storeFilterGroup button"), function (b) {
      b.classList.toggle("is-active", b.getAttribute("data-store") === state.store);
    });
    Array.prototype.forEach.call(document.querySelectorAll("#catFilterGroup button"), function (b) {
      b.classList.toggle("is-active", b.getAttribute("data-cat") === state.category);
    });
  }

  function render() {
    var filtered = filterDeals();
    var grid = $("dealGrid");
    var empty = $("dealsEmpty");
    var countTitle = $("dealsCountTitle");

    grid.textContent = "";

    if (countTitle) {
      if (state.category !== "all") {
        countTitle.textContent = "Showing " + filtered.length + " verified deals in " + (CAT_LABELS[state.category] || state.category);
      } else {
        countTitle.textContent = "Showing " + filtered.length + " verified fashion deals";
      }
    }

    if (filtered.length === 0) {
      empty.hidden = false;
    } else {
      empty.hidden = true;
      filtered.forEach(function (d) {
        grid.appendChild(createDealCard(d));
      });
    }
  }

  // Read URL query params on initial page load
  try {
    var urlParams = new URLSearchParams(location.search);
    var initCat = urlParams.get("cat") || urlParams.get("category");
    var initStore = urlParams.get("store");
    if (initCat) state.category = initCat.toLowerCase();
    if (initStore) state.store = initStore.toLowerCase();
  } catch (e) {}

  // ── Store Buttons ───────────────────────────────────────────────────────
  Array.prototype.forEach.call(document.querySelectorAll("#storeFilterGroup button"), function (btn) {
    btn.addEventListener("click", function () {
      state.store = btn.getAttribute("data-store");
      syncFilterPillStates();
      updateUrlParams();
      render();
    });
  });

  // ── Category Pills ──────────────────────────────────────────────────────
  Array.prototype.forEach.call(document.querySelectorAll("#catFilterGroup button"), function (btn) {
    btn.addEventListener("click", function () {
      state.category = btn.getAttribute("data-cat");
      syncFilterPillStates();
      updateUrlParams();
      render();
    });
  });

  // ── Budget Pills ────────────────────────────────────────────────────────
  Array.prototype.forEach.call(document.querySelectorAll("#priceFilterGroup button"), function (btn) {
    btn.addEventListener("click", function () {
      state.priceRange = btn.getAttribute("data-price");
      Array.prototype.forEach.call(document.querySelectorAll("#priceFilterGroup button"), function (b) {
        b.classList.toggle("is-active", b === btn);
      });
      render();
    });
  });

  // ── Sort Dropdown ───────────────────────────────────────────────────────
  var sortSelect = $("dealsSortSelect");
  if (sortSelect) {
    sortSelect.addEventListener("change", function () {
      state.sortBy = this.value;
      render();
    });
  }

  // ── Reset Filters ───────────────────────────────────────────────────────
  var resetBtn = $("resetDealsFilterBtn");
  if (resetBtn) {
    resetBtn.addEventListener("click", function () {
      state.store = "all";
      state.category = "all";
      state.priceRange = "all";
      state.sortBy = "discount";
      if (sortSelect) sortSelect.value = "discount";

      Array.prototype.forEach.call(document.querySelectorAll("#storeFilterGroup button"), function (b) {
        b.classList.toggle("is-active", b.getAttribute("data-store") === "all");
      });
      Array.prototype.forEach.call(document.querySelectorAll("#catFilterGroup button"), function (b) {
        b.classList.toggle("is-active", b.getAttribute("data-cat") === "all");
      });
      Array.prototype.forEach.call(document.querySelectorAll("#priceFilterGroup button"), function (b) {
        b.classList.toggle("is-active", b.getAttribute("data-price") === "all");
      });
      render();
    });
  }

  // ── Initial Data Load ───────────────────────────────────────────────────
  Promise.all([
    FD.api("/api/deals").catch(function () { return { deals: [] }; }),
    FD.api("/api/feed").catch(function () { return { deals: [] }; })
  ]).then(function (results) {
    var curated = (results[0] && results[0].deals) || [];
    var live = (results[1] && results[1].deals) || [];

    // Merge curated and live deals, avoiding duplicates by key
    var seenKeys = new Set();
    var allDeals = [];

    curated.forEach(function (d) {
      seenKeys.add(d.key);
      allDeals.push(d);
    });

    live.forEach(function (d) {
      if (!seenKeys.has(d.key)) {
        seenKeys.add(d.key);
        allDeals.push(d);
      }
    });

    state.deals = allDeals;
    syncFilterPillStates();
    render();

    FD.store.set("fd_deals_seen", new Date().toISOString());
    FD.store.set("fd_deals_new", false);
    if (FD.refreshDots) FD.refreshDots();
    if (FD.track) FD.track("deals_view", { count: allDeals.length });
  }).catch(function (err) {
    var grid = $("dealGrid");
    if (grid) grid.textContent = "";
    $("dealsEmptyTitle").textContent = "Couldn't load deals right now";
    $("dealsEmptyText").textContent = err.message || "Please refresh the page.";
    $("dealsEmpty").hidden = false;
  });
})();
