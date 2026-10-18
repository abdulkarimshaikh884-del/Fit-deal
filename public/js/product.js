// Fit Deal: Dedicated Product Detail & Cross-Store Price Comparison controller.
(function () {
  "use strict";

  var $ = function (id) { return document.getElementById(id); };
  var el = FD.el;

  var parts = location.pathname.split("/").filter(Boolean);
  // URL pattern: /product/:searchId/:productKey
  var searchId = parts[1] || "";
  var productKey = parts[2] || "";

  if (!searchId || !productKey) {
    showMissing("Invalid product link. Please search for an outfit first.");
    return;
  }

  var STORES = {
    amazon: "Amazon",
    flipkart: "Flipkart",
    myntra: "Myntra",
    ajio: "AJIO"
  };

  var state = {
    search: null,
    product: null,
    searchId: searchId,
    productKey: productKey
  };

  function showMissing(msg) {
    $("prodLoading").hidden = true;
    $("prodReady").hidden = true;
    if (msg) $("prodMissingText").textContent = msg;
    $("prodMissing").hidden = false;
  }

  function renderProduct(p) {
    document.title = p.title + " — " + (p.price ? "₹" + p.price.toLocaleString("en-IN") : "Best Price") + " on " + p.storeName + " | Fit Deal";

    // Recently Viewed (this device only): record every product detail view so
    // the home "Recently Viewed" rail actually fills.
    try {
      FD.viewed.add({
        searchId: searchId,
        key: p.key || productKey,
        title: p.title,
        brand: p.brand || "",
        image: p.image || "",
        price: typeof p.price === "number" ? p.price : null,
        storeName: p.storeName || "",
        url: location.pathname
      });
    } catch (e) { /* viewing history must never break the page */ }

    // Back link
    $("prodBackLink").href = isDealPage ? "/deals/" : "/find/" + encodeURIComponent(searchId);

    // Image
    var img = $("prodImg");
    if (p.image) {
      img.src = p.image;
      img.alt = p.title;
      img.onerror = function () {
        this.replaceWith(el("div.p-noimg-lg", null, [FD.icon("i-image")]));
      };
    } else {
      img.replaceWith(el("div.p-noimg-lg", null, [FD.icon("i-image")]));
    }

    $("prodStoreBadge").textContent = p.storeName;

    // Match status
    var badge = $("prodMatchBadge");
    if (isDealPage) {
      badge.className = "badge badge-exact";
      badge.textContent = "Curated deal";
      $("prodMatchReason").textContent = " — Hand-picked price comparison";
    } else if (p.match === "exact") {
      badge.className = "badge badge-exact";
      badge.textContent = "Exact Match";
      $("prodMatchReason").textContent = p.reason ? " — " + p.reason : " — Confirmed same product";
    } else {
      badge.className = "badge badge-similar";
      badge.textContent = "Similar Match";
      $("prodMatchReason").textContent = " — Close in style and cut";
    }

    // Brand & title
    if (p.brand) {
      $("prodBrand").textContent = p.brand;
      $("prodBrand").hidden = false;
    } else {
      $("prodBrand").hidden = true;
    }
    $("prodTitle").textContent = p.title;

    // Price
    if (p.price != null) {
      $("prodPrice").textContent = FD.price(p.price);
      if (p.mrp && p.mrp > p.price) {
        $("prodMrp").textContent = FD.price(p.mrp);
        $("prodMrp").hidden = false;
        var off = Math.round((1 - p.price / p.mrp) * 100);
        if (off >= 5) {
          $("prodOff").textContent = off + "% OFF";
          $("prodOff").hidden = false;
        }
      }
    } else {
      $("prodPrice").textContent = "See price at " + p.storeName;
    }

    // Shipping & Freshness
    if (p.shipping === 0) {
      $("prodShipping").textContent = "Free delivery";
      $("prodShipping").hidden = false;
    } else if (p.shipping > 0 && p.price != null) {
      $("prodShipping").textContent = "+" + FD.price(p.shipping) + " delivery (" + FD.price(p.price + p.shipping) + " total)";
      $("prodShipping").hidden = false;
    }

    if (p.checkedAt && !isDealPage) {
      $("prodCheckedAt").textContent = "Verified " + FD.time(p.checkedAt);
    } else {
      $("prodFreshness").hidden = true;
    }

    // Primary CTA
    var buyBtn = $("prodBuyBtn");
    buyBtn.href = isDealPage
      ? "/go/deal/" + encodeURIComponent(p.key) + "?from=product_detail"
      : "/go/" + encodeURIComponent(searchId) + "/" + encodeURIComponent(p.key) + "?from=product_detail";
    $("prodBuyStoreName").textContent = p.storeName;

    // Save button
    updateSaveState(p);
    $("prodSaveBtn").onclick = function () {
      toggleSave(p);
    };

    // Social Sharing
    var shareUrl = location.href;
    var shareMsg = "Found this on Fit Deal: " + p.title + " for " + (p.price ? "₹" + p.price.toLocaleString("en-IN") : "great price") + " at " + p.storeName + "\n" + shareUrl;
    $("prodShareWa").href = "https://api.whatsapp.com/send?text=" + encodeURIComponent(shareMsg);

    $("prodShareCopy").onclick = function () {
      if (navigator.clipboard) {
        navigator.clipboard.writeText(shareUrl).then(function () {
          FD.toast("Product link copied to clipboard!");
        }).catch(function () {
          FD.toast("Link: " + shareUrl);
        });
      } else {
        FD.toast("Link: " + shareUrl);
      }
      FD.track("share", { key: p.key, method: "copy" });
    };

    // Report
    $("prodReportBtn").onclick = function () {
      openReport(p);
    };

    renderComparisonTable(p, state.search);

    $("prodLoading").hidden = true;
    $("prodReady").hidden = false;
  }

  function updateSaveState(p) {
    var isSaved = FD.saved.has(searchId, p.key);
    var btn = $("prodSaveBtn");
    btn.setAttribute("aria-pressed", isSaved ? "true" : "false");
    $("prodSaveText").textContent = isSaved ? "Saved" : "Save";
    var ico = $("prodSaveIco").querySelector("use");
    if (ico) ico.setAttribute("href", isSaved ? "#i-heart-fill" : "#i-heart");
  }

  function toggleSave(p) {
    var isSaved = FD.saved.has(searchId, p.key);
    if (isSaved) {
      FD.saved.remove(searchId, p.key);
      FD.toast("Removed from saved items");
      FD.track("unsave", { key: p.key });
    } else {
      FD.saved.add({
        searchId: searchId,
        key: p.key,
        title: p.title,
        brand: p.brand,
        store: p.store,
        storeName: p.storeName,
        image: p.image,
        price: p.price,
        checkedAt: p.checkedAt,
        match: p.match
      });
      FD.toast("Saved to your device");
      FD.track("save", { key: p.key });
    }
    updateSaveState(p);
  }

  function renderComparisonTable(currentProduct, searchData) {
    var tbody = $("compareBody");
    tbody.textContent = "";

    var allProds = (searchData.exact || []).concat(searchData.similar || []);
    var storeKeys = ["amazon", "flipkart", "myntra", "ajio"];

    storeKeys.forEach(function (sk) {
      var storeName = STORES[sk] || sk;
      var tr = document.createElement("tr");

      if (sk === currentProduct.store) {
        // This is the active product deal
        tr.className = "row-current-deal";
        tr.innerHTML = [
          '<td><span class="store-badge-cell"><strong>' + FD.esc(currentProduct.storeName) + '</strong> <em class="current-deal-tag">This Deal</em></span></td>',
          '<td><strong class="compare-price">' + (currentProduct.price != null ? FD.price(currentProduct.price) : "See store") + '</strong></td>',
          '<td><span class="diff-badge diff-selected">Selected</span></td>',
          '<td><span class="compare-status">' + (currentProduct.match === "exact" ? "Exact match" : "Similar") + (currentProduct.checkedAt ? " · " + FD.time(currentProduct.checkedAt) : "") + '</span></td>',
          '<td><a href="' + buyHref(currentProduct.key, sk) + '" target="_blank" rel="sponsored noopener" class="btn btn-primary btn-sm">Buy Deal <svg class="btn-sm-ico" aria-hidden="true"><use href="#i-external"/></svg></a></td>'
        ].join("");
      } else {
        // Find best match in that store
        var candidates = allProds.filter(function (x) { return x.store === sk; });
        var bestMatch = candidates.filter(function (x) { return x.match === "exact"; })[0];
        if (!bestMatch && candidates.length) {
          // Sort by price
          var priced = candidates.slice().sort(function (a, b) {
            if (a.price == null) return 1;
            if (b.price == null) return -1;
            return a.price - b.price;
          });
          bestMatch = priced[0];
        }

        if (bestMatch) {
          var diffHtml = "–";
          // Search-level "exact" means exact to the original query item, not
          // necessarily the currently selected product. Do not imply savings
          // across different styles or variants.
          var sameIdentity = !!(currentProduct.gtin && bestMatch.gtin && currentProduct.gtin === bestMatch.gtin);
          if (sameIdentity && currentProduct.price != null && bestMatch.price != null) {
            var diff = bestMatch.price - currentProduct.price;
            if (diff < 0) {
              diffHtml = '<span class="diff-badge diff-cheaper">₹' + Math.abs(diff).toLocaleString("en-IN") + ' cheaper</span>';
            } else if (diff > 0) {
              diffHtml = '<span class="diff-badge diff-more">+₹' + diff.toLocaleString("en-IN") + ' more</span>';
            } else {
              diffHtml = '<span class="diff-badge diff-same">Same price</span>';
            }
          }

          var matchLabel = sameIdentity ? "Same barcode" : "Other search result · verify variant";
          tr.innerHTML = [
            '<td><span class="store-badge-cell">' + FD.esc(bestMatch.storeName) + '</span></td>',
            '<td><strong class="compare-price">' + (bestMatch.price != null ? FD.price(bestMatch.price) : "See store") + '</strong></td>',
            '<td>' + diffHtml + '</td>',
            '<td><span class="compare-status">' + matchLabel + (bestMatch.checkedAt ? " · " + FD.time(bestMatch.checkedAt) : "") + '</span></td>',
            '<td><a href="' + buyHref(bestMatch.key, sk) + '" target="_blank" rel="sponsored noopener" class="btn btn-ghost btn-sm">View <svg class="btn-sm-ico" aria-hidden="true"><use href="#i-external"/></svg></a></td>'
          ].join("");
        } else {
          // Store not found in this search
          tr.className = "row-not-found";
          tr.innerHTML = [
            '<td><span class="store-badge-cell muted">' + FD.esc(storeName) + '</span></td>',
            '<td><span class="muted">No direct match</span></td>',
            '<td><span class="muted">–</span></td>',
            '<td><span class="muted">Not found in this search</span></td>',
            '<td><a href="' + storeSearchHref(sk) + '" target="_blank" rel="sponsored noopener" class="btn btn-ghost btn-sm">Search on ' + FD.esc(storeName) + '</a></td>'
          ].join("");
        }
      }

      tbody.appendChild(tr);
    });
  }

  // ── Report Modal ──────────────────────────────────────────────────────────
  var activeReportProduct = null;
  function openReport(p) {
    activeReportProduct = p;
    $("reportProduct").textContent = p.title + " (" + p.storeName + ")";
    $("reportForm").reset();
    $("reportSheet").showModal();
  }

  $("reportClose").onclick = function () {
    $("reportSheet").close();
  };

  $("reportForm").onsubmit = function (ev) {
    ev.preventDefault();
    if (!activeReportProduct) return;
    var reason = $("reportForm").elements.reason.value;
    var note = $("reportForm").elements.note.value;
    FD.api("/api/report", {
      json: {
        searchId: searchId,
        key: activeReportProduct.key,
        reason: reason,
        note: note
      }
    }).then(function () {
      FD.toast("Thank you for your report! Our team will review this result.");
      $("reportSheet").close();
    }).catch(function (e) {
      FD.toast("Failed to submit report: " + e.message);
    });
  };

  var isDealPage = searchId === "deals";

  function buyHref(key, storeKey) {
    var q = "?from=product_compare";
    if (isDealPage) return "/go/deal/" + encodeURIComponent(key) + "/" + encodeURIComponent(storeKey) + q;
    return "/go/" + encodeURIComponent(searchId) + "/" + encodeURIComponent(key) + q;
  }

  function storeSearchHref(storeKey) {
    if (isDealPage) return "/deals/?store=" + encodeURIComponent(storeKey);
    return "/go/" + encodeURIComponent(searchId) + "/store/" + encodeURIComponent(storeKey);
  }

  // Deals-hub products live at /product/deals/<key> and come from /api/deals.
  function dealToSearch(deal) {
    var prods = (deal.stores || []).map(function (s) {
      return {
        key: deal.key, title: deal.title, brand: deal.brand, image: deal.image,
        store: s.store, storeName: s.storeName, price: s.price, mrp: deal.mrp,
        url: s.url, match: "exact", inStock: s.inStock !== false
      };
    });
    var lowest = prods.filter(function (x) { return x.store === deal.store; })[0] || prods[0];
    return { search: { id: "deals", exact: prods, similar: [] }, product: lowest };
  }

  // ── Load Search Session ───────────────────────────────────────────────────
  if (isDealPage) {
    FD.api("/api/deals/" + encodeURIComponent(productKey)).then(function (data) {
      var conv = dealToSearch(data.deal);
      state.search = conv.search;
      state.product = conv.product;
      // Reporting needs a search session; hide it for curated deals.
      var rb = $("prodReportBtn");
      if (rb) rb.hidden = true;
      renderProduct(conv.product);
    }).catch(function () {
      showMissing("We couldn't find that deal.");
    });
  } else {
  FD.api("/api/search/" + encodeURIComponent(searchId)).then(function (data) {
    state.search = data;
    var all = (data.exact || []).concat(data.similar || []);
    var prod = all.filter(function (x) { return x.key === productKey; })[0];
    if (!prod) {
      showMissing("This specific product was not found in this search session.");
      return;
    }
    state.product = prod;
    renderProduct(prod);
  }).catch(function (err) {
    showMissing(err.code === "not_found" ? "This search session has expired." : "Could not load product details.");
  });
  }

})();
