/* Fit Deal — Profile ("Your Fit Deal"): what's saved on this device, a
   size helper, and a way to clear it all. No account, nothing sent to us. */
(function () {
  "use strict";
  var FD = window.FD;
  var $ = function (id) { return document.getElementById(id); };
  var form = $("sizeForm");

  // Counts from this device.
  function counts() {
    $("stSaved").textContent = String(FD.saved.all().length);
    $("stSearches").textContent = String(FD.recent.all().length);
    $("stVotes").textContent = String(FD.store.get("fd_myvotes", []).length);
  }
  counts();

  // ── Size helper ─────────────────────────────────────────────────────────
  // Body measurements in inches → usual size on common Indian charts.
  // Upper limits per size; the last size covers everything above.
  var ORDER = ["XS", "S", "M", "L", "XL", "XXL"];
  var CHARTS = {
    women: { chest: [32, 34, 36, 38, 40], waist: [26, 28, 30, 32, 34] },
    men: { chest: [36, 38, 40, 42, 44], waist: [28, 30, 32, 34, 36] }
  };
  function sizeFor(value, limits) {
    for (var i = 0; i < limits.length; i++) if (value <= limits[i]) return i;
    return limits.length;
  }
  function calc(who, chest, waist, fit) {
    var chart = CHARTS[who] || CHARTS.women;
    var picks = [];
    if (chest > 0) picks.push(sizeFor(chest, chart.chest));
    if (waist > 0) picks.push(sizeFor(waist, chart.waist));
    if (!picks.length) return null;
    // Between two sizes, the larger one is the safer buy.
    var idx = Math.max.apply(null, picks);
    if (fit === "loose") idx = Math.min(ORDER.length - 1, idx + 1);
    if (fit === "slim" && picks.every(function (p) { return p > 0; })) idx = Math.max(0, idx - 1);
    return ORDER[idx];
  }

  var who = "women";
  var fit = "regular";
  function seg(id, attr, onPick) {
    var box = $(id);
    box.addEventListener("click", function (ev) {
      var btn = ev.target.closest("button[" + attr + "]");
      if (!btn) return;
      Array.prototype.forEach.call(box.querySelectorAll("button"), function (b) { b.setAttribute("aria-pressed", b === btn ? "true" : "false"); });
      onPick(btn.getAttribute(attr));
    });
    return function (value) {
      Array.prototype.forEach.call(box.querySelectorAll("button"), function (b) { b.setAttribute("aria-pressed", b.getAttribute(attr) === value ? "true" : "false"); });
    };
  }
  var setWho = seg("forSeg", "data-for", function (v) { who = v; $("chestLabel").textContent = v === "men" ? "Chest" : "Bust"; });
  var setFit = seg("fitSeg", "data-fit", function (v) { fit = v; });

  function showSize(size) {
    $("sizeLetter").textContent = size;
    $("sizeResult").hidden = false;
  }

  var saved = FD.store.get("fd_size_v2", null);
  if (saved) {
    who = saved.who || "women";
    fit = saved.fit || "regular";
    setWho(who);
    setFit(fit);
    $("chestLabel").textContent = who === "men" ? "Chest" : "Bust";
    if (saved.chest) form.elements.chest.value = saved.chest;
    if (saved.waist) form.elements.waist.value = saved.waist;
    if (saved.size) showSize(saved.size);
  }

  form.addEventListener("submit", function (ev) {
    ev.preventDefault();
    var chest = Number(form.elements.chest.value);
    var waist = Number(form.elements.waist.value);
    var err = $("sizeError");
    var okChest = !chest || (chest >= 24 && chest <= 60);
    var okWaist = !waist || (waist >= 20 && waist <= 56);
    if ((!chest && !waist) || !okChest || !okWaist) {
      err.textContent = !chest && !waist ? "Add your bust/chest or waist in inches." : "Please check the numbers: they should be in inches.";
      err.hidden = false;
      return;
    }
    err.hidden = true;
    var size = calc(who, chest, waist, fit);
    FD.store.set("fd_size_v2", { who: who, chest: chest || "", waist: waist || "", fit: fit, size: size, at: new Date().toISOString() });
    showSize(size);
    FD.toast("Your usual size: " + size + ". Check the store's chart too.");
  });

  // ── Clear everything this site keeps on the device ──────────────────────
  $("clearData").addEventListener("click", function () {
    if (!window.confirm("Clear saved items, recent searches, votes you made and size notes from this device?")) return;
    try {
      Object.keys(localStorage).forEach(function (k) { if (k.indexOf("fd_") === 0) localStorage.removeItem(k); });
      Object.keys(sessionStorage).forEach(function (k) { if (k.indexOf("fd_") === 0) sessionStorage.removeItem(k); });
    } catch (e) { /* storage blocked: nothing to clear */ }
    form.reset();
    $("sizeResult").hidden = true;
    counts();
    FD.refreshDots();
    FD.track("profile_clear", {});
    FD.toast("Cleared from this device");
  });
})();
