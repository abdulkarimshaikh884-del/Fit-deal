/* Fit Deal — AI Virtual Try-On */
(function () {
  "use strict";
  var FD = window.FD;

  var tryDrop = document.getElementById("tryDrop");
  var tryEmpty = document.getElementById("tryEmpty");
  var tryPhoto = document.getElementById("tryPhoto");
  var tryFile = document.getElementById("tryFile");
  var tryUpload = document.getElementById("tryUpload");
  var trySample = document.getElementById("trySample");
  var tryGo = document.getElementById("tryGo");
  var tryLeft = document.getElementById("tryLeft");
  var tryResult = document.getElementById("tryResult");
  var resultEmpty = document.getElementById("resultEmpty");
  var resultBody = document.getElementById("resultBody");
  var resBefore = document.getElementById("resBefore");
  var resAfter = document.getElementById("resAfter");

  if (!tryGo) return;

  var userPhotoUrl = null;
  var selectedOutfit = "dress";

  // Quota: 2 free try-ons per day
  var today = new Date().toISOString().slice(0, 10);
  var quota = FD.store.get("fd_tryon_quota", { date: today, left: 2 });
  if (quota.date !== today) {
    quota = { date: today, left: 2 };
    FD.store.set("fd_tryon_quota", quota);
  }
  if (tryLeft) tryLeft.textContent = String(quota.left);

  function setUserPhoto(url) {
    userPhotoUrl = url;
    tryPhoto.src = url;
    tryPhoto.hidden = false;
    tryEmpty.hidden = true;
  }

  if (tryUpload) tryUpload.addEventListener("click", function () { tryFile.click(); });
  if (tryFile) {
    tryFile.addEventListener("change", function () {
      var f = tryFile.files && tryFile.files[0];
      if (f) {
        var reader = new FileReader();
        reader.onload = function (e) { setUserPhoto(e.target.result); };
        reader.readAsDataURL(f);
      }
    });
  }

  if (trySample) {
    trySample.addEventListener("click", function () {
      setUserPhoto("https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&auto=format&fit=crop&q=80");
      FD.toast("Loaded sample model photo");
    });
  }

  // Outfit selector
  Array.prototype.forEach.call(document.querySelectorAll('input[name="outfit"]'), function (r) {
    r.addEventListener("change", function () {
      if (r.checked) selectedOutfit = r.value;
    });
  });

  tryGo.addEventListener("click", function () {
    if (!userPhotoUrl) {
      FD.toast("Please upload your photo or choose the sample photo first.");
      tryUpload.focus();
      return;
    }
    if (quota.left <= 0) {
      FD.toast("You've used your 2 free try-ons for today. Check back tomorrow!");
      return;
    }

    tryGo.disabled = true;
    tryGo.textContent = "Synthesizing AI Try-On…";

    setTimeout(function () {
      quota.left = Math.max(0, quota.left - 1);
      FD.store.set("fd_tryon_quota", quota);
      if (tryLeft) tryLeft.textContent = String(quota.left);

      resBefore.src = userPhotoUrl;
      // Result outfit composite
      var outfitMap = {
        dress: "https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=600&auto=format&fit=crop&q=80",
        shirt: "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=600&auto=format&fit=crop&q=80",
        top: "https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=600&auto=format&fit=crop&q=80",
        kurti: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=600&auto=format&fit=crop&q=80"
      };
      resAfter.src = outfitMap[selectedOutfit] || outfitMap.dress;

      resultEmpty.hidden = true;
      resultBody.hidden = false;
      tryGo.disabled = false;
      tryGo.innerHTML = '<svg aria-hidden="true"><use href="#i-sparkle-plain"/></svg>Try another outfit';

      tryResult.scrollIntoView({ behavior: "smooth", block: "center" });
      FD.toast("Try-on complete!");
      FD.track("tryon_complete", { outfit: selectedOutfit });
    }, 1800);
  });
})();
