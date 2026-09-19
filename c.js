/* Точки действия на sandowfitness.ru — под лидогенерацию. 18.09.2026.
 *
 * Почему отдельным файлом: head-код проекта Тильды занят на 49 912 знаков
 * из 50 000, туда помещается только строка подключения.
 *
 * Что делает:
 *   1. favicon 120x120 — рекомендация Яндекс.Вебмастера от 11.02.2026;
 *   2. (снято 19.09) подпись с номером в шапке — на десктопе номер там
 *      уже есть своей кнопкой, вышел дубль; на мобильном работает панель;
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
    // На широких экранах номер в шапке уже есть отдельной кнопкой —
    // вторая подпись рядом читалась как дубль. Проверяем по тексту
    // верхней части страницы, а не по наличию ссылки tel:.
    var шапка = '';
    document.querySelectorAll('a,button,span,div').forEach(function (e) {
      var r = e.getBoundingClientRect();
      if (r.top < 140 && r.width > 0 && e.children.length === 0) {
        шапка += (e.textContent || '');
      }
    });
    if (/795[-\s]?69[-\s]?57/.test(шапка.replace(/ /g, ' '))) return;
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


  /* 5. Панель обратного звонка на компьютере ---------------------------
   * Замер 05–18.09: смартфоны дают 17,7% лидов, компьютеры — 4,7%, при
   * том что с компьютера читают вдвое дольше (241 с против 110 с).
   * Причина не в интересе: с компьютера просто не звонят. Поэтому здесь
   * не кнопка звонка, а предложение оставить номер. */
  function панель_пк() {
    if (window.innerWidth < 900) return;
    if (document.getElementById('sndw-desk')) return;

    var стиль = document.createElement('style');
    стиль.textContent =
      '#sndw-desk{position:fixed;right:24px;bottom:24px;z-index:9998;width:300px;' +
      'background:' + ТЁМНЫЙ + ';border:1px solid rgba(233,199,126,.35);border-radius:16px;' +
      'padding:18px 18px 16px;box-shadow:0 18px 50px rgba(0,0,0,.55);' +
      'font-family:Arial,sans-serif;transform:translateY(140%);transition:transform .3s ease}' +
      '#sndw-desk.sndw-on{transform:translateY(0)}' +
      '#sndw-desk .sndw-h{color:#F0EADE;font:700 17px/1.25 Arial,sans-serif;margin:0 0 6px}' +
      '#sndw-desk .sndw-p{color:#9A8F7C;font:400 13px/1.45 Arial,sans-serif;margin:0 0 12px}' +
      '#sndw-desk input{width:100%;box-sizing:border-box;height:42px;border-radius:10px;' +
      'border:1px solid rgba(240,234,222,.25);background:rgba(240,234,222,.06);color:#F0EADE;' +
      'padding:0 12px;font:400 15px Arial,sans-serif;margin-bottom:8px}' +
      '#sndw-desk input::placeholder{color:#9A8F7C}' +
      '#sndw-desk button{width:100%;height:46px;border:0;border-radius:23px;cursor:pointer;' +
      'background:' + ЗОЛОТО + ';color:' + ТЁМНЫЙ + ';font:700 15px Arial,sans-serif}' +
      '#sndw-desk .sndw-x{position:absolute;top:10px;right:12px;color:#9A8F7C;cursor:pointer;' +
      'font:400 20px/1 Arial,sans-serif;background:none;border:0;width:auto;height:auto}' +
      '#sndw-desk .sndw-tel{display:block;margin-top:10px;text-align:center;color:' + ЗОЛОТО + ';' +
      'font:600 14px Arial,sans-serif;text-decoration:none}';
    document.head.appendChild(стиль);

    var п = document.createElement('div');
    п.id = 'sndw-desk';
    п.innerHTML =
      '<button class="sndw-x" aria-label="Закрыть">×</button>' +
      '<p class="sndw-h">Перезвоним и всё расскажем</p>' +
      '<p class="sndw-p">Оставьте номер — менеджер ответит на вопросы ' +
      'и договорится о времени визита.</p>' +
      '<input type="tel" inputmode="tel" placeholder="+7 (___) ___-__-__" id="sndw-desk-tel">' +
      '<button type="button" id="sndw-desk-go">Жду звонка</button>' +
      '<a class="sndw-tel" href="tel:' + ТЕЛЕФОН + '">' + ТЕЛЕФОН_ВИД + '</a>';
    document.body.appendChild(п);

    п.querySelector('.sndw-x').addEventListener('click', function () {
      п.classList.remove('sndw-on');
      try { sessionStorage.setItem('sndw-desk-off', '1'); } catch (e) {}
    });

    // Свою отправку не делаем: заявки должны идти тем же путём, что и
    // с основной формы, иначе они не попадут в группу заявок. Переносим
    // введённый номер в форму первого экрана и доводим человека до неё.
    п.querySelector('#sndw-desk-go').addEventListener('click', function () {
      var номер = (п.querySelector('#sndw-desk-tel').value || '').trim();
      var ф = найти_форму();
      if (ф && номер) {
        var поле = ф.querySelector('input[type="tel"],input[name*="hone"],input[name*="el"]');
        if (поле) {
          поле.value = номер;
          поле.dispatchEvent(new Event('input', { bubbles: true }));
          поле.dispatchEvent(new Event('change', { bubbles: true }));
        }
      }
      к_форме();
      п.classList.remove('sndw-on');
    });

    function пересчёт() {
      var выключен = false;
      try { выключен = sessionStorage.getItem('sndw-desk-off') === '1'; } catch (e) {}
      if (выключен) return;
      if (window.scrollY > window.innerHeight * 1.2) п.classList.add('sndw-on');
      else п.classList.remove('sndw-on');
    }
    window.addEventListener('scroll', пересчёт, { passive: true });
    пересчёт();
  }

  готово(function () {
    try { фавикон(); } catch (e) {}
    try { липкая_панель(); } catch (e) {}
    try { панель_пк(); } catch (e) {}
    // Тильда достраивает блоки после загрузки — ждём, иначе .t-rec ещё нет
    setTimeout(function () { try { якоря(); } catch (e) {} }, 1200);
    window.addEventListener('load', function () {
      setTimeout(function () { try { якоря(); } catch (e) {} }, 800);
    });
  });
})();
