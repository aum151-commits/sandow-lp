/* Точки действия на sandowfitness.ru — под лидогенерацию. 18.09.2026.
 *
 * Почему отдельным файлом: head-код проекта Тильды занят на 49 912 знаков
 * из 50 000, туда помещается только строка подключения.
 *
 * Что делает:
 *   1. favicon 120x120 — рекомендация Яндекс.Вебмастера от 11.02.2026;
 *   2. (снято 19.09) подпись с номером в шапке — на десктопе номер там
 *      уже есть своей кнопкой, вышел дубль; на мобильном работает панель;
 *   3. липкая панель внизу на мобильном: «Позвонить» и «Год в подарок»;
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

  /* ЧУЖИЕ ПРОЕКТЫ — ничего не трогаем.
   *
   * Этот файл подключён в head всего домена sandowfitness.ru, а значит
   * работает и на страницах ВТОРОГО клуба (Богородицк). 24.09.2026 из-за
   * этого на /bogoroditsk оказался московский оффер: три кнопки «Забрать
   * год в подарок» и липкая панель. Богородицк — отдельный проект со
   * своими условиями (клуб 7:00-23:00, своя подписка), московские акции
   * там неприменимы и вводят людей в заблуждение.
   *
   * Выходим сразу, не добавляя на страницу ничего. Список пополнять при
   * появлении новых чужих разделов. */
  var ЧУЖИЕ = ['/bogoroditsk'];
  var путь = location.pathname.replace(/\/+$/, '').toLowerCase();
  for (var ч = 0; ч < ЧУЖИЕ.length; ч++) {
    if (путь === ЧУЖИЕ[ч] || путь.indexOf(ЧУЖИЕ[ч] + '/') === 0) return;
  }

  var ТЕЛЕФОН = '+74957956957';
  var ТЕЛЕФОН_ВИД = '+7 (495) 795-69-57';
  var ЗОЛОТО = '#E9C77E';
  var ТЁМНЫЙ = '#0B0906';
  var БАЗА = 'https://lp.sandowfitness.ru/';

  // Точечные выключатели: поставить false и перезалить файл — элемент
  // исчезнет с сайта за минуту, остальные правки останутся на месте.
  var ПОКАЗЫВАТЬ_РЕЙТИНГ = true;
  var ПОКАЗЫВАТЬ_ТЕЛЕГРАМ = true;   // кнопка «Написать» в нижней полосе
  var ТЕЛЕГРАМ = 'https://t.me/sandowclub_bot';

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
      'text-align:center;padding:0 8px;white-space:nowrap}' +
      // на 360 px подпись ломалась на две строки — уменьшаем кегль
      '@media (max-width:380px){#sndw-bar a{font-size:13px;padding:0 6px}' +
      '#sndw-bar{gap:6px;padding-left:8px;padding-right:8px}}' +
      // Телеграм — квадратной иконкой, а не третьей надписью: на 360 px
      // три подписи не помещаются и ломаются
      '#sndw-bar .sndw-tg{flex:0 0 48px;width:48px;padding:0;' +
      'background:transparent;border:1px solid rgba(233,199,126,.55)}' +
      '#sndw-bar .sndw-tg svg{width:22px;height:22px;display:block}' +
      '#sndw-bar .sndw-call{background:' + ЗОЛОТО + ';color:' + ТЁМНЫЙ + '}' +
      '#sndw-bar .sndw-lead{background:transparent;color:' + ЗОЛОТО + ';' +
      'border:1px solid rgba(233,199,126,.55)}' +
      'body{padding-bottom:78px}';
    document.head.appendChild(стиль);

    var панель = document.createElement('div');
    панель.id = 'sndw-bar';
    // Замер 06–17.09: переходов в мессенджер 21 против 11 заявок через
    // форму — людям проще написать. Кнопка даёт этот путь явно.
    var тг = ПОКАЗЫВАТЬ_ТЕЛЕГРАМ
      ? '<a class="sndw-tg" href="' + ТЕЛЕГРАМ + '" target="_blank" rel="noopener" ' +
        'aria-label="Написать в Телеграм">' +
        '<svg viewBox="0 0 24 24" fill="' + ЗОЛОТО + '">' +
        '<path d="M21.9 4.3 18.9 19c-.2 1-.8 1.3-1.7.8l-4.6-3.4-2.2 2.1c-.3.3-.5.5-1 .5l.3-4.6 8.4-7.6c.4-.3-.1-.5-.6-.2L7.2 13 2.7 11.6c-1-.3-1-1 .2-1.4l17.7-6.8c.8-.3 1.5.2 1.3 1z"/>' +
        '</svg></a>'
      : '';
    панель.innerHTML =
      тг +
      '<a class="sndw-call" href="tel:' + ТЕЛЕФОН + '">Позвонить</a>' +
      '<a class="sndw-lead" href="#sndw-form">Год в подарок</a>';
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
        '<a href="#sndw-form">Забрать год в подарок</a>';
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


  /* 6. Строка доверия под формой первого экрана -------------------------
   * На первом экране было только обещание подарка и ни одного
   * доказательства. Строка намеренно одна и мелкая: hero держится на
   * заголовке и форме, доказательство лишь снимает страх ошибиться.
   * Цифры округлены («более 1000»), чтобы не устаревать. */
  function строка_доверия() {
    if (!ПОКАЗЫВАТЬ_РЕЙТИНГ) return;
    if (document.getElementById('sndw-trust')) return;
    var ф = найти_форму();
    if (!ф) return;
    // только у формы первого экрана: ниже по странице она ни к чему
    if (ф.getBoundingClientRect().top + window.scrollY > window.innerHeight * 1.6) return;

    var стиль = document.createElement('style');
    стиль.textContent =
      // nowrap обязателен: без него длинный хвост переносился на вторую
      // строку и вся группа разъезжалась влево — на телефоне выглядело криво
      '#sndw-trust{display:flex;align-items:center;justify-content:center;gap:7px;' +
      'margin:14px auto 0;padding:0 10px;max-width:520px;text-align:center;' +
      'white-space:nowrap;flex-wrap:nowrap;' +
      'font-family:Arial,sans-serif;opacity:0;transition:opacity .6s ease .3s}' +
      '#sndw-trust.sndw-in{opacity:1}' +
      '#sndw-trust .sndw-star{color:' + ЗОЛОТО + ';font-size:15px;line-height:1}' +
      '#sndw-trust .sndw-val{color:' + ЗОЛОТО + ';font:700 15px/1 Arial,sans-serif;' +
      'letter-spacing:.02em}' +
      '#sndw-trust .sndw-dot{width:3px;height:3px;border-radius:50%;' +
      'background:rgba(154,143,124,.7);flex:0 0 auto}' +
      '#sndw-trust .sndw-txt{color:#9A8F7C;font:400 13px/1.3 Arial,sans-serif}' +
      '@media (max-width:430px){#sndw-trust{gap:6px}#sndw-trust .sndw-txt{font-size:11px}#sndw-trust .sndw-val{font-size:14px}#sndw-trust .sndw-star{font-size:13px}}';
    document.head.appendChild(стиль);

    var с = document.createElement('div');
    с.id = 'sndw-trust';
    с.innerHTML =
      '<span class="sndw-star">★</span>' +
      '<span class="sndw-val">4,6</span>' +
      '<span class="sndw-dot"></span>' +
      '<span class="sndw-txt">более 1000 оценок на Яндекс&nbsp;Картах</span>';

    // ставим под форму, а если рядом есть подпись «Перезвонит менеджер…» —
    // после неё, чтобы не разрывать смысловую пару «кнопка → что дальше»
    var куда = ф;
    var сосед = ф.nextElementSibling;
    if (сосед && /перезвонит|менеджер/i.test(сосед.innerText || '')) куда = сосед;
    куда.insertAdjacentElement('afterend', с);
    setTimeout(function () { с.classList.add('sndw-in'); }, 50);
  }


  /* 7. Первый экран: три правки по замечаниям Ольги 19.09 -------------
   *  — заголовок рвал слово пополам («ПЕРСОНАЛЬНЫ / Х»): Тильда ставит
   *    перенос по буквам, а кегль не влезает в узкий экран;
   *  — строка доверия прилипала к кнопке без отступа;
   *  — подпись «Перезвонит менеджер…» лишняя: человек и так оставляет
   *    телефон, объяснять незачем. */
  function первый_экран() {
    if (document.getElementById('sndw-hero-fix')) return;

    var стиль = document.createElement('style');
    стиль.id = 'sndw-hero-fix';
    стиль.textContent =
      // Заголовок первого экрана строит наш же старый скрипт из head —
      // это блоки sndw2-hero-*. У них overflow-wrap:break-word (рвёт слова
      // пополам) и контейнер всего 252 px при экране 390. Чиним и то, и другое.
      '[class*="sndw2-hero-title"],[class*="sndw2-hero-l"],' +
      '.t-cover h1,.t-cover .tn-atom,.t-section__title,.tn-elem .tn-atom{' +
      'word-break:normal !important;overflow-wrap:normal !important;hyphens:none !important}' +
      '[class*="sndw2-hero-title"]{max-width:none !important;width:auto !important;' +
      'padding-left:8px !important;padding-right:8px !important}' +
      '[class*="sndw2-hero-lwrap"],[class*="sndw2-hero-l"]{max-width:none !important;' +
      'width:auto !important;display:block !important}' +
      // отступ строке доверия, чтобы не липла к кнопке
      '#sndw-trust{margin-top:22px !important}';
    document.head.appendChild(стиль);

    // Подбираем кегль заголовка так, чтобы самое длинное слово влезало
    // целиком. Считаем по реальной ширине, а не «на глаз».
    var заголовки = [].slice.call(document.querySelectorAll('h1,.tn-atom,div,span'))
      .filter(function (e) {
        var t = (e.textContent || '').trim();
        return e.children.length === 0 && /ПОЛУЧИ|ПОДАРОК|ПЕРСОНАЛЬНЫХ|ТРЕНИРОВОК/i.test(t) &&
               t.length < 60 && e.getBoundingClientRect().top < window.innerHeight;
      });
    заголовки.forEach(function (эл) {
      var ширина = эл.getBoundingClientRect().width;
      if (!ширина) return;
      var мерка = document.createElement('span');
      var s = getComputedStyle(эл);
      мерка.style.cssText = 'position:absolute;visibility:hidden;white-space:nowrap;' +
        'font-family:' + s.fontFamily + ';font-weight:' + s.fontWeight +
        ';letter-spacing:' + s.letterSpacing;
      document.body.appendChild(мерка);
      var слова = (эл.textContent || '').trim().split(/\s+/);
      var кегль = parseFloat(s.fontSize) || 40;
      for (var шаг = 0; шаг < 14; шаг++) {
        мерка.style.fontSize = кегль + 'px';
        var влезает = слова.every(function (сл) {
          мерка.textContent = сл;
          return мерка.getBoundingClientRect().width <= ширина - 2;
        });
        if (влезает) break;
        кегль = Math.max(18, кегль * 0.92);
      }
      document.body.removeChild(мерка);
      if (кегль < parseFloat(s.fontSize)) {
        эл.style.fontSize = Math.floor(кегль) + 'px';
        эл.style.lineHeight = '1.08';
      }
    });

    // Убираем подпись под кнопкой — по прямому указанию Ольги
    [].slice.call(document.querySelectorAll('div,p,span')).forEach(function (e) {
      if (e.children.length > 1) return;
      var t = (e.textContent || '').trim();
      if (/^Перезвонит менеджер/i.test(t) && t.length < 120) {
        e.style.display = 'none';
      }
    });
  }

  /* Ссылки на разделы lp.sandowfitness.ru в подвале.
   *
   * Зачем: замер 20.09.2026 показал, что с главной на 129 страниц
   * лендингов ведут ровно ДВЕ ссылки, обе на раздел статей. Для
   * поисковика это отдельный сайт, которому основной домен почти не
   * передаёт вес — Bing Webmaster прямым текстом держит рекомендацию
   * «недостаточно входящих ссылок с качественных доменов». Органика
   * лендингов при этом 42 визита в месяц на 129 страниц.
   *
   * При этом сайт живёт почти целиком на брендовом трафике: все
   * поисковые фразы, дающие лиды, — название клуба. Небрендовые за два
   * месяца дали 10 визитов и ноль лидов. Пока лендинги не ранжируются,
   * новых людей поиск не приводит.
   *
   * Вид: ссылки дописываются в СУЩЕСТВУЮЩУЮ строку подвала
   * (.sndw2-footer-links, flex с переносом) — своей вёрстки нет,
   * шрифт и цвет наследуются. Требование Ольги 20.09: «внешне он должен
   * быть таким же стильным, не перегруженным текстом».
   *
   * Откат: ПОКАЗЫВАТЬ_ССЫЛКИ_ПОДВАЛА = false и перезалить файл.
   */
  var ПОКАЗЫВАТЬ_ССЫЛКИ_ПОДВАЛА = true;
  var РАЗДЕЛЫ = [
    ['Тренажёрный зал', 'https://lp.sandowfitness.ru/trenazherny-zal-nizhegorodskaya/'],
    ['Групповые программы', 'https://lp.sandowfitness.ru/gruppovye-programmy-moskva/'],
    ['Бокс и кикбоксинг', 'https://lp.sandowfitness.ru/boytsovsky-klub-moskva/'],
    ['Круглосуточно', 'https://lp.sandowfitness.ru/krugosutochny-fitness-klub-metro/'],
    ['Разовое посещение', 'https://lp.sandowfitness.ru/razovoe-poseschenie-sportzala/'],
    ['Статьи', 'https://lp.sandowfitness.ru/stati/']
  ];

  function ссылки_в_подвал() {
    if (!ПОКАЗЫВАТЬ_ССЫЛКИ_ПОДВАЛА) return;
    var строка = document.querySelector('.sndw2-footer-links');
    if (!строка || строка.getAttribute('data-sndw-lp')) return;
    строка.setAttribute('data-sndw-lp', '1');
    РАЗДЕЛЫ.forEach(function (р) {
      // не дублируем то, что в подвале уже есть
      var есть = [].slice.call(строка.querySelectorAll('a')).some(function (a) {
        return a.href === р[1] || (a.innerText || '').trim() === р[0];
      });
      if (есть) return;
      var a = document.createElement('a');
      a.href = р[1];
      a.textContent = р[0];
      строка.appendChild(a);
    });
  }


  /* N. Единый Телеграм --------------------------------------------------- */
  // На внутренних страницах (контакты, бойцовский клуб, тренеры) кнопки
  // Телеграма вели в @sandowfitness_ru_bot — бот, которым клуб не
  // управляет и токена от которого нет; на главной и на лендингах при
  // этом стоит живой @sandowclub_bot. Решение Ольги 23.09.2026: свести
  // всё к живому боту. Канал @sandowfit не трогаем — это канал, а не
  // способ связи.
  function единый_телеграм() {
    // Список пополнен 23.09 после проверки всех страниц сайта: на
    // /info1 нашлись ещё два бота. Богородицкий @sandow_bogoroditsk_bot
    // НЕ трогаем — это отдельный клуб со своим приёмником заявок.
    var чужие = ['sandowfitness_ru_bot', 'SandowFitness_bot',
                 'Sandofit_bot', 'sandowfitness_bot'];
    var заменено = 0;
    [].slice.call(document.querySelectorAll('a[href*="t.me/"]')).forEach(function (a) {
      var h = a.getAttribute('href') || '';
      for (var i = 0; i < чужие.length; i++) {
        if (h.indexOf(чужие[i]) >= 0) {
          a.setAttribute('href', ТЕЛЕГРАМ);
          заменено++;
          break;
        }
      }
    });
    return заменено;
  }

  готово(function () {
    try { фавикон(); } catch (e) {}
    try { единый_телеграм(); } catch (e) {}
    try { ссылки_в_подвал(); } catch (e) {}
    try { липкая_панель(); } catch (e) {}
    try { панель_пк(); } catch (e) {}
    try { первый_экран(); } catch (e) {}
    try { строка_доверия(); } catch (e) {}
    // Тильда достраивает блоки после загрузки — ждём, иначе .t-rec ещё нет
    setTimeout(function () { try { якоря(); } catch (e) {} }, 1200);
    // подвал рисуется одним из последних — повторяем, когда он уже есть
    setTimeout(function () { try { ссылки_в_подвал(); } catch (e) {} }, 2000);
    setTimeout(function () { try { первый_экран(); } catch (e) {} }, 1400);
    // Единый слой сайта (main.js) пересобирает первый экран шесть раз
    // с интервалом 1,5 с — и затирает строку доверия. Восстанавливаем,
    // пока он это делает: дешевле, чем встраиваться в его цикл.
    var восстановлений = 0;
    var сторож = setInterval(function () {
      try {
        первый_экран();
        строка_доверия();
        единый_телеграм();
      } catch (e) {}
      if (++восстановлений > 9) clearInterval(сторож);
    }, 1500);
    var перестройка = null;
    window.addEventListener('resize', function () {
      // без задержки обработчик срабатывал пачками и ронял страницу
      clearTimeout(перестройка);
      перестройка = setTimeout(function () {
        var с = document.getElementById('sndw-hero-fix');
        if (с) с.remove();
        try { первый_экран(); } catch (e) {}
      }, 400);
    });
    window.addEventListener('load', function () {
      setTimeout(function () { try { якоря(); } catch (e) {} }, 800);
    });
  });
})();
