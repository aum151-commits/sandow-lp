/* Единый слой сайта sandowfitness.ru.
 * Вынесен из head-кода Тильды 20.09.2026: там было 49 912 знаков
 * из 50 000, и не помещался даже тег подтверждения Google.
 * Содержимое не менялось — перенесено как есть. Скрипт сам ждёт
 * DOMContentLoaded, поэтому работает одинаково инлайн и внешним.
 * Откат: вернуть headcode.html из data/backups/site/. */
/* ЕДИНЫЙ СЛОЙ САЙТА sandowfitness.ru — собирается из двух файлов, вручную не править. sndw-legal-css */
(function () {
  'use strict';
  var ORG = 'ООО «Легенда Фитнеса»';
  var INN = '7722464364';
  var OGRN = '1187746693265';
  var ADDR = '109052, Москва, Нижегородская ул., 29-33, стр. 3';
  var PHONE = '+7 (495) 795-69-57';
  var POLICY = 'https://sandowfitness.ru/policy';
  var DOGOVOR = '';
  var CONSENT_TEXT = 'Я согласен на обработку персональных данных';
  function css() {
    if (document.getElementById('sndw-legal-css')) return;
    var s = document.createElement('style');
    s.id = 'sndw-legal-css';
    s.textContent = [
      '.sndw-consent{margin:14px 0 4px;font-size:13px;line-height:1.45;text-align:left;',
      ' width:100%;flex-basis:100%;grid-column:1/-1;box-sizing:border-box}',
      '.sndw-consent label{display:flex;align-items:flex-start;gap:9px;cursor:pointer}',
      '.sndw-consent input{flex:none;width:17px;height:17px;margin:1px 0 0;cursor:pointer;',
      ' accent-color:#E9C77E;outline:1px solid rgba(128,128,128,.55);outline-offset:1px}',
      '.sndw-consent a{text-decoration:underline;color:inherit}',
      '.sndw-consent.sndw-miss input{outline:2px solid #d3372b}',
      '.sndw-consent.sndw-miss span{color:#ff6b5e}',
      '.sndw-legal{padding:24px 18px 28px;font-size:12px;line-height:1.65;text-align:center;',
      ' font-family:inherit}',
      '.sndw-legal a{color:inherit;text-decoration:underline}',
      '.sndw-legal p{margin:3px 0}'
    ].join('');
    document.head.appendChild(s);
  }
  function bgColorOf(el) {
    var node = el;
    for (var i = 0; i < 14 && node; i++) {
      var bg = getComputedStyle(node).backgroundColor || '';
      var m = bg.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?/);
      if (m && (m[4] === undefined || parseFloat(m[4]) > 0.3)) return bg;
      node = node.parentElement;
    }
    return '';
  }
  function luma(color) {
    var m = (color || '').match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
    if (!m) return 1;
    return (0.299 * +m[1] + 0.587 * +m[2] + 0.114 * +m[3]) / 255;
  }
  function bgLuma(el) {
    var c = bgColorOf(el);
    return c ? luma(c) : 1;   // фон не нашли — считаем светлым
  }
  function paint(el) {
    var dark = bgLuma(el) < 0.5;
    el.style.color = dark ? '#d8d2c8' : '#3b3b3b';
    var links = el.querySelectorAll('a');
    for (var i = 0; i < links.length; i++) {
      links[i].style.color = dark ? '#E9C77E' : '#1a1a1a';
    }
  }
  function hasConsent(form) {
    if (form.querySelector('.sndw-consent')) return true;
    var inputs = form.querySelectorAll('input[type="checkbox"]');
    for (var i = 0; i < inputs.length; i++) {
      var name = (inputs[i].name || '') + ' ' + (inputs[i].value || '');
      var near = inputs[i].closest('label, .t-input-group, div');
      var text = near ? (near.textContent || '') : '';
      var all = name + ' ' + text;
      if (/персональн|обработк[уаи]?\s+данн|политик\w*\s+конфиденциальн/i.test(all)) return true;
    }
    return false;
  }
  function addConsent(form) {
    if (hasConsent(form)) return false;
    var wrap = document.createElement('div');
    wrap.className = 'sndw-consent';
    var id = 'sndw-c-' + Math.random().toString(36).slice(2, 9);
    wrap.innerHTML =
      '<label for="' + id + '">' +
      '<input type="checkbox" id="' + id + '" name="Согласие" value="Да">' +
      '<span>' + CONSENT_TEXT + (POLICY
        ? ' и принимаю <a href="' + POLICY + '" target="_blank" rel="noopener">политику конфиденциальности</a>'
        : ' и принимаю политику конфиденциальности') + '</span>' +
      '</label>';
    var btn = form.querySelector('.t-form__submit') ||
              form.querySelector('[type="submit"]') ||
              form.querySelector('.t-submit');
    var anchor = btn ? (btn.closest('.t-form__submit') || btn) : null;
    if (anchor && anchor.parentNode) anchor.parentNode.insertBefore(wrap, anchor);
    else form.appendChild(wrap);
    paint(wrap);
    return true;
  }
  function guard(form) {
    if (form.dataset.sndwGuard) return;
    form.dataset.sndwGuard = '1';
    var stop = function (e) {
      var box = form.querySelector('.sndw-consent input[type="checkbox"]');
      if (!box || box.checked) return;
      e.preventDefault();
      e.stopPropagation();
      if (e.stopImmediatePropagation) e.stopImmediatePropagation();
      var wrap = box.closest('.sndw-consent');
      if (wrap) {
        wrap.classList.add('sndw-miss');
        wrap.scrollIntoView({block: 'center', behavior: 'smooth'});
      }
      return false;
    };
    form.addEventListener('submit', stop, true);
    var btn = form.querySelector('.t-form__submit') || form.querySelector('[type="submit"]');
    if (btn) btn.addEventListener('click', stop, true);
    form.addEventListener('change', function (e) {
      if (e.target && e.target.type === 'checkbox') {
        var w = e.target.closest('.sndw-consent');
        if (w && e.target.checked) w.classList.remove('sndw-miss');
      }
    });
  }
  function legalFooter() {
    if (document.querySelector('.sndw-legal')) return;
    if ((document.body.innerText || '').indexOf(INN) !== -1) return;
    var d = document.createElement('div');
    d.className = 'sndw-legal';
    d.innerHTML =
      '<p>' + ORG + ' · ИНН ' + INN + ' · ОГРН ' + OGRN + '</p>' +
      '<p>' + ADDR + ' · <a href="tel:+74957956957">' + PHONE + '</a></p>' +
      (POLICY || DOGOVOR
        ? '<p>' +
          (POLICY ? '<a href="' + POLICY + '" target="_blank" rel="noopener">Политика конфиденциальности</a>' : '') +
          (POLICY && DOGOVOR ? ' · ' : '') +
          (DOGOVOR ? '<a href="' + DOGOVOR + '" target="_blank" rel="noopener">Условия предоставления услуг</a>' : '') +
          '</p>'
        : '');
    document.body.appendChild(d);
    var bg = '';
    var bottom = -1;
    var all = document.querySelectorAll('.t-rec, .t-rec *, section, section *');
    for (var i = 0; i < all.length; i++) {
      var el = all[i];
      if (el === d || d.contains(el)) continue;
      var r = el.getBoundingClientRect();
      if (r.height < 40 || r.width < 200) continue;
      var c = getComputedStyle(el).backgroundColor;
      var m = (c || '').match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?/);
      if (!m || (m[4] !== undefined && parseFloat(m[4]) <= 0.3)) continue;
      var b = r.bottom + window.scrollY;
      if (b > bottom) { bottom = b; bg = c; }
    }
    if (!bg) bg = bgColorOf(document.body);
    if (bg) d.style.background = bg;
    paint(d);
    d.style.opacity = '.8';
  }
  function apply() {
    css();
    var forms = document.querySelectorAll('form');
    for (var i = 0; i < forms.length; i++) {
      var f = forms[i];
      if (!f.querySelector('input[type="tel"], input[name*="hone"], input[type="email"], input[name*="mail"]')) continue;
      addConsent(f);
      guard(f);
    }
    legalFooter();
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', apply);
  } else {
    apply();
  }
  var tries = 0;
  var timer = setInterval(function () {
    apply();
    if (++tries > 10) clearInterval(timer);
  }, 1200);
})();
(function () {
  'use strict';
  var path = location.pathname.replace(/\/+$/, '');
  var IS_HOME = (path === '' || path === '/index.html');
  var GOLD = '#E9C77E';
  var GOLD2 = '#F3DCA6';
  var INK = '#F0EADE';
  var BG = '#0B0906';
  var PHONE_TEXT = '+7 (495) 795-69-57';
  var PHONE_HREF = 'tel:+74957956957';
  function fonts() {
    if (document.getElementById('sndw-fonts')) return;
    var l = document.createElement('link');
    l.id = 'sndw-fonts';
    l.rel = 'stylesheet';
    l.href = 'https://fonts.googleapis.com/css2?family=Archivo:wght@400;500;600;700' +
             '&family=Unbounded:wght@500;700;800&display=swap';
    document.head.appendChild(l);
  }
  function css() {
    if (document.getElementById('sndw-brand-css')) return;
    var s = document.createElement('style');
    s.id = 'sndw-brand-css';
    s.textContent = [
      '.t-text,.t-descr,.t-name,.t-title,.t-heading,.t-input,.t-btn,.t-submit,',
      'body,input,textarea,select,button{font-family:"Archivo",system-ui,-apple-system,sans-serif}',
      '.t-title,.t-heading,h1,h2,h3,.t-name_xl,.t-name_xxl{',
      ' font-family:"Unbounded","Archivo",system-ui,sans-serif;letter-spacing:-.01em}',
      '.t-submit,.t-btn,.t-btnwrapper .t-btn,button.t-submit{',
      ' background:linear-gradient(180deg,' + GOLD2 + ',' + GOLD + ') !important;',
      ' color:#171208 !important;border:none !important;border-radius:34px !important;',
      ' font-family:"Archivo",system-ui,sans-serif !important;font-weight:600 !important;',
      ' letter-spacing:.01em;box-shadow:0 6px 22px rgba(233,199,126,.18);',
      ' transition:transform .18s ease,box-shadow .18s ease}',
      '.t-submit:hover,.t-btn:hover{transform:translateY(-1px);',
      ' box-shadow:0 10px 26px rgba(233,199,126,.28)}',
      '.t-input,input.t-input,textarea.t-input{border-radius:12px !important;',
      ' border:1px solid rgba(0,0,0,.12) !important}',
      '.sndw-top{position:sticky;top:0;z-index:9990;display:flex;align-items:center;',
      ' justify-content:space-between;gap:16px;padding:11px 18px;',
      ' background:rgba(11,9,6,.92);backdrop-filter:saturate(140%) blur(8px);',
      ' border-bottom:1px solid rgba(240,234,222,.13);font-family:"Archivo",sans-serif}',
      '.sndw-top a{text-decoration:none}',
      '.sndw-top .sndw-brand{display:inline-flex;align-items:baseline;gap:7px;',
      ' font-family:"Unbounded","Archivo",sans-serif;font-weight:800;font-size:15px;',
      ' letter-spacing:.02em;color:' + INK + '}',
      '.sndw-top .sndw-brand em{font-style:normal;font-weight:500;color:' + GOLD + '}',
      '.sndw-top .sndw-tel{font-weight:600;font-size:14px;color:' + GOLD + ';white-space:nowrap}',
      '@media(max-width:640px){.sndw-top{padding:9px 12px}',
      ' .sndw-top .sndw-brand{font-size:13px}.sndw-top .sndw-tel{font-size:13px}}',
      '.sndw-legal{background:' + BG + ' !important;color:#9A8F7C !important;',
      ' font-family:"Archivo",sans-serif !important;opacity:1 !important;',
      ' border-top:1px solid rgba(240,234,222,.13)}',
      '.sndw-legal a{color:' + GOLD + ' !important}',
      'a[href*="wa.me"],a[href*="api.whatsapp.com"],.sndw2-mess-wa{display:none !important}',
      '[data-elem-id="1776929367204000002"]{display:none !important}',
      '@media(max-width:640px){',
      '#rec2997917001 [data-elem-id="1786639452756000002"],',
      '#rec2997917001 [data-elem-id="1786639452756000003"],',
      '#rec2997917001 [data-elem-id="1776932488528"],',
      '#rec2997917001 [data-elem-id="1776928602390"]{display:none !important}',
      '}',
      '#sndw-faq{background:' + BG + ';color:#D9D2C6;padding:44px 20px 50px;',
      ' font-family:"Archivo",sans-serif;border-top:1px solid rgba(240,234,222,.13)}',
      '#sndw-faq h2{max-width:820px;margin:0 auto 26px;font-family:"Unbounded","Archivo",sans-serif;',
      ' font-weight:700;font-size:23px;line-height:1.25;color:' + INK + ';text-align:center}',
      '#sndw-faq dl{max-width:820px;margin:0 auto}',
      '#sndw-faq dt{font-weight:700;font-size:16px;color:' + GOLD + ';margin:22px 0 7px}',
      '#sndw-faq dd{margin:0;font-size:15px;line-height:1.55;color:#B9B1A3}',
      '@media(max-width:640px){#sndw-faq{padding:32px 16px 38px}',
      ' #sndw-faq h2{font-size:19px}#sndw-faq dt{font-size:15px}#sndw-faq dd{font-size:14px}}'
    ].join('');
    document.head.appendChild(s);
  }
  var NAV_PAGES = ['', 'index.html', 'contacts', 'group', 'fightclub'];
  function topbar() {
    if (document.querySelector('.sndw-top')) return;
    var last = location.pathname.replace(/\/+$/, '').split('/').pop();
    var isNav = NAV_PAGES.indexOf(last) !== -1;
    var d = document.createElement('div');
    d.className = 'sndw-top';
    d.innerHTML =
      (isNav
        ? '<a class="sndw-brand" href="/">САНДОВ <em>ФИТНЕС</em></a>'
        : '<span class="sndw-brand">САНДОВ <em>ФИТНЕС</em></span>') +
      '<a class="sndw-tel" href="' + PHONE_HREF + '">' + PHONE_TEXT + '</a>';
    document.body.insertBefore(d, document.body.firstChild);
  }
  var FAQ = [
    ['А бассейн у вас есть?',
     'Бассейна нет, клуб «сухой». Взамен — 2500 м² без очередей, финская сауна ' +
     'с ведро-водопадом, бойцовский клуб и три зала групповых программ.'],
    ['Клуб правда работает круглосуточно?',
     'Да, членам клуба зал доступен 24 часа. Это удобно при сменном графике ' +
     'и позволяет тренироваться, когда в зале свободно.'],
    ['Где вы находитесь?',
     'Москва, Нижегородская улица, 29/33, строение 3 — бизнес-центр ' +
     '«Нижегородский». Как удобнее добраться, подскажет менеджер по телефону.'],
    ['Можно сначала посмотреть клуб?',
     'Да. Позвоните по номеру +7 (495) 795-69-57 — менеджер расскажет условия ' +
     'гостевого визита и подберёт удобное время.'],
    ['Какие единоборства есть в клубе?',
     'Бойцовский клуб на 500 м²: бокс и кикбоксинг. Первое занятие по боксу ' +
     'и кикбоксингу — бесплатно, дальше расскажет тренер.'],
    ['Сколько стоит абонемент?',
     'Стоимость подбираем под ваши задачи и считаем при встрече — форматы ' +
     'занятий сильно разнятся. Есть рассрочка и разбивка платежей.'],
    ['Как до вас добраться?',
     'Пешком от метро Нижегородская или Волгоградский проспект, рядом ' +
     'также Текстильщики и Авиамоторная — уточним маршрут по телефону.'],
    ['Какие районы рядом с клубом?',
     'Рядом Таганская, Рязанский проспект, станция Карачарово, ' +
     'Новохохловская улица и исторический район Хохловка.'],
  ];
  function faqBlock() {
    if (document.getElementById('sndw-faq')) return;
    var last = location.pathname.replace(/\/+$/, '').split('/').pop();
    if (last && last !== 'index.html') return;
    if (!document.getElementById('sndw-faq-css')) {
      var st = document.createElement('style');
      st.id = 'sndw-faq-css';
      st.textContent = [
        '#sndw-faq{background:' + BG + ';color:#D9D2C6;padding:44px 20px 50px;',
        ' font-family:"Archivo",system-ui,sans-serif;border-top:1px solid rgba(240,234,222,.13)}',
        '#sndw-faq h2{max-width:820px;margin:0 auto 26px;font-weight:700;font-size:23px;',
        ' line-height:1.25;color:' + INK + ';text-align:center}',
        '#sndw-faq dl{max-width:820px;margin:0 auto}',
        '#sndw-faq dt{font-weight:700;font-size:16px;color:' + GOLD + ';margin:22px 0 7px}',
        '#sndw-faq dd{margin:0;font-size:15px;line-height:1.55;color:#B9B1A3}',
        '@media(max-width:640px){#sndw-faq{padding:32px 16px 38px}',
        ' #sndw-faq h2{font-size:19px}#sndw-faq dt{font-size:15px}#sndw-faq dd{font-size:14px}}'
      ].join('');
      document.head.appendChild(st);
    }
    var wrap = document.createElement('section');
    wrap.id = 'sndw-faq';
    var html = '<h2>Частые вопросы о клубе</h2><dl>';
    for (var i = 0; i < FAQ.length; i++) {
      html += '<dt>' + FAQ[i][0] + '</dt><dd>' + FAQ[i][1] + '</dd>';
    }
    wrap.innerHTML = html + '</dl>';
    var foot = document.querySelector('.sndw-legal, footer, .t-footer');
    if (foot && foot.parentElement) foot.parentElement.insertBefore(wrap, foot);
    else document.body.appendChild(wrap);
    if (IS_HOME) {
      wrap.style.display = 'none';
      wrap.id = 'sndw-faq';
      var show = function (e) {
        if (e) e.preventDefault();
        wrap.style.display = 'block';
        setTimeout(function () { wrap.scrollIntoView({behavior: 'smooth'}); }, 60);
      };
      var addLink = function (box, cls) {
        if (!box || box.querySelector('[data-sndw-faq]')) return;
        var a = document.createElement('a');
        a.href = '#faq';
        a.textContent = 'Частые вопросы';
        a.setAttribute('data-sndw-faq', '1');
        if (cls) a.className = cls;
        a.addEventListener('click', show);
        box.appendChild(a);
      };
      var probe = document.querySelector('#sndw2NavOvl a[href^="#"]');
      addLink(probe ? probe.parentElement : null);
      var top = document.querySelector('.sndw2-nav-links');
      if (top) addLink(top, (top.querySelector('a') || {}).className || '');
      if (location.hash === '#faq') show();
    }
    var already = false;
    var lds = document.querySelectorAll('script[type="application/ld+json"]');
    for (var q3 = 0; q3 < lds.length; q3++) {
      if ((lds[q3].textContent || '').indexOf('FAQPage') !== -1) { already = true; break; }
    }
    if (already) return;
    var data = {'@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: []};
    for (var j = 0; j < FAQ.length; j++) {
      data.mainEntity.push({
        '@type': 'Question', name: FAQ[j][0],
        acceptedAnswer: {'@type': 'Answer', text: FAQ[j][1]}
      });
    }
    var s = document.createElement('script');
    s.type = 'application/ld+json';
    s.textContent = JSON.stringify(data);
    document.head.appendChild(s);
  }
  function luma(color) {
    var m = (color || '').match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
    if (!m) return 1;
    return (0.299 * +m[1] + 0.587 * +m[2] + 0.114 * +m[3]) / 255;
  }
  function bgColorOf(el) {
    var node = el;
    for (var i = 0; i < 14 && node; i++) {
      var bg = getComputedStyle(node).backgroundColor || '';
      var m = bg.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?/);
      if (m && (m[4] === undefined || parseFloat(m[4]) > 0.3)) return bg;
      node = node.parentElement;
    }
    return '';
  }
  function isYellow(c) {
    var m = (c || '').match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?/);
    if (!m) return false;
    if (m[4] !== undefined && parseFloat(m[4]) < 0.4) return false;
    var r = +m[1], g = +m[2], b = +m[3];
    return r > 195 && g > 170 && b < 130 && (r - b) > 90;
  }
  function regold(root) {
    var nodes = (root || document.body).querySelectorAll('*');
    for (var i = 0; i < nodes.length; i++) {
      var el = nodes[i];
      if (el.closest('.sndw-top, .sndw-legal, .sndw-consent')) continue;
      if (el.dataset.sndwGold) continue;
      var st = getComputedStyle(el);
      var touched = false;
      if (isYellow(st.color)) { el.style.color = GOLD; touched = true; }
      if (isYellow(st.backgroundColor) && el.getBoundingClientRect().height < 90) {
        el.style.background = 'linear-gradient(180deg,' + GOLD2 + ',' + GOLD + ')';
        el.style.color = '#171208';
        touched = true;
      }
      if (isYellow(st.borderTopColor)) { el.style.borderColor = GOLD; touched = true; }
      if (touched) el.dataset.sndwGold = '1';
    }
  }
  function hideDeadTimers() {
    var timers = document.querySelectorAll(
      '.t-countdown, [class*="countdown"], .t415__timer, [class*="__timer"]');
    for (var i = 0; i < timers.length; i++) {
      var t = timers[i];
      if (t.dataset.sndwTimer) continue;
      var digits = (t.innerText || '').replace(/\D/g, '');
      if (!digits || /^0+$/.test(digits)) {
        t.style.display = 'none';
        t.dataset.sndwTimer = 'hidden';
        var prev = t.previousElementSibling;
        if (prev) {
          var cand = prev.querySelectorAll('*');
          for (var k = 0; k < cand.length; k++) {
            var s = (cand[k].textContent || '').trim();
            if (s.length < 40 && /до конца акции|осталось/i.test(s) &&
                cand[k].children.length === 0) {
              cand[k].style.display = 'none';
            }
          }
          var own = (prev.textContent || '').trim();
          if (own.length < 40 && /до конца акции|осталось/i.test(own)) {
            prev.style.display = 'none';
          }
        }
      } else {
        t.dataset.sndwTimer = 'alive';
      }
    }
    var all = document.querySelectorAll('.t-text, .t-title, .t-descr, .t-name');
    for (var j = 0; j < all.length; j++) {
      var el = all[j];
      if (el.dataset.sndwTimerText) continue;
      var s = (el.innerText || '').trim();
      if (/^(до конца акции осталось:?|осталось всего:?)$/i.test(s)) {
        var near = el.closest('.t-rec');
        var timer = near ? near.querySelector('.t-countdown') : null;
        if (!timer || timer.dataset.sndwTimer === 'hidden') el.style.display = 'none';
        el.dataset.sndwTimerText = '1';
      }
    }
  }
  var STALE = new RegExp(
    '^(только\\s+|акция\\s+|успей\\s+)?до\\s+\\d{1,2}\\s*' +
    '(январ|феврал|март|апрел|ма|июн|июл|август|сентябр|октябр|ноябр|декабр)[а-яё]*\\s*[!.]*$',
    'i');
  function hideStaleDates() {
    var el = document.querySelectorAll(
      '.tn-atom, .tn-elem, .t-text, .t-title, .t-descr, .t-uptitle, .t-name');
    for (var i = 0; i < el.length; i++) {
      var e = el[i];
      if (e.dataset.sndwStale) continue;
      var s = (e.innerText || '').trim();
      if (s.length < 32 && STALE.test(s)) {
        e.style.setProperty('display', 'none', 'important');
        e.dataset.sndwStale = '1';
        var box = e.closest('.tn-elem');
        if (box && (box.innerText || '').trim() === s) {
          box.style.setProperty('display', 'none', 'important');
          box.dataset.sndwStale = '1';
        }
      }
    }
  }
  var TEXT_FIX = [
    [/массаж и солевые обертывания/gi, 'финская сауна и ведро-водопад'],
    [/массаж и солевые обёртывания/gi, 'финская сауна и ведро-водопад'],
    [/,?\s*солевые обертывания/gi, ''],
    [/все популярные виды массажа/gi, 'персональные тренировки'],
  ];
  function hideWhatsApp() {
    if (!document.getElementById('sndw-no-wa')) {
      var s = document.createElement('style');
      s.id = 'sndw-no-wa';
      s.textContent = 'a[href*="wa.me"],a[href*="api.whatsapp.com"],' +
                      '.sndw2-mess-wa{display:none !important}';
      document.head.appendChild(s);
    }
    var links = document.querySelectorAll(
      'a[href*="wa.me"], a[href*="api.whatsapp.com"], a[href*="whatsapp://"]');
    for (var i = 0; i < links.length; i++) {
      var el = links[i];
      var host = el.closest('.tn-elem') || el;
      host.style.setProperty('display', 'none', 'important');
    }
    var own = document.querySelectorAll('.sndw2-mess-wa');
    for (var j = 0; j < own.length; j++) {
      own[j].style.setProperty('display', 'none', 'important');
    }
  }
  function fixText(root) {
    var walker = document.createTreeWalker(root || document.body, NodeFilter.SHOW_TEXT, null);
    var node;
    while ((node = walker.nextNode())) {
      var v = node.nodeValue;
      if (!v || v.length < 6) continue;
      var nv = v;
      for (var i = 0; i < TEXT_FIX.length; i++) nv = nv.replace(TEXT_FIX[i][0], TEXT_FIX[i][1]);
      if (nv !== v) node.nodeValue = nv;
    }
  }
  function darkTheme() {
    if (document.getElementById('sndw-dark')) return;
    var s = document.createElement('style');
    s.id = 'sndw-dark';
    s.textContent = [
      'html,body,.t-body,#allrecords{background:' + BG + ' !important}',
      '.t-rec{background-color:transparent !important}',
      '.t-text,.t-descr,.t-name,.t-title,.t-heading,.t-uptitle,.t-section__title,',
      '.t-section__descr,li,p,span,div.t-col{color:' + INK + '}',
      '.t-input,input.t-input,textarea.t-input{background:#fff !important;color:#17140f !important}',
      '.t-input::placeholder{color:#8b8478 !important}',
      '.t-card,.t-store__card,.t-feed__post,.t-popup__block{',
      ' background:#14100B !important;border:1px solid rgba(240,234,222,.12) !important}'
    ].join('');
    document.head.appendChild(s);
  }
  function darkenBlocks() {
    var nodes = document.querySelectorAll('.t-rec *');
    for (var i = 0; i < nodes.length; i++) {
      var el = nodes[i];
      if (el.dataset.sndwDark) continue;
      el.dataset.sndwDark = '1';
      if (el.closest('.sndw-top, .sndw-legal, .sndw-consent')) continue;
      var tag = el.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || tag === 'IMG') continue;
      if (el.classList.contains('t-input')) continue;
      var st = getComputedStyle(el);
      if (st.backgroundImage && st.backgroundImage !== 'none') continue;
      var m = (st.backgroundColor || '').match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?/);
      if (!m) continue;
      if (m[4] !== undefined && parseFloat(m[4]) < 0.35) continue;
      if (luma(st.backgroundColor) < 0.75) continue;      // тёмное и цветное не трогаем
      var r = el.getBoundingClientRect();
      if (r.height < 26 || r.width < 90) continue;        // иконки и точки оставляем
      el.style.setProperty('background-color', r.height < 260 ? '#14100B' : BG, 'important');
      if (r.height < 260) el.style.setProperty('border', '1px solid rgba(240,234,222,.10)', 'important');
    }
  }
  function relight() {
    var nodes = document.querySelectorAll('.t-rec *');
    for (var i = 0; i < nodes.length; i++) {
      var el = nodes[i];
      if (el.dataset.sndwLit) continue;
      if (el.closest('.t-input, input, textarea, .sndw-top, .sndw-legal')) continue;
      var hasOwnText = false;
      for (var k = 0; k < el.childNodes.length; k++) {
        var ch = el.childNodes[k];
        if (ch.nodeType === 3 && (ch.nodeValue || '').trim()) { hasOwnText = true; break; }
      }
      if (hasOwnText) {
        var st = getComputedStyle(el);
        if (luma(st.color) < 0.42) {
          var own = bgColorOf(el);
          if (!own || luma(own) < 0.5) el.style.setProperty('color', INK, 'important');
        }
      }
      el.dataset.sndwLit = '1';
    }
  }
  function rescueOffscreen() {
    if (window.innerWidth > 700) return;
    var lost = document.querySelectorAll('.t-menu__link-item');
    var hasBurger = document.querySelector('.t-menuburger, [class*="burger"]');
    if (lost.length && !hasBurger) {
      for (var m = 0; m < lost.length; m++) {
        var r0 = lost[m].getBoundingClientRect();
        if (r0.left < -25) {
          var menu = lost[m].closest('.t-menu, .t-menu__list, nav, .t228, .t450');
          if (menu) menu.style.setProperty('display', 'none', 'important');
        }
      }
    }
    var atoms = document.querySelectorAll('.t396 .tn-atom, .t396 .tn-elem');
    for (var i = 0; i < atoms.length; i++) {
      var el = atoms[i];
      if (el.dataset.sndwFix && !el.dataset.sndwRecheck) continue;
      var r = el.getBoundingClientRect();
      if (!r.width || !r.height) continue;
      var out = r.left < -20 || r.right > window.innerWidth + 20;
      if (!out) continue;
      var host = el.closest('.tn-elem') || el;
      host.style.setProperty('left', '50%', 'important');
      host.style.setProperty('transform', 'translateX(-50%)', 'important');
      host.style.setProperty('max-width', '92vw', 'important');
      var in2 = host.querySelector('.tn-atom');
      if (in2) {
        in2.style.setProperty('max-width', '100%', 'important');
        in2.style.setProperty('white-space', 'normal', 'important');
      }
      el.dataset.sndwFix = '1';
      delete el.dataset.sndwRecheck;
    }
  }
  function overlapCount() {
    var b = [];
    var el = document.querySelectorAll('.t396 .tn-elem, .t396 .tn-atom');
    for (var i = 0; i < el.length; i++) {
      var t = (el[i].innerText || '').trim();
      if (!t || t.length > 400) continue;
      if (el[i].querySelector('.tn-elem')) continue;   // считаем только листья
      var r = el[i].getBoundingClientRect();
      if (r.width > 15 && r.height > 10) b.push(r);
    }
    var n = 0;
    for (var x = 0; x < b.length; x++) {
      for (var y = x + 1; y < b.length; y++) {
        if (b[x].bottom > b[y].top + 10 && b[x].top < b[y].bottom - 10 &&
            b[x].right > b[y].left + 10 && b[x].left < b[y].right - 10) n++;
      }
    }
    return n;
  }
  function flattenZero() {
    if (window.innerWidth > 700) return;
    var boards = document.querySelectorAll('.t396__artboard');
    for (var b = 0; b < boards.length; b++) {
      var board = boards[b];
      if (board.dataset.sndwFlat) continue;
      var undo = [];
      var seq = board.children;
      for (var u = 0; u < seq.length; u++) {
        undo.push({el: seq[u], next: seq[u].nextElementSibling, css: seq[u].style.cssText});
      }
      var undoAll = [];
      var every = board.querySelectorAll('.tn-elem, .tn-atom');
      for (var u2 = 0; u2 < every.length; u2++) {
        undoAll.push({e: every[u2], css: every[u2].style.cssText});
      }
      var boardCss = board.style.cssText;
      var wrapEl = board.closest('.t396');
      var wrapCss = wrapEl ? wrapEl.style.cssText : '';
      var before = overlapCount();
      var kids = [];
      var raw = board.children;
      for (var i = 0; i < raw.length; i++) {
        if (raw[i].classList && raw[i].classList.contains('tn-elem')) kids.push(raw[i]);
      }
      if (kids.length < 2) continue;
      var box = [];
      for (var k = 0; k < kids.length; k++) {
        var r = kids[k].getBoundingClientRect();
        var txt = (kids[k].innerText || '').trim();
        if (r.width > 15 && r.height > 10) box.push({el: kids[k], r: r, txt: txt});
      }
      var over = 0;
      for (var x = 0; x < box.length; x++) {
        for (var y = x + 1; y < box.length; y++) {
          if (!box[x].txt || !box[y].txt) continue;
          if (box[x].r.bottom > box[y].r.top + 10 && box[x].r.top < box[y].r.bottom - 10 &&
              box[x].r.right > box[y].r.left + 10 && box[x].r.left < box[y].r.right - 10) over++;
        }
      }
      if (!over) { board.dataset.sndwFlat = 'ok'; continue; }
      for (var m2 = 0; m2 < box.length; m2++) {
        var cell = box[m2];
        var im = cell.el.querySelector('img');
        var live = cell.el.querySelector('input,form,textarea,select,iframe,svg,video');
        var bgi = '';
        var inner = cell.el.querySelector('.tn-atom') || cell.el;
        try { bgi = getComputedStyle(inner).backgroundImage || ''; } catch (e2) { bgi = ''; }
        var hasPic = !!im || /url\(/i.test(bgi);
        cell.pic = hasPic;
        cell.live = !!live;
        if (cell.txt || live) continue;
        if (hasPic && cell.r.height > 120) {
          cell.deco = true;          // фото — вниз, под текст и кнопку
        } else if (!hasPic) {
          cell.el.style.setProperty('display', 'none', 'important');
          cell.drop = true;
        }
      }
      box = box.filter(function (o) { return !o.drop; });
      var seenPic = {};
      for (var p2 = 0; p2 < box.length; p2++) {
        var pic = box[p2].el.querySelector('img');
        var key = pic ? (pic.getAttribute('src') || pic.getAttribute('data-original') || '') : '';
        if (!key) {
          var at2 = box[p2].el.querySelector('.tn-atom');
          var bg2 = at2 ? (getComputedStyle(at2).backgroundImage || '') : '';
          var mu = bg2.match(/url\(["']?([^"')]+)/);
          key = mu ? mu[1] : '';
        }
        if (box[p2].txt || !key) continue;
        if (seenPic[key]) {
          box[p2].el.style.setProperty('display', 'none', 'important');
          box[p2].drop = true;
        } else {
          seenPic[key] = 1;
        }
      }
      for (var s1 = 0; s1 < box.length; s1++) {
        if (box[s1].drop || box[s1].txt || box[s1].live || !box[s1].pic) continue;
        for (var s2 = s1 + 1; s2 < box.length; s2++) {
          if (box[s2].drop || box[s2].txt || box[s2].live || !box[s2].pic) continue;
          var a1 = box[s1].r, a2 = box[s2].r;
          var iw = Math.min(a1.right, a2.right) - Math.max(a1.left, a2.left);
          var ih = Math.min(a1.bottom, a2.bottom) - Math.max(a1.top, a2.top);
          if (iw <= 0 || ih <= 0) continue;
          var small = Math.min(a1.width * a1.height, a2.width * a2.height);
          if (small > 0 && (iw * ih) / small > 0.6) {
            box[s2].el.style.setProperty('display', 'none', 'important');
            box[s2].drop = true;
          }
        }
      }
      box = box.filter(function (o) { return !o.drop; });
      box.sort(function (a, c) {
        if (a.deco !== c.deco) return a.deco ? 1 : -1;
        var d = (a.r.top + window.scrollY) - (c.r.top + window.scrollY);
        return Math.abs(d) > 12 ? d : a.r.left - c.r.left;
      });
      board.style.setProperty('height', 'auto', 'important');
      board.style.setProperty('min-height', '0', 'important');
      board.style.setProperty('padding', '26px 16px 30px', 'important');
      board.style.setProperty('display', 'block', 'important');
      var wrap = board.closest('.t396');
      if (wrap) wrap.style.setProperty('height', 'auto', 'important');
      for (var j = 0; j < box.length; j++) {
        var e = box[j].el;
        e.style.setProperty('position', 'relative', 'important');
        e.style.setProperty('left', 'auto', 'important');
        e.style.setProperty('top', 'auto', 'important');
        e.style.setProperty('transform', 'none', 'important');
        e.style.setProperty('width', '100%', 'important');
        e.style.setProperty('max-width', '100%', 'important');
        e.style.setProperty('height', 'auto', 'important');
        e.style.setProperty('margin', '0 0 14px', 'important');
        var inside = e.querySelectorAll('.tn-atom');
        for (var q2 = 1; q2 < inside.length; q2++) {
          inside[q2].style.setProperty('position', 'static', 'important');
          inside[q2].style.setProperty('max-width', '100%', 'important');
        }
        var atom = e.querySelector('.tn-atom');
        if (atom) {
          atom.style.setProperty('position', 'static', 'important');
          atom.style.setProperty('width', 'auto', 'important');
          atom.style.setProperty('max-width', '100%', 'important');
          if (atom.tagName !== 'IMG') atom.style.setProperty('height', 'auto', 'important');
          var fs = parseFloat(getComputedStyle(atom).fontSize) || 0;
          if (fs > 40) atom.style.setProperty('font-size', '30px', 'important');
          else if (fs > 26) atom.style.setProperty('font-size', '22px', 'important');
          if (fs) atom.style.setProperty('line-height', '1.18', 'important');
          var isBtn = atom.tagName === 'A' || /t-btn|tn-atom__btn/.test(atom.className || '') ||
                      (getComputedStyle(atom).borderRadius || '').indexOf('0px') !== 0;
          if (isBtn && (atom.innerText || '').trim()) {
            atom.style.setProperty('min-height', '52px', 'important');
            atom.style.setProperty('padding', '12px 18px', 'important');
            atom.style.setProperty('display', 'flex', 'important');
            atom.style.setProperty('align-items', 'center', 'important');
            atom.style.setProperty('justify-content', 'center', 'important');
            atom.style.setProperty('white-space', 'normal', 'important');
            atom.style.setProperty('box-sizing', 'border-box', 'important');
          }
        }
        board.appendChild(e);
      }
      var deep = board.querySelectorAll('.tn-elem .tn-elem');
      for (var d = 0; d < deep.length; d++) {
        var q = deep[d];
        if (getComputedStyle(q).position !== 'absolute') continue;
        q.style.setProperty('position', 'relative', 'important');
        q.style.setProperty('left', 'auto', 'important');
        q.style.setProperty('top', 'auto', 'important');
        q.style.setProperty('transform', 'none', 'important');
        q.style.setProperty('width', '100%', 'important');
        q.style.setProperty('height', 'auto', 'important');
        q.style.setProperty('margin', '0 0 10px', 'important');
      }
      var after = overlapCount();
      if (after >= before) {
        for (var v = 0; v < undoAll.length; v++) undoAll[v].e.style.cssText = undoAll[v].css;
        for (var w = undo.length - 1; w >= 0; w--) {
          var it = undo[w];
          it.el.style.cssText = it.css;
          if (it.next && it.next.parentElement === board) board.insertBefore(it.el, it.next);
          else board.appendChild(it.el);
        }
        board.style.cssText = boardCss;
        if (wrapEl) wrapEl.style.cssText = wrapCss;
        board.dataset.sndwFlat = 'откат';
        continue;
      }
      var again = board.querySelectorAll('.tn-elem, .tn-atom');
      for (var g = 0; g < again.length; g++) again[g].dataset.sndwRecheck = '1';
      board.dataset.sndwFlat = 'done';
    }
  }
  function guestFields() {
    if (path.split('/').pop() !== 'guest') return;
    var all = document.querySelectorAll('div, span, label, p');
    for (var i = 0; i < all.length; i++) {
      var t = (all[i].textContent || '').trim();
      if (t && t.length < 60 && /10:30/.test(t) && /21:00|20:00/.test(t)) {
        all[i].style.setProperty('display', 'none', 'important');
      }
    }
    var ins = document.querySelectorAll('input[placeholder="31-12-2022"]');
    for (var j = 0; j < ins.length; j++) ins[j].placeholder = 'дд-мм-гггг';
  }
  function stretchShortBlocks() {
    var arts = document.querySelectorAll('.t396__artboard');
    for (var i = 0; i < arts.length; i++) {
      var art = arts[i];
      var rec = art.closest('.r, .t-rec') || art.parentElement;
      if (!rec || rec.dataset.sndwStretched) continue;
      var rb = rec.getBoundingClientRect();
      if (rb.height < 50) continue;
      var low = rb.bottom;
      var els = art.querySelectorAll('.tn-elem');
      for (var j = 0; j < els.length; j++) {
        var b = els[j].getBoundingClientRect();
        if (b.height > 0 && b.bottom > low) low = b.bottom;
      }
      var overflow = low - rb.bottom;
      if (overflow > 40) {
        rec.style.minHeight = Math.round(rb.height + overflow + 40) + 'px';
        rec.dataset.sndwStretched = '1';
      }
    }
  }
  var CALL_PAGES = ['yandex_offer', 'yandex_offer_2', 'yandex_offer_5',
                    'fitness_club', 'callback', 'guest', '13foryou'];
  function callFab() {
    if (document.getElementById('sndw-call')) return;
    if (CALL_PAGES.indexOf(path.split('/').pop()) === -1) return;
    var a = document.createElement('a');
    a.id = 'sndw-call';
    a.href = PHONE_HREF;
    a.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none">' +
      '<path d="M6.6 10.8c1.4 2.7 3.9 5.2 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.2.4' +
      ' 2.4.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1C10.9 21 3 13.1 3 4c0-.6.4-1' +
      ' 1-1h3.5c.6 0 1 .4 1 1 0 1.2.2 2.4.6 3.6.1.3 0 .7-.2 1l-2.3 2.2z" ' +
      'fill="#14100A"/></svg><span>Позвонить</span>';
    a.style.cssText = 'position:fixed;right:16px;bottom:16px;z-index:99990;' +
      'background:' + GOLD + ';color:#14100A;font:700 15px/1 "Archivo",system-ui,sans-serif;' +
      'padding:14px 20px;border-radius:999px;text-decoration:none;' +
      'display:flex;align-items:center;gap:8px;' +
      'box-shadow:0 6px 18px rgba(0,0,0,.45)';
    if (!document.getElementById('sndw-call-css')) {
      var s = document.createElement('style');
      s.id = 'sndw-call-css';
      s.textContent = '@media(max-width:640px){#sndw-call{width:54px;height:54px;' +
        'padding:0;justify-content:center}#sndw-call span{display:none}}';
      document.head.appendChild(s);
    }
    document.body.appendChild(a);
  }
  function heroTicker() {
    if (document.getElementById('sndw-hero-mq')) return;
    var hero = document.getElementById('sndw2-hero');
    var title = document.querySelector('.sndw2-hero-title');
    if (!hero || !title) return;
    var offer = (title.textContent || '').replace(/\s+/g, ' ').trim();
    if (!offer) return;
    var seg = offer.toUpperCase() + ' · ';
    if (!document.getElementById('sndw-hero-mq-css')) {
      var s = document.createElement('style');
      s.id = 'sndw-hero-mq-css';
      s.textContent =
        '#sndw-hero-mq{position:absolute;left:0;right:0;' +
        'overflow:hidden;pointer-events:none;display:none;z-index:3}' +
        '@media(max-width:760px){#sndw-hero-mq{display:block}}' +
        '#sndw-hero-mq .in{display:flex;width:max-content;will-change:transform}' +
        '#sndw-hero-mq span{display:block;white-space:nowrap;' +
        'font-family:"Archivo",system-ui,sans-serif;font-weight:900;' +
        'letter-spacing:.02em;text-transform:uppercase;' +
        'font-size:clamp(30px,9vw,46px);line-height:1.1;' +
        'color:transparent;-webkit-text-stroke:1px rgba(233,199,126,.72);' +
        'padding-right:.5em}';
      document.head.appendChild(s);
    }
    var mq = document.createElement('div');
    mq.id = 'sndw-hero-mq';
    mq.setAttribute('aria-hidden', 'true');
    var track = document.createElement('div');
    track.className = 'in';
    for (var i = 0; i < 2; i++) {
      var sp = document.createElement('span');
      sp.textContent = seg + seg + seg;
      track.appendChild(sp);
    }
    mq.appendChild(track);
    if (getComputedStyle(hero).position === 'static') {
      hero.style.position = 'relative';
    }
    hero.appendChild(mq);
    var place = function () {
      hero.style.removeProperty('min-height');
      hero.style.removeProperty('height');
      var hr = hero.getBoundingClientRect();
      // ПОЛОЖЕНИЕ строки считаем по СОДЕРЖИМОМУ — по этому списку, а не
      // по всем потомкам: фоновые и декоративные слои растянуты на весь
      // экран, и от них строка уезжала вниз, за пределы видимой части
      // (проверено на живом 23.09 — строка пропала).
      var cands = hero.querySelectorAll(
        '.sndw2-hero-note, .sndw2-hero-formslot, form, .t-form, .sndw2-hero-cta');
      var contentBottom = 0;
      for (var ci = 0; ci < cands.length; ci++) {
        var cb = cands[ci].getBoundingClientRect();
        if (cb.height > 0 && cb.bottom - hr.top > contentBottom) {
          contentBottom = cb.bottom - hr.top;
        }
      }
      if (!contentBottom) {
        contentBottom = title.getBoundingClientRect().bottom - hr.top;
      }
      // А вот ВЫСОТУ экрана ограничиваем по низу всего видимого: форму
      // переносит сюда c.js (moveForm) уже после первого замера, и если
      // считать только по списку выше, кнопка с формой попадают под
      // обрезку (у hero overflow:hidden) — человек не может оставить
      // заявку. Замер до починки: 4 обрезки из 5 запусков.
      var всёВидимое = hero.querySelectorAll('*');
      var реальныйНиз = 0;
      for (var vi = 0; vi < всёВидимое.length; vi++) {
        var эл = всёВидимое[vi];
        if (эл === mq || mq.contains(эл)) continue;
        var стиль = getComputedStyle(эл);
        if (стиль.display === 'none' || стиль.visibility === 'hidden') continue;
        if (стиль.position === 'fixed') continue;
        var рект = эл.getBoundingClientRect();
        if (рект.height > 0 && рект.bottom - hr.top > реальныйНиз) {
          реальныйНиз = рект.bottom - hr.top;
        }
      }
      var lineH = mq.getBoundingClientRect().height || 60;
      var top = contentBottom + 22;
      mq.style.top = Math.round(top) + 'px';
      mq.style.bottom = 'auto';
      if (window.innerWidth <= 760) {
        // Берём большее из двух: место под строку и низ всего содержимого.
        // Так строка остаётся на виду, а форма с кнопкой не обрезаются.
        var wantH = Math.round(Math.max(top + lineH + 26, реальныйНиз + 26));
        if (wantH < hr.height) {
          hero.style.setProperty('min-height', wantH + 'px', 'important');
          hero.style.setProperty('height', wantH + 'px', 'important');
        }
      }
    };
    place();
    var delays = [1500, 3000, 5000, 8000, 12000];
    for (var di = 0; di < delays.length; di++) setTimeout(place, delays[di]);
    window.addEventListener('resize', place);
    var pos = 0;
    var prev = null;
    var SPEED = 60; // пикселей в секунду
    var step = function (ts) {
      if (prev !== null) {
        pos -= SPEED * (ts - prev) / 1000;
        var half = track.scrollWidth / 2;
        if (half > 0 && -pos >= half) pos += half;
        track.style.transform = 'translate3d(' + pos.toFixed(1) + 'px,0,0)';
      }
      prev = ts;
      requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }
  function enforceConsent() {}
  function apply() {
    if (IS_HOME) {
      hideWhatsApp();
      faqBlock();
      heroTicker();
      enforceConsent();
      return;
    }
    fonts();
    css();
    darkTheme();
    rescueOffscreen();
    topbar();
    faqBlock();
    regold();
    hideDeadTimers();
    hideStaleDates();
    hideWhatsApp();
    flattenZero();
    rescueOffscreen();   // после перестройки колонки часть надписей уезжает вбок
    fixText();
    darkenBlocks();
    relight();
    guestFields();
    enforceConsent();
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', apply);
  } else {
    apply();
  }
  var n = 0;
  var t = setInterval(function () {
    apply();
    if (++n > 6) clearInterval(t);
  }, 1500);
})();