/* Точки действия на sandowfitness.ru — под лидогенерацию. 18.09.2026.
 *
 * Почему отдельным файлом: head-код проекта Тильды занят на 49 912 знаков
 * из 50 000, туда помещается только строка подключения.
 *
 * Что делает:
 *   1. favicon 120x120 — рекомендация Яндекс.Вебмастера от 11.02.2026;
 *   2. номер телефона рядом с иконкой трубки в шапке (звонки = половина
 *      всех лидов сайта, а номера на первом экране не было);
 *   3. липкая панель внизу на мобильном: «Позвонить» и «5 тренировок»;
 *   4. кнопки-якоря по ходу страницы — между первым экраном и подвалом
 *      было девять экранов без единой точки действия.
 *
 * Формы Тильды НЕ клонируются: у них обработчики привязаны к id, дубль
 * ломает отправку. Вместо этого кнопки прокручивают к форме наверху.
 *
 * Откат: удалить строку подключения из head (см. site_rollback.py).
 */
(function () {
  'use strict';

  var ТЕЛЕФОН = '+74957956957';
  var ТЕЛЕФОН_ВИД = '+7 (495) 795-69-57';
  var ЗОЛОТО = '#E9C77E';
  var ТЁМНЫЙ = '#0B0906';
  var БАЗА = 'https://lp.sandowfitness.ru/';

  function готово(что) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', что);
    } else {
      что();
    }
  }

  /* 1. Favicon --------------------------------------------------------- */
  function фавикон() {
    if (document.getElementById('sndw-fav')) return;
    var набор = [
      { rel: 'icon', sizes: '120x120', href: БАЗА + 'favicon-120.png' },
      { rel: 'icon', sizes: '32x32', href: БАЗА + 'favicon-32.png' },
      { rel: 'apple-touch-icon', sizes: '120x120', href: БАЗА + 'favicon-120.png' }
    ];
    набор.forEach(function (о, i) {
      var l = document.createElement('link');
      if (i === 0) l.id = 'sndw-fav';
      l.rel = о.rel;
      l.type = 'image/png';
      l.sizes = о.sizes;
      l.href = о.href;
      document.head.appendChild(l);
    });
  }

  /* 2. Номер в шапке --------------------------------------------------- */
  function номер_в_шапке() {
    if (document.getElementById('sndw-hdr-tel')) return;
    // иконка трубки в шапке — первая ссылка tel: в верхних 200px
    var ссылки = [].slice.call(document.querySelectorAll('a[href^="tel:"]'));
    var цель = null;
    ссылки.forEach(function (a) {
      var r = a.getBoundingClientRect();
      if (!цель && r.top + window.scrollY < 200) цель = a;
    });
    if (!цель) return;
    // на узких экранах номер рядом с иконкой не помещается — там работает
    // липкая панель, она заметнее
    if (window.innerWidth < 900) return;
    var подпись = document.createElement('a');
    подпись.id = 'sndw-hdr-tel';
    подпись.href = 'tel:' + ТЕЛЕФОН;
    подпись.textContent = ТЕЛЕФОН_ВИД;
    подпись.style.cssText = 'color:' + ЗОЛОТО + ';font:600 15px/1 Arial,sans-serif;' +
      'text-decoration:none;white-space:nowrap;margin-left:10px;align-self:center;';
    цель.insertAdjacentElement('afterend', подпись);
  }

  /* 3. Липкая панель на мобильном -------------------------------------- */
  function липкая_панель() {
    if (window.innerWidth >= 900) return;
    if (document.getElementById('sndw-bar')) return;

    var стиль = document.createElement('style');
    стиль.id = 'sndw-bar-css';
    стиль.textContent =
      '#sndw-bar{position:fixed;left:0;right:0;bottom:0;z-index:9999;display:flex;gap:8px;' +
      'padding:8px 10px calc(8px + env(safe-area-inset-bottom));background:' + ТЁМНЫЙ + ';' +
      'box-shadow:0 -8px 24px rgba(0,0,0,.55);border-top:1px solid rgba(233,199,126,.25);' +
      'transform:translateY(120%);transition:transform .25s ease}' +
      '#sndw-bar.sndw-on{transform:translateY(0)}' +
      '#sndw-bar a{flex:1;display:flex;align-items:center;justify-content:center;' +
      'height:48px;border-radius:24px;font:700 15px/1 Arial,sans-serif;text-decoration:none;' +
      'text-align:center;padding:0 10px}' +
      '#sndw-bar .sndw-call{background:' + ЗОЛОТО + ';color:' + ТЁМНЫЙ + '}' +
      '#sndw-bar .sndw-lead{background:transparent;color:' + ЗОЛОТО + ';' +
      'border:1px solid rgba(233,199,126,.55)}' +
      'body{padding-bottom:78px}';
    document.head.appendChild(стиль);

    var панель = document.createElement('div');
    панель.id = 'sndw-bar';
    панель.innerHTML =
      '<a class="sndw-call" href="tel:' + ТЕЛЕФОН + '">Позвонить</a>' +
      '<a class="sndw-lead" href="#sndw-form">5 тренировок</a>';
    document.body.appendChild(панель);

    панель.querySelector('.sndw-lead').addEventListener('click', function (e) {
      e.preventDefault();
      к_форме();
    });

    // показываем, когда форма первого экрана ушла вверх: раньше она и так
    // на виду, панель только мешала бы
    function пересчёт() {
      var порог = window.innerHeight * 0.9;
      if (window.scrollY > порог) панель.classList.add('sndw-on');
      else панель.classList.remove('sndw-on');
    }
    window.addEventListener('scroll', пересчёт, { passive: true });
    пересчёт();
  }

  /* 4. Кнопки-якоря по ходу страницы ----------------------------------- */
  function найти_форму() {
    var формы = [].slice.call(document.querySelectorAll('form'));
    for (var i = 0; i < формы.length; i++) {
      var r = формы[i].getBoundingClientRect();
      if (r.width > 0) return формы[i];
    }
    return null;
  }

  function к_форме() {
    var ф = найти_форму();
    if (!ф) return;
    var верх = ф.getBoundingClientRect().top + window.scrollY - 90;
    window.scrollTo({ top: Math.max(0, верх), behavior: 'smooth' });
    var поле = ф.querySelector('input[type="text"],input[name*="ame"],input');
    if (поле) setTimeout(function () { поле.focus({ preventScroll: true }); }, 700);
  }

  function якоря() {
    if (document.querySelector('.sndw-anchor')) return;
    var записи = [].slice.call(document.querySelectorAll('.t-rec'));
    if (записи.length < 6) return;

    var стиль = document.createElement('style');
    стиль.textContent =
      '.sndw-anchor{padding:10px 16px 30px;text-align:center;background:' + ТЁМНЫЙ + '}' +
      '.sndw-anchor a{display:inline-block;padding:15px 30px;border-radius:26px;' +
      'background:' + ЗОЛОТО + ';color:' + ТЁМНЫЙ + ';font:700 16px/1.2 Arial,sans-serif;' +
      'text-decoration:none;max-width:92%}' +
      '.sndw-anchor p{margin:0 0 12px;color:#9A8F7C;font:400 14px/1.4 Arial,sans-serif}';
    document.head.appendChild(стиль);

    // Ставим по высоте: примерно каждые 2,5 экрана, начиная со второго.
    // По номеру блока не выходит — блоки Тильды очень разные по высоте.
    var шаг = window.innerHeight * 2.5;
    var следующая = window.innerHeight * 2.0;
    var предел = document.documentElement.scrollHeight - window.innerHeight * 1.6;
    var поставлено = 0;
    записи.forEach(function (зап) {
      if (поставлено >= 3) return;
      var r = зап.getBoundingClientRect();
      var низ = r.top + window.scrollY + r.height;
      if (низ < следующая || низ > предел) return;
      следующая = низ + шаг;

      var блок = document.createElement('div');
      блок.className = 'sndw-anchor';
      блок.innerHTML =
        '<p>Перезвоним и договоримся о времени визита</p>' +
        '<a href="#sndw-form">Забрать 5 тренировок</a>';
      блок.querySelector('a').addEventListener('click', function (e) {
        e.preventDefault();
        к_форме();
      });
      зап.insertAdjacentElement('afterend', блок);
      поставлено++;
    });
  }

  готово(function () {
    try { фавикон(); } catch (e) {}
    try { номер_в_шапке(); } catch (e) {}
    try { липкая_панель(); } catch (e) {}
    // Тильда достраивает блоки после загрузки — ждём, иначе .t-rec ещё нет
    setTimeout(function () { try { якоря(); } catch (e) {} }, 1200);
    window.addEventListener('load', function () {
      setTimeout(function () { try { якоря(); } catch (e) {} }, 800);
    });
  });
})();
