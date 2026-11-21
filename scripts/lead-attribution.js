/* First-party lead attribution. No names, phone numbers, arbitrary queries or form values are stored. */
(function () {
  'use strict';
  var w = window, d = document;
  var host = location.hostname.toLowerCase().replace(/^www\./, '');
  var excluded = /^\/(?:bogoroditsk|zamorozka|baza|treneram|trener-hub)(?:\/|$)/i;
  if (['sandowfitness.ru', 'lp.sandowfitness.ru'].indexOf(host) < 0 || excluded.test(location.pathname)) return;
  if (/богородиц/i.test(d.title || '') || ((d.body && d.body.innerText || '').match(/богородиц/gi) || []).length >= 5) return;
  if (w.SandowAttribution) return;
  var VERSION = '1', KEY = 'sndw_journey_v1', TTL = 30 * 86400000, MAX = 8;
  var counter = host === 'lp.sandowfitness.ru' ? 111841988 : 111438633;
  var clientId = '', storage = 'memory', state, lastClick = null;
  var sent = Object.create(null), observed = Object.create(null);
  function now() { return new Date().toISOString(); }
  function id() {
    try { var a = new Uint32Array(3); w.crypto.getRandomValues(a); return 'sl-' + Array.prototype.map.call(a, function (n) { return n.toString(36); }).join('-'); }
    catch (_) { return 'sl-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 13); }
  }
  function label(v) {
    v = String(v || '').trim();
    if (/@|(?:\d[\s()+.-]*){9,}/.test(v)) return '';
    return v.replace(/[^a-zA-Zа-яА-ЯёЁ0-9 _.,:/-]/g, '').slice(0, 80);
  }
  function page(v) {
    try {
      var u = new URL(v, location.href);
      var h = u.hostname.toLowerCase().replace(/^www\./, '');
      if (['sandowfitness.ru', 'lp.sandowfitness.ru'].indexOf(h) < 0 || excluded.test(u.pathname)) return '';
      var path = decodeURIComponent(u.pathname);
      if (/@|(?:\d[\s()+.-]*){9,}/.test(path) || path.length > 180 || /[^a-zA-Zа-яА-ЯёЁ0-9_./ -]/.test(path)) return h + '/[withheld]';
      return h + path;
    } catch (_) { return ''; }
  }
  function internal(u) { return /^(?:www\.)?(?:lp\.)?sandowfitness\.ru$/i.test(u.hostname); }
  function touch() {
    var q = new URLSearchParams(location.search), s = label(q.get('utm_source')), medium = label(q.get('utm_medium'));
    var t = {source: '', medium: '', campaign: '', term: '', landing: page(location.href), at: now(), evidence: ''};
    if (s) {
      t.source = s; t.medium = medium || 'tagged'; t.campaign = label(q.get('utm_campaign')); t.term = label(q.get('utm_term')); t.evidence = 'tag'; return t;
    }
    try {
      if (d.referrer) {
        var r = new URL(d.referrer);
        if (internal(r)) return null;
        var rh = r.hostname.toLowerCase().replace(/^www\./, '');
        t.source = /(^|\.)google\.[a-z.]+$/.test(rh) ? 'google' : /(^|\.)ya(?:ndex)?\.[a-z.]+$/.test(rh) ? 'yandex' : label(rh);
        t.medium = /google|yandex/.test(t.source) ? (/\/maps(?:\/|$)/.test(r.pathname) ? 'maps' : 'search_or_referral') : 'referral';
        if (t.source === 'google' || t.source === 'yandex') t.term = label(r.searchParams.get(t.source === 'google' ? 'q' : 'text'));
        t.evidence = 'referrer'; return t;
      }
    } catch (_) {}
    t.source = 'unknown'; t.medium = 'direct_or_hidden'; t.evidence = 'not_provided'; return t;
  }
  function cleanTouch(t) {
    if (!t || typeof t !== 'object' || !Number.isFinite(Date.parse(t.at))) return null;
    var p = page('https://' + String(t.landing || ''));
    if (!p) return null;
    return {source: label(t.source) || 'unknown', medium: label(t.medium) || 'unknown', campaign: label(t.campaign), term: label(t.term), landing: p, at: new Date(t.at).toISOString(), evidence: label(t.evidence)};
  }
  function restore() {
    try {
      var match = d.cookie.split('; ').find(function (x) { return x.indexOf(KEY + '=') === 0; });
      if (!match) return null;
      var x = JSON.parse(decodeURIComponent(match.slice(KEY.length + 1)));
      if (x.v !== VERSION || !Number.isFinite(x.created) || Date.now() - x.created > TTL || x.created > Date.now() + 60000) return null;
      var first = cleanTouch(x.first), last = cleanTouch(x.last);
      if (!first) return null;
      var routes = (Array.isArray(x.path) ? x.path : []).slice(-MAX).map(function (r) {
        var url = page('https://' + String(r.url || ''));
        return url && Number.isFinite(Date.parse(r.at)) ? {url: url, at: new Date(r.at).toISOString()} : null;
      }).filter(Boolean);
      return {v: VERSION, created: x.created, first: first, last: last || first, path: routes};
    } catch (_) { return null; }
  }
  function persist() {
    try {
      var encoded = encodeURIComponent(JSON.stringify(state));
      while (encoded.length > 3400 && state.path.length > 1) { state.path.shift(); encoded = encodeURIComponent(JSON.stringify(state)); }
      if (encoded.length > 3400) { storage = 'memory'; return; }
      var seconds = Math.max(0, Math.floor((state.created + TTL - Date.now()) / 1000));
      d.cookie = KEY + '=' + encoded + '; Domain=sandowfitness.ru; Path=/; Max-Age=' + seconds + '; SameSite=Lax; Secure';
      storage = d.cookie.indexOf(KEY + '=') >= 0 ? 'cookie' : 'memory';
    } catch (_) { storage = 'memory'; }
  }
  var current = touch(), restored = restore();
  if (!restored) {
    var initial = current || {source:'unknown', medium:'internal_without_history', campaign:'', landing:page(location.href), at:now(), evidence:'not_provided'};
    state = {v: VERSION, created: Date.now(), first: initial, last: initial, path: []};
  } else {
    state = restored;
    if (current && current.source !== 'unknown') state.last = current;
  }
  function record() {
    var p = page(location.href);
    if (!p) return;
    var prior = state.path[state.path.length - 1];
    if (!prior || prior.url !== p) { state.path.push({url:p, at:now()}); state.path = state.path.slice(-MAX); }
    persist();
  }
  record();
  function fields(form) {
    if (form && !form.__sndwLeadId) form.__sndwLeadId = id();
    var out = {sndw_attr_version:VERSION, sndw_lead_id:form ? form.__sndwLeadId : id(), sndw_client_id:clientId, sndw_path:JSON.stringify(state.path), sndw_source_status:state.last.evidence + ';storage=' + storage + ';client=' + (clientId ? 'available' : 'unavailable')};
    ['first', 'last'].forEach(function (kind) {
      ['source','medium','campaign','term','landing','at'].forEach(function (key) { out['sndw_' + kind + '_' + key] = state[kind][key] || ''; });
    });
    return out;
  }
  function eligible(form) { return form && form.tagName === 'FORM' && form.querySelector('input[type=tel],input[name=Phone],input[name=phone]'); }
  function prepare(form) {
    if (!eligible(form)) return;
    var data = fields(form);
    Object.keys(data).forEach(function (name) {
      var input = form.querySelector('input[name="' + name + '"]');
      if (!input) { input = d.createElement('input'); input.type = 'hidden'; input.name = name; form.appendChild(input); }
      input.value = data[name];
    });
  }
  function scan(root) { if (eligible(root)) prepare(root); if (root && root.querySelectorAll) root.querySelectorAll('form').forEach(prepare); }
  function testForm(form) {
    if (!form) return false;
    var p = form.querySelector('input[type=tel],input[name=Phone],input[name=phone]');
    var digits = String(p && p.value || '').replace(/\D/g, '').slice(-10);
    var t = form.querySelector('[name=test],[name=is_test],[name=isTest]');
    return /^900000/.test(digits) || /^000/.test(digits) || !!(t && /^(true|1|yes)$/i.test(t.value));
  }
  function accepted(form, response) {
    if (!form || testForm(form) || response && (response.test || response.repeat || response.deduped || response.duplicate || response.skipped)) return;
    var lead = form.__sndwLeadId;
    if (!lead || sent[lead]) return;
    sent[lead] = true;
    // Never pass route strings, user fields or client identifiers to analytics.
    try { if (typeof w.ym === 'function') w.ym(counter, 'reachGoal', 'sndw_lead_accepted', {version:VERSION, form_kind:form.classList.contains('t-form') ? 'tilda' : 'custom'}); } catch (_) {}
    form.__sndwAccepted = true;
  }
  function attempt(form) {
    if (form.__sndwAccepted) { form.__sndwLeadId = id(); form.__sndwAccepted = false; }
    lastClick = form; prepare(form);
  }
  // Native Tilda serializes before its asynchronous request: capture before target handlers.
  d.addEventListener('submit', function (e) { if (eligible(e.target)) attempt(e.target); }, true);
  d.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('button,input[type=submit]');
    if (b && b.form && eligible(b.form)) attempt(b.form);
  }, true);
  // Only enrich known custom JSON lead receivers, leaving every other fetch untouched.
  if (typeof w.fetch === 'function') {
    var originalFetch = w.fetch;
    w.fetch = function (resource, init) {
      var next = init, form = null, data;
      try {
        var url = new URL(typeof resource === 'string' ? resource : resource.url, location.href);
        var known = url.protocol === 'https:' && /^(sandow-emergency-leads\.pages\.dev|sandow-lead-bot-standalone\.onrender\.com)$/.test(url.hostname) && url.pathname === '/site-lead';
        if (known && init && String(init.method || 'GET').toUpperCase() === 'POST' && typeof init.body === 'string') {
          data = JSON.parse(init.body);
          if (data && !Array.isArray(data) && typeof data === 'object' && !(data.company || '').trim()) {
            form = lastClick;
            var attrs = fields(form);
            next = Object.assign({}, init, {body:JSON.stringify(Object.assign({}, data, attrs))});
          }
        }
      } catch (_) { next = init; }
      var promise = originalFetch.call(this, resource, next);
      if (form) {
        promise.then(function (r) {
          if (!r.ok) return;
          r.clone().json().then(function (j) { if (j && j.ok === true) accepted(form, j); }).catch(function () {});
        }).catch(function () {});
      }
      return promise;
    };
  }
  function tildaSuccess(e, form) {
    var f = form && (form.tagName ? form : form[0]);
    if (!f && e.target && e.target.tagName === 'FORM') f = e.target;
    if (f) accepted(f);
  }
  function bindJquery() {
    if (w.jQuery && !observed.jquery) { observed.jquery = true; w.jQuery(d).on('tildaform:aftersuccess.sndwAttribution', tildaSuccess); }
  }
  d.addEventListener('tildaform:aftersuccess', tildaSuccess);
  function boot() {
    scan(d); bindJquery();
    if (w.MutationObserver) new MutationObserver(function (mutations) {
      mutations.forEach(function (m) { m.addedNodes.forEach(function (n) { if (n.nodeType === 1) scan(n); }); });
    }).observe(d.documentElement, {childList:true, subtree:true});
  }
  if (d.readyState === 'loading') d.addEventListener('DOMContentLoaded', boot); else boot();
  var attempts = 0, timer = setInterval(function () {
    bindJquery();
    try { if (!clientId && typeof w.ym === 'function') w.ym(counter, 'getClientID', function (value) {
      if (/^(?:\d{5,30}|\d{1,20}\.\d{1,20})$/.test(String(value || ''))) { clientId = String(value); scan(d); }
    }); } catch (_) {}
    if (++attempts >= 12 || clientId) clearInterval(timer);
  }, 1000);
  w.addEventListener('pageshow', function () { scan(d); bindJquery(); });
  w.SandowAttribution = {version:VERSION, fields:fields, prepare:prepare, accepted:accepted, snapshot:function () { return JSON.parse(JSON.stringify(state)); }};
})();
