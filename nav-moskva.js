/* Меню и гамбургер для московских страниц lp.sandowfitness.ru
 * ============================================================
 * Ольга, 20.10.2026: «сделай гамбургеры на московском сайте также, там их
 * тоже видимо нет».
 *
 * Факт на момент правки: на главной sandowfitness.ru меню и гамбургер есть
 * (кнопка 42×40, 14 px от правого края), а на 124 страницах lp — лендингах и
 * статьях — в шапке только логотип и телефон. Человек, попавший на лендинг,
 * навигацию не находит.
 *
 * Что делает файл: дорисовывает в шапку те же пункты, что на главной, и на
 * телефоне убирает их в гамбургер справа — так же, как на главной.
 *
 * Где работает: только на lp.sandowfitness.ru и только вне раздела
 * Богородицка (§0б — проекты не смешиваются).
 */
(function () {
  var хост = location.hostname;
  var путь = location.pathname;
  if (хост.indexOf('lp.sandowfitness.ru') === -1) return;
  if (путь.indexOf('/bogoroditsk') === 0) return;

  var ГЛАВНАЯ = 'https://sandowfitness.ru';
  var ПУНКТЫ = [
    ['Клуб', ГЛАВНАЯ + '/#club'],
    ['Залы', ГЛАВНАЯ + '/#zones'],
    ['Тренеры', ГЛАВНАЯ + '/#trainers'],
    ['Бойцовский клуб', ГЛАВНАЯ + '/fightclub'],
    ['Наши клубы', ГЛАВНАЯ + '/clubs'],
    ['Статьи', 'https://lp.sandowfitness.ru/stati/']
  ];

  function стили() {
    if (document.getElementById('sndw-nav-moskva-css')) return;
    var с = document.createElement('style');
    с.id = 'sndw-nav-moskva-css';
    с.textContent = [
      /* общий ряд шапки: не переносим, даём содержимому сжиматься */
      '.header-in{flex-wrap:nowrap;gap:10px;min-width:0}',
      '.nav-moskva{display:flex;align-items:center;gap:18px;margin-left:auto;flex:0 0 auto}',
      '.nav-moskva a{color:#cfc3ae;text-decoration:none;font-size:14px;white-space:nowrap}',
      '.nav-moskva a:hover{color:#e9c77e}',
      /* кнопка-гамбургер: тот же размер, что на главной сайте */
      '.nav-burger{display:none;width:42px;height:40px;flex:0 0 42px;box-sizing:border-box;',
      'border:1px solid #2e2415;border-radius:10px;background:transparent;',
      'padding:9px 10px;cursor:pointer;margin-left:auto}',
      '.nav-burger span{display:block;height:2px;background:#e9c77e;border-radius:2px;margin:3px 0;',
      'transition:transform .2s ease,opacity .2s ease}',
      '.nav-burger[aria-expanded="true"] span:nth-child(1){transform:translateY(5px) rotate(45deg)}',
      '.nav-burger[aria-expanded="true"] span:nth-child(2){opacity:0}',
      '.nav-burger[aria-expanded="true"] span:nth-child(3){transform:translateY(-5px) rotate(-45deg)}',
      /* выпадающая панель */
      '.nav-drop{display:flex;flex-direction:column;gap:2px;position:absolute;left:0;right:0;top:100%;',
      'background:rgba(11,9,6,.98);border-bottom:1px solid #2e2415;padding:8px 16px 14px;z-index:60}',
      '.nav-drop[hidden]{display:none !important}',
      '.nav-drop a{color:#e6dcc8;text-decoration:none;padding:11px 2px;font-size:15.5px;',
      'border-bottom:1px solid rgba(233,199,126,.10)}',
      '.nav-drop .nav-drop-cta{margin-top:12px;background:linear-gradient(180deg,#f3dca6,#e9c77e);',
      'color:#1a1408;border-radius:999px;padding:14px;text-align:center;font-weight:600;border-bottom:0}',
      '@media (max-width:900px){',
      '.nav-moskva{display:none}',
      '.nav-burger{display:block;margin-right:-6px}',
      /* на телефоне строка узкая: название и телефон поджимаем, чтобы
         гамбургер не выезжал за край */
      '.logo{font-size:15px;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}',
      '.head-phone{font-size:13px;white-space:nowrap}',
      '}',
      '@media (min-width:901px){.nav-drop{display:none !important}}'
    ].join('');
    document.head.appendChild(с);
  }

  function поставить() {
    var шапка = document.querySelector('header');
    if (!шапка || шапка.querySelector('.nav-burger')) return false;
    var ряд = шапка.querySelector('.header-in') || шапка;
    стили();
    if (getComputedStyle(ряд).position === 'static') ряд.style.position = 'relative';

    var меню = document.createElement('nav');
    меню.className = 'nav-moskva';
    меню.setAttribute('aria-label', 'Разделы клуба');
    ПУНКТЫ.forEach(function (п) {
      var а = document.createElement('a');
      а.href = п[1]; а.textContent = п[0];
      меню.appendChild(а);
    });

    var кнопка = document.createElement('button');
    кнопка.className = 'nav-burger';
    кнопка.type = 'button';
    кнопка.setAttribute('aria-label', 'Меню');
    кнопка.setAttribute('aria-expanded', 'false');
    кнопка.innerHTML = '<span></span><span></span><span></span>';

    var панель = document.createElement('div');
    панель.className = 'nav-drop';
    панель.hidden = true;
    ПУНКТЫ.forEach(function (п) {
      var а = document.createElement('a');
      а.href = п[1]; а.textContent = п[0];
      панель.appendChild(а);
    });
    var звонок = документЗвонок();
    if (звонок) панель.appendChild(звонок);

    ряд.appendChild(меню);
    ряд.appendChild(кнопка);
    ряд.appendChild(панель);

    кнопка.addEventListener('click', function () {
      var открыто = кнопка.getAttribute('aria-expanded') === 'true';
      кнопка.setAttribute('aria-expanded', String(!открыто));
      панель.hidden = открыто;
    });
    панель.addEventListener('click', function (е) {
      if (е.target.closest('a')) {
        кнопка.setAttribute('aria-expanded', 'false');
        панель.hidden = true;
      }
    });
    return true;
  }

  /* В панель кладём тот же телефон, что уже стоит в шапке страницы —
   * номер у московского клуба один, выдумывать нечего. */
  function документЗвонок() {
    var тел = document.querySelector('header a[href^="tel:"]');
    if (!тел) return null;
    var а = document.createElement('a');
    а.className = 'nav-drop-cta';
    а.href = тел.getAttribute('href');
    а.textContent = 'Позвонить: ' + (тел.textContent || '').trim();
    return а;
  }

  var попыток = 0;
  function попробовать() {
    if (поставить()) return;
    попыток += 1;
    if (попыток < 40) setTimeout(попробовать, 400);
  }
  попробовать();
  document.addEventListener('DOMContentLoaded', попробовать);
  window.addEventListener('load', попробовать);
})();

/* SNDW_ATTRIBUTION_BEGIN */
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
  var pointerEndpoint = 'https://sandow-lead-bot-standalone.onrender.com/lead-journey';
  var botLinks = {telegram: /^(?:www\.)?t\.me$/i, max: /^(?:www\.)?max\.ru$/i};
  var botPointer = '', pointers = Object.create(null), botRequest = Object.create(null);
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
  function randomHex() {
    var bytes = new Uint8Array(12);
    try { w.crypto.getRandomValues(bytes); } catch (_) { for (var i = 0; i < bytes.length; i++) bytes[i] = Math.floor(Math.random() * 256); }
    return Array.prototype.map.call(bytes, function (n) { return ('0' + n.toString(16)).slice(-2); }).join('');
  }
  // Registration never blocks the visit. If it fails, the token still opens the intended
  // bot screen (old code rides in the link) and the bot records the source as unknown.
  function registerPointer(meta) {
    if (!meta || botRequest[meta.token] === true) return;
    var data = meta.data;
    botRequest[meta.token] = true;
    try {
      if (typeof w.fetch !== 'function') return;
      w.fetch(pointerEndpoint, {method: 'POST', mode: 'cors', credentials: 'omit', keepalive: true,
        headers: {'Content-Type': 'application/json'}, body: JSON.stringify(data)})
        .then(function (r) { if (!r.ok) delete botRequest[meta.token]; }).catch(function () { delete botRequest[meta.token]; });
    } catch (_) { delete botRequest[meta.token]; }
  }
  function makePointer(channel, legacy, register) {
    var token = 'j_' + randomHex(), data = fields(null);
    data.channel = channel;
    data.token = token;
    data.legacy_start = legacy;
    var meta = {token: token, legacy: legacy, data: data, payload: token + (legacy ? '_' + legacy : '')};
    pointers[token] = meta;
    if (register) registerPointer(meta);
    return meta;
  }
  function botHref(a, meta) {
    var c = new URL(a.getAttribute('href'), location.href);
    if (a.__sndwKind === 'telegram') {
      c.pathname = '/' + a.__sndwAccount + (a.__sndwPathStart ? '/start' : '');
    }
    c.search = '?start=' + meta.payload;
    c.hash = '';
    return c.toString();
  }
  function rewriteBotLink(a) {
    if (!a) return false;
    // Site widgets may rebuild hrefs; re-bridge when our pointer is gone.
    if (a.__sndwBotLink === 'done' && /[?&]start=j_/.test(String(a.getAttribute('href') || ''))) return false;
    var channel = '', c;
    try { c = new URL(a.getAttribute('href'), location.href); } catch (_) { return false; }
    if (!/^https?:$/.test(c.protocol)) return false;
    if (botLinks.telegram.test(c.hostname)) channel = 'telegram';
    else if (botLinks.max.test(c.hostname)) channel = 'max';
    if (!channel) return false;
    var parts = c.pathname.split('/').filter(Boolean), legacy = '', account = '', oldQuery = new URLSearchParams(c.search).get('start') || '';
    // Only plain bot entry points are ours. Share/invite/QR/encoded links stay untouched.
    var plain = /^\/[A-Za-z0-9_]{1,80}(?:\/start\/[A-Za-z0-9_-]{1,32})?\/?$/;
    if (!plain.test(c.pathname)) { a.__sndwBotLink = 'done'; return false; }
    oldQuery = /^[A-Za-z0-9_-]{1,32}$/.test(oldQuery) ? oldQuery.toLowerCase() : '';
    if (channel === 'telegram') {
      account = parts[0];
      a.__sndwPathStart = parts.length === 2;
      legacy = parts.length === 2 ? parts[1].toLowerCase() : oldQuery;
    } else {
      if (oldQuery === '' && new URLSearchParams(c.search).has('start')) { a.__sndwBotLink = 'done'; return false; }
      legacy = oldQuery;
    }
    a.__sndwKind = channel;
    a.__sndwAccount = account;
    a.__sndwLegacy = legacy;
    a.__sndwMeta = makePointer(channel, legacy, false);
    a.setAttribute('href', botHref(a, a.__sndwMeta));
    a.__sndwBotLink = 'done';
    return true;
  }
  function botLinksIn(root) {
    if (!root || !root.querySelectorAll) return;
    // The added node can be the link itself, and querySelectorAll skips the root.
    if (root.matches && root.matches('a[href*="t.me/"],a[href*="max.ru/"]')) rewriteBotLink(root);
    var list = root.querySelectorAll('a[href*="t.me/"],a[href*="max.ru/"]');
    for (var i = 0; i < list.length; i++) rewriteBotLink(list[i]);
  }
  // compiledPath also reaches links built inside the site's own shadow widgets.
  function botAnchorFrom(e) {
    var path = (e && e.composedPath && e.composedPath()) || [];
    for (var i = 0; i < path.length; i++) {
      var n = path[i];
      if (n && n.tagName === 'A' && /(?:^|\.)(?:t\.me|max\.ru)$/i.test(n.hostname || '')) return n;
    }
    return null;
  }
  function onBotTap(e) {
    var a = botAnchorFrom(e);
    if (a) clickBotLink(a);
    return a;
  }
  d.addEventListener('pointerdown', function (e) { onBotTap(e); }, true);
  function clickBotLink(a) {
    if (!a) return;
    if (!a.__sndwMeta) rewriteBotLink(a);
    if (!a.__sndwMeta) return;
    // Registered only when the visitor really goes to the bot, not on every page view.
    registerPointer(a.__sndwMeta);
  }
  function attempt(form) {
    if (form.__sndwAccepted) { form.__sndwLeadId = id(); form.__sndwAccepted = false; }
    lastClick = form; prepare(form);
  }
  // Native Tilda serializes before its asynchronous request: capture before target handlers.
  d.addEventListener('submit', function (e) { if (eligible(e.target)) attempt(e.target); }, true);
  d.addEventListener('click', function (e) {
    var link = botAnchorFrom(e);
    if (link) { clickBotLink(link); return; }
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
  function prepareAll(root) { scan(root); botLinksIn(root); }
  function boot() {
    prepareAll(d); bindJquery();
    // Widgets replace bot buttons after load: keep watching instead of a one-off pass.
    // They also reset href to the plain bot address, which must be re-bridged.
    if (w.MutationObserver) new MutationObserver(function (mutations) {
      mutations.forEach(function (m) {
        if (m.type === 'attributes') { if (m.target && m.target.tagName === 'A') rewriteBotLink(m.target); return; }
        m.addedNodes.forEach(function (n) { if (n.nodeType === 1) prepareAll(n); });
      });
    }).observe(d.documentElement, {childList:true, subtree:true, attributes:true, attributeFilter:['href']});
  }
  if (d.readyState === 'loading') d.addEventListener('DOMContentLoaded', boot); else boot();
  var attempts = 0, timer = setInterval(function () {
    bindJquery();
    // Floating messenger buttons are rebuilt by the site script: keep them bridged.
    prepareAll(d);
    try { if (!clientId && typeof w.ym === 'function') w.ym(counter, 'getClientID', function (value) {
      if (/^(?:\d{5,30}|\d{1,20}\.\d{1,20})$/.test(String(value || ''))) { clientId = String(value); prepareAll(d); }
    }); } catch (_) {}
    if (++attempts >= 12 || clientId) clearInterval(timer);
  }, 1000);
  w.addEventListener('pageshow', function () { prepareAll(d); bindJquery(); });
  w.SandowAttribution = {version:VERSION, fields:fields, prepare:prepare, accepted:accepted, links:botLinksIn, click:clickBotLink, snapshot:function () { return JSON.parse(JSON.stringify(state)); }};
})();
/* SNDW_ATTRIBUTION_END */
