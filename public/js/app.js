/* Fit Deal — shared behaviour for every page.
   Exposes window.FD with small helpers the page scripts use: toast, api,
   track, saved items, recent searches, sharing and formatting. */
(function () {
  "use strict";

  // ── Storage that never throws (private mode, full disk, blocked) ─────────
  var store = {
    get: function (key, fallback) {
      try {
        var v = localStorage.getItem(key);
        return v == null ? fallback : JSON.parse(v);
      } catch (e) { return fallback; }
    },
    set: function (key, value) {
      try { localStorage.setItem(key, JSON.stringify(value)); return true; } catch (e) { return false; }
    },
    sessionGet: function (key) {
      try { var v = sessionStorage.getItem(key); return v == null ? null : JSON.parse(v); } catch (e) { return null; }
    },
    sessionSet: function (key, value) {
      try { sessionStorage.setItem(key, JSON.stringify(value)); return true; } catch (e) { return false; }
    }
  };

  // ── Toast ────────────────────────────────────────────────────────────────
  var toastEl = document.getElementById("toast");
  var toastTimer = null;
  function toast(msg, ms) {
    if (!toastEl) return;
    toastEl.textContent = msg;
    toastEl.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toastEl.hidden = true; }, ms || 3200);
  }

  // ── API ──────────────────────────────────────────────────────────────────
  // Resolves with the JSON body; rejects with an Error whose .message is safe
  // to show and whose .code/.status say what went wrong.
  function api(path, opts) {
    opts = opts || {};
    var init = { method: opts.method || "GET", headers: opts.headers || {}, credentials: "same-origin" };
    try {
      var tok = localStorage.getItem("fd_token");
      if (tok && !init.headers["Authorization"]) init.headers["Authorization"] = "Bearer " + tok;
    } catch (e) {}
    if (opts.json !== undefined) {
      init.method = opts.method || "POST";
      init.headers["Content-Type"] = "application/json";
      init.body = JSON.stringify(opts.json);
    } else if (opts.body !== undefined) {
      init.method = opts.method || "POST";
      init.body = opts.body;
    }
    if (opts.signal) init.signal = opts.signal;
    return fetch(path, init).then(function (res) {
      return res.text().then(function (text) {
        var data = null;
        try { data = text ? JSON.parse(text) : {}; } catch (e) { data = null; }
        if (!res.ok || !data) {
          var err = new Error((data && data.message) || (res.status >= 500 ? "Something went wrong on our side. Please try again." : "Something went wrong. Please try again."));
          err.status = res.status;
          err.code = (data && data.error) || "http_" + res.status;
          err.data = data;
          throw err;
        }
        return data;
      });
    }, function (e) {
      if (e && e.name === "AbortError") throw e;
      var err = new Error(navigator.onLine === false ? "You're offline. Check your connection and try again." : "We couldn't reach Fit Deal. Check your connection and try again.");
      err.code = "network";
      throw err;
    });
  }

  // ── Analytics: no cookies, no personal data, fire and forget ─────────────
  function pagePath() {
    return location.pathname.replace(/^\/(find|vote)\/[^/]+\/?$/, "/$1/:id");
  }
  function track(name, props) {
    try {
      var body = JSON.stringify({ name: name, props: props || {}, path: pagePath() });
      if (navigator.sendBeacon) {
        navigator.sendBeacon("/api/event", new Blob([body], { type: "application/json" }));
      } else {
        fetch("/api/event", { method: "POST", headers: { "Content-Type": "application/json" }, body: body, keepalive: true }).catch(function () {});
      }
    } catch (e) { /* analytics must never break the page */ }
  }

  // ── Saved items (this device only, V1) ───────────────────────────────────
  var SAVED = "fd_saved_v1";
  var saved = {
    all: function () { return store.get(SAVED, []); },
    has: function (searchId, key) {
      return saved.all().some(function (s) { return s.searchId === searchId && s.key === key; });
    },
    add: function (item) {
      var list = saved.all().filter(function (s) { return !(s.searchId === item.searchId && s.key === item.key); });
      item.savedAt = new Date().toISOString();
      list.unshift(item);
      return store.set(SAVED, list.slice(0, 200));
    },
    remove: function (searchId, key) {
      store.set(SAVED, saved.all().filter(function (s) { return !(s.searchId === searchId && s.key === key); }));
    },
    clear: function () { store.set(SAVED, []); }
  };

  // ── Recent searches (this device only) ───────────────────────────────────
  var RECENT = "fd_recent_v1";
  var recent = {
    all: function () { return store.get(RECENT, []); },
    add: function (entry) {
      var list = recent.all().filter(function (r) { return r.id !== entry.id; });
      entry.at = new Date().toISOString();
      list.unshift(entry);
      store.set(RECENT, list.slice(0, 12));
    },
    clear: function () { store.set(RECENT, []); }
  };

  // ── Formatting ───────────────────────────────────────────────────────────
  var inr = null;
  try { inr = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }); } catch (e) { inr = null; }
  function price(n) {
    if (n == null || !isFinite(n)) return "";
    return "₹" + (inr ? inr.format(Math.round(n)) : String(Math.round(n)));
  }
  function time(iso) {
    if (!iso) return "";
    var d = new Date(iso);
    if (isNaN(d)) return "";
    var today = new Date();
    var t = d.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" });
    if (d.toDateString() === today.toDateString()) return "today " + t;
    return d.toLocaleDateString("en-IN", { day: "numeric", month: "short" }) + ", " + t;
  }
  function ago(iso) {
    var s = (Date.now() - new Date(iso).getTime()) / 1000;
    if (!isFinite(s)) return "";
    if (s < 90) return "just now";
    if (s < 3600) return Math.round(s / 60) + " min ago";
    if (s < 86400) return Math.round(s / 3600) + " h ago";
    return Math.round(s / 86400) + " d ago";
  }

  // ── DOM helper ───────────────────────────────────────────────────────────
  // el("a.btn", { href: "/" }, ["text", childNode]) — text is always set as
  // text, never parsed as HTML.
  function el(spec, attrs, children) {
    var parts = spec.split(".");
    var node = document.createElement(parts[0] || "div");
    if (parts.length > 1) node.className = parts.slice(1).join(" ");
    if (attrs) {
      Object.keys(attrs).forEach(function (k) {
        var v = attrs[k];
        if (v == null || v === false) return;
        if (k === "text") node.textContent = v;
        else if (k === "on") Object.keys(v).forEach(function (ev) { node.addEventListener(ev, v[ev]); });
        else if (k === "dataset") Object.keys(v).forEach(function (d) { node.dataset[d] = v[d]; });
        else node.setAttribute(k, v === true ? "" : v);
      });
    }
    (children || []).forEach(function (c) {
      if (c == null || c === false) return;
      node.appendChild(typeof c === "string" ? document.createTextNode(c) : c);
    });
    return node;
  }
  function icon(id, cls) {
    var svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("aria-hidden", "true");
    if (cls) svg.setAttribute("class", cls);
    var use = document.createElementNS("http://www.w3.org/2000/svg", "use");
    use.setAttribute("href", "#" + id);
    svg.appendChild(use);
    return svg;
  }

  // ── Sharing ──────────────────────────────────────────────────────────────
  function copy(text) {
    if (navigator.clipboard && window.isSecureContext) return navigator.clipboard.writeText(text);
    return new Promise(function (resolve, reject) {
      var ta = el("textarea", { readonly: true, "aria-hidden": "true" });
      ta.value = text;
      ta.className = "sr-only";
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand("copy") ? resolve() : reject(); } catch (e) { reject(e); }
      ta.remove();
    });
  }
  // Wires a WhatsApp link, a Copy button and (where supported) a native
  // Share button to one URL.
  function wireShare(opts) {
    var wa = document.getElementById(opts.wa || "shareWa");
    var cp = document.getElementById(opts.copy || "shareCopy");
    var more = document.getElementById(opts.more || "shareMore");
    if (wa) {
      wa.href = "https://wa.me/?text=" + encodeURIComponent(opts.text + " " + opts.url);
      wa.addEventListener("click", function () { track("share", { via: "whatsapp", what: opts.what }); });
    }
    if (cp) cp.addEventListener("click", function () {
      copy(opts.url).then(function () { toast("Link copied"); }, function () { toast("Couldn't copy. Long-press the address bar to copy it."); });
      track("share", { via: "copy", what: opts.what });
    });
    if (more && navigator.share) {
      more.hidden = false;
      more.addEventListener("click", function () {
        navigator.share({ title: opts.title || document.title, text: opts.text, url: opts.url }).then(function () {
          track("share", { via: "native", what: opts.what });
        }, function () {});
      });
    }
  }

  // Dots in the header and tab bar, from real data on this device only: the
  // heart when something is saved, Deals when new deals appeared since the
  // Deals page was last opened.
  function refreshDots() {
    var s = document.getElementById("savedDot");
    if (s) s.hidden = saved.all().length === 0;
    var d = document.getElementById("dealsDot");
    if (d) d.hidden = !store.get("fd_deals_new", false);
    var count = String(saved.all().length);
    Array.prototype.forEach.call(document.querySelectorAll(".fd-saved-count, #sbSavedBadge"), function (el) {
      el.textContent = count;
    });
  }

  // ── Sidebar Navigation Interaction ───────────────────────────────────────
  function initSidebar() {
    var desktopToggle = document.getElementById("sidebarToggleBtn");
    var mobileToggle = document.getElementById("mobileSidebarToggleBtn");
    var closeBtn = document.getElementById("sidebarCloseBtn");
    var backdrop = document.getElementById("sidebarBackdrop");
    var photoBtn = document.getElementById("sbPhotoSearchBtn");

    try {
      if (localStorage.getItem("fd_sb_collapsed") === "1" && window.innerWidth >= 1100) {
        document.body.classList.add("sidebar-collapsed");
      }
    } catch (e) {}

    function openSidebar() {
      document.body.classList.add("sidebar-open");
      document.body.style.overflow = "hidden";
    }

    function closeSidebar() {
      document.body.classList.remove("sidebar-open");
      document.body.style.overflow = "";
    }

    if (desktopToggle) {
      desktopToggle.addEventListener("click", function () {
        if (window.innerWidth >= 1100) {
          var isCollapsed = document.body.classList.toggle("sidebar-collapsed");
          try { localStorage.setItem("fd_sb_collapsed", isCollapsed ? "1" : "0"); } catch (e) {}
        } else {
          openSidebar();
        }
      });
    }

    // Bind ALL mobile & secondary sidebar toggle buttons across all pages
    Array.prototype.forEach.call(document.querySelectorAll(".fd-sidebar-toggle-btn, .m-sidebar-toggle"), function (btn) {
      if (btn !== desktopToggle) {
        btn.addEventListener("click", function (e) {
          e.preventDefault();
          openSidebar();
        });
      }
    });

    if (photoBtn) {
      photoBtn.addEventListener("click", function (e) {
        e.preventDefault();
        closeSidebar();
        var fileInput = document.querySelector('input[type="file"]#fileInput, input[type="file"]#heroFileInput, input[type="file"]');
        if (fileInput && (window.location.pathname === "/" || window.location.pathname === "/find/")) {
          fileInput.click();
        } else {
          window.location.href = "/find/?mode=photo";
        }
      });
    }

    if (closeBtn) closeBtn.addEventListener("click", closeSidebar);
    if (backdrop) backdrop.addEventListener("click", closeSidebar);

    // Auto-close drawer on mobile when user taps any nav link
    Array.prototype.forEach.call(document.querySelectorAll(".fd-sidebar a"), function (a) {
      a.addEventListener("click", function () {
        if (window.innerWidth < 1100) {
          closeSidebar();
        }
      });
    });

    document.addEventListener("keydown", function (ev) {
      if (ev.key === "Escape" && document.body.classList.contains("sidebar-open")) {
        closeSidebar();
      }
    });

    // Touch gesture: swipe left on sidebar to close on mobile
    var sidebarEl = document.getElementById("fdSidebar");
    if (sidebarEl) {
      var touchStartX = 0;
      sidebarEl.addEventListener("touchstart", function (e) {
        touchStartX = e.touches[0].clientX;
      }, { passive: true });
      sidebarEl.addEventListener("touchend", function (e) {
        var touchEndX = e.changedTouches[0].clientX;
        if (touchStartX - touchEndX > 50) {
          closeSidebar();
        }
      }, { passive: true });
    }

    if (photoBtn) {
      photoBtn.addEventListener("click", function () {
        closeSidebar();
        var photoInput = document.getElementById("photo");
        if (photoInput) {
          photoInput.click();
        } else {
          window.location.href = "/find/";
        }
      });
    }
  }
  initSidebar();

  // ── Authentication & Cloud Progress Sync ─────────────────────────────────
  function updateAuthUI(user) {
    Array.prototype.forEach.call(document.querySelectorAll("[data-auth-user]"), function (el) {
      el.hidden = !user;
    });
    Array.prototype.forEach.call(document.querySelectorAll("[data-auth-guest]"), function (el) {
      el.hidden = !!user;
    });
    Array.prototype.forEach.call(document.querySelectorAll("[data-user-name]"), function (el) {
      if (user) el.textContent = user.fullName || user.email.split("@")[0];
    });
  }

  var auth = {
    getUser: function () {
      return store.get("fd_user", null);
    },
    getToken: function () {
      try { return localStorage.getItem("fd_token") || null; } catch (e) { return null; }
    },
    isLoggedIn: function () {
      return Boolean(auth.getToken());
    },
    logout: function () {
      return api("/api/auth/logout", { method: "POST" }).finally(function () {
        try {
          localStorage.removeItem("fd_token");
          localStorage.removeItem("fd_user");
        } catch (e) {}
        window.location.href = "/";
      });
    },
    syncLocalToCloud: function () {
      if (!auth.isLoggedIn()) return Promise.resolve();
      var saves = saved.all();
      var searches = recent.all();
      var size = store.get("fd_size_prefs", {});
      return api("/api/user/sync", { json: { saves: saves, searches: searches, preferences: size } })
        .then(function (res) {
          if (res && res.saves && Array.isArray(res.saves)) {
            var existingKeys = new Set(saved.all().map(function (s) { return s.key; }));
            var merged = saved.all().slice();
            res.saves.forEach(function (cs) {
              if (cs && cs.key && !existingKeys.has(cs.key)) {
                merged.push(cs);
                existingKeys.add(cs.key);
              }
            });
            store.set(SAVED, merged.slice(0, 200));
            refreshDots();
          }
          return res;
        }).catch(function () {});
    },
    init: function () {
      if (auth.isLoggedIn()) {
        updateAuthUI(auth.getUser());
        api("/api/auth/me").then(function (res) {
          if (res && res.authenticated && res.user) {
            store.set("fd_user", res.user);
            updateAuthUI(res.user);
          } else {
            try { localStorage.removeItem("fd_token"); localStorage.removeItem("fd_user"); } catch (e) {}
            updateAuthUI(null);
          }
        }).catch(function () {
          updateAuthUI(auth.getUser());
        });
      } else {
        updateAuthUI(null);
      }
    }
  };

  window.FD = {
    store: store, toast: toast, api: api, track: track, saved: saved, recent: recent,
    esc: function(s) { return String(s == null ? "" : s).replace(/[&<>"']/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c];}); },
    price: price, time: time, ago: ago, el: el, icon: icon, copy: copy, wireShare: wireShare,
    refreshDots: refreshDots, auth: auth
  };
  refreshDots();
  auth.init();
  // Shared search and image entry points must work on every page.
  if (document.body.dataset.page !== 'home') {
    document.querySelectorAll('[data-search-form]').forEach(function(form) {
      form.addEventListener('submit', function(ev) {
        ev.preventDefault();
        var input=form.querySelector('input[name="q"], input[type="text"]');
        if(input && input.value.trim()) {
          var value=input.value.trim();
          location.href='/find/?q='+encodeURIComponent(value);
        }
      });
    });
    ['headerSnapBtn','mobileSnapBtn','sbPhotoSearchBtn','headerUploadCta'].forEach(function(id){
      var button=document.getElementById(id);
      if(button) {
        button.addEventListener('click',function(ev){
          ev.preventDefault();
          location.href='/find/?mode=photo';
        });
      }
    });
  }
  document.querySelectorAll('[data-style-save]').forEach(function(button){
    var id=button.dataset.styleSave;
    function refresh(){var has=saved.has('style',id);button.setAttribute('aria-pressed',String(has));button.classList.toggle('is-active',has);var use=button.querySelector('use');if(use)use.setAttribute('href',has?'#i-heart-fill':'#i-heart');}
    button.addEventListener('click',function(){
      if(saved.has('style',id)) saved.remove('style',id);
      else {var card=button.closest('article, .fd-showcase-card'),img=card&&card.querySelector('img');saved.add({searchId:'style',key:id,title:img?img.alt:'Saved style',image:img?img.getAttribute('src'):'',price:null,storeName:'Style inspiration',match:'editorial'});}
      refresh();refreshDots();
    });refresh();
  });
  window.addEventListener("storage", function () {
    refreshDots();
    auth.init();
  });

  // ── Page chrome ──────────────────────────────────────────────────────────
  // Back button: go back if we came from our own site, else follow the link.
  Array.prototype.forEach.call(document.querySelectorAll("[data-back]"), function (a) {
    a.addEventListener("click", function (ev) {
      if (document.referrer && document.referrer.indexOf(location.origin + "/") === 0 && history.length > 1) {
        ev.preventDefault();
        history.back();
      }
    });
  });

  // Scroll helpers used by the home page's buttons and the tab bar.
  Array.prototype.forEach.call(document.querySelectorAll("[data-action]"), function (el) {
    el.addEventListener("click", function (ev) {
      var action = el.getAttribute("data-action");
      var upload = document.getElementById("upload");
      if (action === "find" && upload) {
        ev.preventDefault();
        upload.scrollIntoView({ behavior: "smooth", block: "center" });
        // The phone tab bar's "Find" opens the photo picker straight away.
        if (el.classList.contains("tab")) {
          var input = document.getElementById("photo");
          if (input) input.click();
        }
      } else if (action === "looks") {
        var looks = document.getElementById("looks");
        if (looks) { ev.preventDefault(); looks.scrollIntoView({ behavior: "smooth", block: "start" }); }
      } else if (action === "how") {
        var how = document.getElementById("how");
        if (how) { ev.preventDefault(); how.scrollIntoView({ behavior: "smooth", block: "start" }); }
      } else if (action === "focus-link") {
        var link = document.getElementById("linkInput");
        if (link) {
          link.scrollIntoView({ behavior: "smooth", block: "center" });
          setTimeout(function () { link.focus({ preventScroll: true }); }, 350);
        }
      }
    });
  });

  var ref = "";
  try { ref = document.referrer ? new URL(document.referrer).hostname.slice(0, 60) : ""; } catch (e) { ref = ""; }
  track("page_view", { ref: ref === location.hostname ? "" : ref, source: new URLSearchParams(location.search).get("source") || "" });
})();
