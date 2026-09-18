/* Fit Deal — "Help me choose" vote page (/vote/<id>). */
(function () {
  "use strict";
  var FD = window.FD;
  var el = FD.el;
  var $ = function (id) { return document.getElementById(id); };

  var m = location.pathname.match(/^\/vote\/([A-Za-z0-9_-]{4,40})\/?$/);
  var id = m ? m[1] : null;
  var isNew = /[?&]new=1/.test(location.search);
  var sending = false;

  function showState(name) {
    ["voteLoading", "voteMissing", "voteReady"].forEach(function (s) { $(s).hidden = s !== name; });
  }

  // A random code kept on this device so one person can't vote twice.
  function voter() {
    var v = FD.store.get("fd_voter", null);
    if (!v) {
      var a = new Uint8Array(16);
      (window.crypto || window.msCrypto).getRandomValues(a);
      v = Array.prototype.map.call(a, function (b) { return ("0" + b.toString(16)).slice(-2); }).join("");
      FD.store.set("fd_voter", v);
    }
    return v;
  }

  if (!id) { showState("voteMissing"); return; }

  FD.api("/api/vote/" + encodeURIComponent(id), { headers: { "X-Voter": voter() } }).then(function (v) {
    render(v);
    showState("voteReady");
    FD.track("vote_view", { mine: !!v.mine, closed: v.closed });
    if (isNew) {
      FD.toast("Your vote page is ready. Share it with friends!", 5000);
      history.replaceState(null, "", location.pathname);
    }
  }).catch(function (e) {
    if (e.status !== 404) FD.toast(e.message);
    showState("voteMissing");
  });

  function timeLeft(v) {
    if (v.closed) return "Voting closed";
    var h = Math.max(0, (new Date(v.closesAt).getTime() - Date.now()) / 3600000);
    if (h >= 48) return Math.floor(h / 24) + " days left";
    if (h >= 1) return Math.floor(h) + "h left";
    return "Closing soon";
  }

  function render(v) {
    var mineCreated = FD.store.get("fd_myvotes", []).indexOf(v.id) >= 0;
    $("voteInitial").textContent = v.asker ? v.asker.charAt(0).toUpperCase() : "?";
    $("voteAsker").textContent = "";
    if (mineCreated) {
      $("voteAsker").appendChild(document.createTextNode("Your vote page"));
    } else {
      $("voteAsker").appendChild(el("b", { text: v.asker || "Your friend" }));
      $("voteAsker").appendChild(document.createTextNode(" wants your opinion"));
    }
    $("voteQ").textContent = v.question;
    $("voteLeft").textContent = timeLeft(v);
    $("voteTotal").textContent = v.total === 1 ? "1 vote" : v.total + " votes";

    var showResults = !!v.mine || v.closed || mineCreated;
    var top = Math.max.apply(null, v.options.map(function (o) { return o.votes; }));
    var wrap = $("voteOptions");
    wrap.textContent = "";
    v.options.forEach(function (o) {
      var pct = v.total ? Math.round((o.votes / v.total) * 100) : 0;
      var body = el("span.v-body", null, [
        el("span.v-title", { text: o.title }),
        el("span.v-price", null, [o.price != null ? el("b", { text: FD.price(o.price) }) : null, (o.price != null ? " · " : "") + o.storeName]),
        showResults ? el("span.v-bar", { "aria-hidden": "true" }, [el("i")]) : null,
        showResults ? el("span.v-pct", null, [el("b", { text: pct + "%" }), o.votes === 1 ? "1 vote" : o.votes + " votes"]) : null
      ]);
      var inner = [
        el("span.v-img", null, [
          o.image ? el("img", { src: o.image, alt: "", loading: "lazy", referrerpolicy: "no-referrer" }) : null,
          el("span.v-key", { text: o.key })
        ]),
        body
      ];
      var cls = "v-opt" + (v.mine === o.key ? " is-mine" : "") + (showResults && v.total && o.votes === top ? " is-top" : "");
      var node;
      if (!showResults) {
        node = el("button." + cls, { type: "button", "aria-label": "Vote for " + o.key + ": " + o.title, on: { click: function () { cast(o.key); } } }, inner);
      } else {
        node = el("div." + cls, null, inner);
        if (v.searchId && o.productKey) {
          body.appendChild(el("a.v-buy", { href: "/go/" + encodeURIComponent(v.searchId) + "/" + encodeURIComponent(o.productKey) + "?from=vote", target: "_blank", rel: "sponsored noopener" }, ["See it at " + o.storeName]));
        }
      }
      wrap.appendChild(node);
      var bar = node.querySelector(".v-bar i");
      if (bar) requestAnimationFrame(function () { bar.style.width = pct + "%"; });
    });
    $("voteHint").textContent = v.closed ? "This vote has closed. Here's how it ended." : v.mine ? "Thanks for voting! Here's how everyone voted." : mineCreated ? "Share the link below. Results update as friends vote." : "Tap the one you like to vote";

    FD.wireShare({
      url: location.origin + "/vote/" + v.id,
      text: (v.asker ? v.asker + " needs" : "I need") + " your vote! Which one should I buy? 🛍️",
      what: "vote"
    });
  }

  function cast(key) {
    if (sending) return;
    sending = true;
    FD.api("/api/vote/" + encodeURIComponent(id) + "/ballot", { json: { option: key }, headers: { "X-Voter": voter() } }).then(function (v) {
      render(v);
      FD.toast("Vote counted. Thanks!");
    }).catch(function (e) {
      if (e.data && e.data.vote) render(e.data.vote);
      FD.toast(e.message);
    }).then(function () { sending = false; });
  }
})();
