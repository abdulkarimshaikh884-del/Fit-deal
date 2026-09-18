/* Fit Deal — contact form. Messages are stored for the team to answer. */
(function () {
  "use strict";
  var FD = window.FD;
  var form = document.getElementById("contactForm");
  var errorBox = document.getElementById("contactError");
  var send = document.getElementById("contactSend");
  // form.elements, not form.name: a form's own .name is its name attribute.
  var f = form.elements;

  // ?topic=… preselects a topic, e.g. links from the privacy page.
  var t = new URLSearchParams(location.search).get("topic");
  if (t) Array.prototype.forEach.call(f.topic.options, function (o) { if (o.text.toLowerCase() === t.toLowerCase()) o.selected = true; });

  function invalid(field, on) { field.setAttribute("aria-invalid", on ? "true" : "false"); }

  form.addEventListener("submit", function (ev) {
    ev.preventDefault();
    var name = f.name.value.trim();
    var email = f.email.value.trim();
    var message = f.message.value.trim();
    var okEmail = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);
    invalid(f.name, !name);
    invalid(f.email, !okEmail);
    invalid(f.message, message.length < 5);
    if (!name || !okEmail || message.length < 5) {
      errorBox.textContent = !name ? "Please add your name." : !okEmail ? "Please add a valid email so we can reply." : "Please write a short message.";
      errorBox.hidden = false;
      (form.querySelector('[aria-invalid="true"]') || f.name).focus();
      return;
    }
    errorBox.hidden = true;
    send.disabled = true;
    send.textContent = "Sending…";
    FD.api("/api/contact", { json: { name: name, email: email, topic: f.topic.value, message: message, website: f.website.value } }).then(function () {
      form.hidden = true;
      var done = document.getElementById("contactDone");
      done.hidden = false;
      done.focus();
    }).catch(function (e) {
      errorBox.textContent = e.message + " You can also email support@fitdeal.shop.";
      errorBox.hidden = false;
      send.disabled = false;
      send.textContent = "Send message";
    });
  });
})();
