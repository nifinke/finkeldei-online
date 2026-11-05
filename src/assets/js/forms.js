/* Anfrageformulare: senden an die Annahmestelle in WordPress und melden – wie heute – das GTM-Ereignis
   mit gehashter E-Mail-Adresse (erweiterte Conversions). */
(function () {
  'use strict';
  var forms = document.querySelectorAll('form[data-fx-form]');
  if (!forms.length) return;
  var ENDPOINT = (window.fxConfig || {}).endpoint;
  var started = Date.now();
  var MAX_FILE = 10 * 1024 * 1024, MAX_TOTAL = 15 * 1024 * 1024, MAX_COUNT = 5;

  // Ereignisse wie in den heutigen GTM-Skripten
  function eventFor(kind) {
    if (kind === 'kontakt') return 'cf7_Kontakt';
    if (kind === 'verkehrsrecht') return 'formcraft_RA_Verkehrsrecht';
    if (kind === 'arbeitsrecht') return 'formcraft_RA_Arbeitsrecht';
    if (kind === 'nachricht' && /\/scheidungsanwalt\/$/.test(location.pathname)) return 'thrive_Scheidungsanwalt';
    return null;
  }
  function sha256(text) {
    if (!text || !window.crypto || !crypto.subtle) return Promise.resolve('');
    return crypto.subtle.digest('SHA-256', new TextEncoder().encode(text.trim().toLowerCase())).then(function (b) {
      return Array.from(new Uint8Array(b)).map(function (x) { return x.toString(16).padStart(2, '0'); }).join('');
    }).catch(function () { return ''; });
  }
  function showError(form, msg, fields) {
    var box = form.querySelector('.fx-error');
    box.textContent = msg; box.hidden = false;
    form.querySelectorAll('.fx-invalid').forEach(function (el) { el.classList.remove('fx-invalid'); });
    (fields || []).forEach(function (n) {
      var el = form.querySelector('[name="' + n + '"]');
      if (el) { var w = el.closest('.fx-field'); if (w) w.classList.add('fx-invalid'); }
    });
    box.scrollIntoView({ block: 'center', behavior: 'smooth' });
  }

  forms.forEach(function (form) {
    var kind = form.getAttribute('data-fx-form');
    var fileInput = form.querySelector('input[type=file]');
    if (fileInput) fileInput.addEventListener('change', function () {
      var hint = form.querySelector('.fx-filehint');
      var names = Array.prototype.map.call(fileInput.files, function (f) { return f.name; });
      if (hint) hint.textContent = names.length ? names.length + (names.length === 1 ? ' Datei: ' : ' Dateien: ') + names.join(', ') : 'Bis zu 5 Dateien (PDF, JPG, PNG, HEIC, DOC, DOCX), je höchstens 10 MB.';
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      // Pflichtfelder prüfen
      var missing = [];
      form.querySelectorAll('[required]').forEach(function (el) {
        if (el.type === 'radio') { if (!form.querySelector('input[name="' + el.name + '"]:checked')) missing.push(el.name); }
        else if (!el.value.trim() || !el.checkValidity()) missing.push(el.name);
      });
      if (missing.length) { showError(form, 'Bitte füllen Sie alle Pflichtfelder aus.', missing); return; }
      if (fileInput && fileInput.files.length) {
        var total = 0, tooBig = false;
        Array.prototype.forEach.call(fileInput.files, function (f) { total += f.size; if (f.size > MAX_FILE) tooBig = true; });
        if (fileInput.files.length > MAX_COUNT) { showError(form, 'Bitte höchstens 5 Dateien anhängen.', ['files[]']); return; }
        if (tooBig || total > MAX_TOTAL) { showError(form, 'Die Dateien sind zu groß (je Datei höchstens 10 MB, zusammen höchstens 15 MB).', ['files[]']); return; }
      }

      var data = new FormData(form);
      data.append('t', String(started));
      data.append('seite', location.origin + location.pathname);
      var btn = form.querySelector('.fx-submit'), label = btn.textContent;
      btn.disabled = true; btn.textContent = 'Wird gesendet …';
      form.querySelector('.fx-error').hidden = true;

      fetch(ENDPOINT, { method: 'POST', body: data })
        .then(function (r) { return r.json().catch(function () { return {}; }).then(function (j) { return { ok: r.ok && j && j.ok, j: j }; }); })
        .then(function (res) {
          if (!res.ok) {
            var j = res.j || {};
            showError(form, j.message || 'Ihre Nachricht konnte nicht gesendet werden. Bitte versuchen Sie es später erneut oder rufen Sie uns an: 0 20 41 / 16 285 16.', (j.data && j.data.fields) || []);
            btn.disabled = false; btn.textContent = label; return;
          }
          var ev = eventFor(kind), email = (form.querySelector('[name=email]') || {}).value || '';
          var success = form.parentNode.querySelector('.fx-success');
          form.hidden = true; success.hidden = false; success.focus();
          if (ev) sha256(email).then(function (h) {
            window.dataLayer = window.dataLayer || [];
            window.dataLayer.push({ event: ev, user_data: { sha256_email_address: h } });
          });
        })
        .catch(function () {
          showError(form, 'Ihre Nachricht konnte nicht gesendet werden. Bitte prüfen Sie Ihre Internetverbindung oder rufen Sie uns an: 0 20 41 / 16 285 16.');
          btn.disabled = false; btn.textContent = label;
        });
    });
  });
})();
