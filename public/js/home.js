/* Fit Deal — home page behaviour.
   The upload, the product link and the samples are wired to their controls.
   Search itself is the next step in PLAN.md, so for now each of them says so
   plainly instead of pretending to search. Pages that do not exist yet
   (Saved, Try On, Alerts, Profile) answer the same way. */
(function () {
  var toastEl = document.getElementById("toast");
  var toastTimer = null;
  function toast(msg) {
    toastEl.textContent = msg;
    toastEl.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toastEl.hidden = true; }, 2800);
  }

  var STORES = ["amazon.in", "amzn.in", "amzn.to", "myntra.com", "flipkart.com", "fkrt.it", "ajio.com",
    "meesho.com", "nykaafashion.com", "tatacliq.com", "hm.com", "zara.com", "snitch.co.in", "bewakoof.com",
    "souledstore.com", "savana.com", "urbanic.com"];
  function storeOf(value) {
    var url;
    try { url = new URL(/^https?:\/\//i.test(value) ? value : "https://" + value); } catch (e) { return null; }
    var host = url.hostname.toLowerCase().replace(/^www\./, "").replace(/^m\./, "");
    for (var i = 0; i < STORES.length; i++) {
      if (host === STORES[i] || host.slice(-(STORES[i].length + 1)) === "." + STORES[i]) return STORES[i];
    }
    return null;
  }

  // Photo upload
  var photo = document.getElementById("photo");
  document.getElementById("choose").addEventListener("click", function () { photo.click(); });
  photo.addEventListener("change", function () {
    var file = photo.files && photo.files[0];
    photo.value = "";
    if (!file) return;
    if (!/^image\//.test(file.type)) { toast("Please choose a photo or screenshot."); return; }
    if (file.size > 10 * 1024 * 1024) { toast("That photo is over 10 MB. Try a smaller screenshot."); return; }
    toast("Got it! Outfit search is launching soon.");
  });

  // Product link (the phone and desktop layouts each have one form)
  Array.prototype.forEach.call(document.querySelectorAll("[data-link-form]"), function (form) {
    form.addEventListener("submit", function (ev) {
      ev.preventDefault();
      var input = form.querySelector("input");
      var value = input.value.trim();
      if (!value) { input.focus(); toast("Paste a product link from Amazon, Myntra, Flipkart or AJIO."); return; }
      if (!storeOf(value)) { toast("That link isn't from a store we support yet."); return; }
      toast("Link search is launching soon.");
    });
  });

  // Samples
  Array.prototype.forEach.call(document.querySelectorAll("[data-sample]"), function (btn) {
    btn.addEventListener("click", function () {
      toast(btn.getAttribute("data-sample") + " sample: search is launching soon.");
    });
  });

  // Pages that are not built yet
  Array.prototype.forEach.call(document.querySelectorAll("[data-soon]"), function (el) {
    el.addEventListener("click", function (ev) {
      ev.preventDefault();
      toast(el.getAttribute("data-soon") + " is coming soon.");
    });
  });

  // Scroll helpers
  Array.prototype.forEach.call(document.querySelectorAll("[data-action]"), function (el) {
    el.addEventListener("click", function (ev) {
      var action = el.getAttribute("data-action");
      if (action === "find") {
        ev.preventDefault();
        document.getElementById("upload").scrollIntoView({ behavior: "smooth", block: "center" });
      } else if (action === "how") {
        ev.preventDefault();
        document.getElementById("how").scrollIntoView({ behavior: "smooth", block: "start" });
      } else if (action === "focus-link") {
        var input = document.getElementById("linkInput");
        input.scrollIntoView({ behavior: "smooth", block: "center" });
        setTimeout(function () { input.focus({ preventScroll: true }); }, 350);
      }
    });
  });
})();
