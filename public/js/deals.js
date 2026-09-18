/* Fit Deal — Deals page: real discounts from recent searches (/api/feed). */
(function () {
  "use strict";
  var FD = window.FD;
  var el = FD.el;
  var $ = function (id) { return document.getElementById(id); };

  var RULES = {
    all: function () { return true; },
    women: function (x) { return x.audience === "women"; },
    men: function (x) { return x.audience === "men"; },
    ethnic: function (x) { return x.category === "kurti"; },
    dresses: function (x) { return x.category === "dress"; },
    tops: function (x) { return x.category === "top" || x.category === "t_shirt"; },
    jeans: function (x) { return x.category === "jeans"; }
  };
  var MARK = { amazon: "a", flipkart: "F", myntra: "M", ajio: "A" };
  var deals = [];
  var filter = "all";

  function card(x) {
    return el("a.dcard", { href: "/find/" + encodeURIComponent(x.searchId) + "#p-" + encodeURIComponent(x.key), "aria-label": x.title + ", " + FD.price(x.price) + " at " + x.storeName }, [
      el("span.dcard-img", null, [
        el("img", { src: x.image, alt: x.title, loading: "lazy", referrerpolicy: "no-referrer", on: { error: function () { this.hidden = true; } } }),
        x.off ? el("span.dcard-off", { text: x.off + "% OFF" }) : null
      ]),
      el("span.dcard-title", { text: x.title }),
      el("span.dcard-price", null, [el("b", { text: FD.price(x.price) }), x.mrp ? el("s", { text: FD.price(x.mrp) }) : null]),
      el("span.st", null, [el("i.st-mark st-" + x.store, { text: MARK[x.store] || "", "aria-hidden": "true" }), x.storeName]),
      el("small.dcard-time", { text: "Checked " + FD.ago(x.checkedAt) })
    ]);
  }

  function render() {
    var list = deals.filter(RULES[filter] || RULES.all);
    var grid = $("dealGrid");
    grid.textContent = "";
    list.forEach(function (x) { grid.appendChild(card(x)); });
    $("dealsEmpty").hidden = list.length > 0;
    if (!list.length && deals.length) {
      $("dealsEmptyTitle").textContent = "No deals in this category right now";
      $("dealsEmptyText").textContent = "Try another category, or search for a look to find its prices.";
    }
  }

  Array.prototype.forEach.call(document.querySelectorAll("#dealFilter button"), function (b) {
    b.addEventListener("click", function () {
      filter = b.getAttribute("data-f");
      Array.prototype.forEach.call(document.querySelectorAll("#dealFilter button"), function (x) {
        x.setAttribute("aria-pressed", x === b ? "true" : "false");
      });
      render();
    });
  });

  FD.api("/api/feed").then(function (data) {
    deals = data.deals || [];
    render();
    FD.store.set("fd_deals_seen", new Date().toISOString());
    FD.store.set("fd_deals_new", false);
    FD.refreshDots();
    FD.track("deals_view", { count: deals.length });
  }).catch(function (e) {
    $("dealGrid").textContent = "";
    $("dealsEmptyTitle").textContent = "Couldn't load deals";
    $("dealsEmptyText").textContent = e.message;
    $("dealsEmpty").hidden = false;
  });
})();
