/* Cookie-Banner der neuen Website.
   Verhalten wie der WP Consent Manager (gleiches Cookie, gleiche Zuordnung zu Google Consent Mode v2,
   gleiches dataLayer-Ereignis). Neu: Nachweis über die Annahmestelle in WordPress statt admin-ajax,
   Link „Cookie-Einstellungen“ in der Fußzeile, Prüfkasten in der Testversion. */
(function () {
  'use strict';
  var COOKIE_NAME = 'wp_consent_manager';
  var cfg = window.wcmConfig || {};
  var LIVE = /^(www\.)?finkeldei-online\.de$/.test(location.hostname);
  var TEST = !LIVE && /[?&]consent-test=1\b/.test(location.search); // Testversion: einmaliger, gekennzeichneter Nachweis
  var CONSENT_MAP = {
    analytics: ['analytics_storage'],
    marketing: ['ad_storage', 'ad_user_data', 'ad_personalization'],
    preferences: ['functionality_storage', 'personalization_storage']
  };

  function readCookie() {
    var match = document.cookie.match(new RegExp('(?:^|;)\\s*' + COOKIE_NAME + '=([^;]+)'));
    if (!match) return null;
    try { return JSON.parse(atob(decodeURIComponent(match[1]))); } catch (e) { return null; }
  }
  function writeCookie(consent) {
    var days = parseInt(cfg.cookieDuration, 10) || 365;
    var expires = new Date(); expires.setDate(expires.getDate() + days);
    var value = encodeURIComponent(btoa(JSON.stringify(consent)));
    var secure = location.protocol === 'https:' ? '; Secure' : '';
    document.cookie = COOKIE_NAME + '=' + value + '; expires=' + expires.toUTCString() + '; path=/; SameSite=Lax' + secure;
    try { localStorage.setItem(COOKIE_NAME, JSON.stringify(consent)); } catch (e) {}
  }
  function pushConsentUpdate(consent) {
    window.dataLayer = window.dataLayer || [];
    var update = { security_storage: 'granted' };
    for (var category in CONSENT_MAP) {
      if (!Object.prototype.hasOwnProperty.call(CONSENT_MAP, category)) continue;
      var status = consent[category] ? 'granted' : 'denied';
      for (var i = 0; i < CONSENT_MAP[category].length; i++) update[CONSENT_MAP[category][i]] = status;
    }
    function gtag() { dataLayer.push(arguments); }
    gtag('consent', 'update', update);
    dataLayer.push({ event: 'wcm_consent_updated', wcm_analytics: consent.analytics, wcm_marketing: consent.marketing, wcm_preferences: consent.preferences });
    showDebug(update);
  }
  function sendToServer(consent) {
    if (!cfg.logConsents || !cfg.endpoint) return;
    if (!LIVE && !TEST) { showDebug(null, 'Nachweis in der Testversion nicht gespeichert'); return; }
    var body = new URLSearchParams();
    body.append('analytics', consent.analytics ? '1' : '0');
    body.append('marketing', consent.marketing ? '1' : '0');
    body.append('preferences', consent.preferences ? '1' : '0');
    if (TEST) body.append('test', '1');
    fetch(cfg.endpoint, { method: 'POST', body: body })
      .then(function (r) { showDebug(null, 'Nachweis gesendet: HTTP ' + r.status); })
      .catch(function () { showDebug(null, 'Nachweis nicht gesendet'); });
  }

  var banner = document.getElementById('wcm-banner');
  var overlay = document.getElementById('wcm-overlay');
  var detailsEl = document.getElementById('wcm-categories');
  var btnAccept = document.getElementById('wcm-btn-accept');
  var btnReject = document.getElementById('wcm-btn-reject');
  var btnCustomize = document.getElementById('wcm-btn-customize');
  var btnSave = document.getElementById('wcm-btn-save');
  var reopenBtn = document.getElementById('wcm-reopen');

  function openBanner() {
    if (!banner) return;
    banner.classList.remove('wcm-hidden'); banner.removeAttribute('aria-hidden');
    if (reopenBtn) reopenBtn.classList.add('wcm-hidden');
    if (banner.classList.contains('wcm-pos-center')) document.body.style.overflow = 'hidden';
    var firstBtn = banner.querySelector('button'); if (firstBtn) firstBtn.focus();
  }
  function closeBanner() {
    if (!banner) return;
    banner.classList.add('wcm-hidden'); banner.setAttribute('aria-hidden', 'true');
    if (reopenBtn) reopenBtn.classList.remove('wcm-hidden');
    document.body.style.overflow = '';
  }
  function applyConsent(consent) {
    consent.timestamp = Math.floor(Date.now() / 1000);
    writeCookie(consent); pushConsentUpdate(consent); sendToServer(consent); closeBanner();
    ['analytics', 'marketing', 'preferences'].forEach(function (cat) { var chk = document.getElementById('wcm-chk-' + cat); if (chk) chk.checked = !!consent[cat]; });
  }

  var stored = readCookie();
  if (stored) {
    pushConsentUpdate(stored);
    if (reopenBtn) reopenBtn.classList.remove('wcm-hidden');
    ['analytics', 'marketing', 'preferences'].forEach(function (cat) { var chk = document.getElementById('wcm-chk-' + cat); if (chk) chk.checked = !!stored[cat]; });
  } else { openBanner(); }

  if (btnAccept) btnAccept.addEventListener('click', function () { applyConsent({ analytics: true, marketing: true, preferences: true }); });
  if (btnReject) btnReject.addEventListener('click', function () { applyConsent({ analytics: false, marketing: false, preferences: false }); });
  if (btnSave) btnSave.addEventListener('click', function () {
    applyConsent({
      analytics: !!(document.getElementById('wcm-chk-analytics') || {}).checked,
      marketing: !!(document.getElementById('wcm-chk-marketing') || {}).checked,
      preferences: !!(document.getElementById('wcm-chk-preferences') || {}).checked
    });
  });
  if (btnCustomize && detailsEl) {
    var detailsOpen = false, labelShow = btnCustomize.childNodes[0].textContent.trim(), labelHide = 'Details ausblenden';
    btnCustomize.addEventListener('click', function () {
      detailsOpen = !detailsOpen; detailsEl.hidden = !detailsOpen;
      btnCustomize.setAttribute('aria-expanded', String(detailsOpen));
      btnCustomize.childNodes[0].textContent = (detailsOpen ? labelHide : labelShow) + ' ';
    });
  }
  var tabBtns = document.querySelectorAll('.wcm-tab-btn');
  tabBtns.forEach(function (btn) {
    btn.addEventListener('click', function () {
      tabBtns.forEach(function (b) { b.classList.remove('wcm-tab-active'); b.setAttribute('aria-selected', 'false'); });
      document.querySelectorAll('.wcm-tab-panel').forEach(function (p) { p.hidden = true; p.classList.remove('wcm-tab-panel-active'); });
      btn.classList.add('wcm-tab-active'); btn.setAttribute('aria-selected', 'true');
      var panel = document.getElementById('wcm-panel-' + btn.dataset.tab);
      if (panel) { panel.hidden = false; panel.classList.add('wcm-tab-panel-active'); }
    });
  });
  if (overlay) overlay.addEventListener('click', function () { if (readCookie()) closeBanner(); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && banner && !banner.classList.contains('wcm-hidden') && readCookie()) closeBanner(); });
  if (reopenBtn) reopenBtn.addEventListener('click', openBanner);
  document.querySelectorAll('[data-wcm-open]').forEach(function (el) { el.addEventListener('click', function (e) { e.preventDefault(); openBanner(); }); });

  /* Prüfkasten – nur in der Testversion */
  var dbg;
  function showDebug(update, note) {
    if (LIVE) return;
    if (!dbg) {
      dbg = document.createElement('div'); dbg.className = 'wcm-debug'; dbg.setAttribute('role', 'status'); dbg.title = 'Antippen zum Ausblenden'; dbg.addEventListener('click', function () { dbg.style.display = 'none'; });
      document.body.appendChild(dbg);
    }
    if (update) {
      var on = function (k) { return update[k] === 'granted' ? 'ja' : 'nein'; };
      dbg.innerHTML = '<b>Testversion – an Google würde gemeldet:</b><br>Statistik ' + on('analytics_storage') + ' · Werbung ' + on('ad_storage') + ' · Präferenzen ' + on('functionality_storage') + '<br><span>GTM ist in der Testversion nicht geladen.</span>';
    }
    if (note) dbg.innerHTML += '<br><span>' + note + '</span>';
  }
})();
