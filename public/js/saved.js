/* Fit Deal — Saved page. Everything here lives in this browser only. */
(function () {
  "use strict";
  var FD = window.FD;
  var el = FD.el;
  var $ = function (id) { return document.getElementById(id); };

  function renderSaved() {
    var items = FD.saved.all();
    var list = $("savedItems");
    list.textContent = "";
    $("savedCount").textContent = String(items.length);
    $("savedEmpty").hidden = items.length > 0;
    $("savedClear").hidden = items.length < 2;
    items.forEach(function (s) {
      var editorial = s.searchId === "style" || s.searchId === "deal";
      var detailUrl = s.searchId === "style" ? "/style/" + encodeURIComponent(s.key) + "/" : editorial ? "/shop/?q=" + encodeURIComponent(s.title) : "/product/" + encodeURIComponent(s.searchId) + "/" + encodeURIComponent(s.key);
      list.appendChild(el("article.card s-item", null, [
        el("div.s-img", null, [s.image ? el("img", { src: s.image, alt: "", loading: "lazy", referrerpolicy: "no-referrer" }) : null]),
        el("div.s-body", null, [
          el("p.p-brand", { text: [s.storeName, s.brand].filter(Boolean).join(" · ") }),
          el("p.p-title", { text: s.title }),
          !editorial && s.price != null ? el("p.p-price", null, [el("b", { text: FD.price(s.price) })]) : el("p.p-noprice", { text: editorial ? "Style inspiration · check store prices" : "See price at " + s.storeName }),
          el("p.p-meta", null, [el("span", { text: (s.match === "exact" ? "Exact match · " : "") + "Saved " + FD.ago(s.savedAt) + (s.checkedAt ? " · price from " + FD.time(s.checkedAt) : "") })]),
          el("div.s-actions", null, [
            el("a.btn btn-primary", { href: detailUrl }, ["View details", FD.icon("i-arrow")]),
            el("a.btn btn-ghost", { href: editorial ? "/shop/" : "/find/" + encodeURIComponent(s.searchId) + "#p-" + s.key }, ["Results"]),
            el("button.btn btn-ghost", { type: "button", "aria-label": "Remove " + s.title, on: { click: function () {
              FD.saved.remove(s.searchId, s.key);
              FD.track("unsave", {});
              FD.toast("Removed");
              renderSaved();
              FD.refreshDots();
            } } }, [FD.icon("i-trash")])
          ])
        ])
      ]));
    });
  }

  function renderRecent() {
    var items = FD.recent.all();
    $("recentBox").hidden = !items.length;
    var list = $("recentList");
    list.textContent = "";
    items.forEach(function (r) {
      list.appendChild(el("li", null, [el("a", { href: "/find/" + encodeURIComponent(r.id) }, [
        FD.icon(r.kind === "link" ? "i-link" : "i-search"), el("b", { text: r.label }), el("small", { text: FD.ago(r.at) })
      ])]));
    });
  }

  $("savedClear").addEventListener("click", function () {
    if (!window.confirm("Remove all saved items from this device?")) return;
    FD.saved.clear();
    renderSaved();
    FD.refreshDots();
  });
  $("recentClear").addEventListener("click", function () {
    FD.recent.clear();
    renderRecent();
  });

  renderSaved();
  renderRecent();
  // Another tab saved something: keep this page in step.
  window.addEventListener("storage", function () { renderSaved(); renderRecent(); });
})();
