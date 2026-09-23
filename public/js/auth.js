/* Fit Deal — Authentication Client Script (Login, Signup, Google OAuth) */
(function () {
  "use strict";
  var FD = window.FD;
  var $ = function (id) { return document.getElementById(id); };

  function showAlert(msg, isSuccess) {
    var alertEl = $("authAlert");
    if (!alertEl) return;
    alertEl.textContent = msg;
    alertEl.className = "auth-alert " + (isSuccess ? "alert-success" : "alert-error");
    alertEl.hidden = false;
  }

  function hideAlert() {
    var alertEl = $("authAlert");
    if (alertEl) alertEl.hidden = true;
  }

  function setButtonLoading(btn, isLoading) {
    if (!btn) return;
    btn.disabled = isLoading;
    var txt = btn.querySelector(".btn-text");
    var spinner = btn.querySelector(".btn-spinner");
    if (spinner) spinner.hidden = !isLoading;
    if (txt) txt.style.opacity = isLoading ? "0.6" : "1";
  }

  function getNextUrl() {
    var params = new URLSearchParams(window.location.search);
    var next = params.get("next") || "/profile/";
    if (next.startsWith("//") || !next.startsWith("/")) next = "/profile/";
    return next;
  }

  // ── Password Visibility Toggle ──────────────────────────────────────────
  function setupPassToggle(toggleBtnId, inputId) {
    var btn = $(toggleBtnId);
    var input = $(inputId);
    if (!btn || !input) return;

    btn.addEventListener("click", function () {
      var isPass = input.type === "password";
      input.type = isPass ? "text" : "password";
      var eye = btn.querySelector(".ico-eye");
      var eyeOff = btn.querySelector(".ico-eye-off");
      if (eye) eye.hidden = isPass;
      if (eyeOff) eyeOff.hidden = !isPass;
    });
  }

  setupPassToggle("toggleLoginPass", "loginPassword");
  setupPassToggle("toggleSignupPass", "signupPassword");

  // ── Password Strength Meter (Signup) ────────────────────────────────────
  var passInput = $("signupPassword");
  var meterEl = $("passStrengthMeter");
  var fillEl = $("meterFill");
  var labelEl = $("meterLabel");

  if (passInput && meterEl && fillEl && labelEl) {
    passInput.addEventListener("input", function () {
      var val = passInput.value;
      if (!val) {
        meterEl.hidden = true;
        return;
      }
      meterEl.hidden = false;
      var score = 0;
      if (val.length >= 6) score++;
      if (val.length >= 8) score++;
      if (/[A-Z]/.test(val) && /[a-z]/.test(val)) score++;
      if (/[0-9]/.test(val) || /[^A-Za-z0-9]/.test(val)) score++;

      var configs = [
        { width: "25%", color: "#ef4444", text: "Too short" },
        { width: "50%", color: "#f59e0b", text: "Weak password" },
        { width: "75%", color: "#3b82f6", text: "Good password" },
        { width: "100%", color: "#10b981", text: "Strong password" }
      ];
      var c = configs[Math.min(score, 3)];
      fillEl.style.width = c.width;
      fillEl.style.backgroundColor = c.color;
      labelEl.textContent = c.text;
      labelEl.style.color = c.color;
    });
  }

  // ── Google OAuth ────────────────────────────────────────────────────────
  function triggerGoogleAuth() {
    FD.api("/api/auth/google").then(function (res) {
      if (res && res.url) {
        window.location.href = res.url;
      } else {
        showAlert("Google sign-in is not configured yet. Please sign up with email.");
      }
    }).catch(function (err) {
      showAlert(err.message || "Failed to initiate Google sign-in.");
    });
  }

  var googleLoginBtn = $("googleLoginBtn");
  if (googleLoginBtn) googleLoginBtn.addEventListener("click", triggerGoogleAuth);

  var googleSignupBtn = $("googleSignupBtn");
  if (googleSignupBtn) googleSignupBtn.addEventListener("click", triggerGoogleAuth);

  // ── Login Form ──────────────────────────────────────────────────────────
  var loginForm = $("loginForm");
  if (loginForm) {
    loginForm.addEventListener("submit", function (e) {
      e.preventDefault();
      hideAlert();
      var email = $("loginEmail").value.trim();
      var password = $("loginPassword").value;
      var btn = $("loginSubmitBtn");

      if (!email || !password) {
        showAlert("Please fill in both email and password.");
        return;
      }

      setButtonLoading(btn, true);

      FD.api("/api/auth/login", { json: { email: email, password: password } })
        .then(function (res) {
          if (res.token) {
            localStorage.setItem("fd_token", res.token);
            if (res.user) localStorage.setItem("fd_user", JSON.stringify(res.user));
          }
          if (FD.auth && FD.auth.syncLocalToCloud) {
            return FD.auth.syncLocalToCloud().catch(function () {});
          }
        })
        .then(function () {
          FD.toast("Logged in successfully! Welcome back.", 2000);
          setTimeout(function () {
            window.location.href = getNextUrl();
          }, 400);
        })
        .catch(function (err) {
          setButtonLoading(btn, false);
          showAlert(err.message || "Invalid email or password.");
        });
    });
  }

  // ── Signup Form ─────────────────────────────────────────────────────────
  var signupForm = $("signupForm");
  if (signupForm) {
    signupForm.addEventListener("submit", function (e) {
      e.preventDefault();
      hideAlert();
      var fullName = $("signupName").value.trim();
      var email = $("signupEmail").value.trim();
      var password = $("signupPassword").value;
      var terms = $("signupTerms").checked;
      var btn = $("signupSubmitBtn");

      if (!fullName) {
        showAlert("Please enter your name.");
        return;
      }
      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        showAlert("Please enter a valid email address.");
        return;
      }
      if (!password || password.length < 6) {
        showAlert("Password must be at least 6 characters.");
        return;
      }
      if (!terms) {
        showAlert("Please agree to the Terms of Use and Privacy Policy.");
        return;
      }

      setButtonLoading(btn, true);

      FD.api("/api/auth/signup", { json: { email: email, password: password, fullName: fullName } })
        .then(function (res) {
          if (res.token) {
            localStorage.setItem("fd_token", res.token);
            if (res.user) localStorage.setItem("fd_user", JSON.stringify(res.user));
          }
          if (FD.auth && FD.auth.syncLocalToCloud) {
            return FD.auth.syncLocalToCloud().catch(function () {});
          }
        })
        .then(function () {
          FD.toast("Account created successfully! Welcome to Fit Deal.", 2000);
          setTimeout(function () {
            window.location.href = getNextUrl();
          }, 400);
        })
        .catch(function (err) {
          setButtonLoading(btn, false);
          showAlert(err.message || "Failed to create account. Please try again.");
        });
    });
  }

  // ── Check for OAuth redirect hash callback ──────────────────────────────
  if (window.location.hash && window.location.hash.includes("access_token=")) {
    var hashParams = new URLSearchParams(window.location.hash.substring(1));
    var accessToken = hashParams.get("access_token");
    if (accessToken) {
      localStorage.setItem("fd_token", accessToken);
      FD.api("/api/auth/me", { headers: { Authorization: "Bearer " + accessToken } })
        .then(function (res) {
          if (res.user) localStorage.setItem("fd_user", JSON.stringify(res.user));
          if (FD.auth && FD.auth.syncLocalToCloud) return FD.auth.syncLocalToCloud().catch(function () {});
        })
        .then(function () {
          window.location.href = getNextUrl();
        });
    }
  }
})();
