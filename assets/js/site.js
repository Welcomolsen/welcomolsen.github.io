/* WORA Tech : formulaire de devis, bandeau de consentement et mesure d'audience */
(function () {
  'use strict';
  var WA = '242066629208';
  var MAIL = 'welcomolsen@gmail.com';
  var GC_URL = 'https://wora-tech.goatcounter.com/count';
  var KEY = 'wora-consent';
  var MAX_AGE = 1000 * 60 * 60 * 24 * 180; // on redemande au bout de 6 mois

  /* ---------- stockage sûr ---------- */
  function readConsent() {
    try {
      var c = JSON.parse(localStorage.getItem(KEY) || 'null');
      if (c && (c.v === 'oui' || c.v === 'non') && Date.now() - c.t < MAX_AGE) return c.v;
    } catch (e) {}
    return null;
  }
  function saveConsent(v) {
    try { localStorage.setItem(KEY, JSON.stringify({ v: v, t: Date.now() })); } catch (e) {}
  }

  /* ---------- mesure d'audience (GoatCounter, sans cookie) ---------- */
  var statsLoaded = false;
  function loadStats() {
    if (statsLoaded || location.protocol !== 'https:') return;
    statsLoaded = true;
    var s = document.createElement('script');
    s.async = true;
    s.src = 'https://gc.zgo.at/count.js';
    s.setAttribute('data-goatcounter', GC_URL);
    document.head.appendChild(s);
  }

  /* ---------- bandeau ---------- */
  var banner;
  function buildBanner() {
    banner = document.createElement('section');
    banner.className = 'cookie';
    banner.setAttribute('role', 'dialog');
    banner.setAttribute('aria-labelledby', 'cookie-t');
    banner.setAttribute('aria-describedby', 'cookie-d');
    banner.hidden = true;
    banner.innerHTML =
      '<h2 id="cookie-t">Votre choix pour la mesure d’audience</h2>' +
      '<p id="cookie-d">Avec votre accord, nous comptons les visites de façon anonyme avec GoatCounter, sans cookie publicitaire ni suivi d’une page à l’autre. ' +
      'Refuser ne change rien à l’utilisation du site. <a href="/confidentialite.html#cookies">En savoir plus</a></p>' +
      '<div class="row"><button type="button" class="btn btn-line" data-c="non">Refuser</button>' +
      '<button type="button" class="btn btn-primary" data-c="oui">Accepter</button></div>';
    banner.addEventListener('click', function (e) {
      var b = e.target.closest('[data-c]');
      if (!b) return;
      var v = b.getAttribute('data-c');
      saveConsent(v);
      hideBanner();
      if (v === 'oui') loadStats();
      else if (statsLoaded) location.reload(); // retire le script déjà chargé
    });
    document.body.appendChild(banner);
  }
  function showBanner() {
    if (!banner) buildBanner();
    banner.hidden = false;
    document.body.classList.add('has-cookie');
  }
  function hideBanner() {
    if (banner) banner.hidden = true;
    document.body.classList.remove('has-cookie');
  }

  var consent = readConsent();
  if (consent === 'oui') loadStats();
  else if (consent === null) showBanner();

  document.addEventListener('click', function (e) {
    if (e.target.closest('[data-cookies]')) { showBanner(); var f = banner.querySelector('button'); if (f) f.focus(); }
  });

  /* ---------- formulaire de devis ---------- */
  var f = document.getElementById('devis');
  if (!f || f.tagName !== 'FORM') return;
  var err = document.getElementById('err');
  var via = 'wa';
  var started = Date.now();
  var rules = {
    nom: function (v) { return v.length >= 2 && v.length <= 80 && /[A-Za-zÀ-ÿ]/.test(v); },
    type: function (v) { return v.length > 0; },
    besoin: function (v) { return v.length >= 15 && v.length <= 1500; }
  };
  function check(n) {
    var el = f.elements[n];
    var ok = rules[n](el.value.trim());
    el.setAttribute('aria-invalid', ok ? 'false' : 'true');
    var m = document.getElementById('err-' + n);
    if (m) m.hidden = ok;
    return ok;
  }
  Object.keys(rules).forEach(function (n) {
    var el = f.elements[n];
    el.addEventListener('input', function () { if (el.getAttribute('aria-invalid') === 'true') check(n); });
  });
  f.querySelectorAll('button[type=submit]').forEach(function (b) {
    b.addEventListener('click', function () { via = b.value; });
  });
  f.addEventListener('submit', function (e) {
    e.preventDefault();
    var bad = Object.keys(rules).filter(function (n) { return !check(n); });
    err.hidden = bad.length === 0;
    if (bad.length) { f.elements[bad[0]].focus(); return; }
    // anti-spam : champ piège rempli ou envoi en moins de 3 secondes = robot
    if (f.elements.site_web.value || Date.now() - started < 3000) return;
    var t = 'Bonjour WORA Tech,\n\nJe m\'appelle ' + f.elements.nom.value.trim() +
      '.\nType de projet : ' + f.elements.type.value +
      '\n\nMon besoin :\n' + f.elements.besoin.value.trim() +
      '\n\nMerci de me recontacter pour un devis.';
    if (window.goatcounter && goatcounter.count) {
      try { goatcounter.count({ path: 'devis-' + via, title: 'Demande de devis', event: true }); } catch (x) {}
    }
    if (via === 'mail') {
      location.href = 'mailto:' + MAIL + '?subject=' + encodeURIComponent('Demande de devis : ' + f.elements.type.value) + '&body=' + encodeURIComponent(t);
    } else {
      window.open('https://wa.me/' + WA + '?text=' + encodeURIComponent(t), '_blank', 'noopener');
    }
  });
})();
