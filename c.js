/* Точки действия на sandowfitness.ru — под лидогенерацию. 18.09.2026.
 *
 * Почему отдельным файлом: head-код проекта Тильды занят на 49 912 знаков
 * из 50 000, туда помещается только строка подключения.
 *
 * Что делает:
 *   1. favicon 120x120 — рекомендация Яндекс.Вебмастера от 11.02.2026;
 *   2. (снято 19.09) подпись с номером в шапке — на десктопе номер там
 *      уже есть своей кнопкой, вышел дубль; на мобильном работает панель;
 *   3. липкая панель внизу на мобильном: «Позвонить» и «Хочу лучшие условия»;
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

  /* ЧЕЙ ЭТО ПРОЕКТ — проверяем ДО того, как что-либо добавить.
   *
   * Этот файл подключён в head ВСЕГО домена sandowfitness.ru, поэтому по
   * умолчанию работает и на страницах других клубов сети. 24.09.2026 из-за
   * этого на /bogoroditsk оказался московский оффер: три московские
   * кнопки с подарком и липкая панель. Богородицк — отдельный проект со
   * своими условиями (клуб 7:00-23:00, своя подписка, свои цены),
   * московские акции там неприменимы и вводят людей в заблуждение.
   *
   * Проверок ДВЕ, и вторая важнее первой:
   *   1) список известных чужих разделов — быстро и точно;
   *   2) признак в самой странице — название другого клуба в заголовке
   *      или частые упоминания в тексте. Это ловит НОВЫЕ страницы чужих
   *      проектов, о которых список ещё не знает: список рано или поздно
   *      забудут пополнить, признак сработает сам.
   *
   * Добавляя третий клуб, впишите его в ЧУЖИЕ_РАЗДЕЛЫ и, если у него своё
   * имя, в ЧУЖИЕ_ИМЕНА — но даже без этого страница уцелеет, если имя
   * клуба стоит у неё в заголовке. */
  var ЧУЖИЕ_РАЗДЕЛЫ = ['/bogoroditsk'];
  var ЧУЖИЕ_ИМЕНА = /богородиц/i;

  /* ---------- пункт «Статьи» в меню клуба в Богородицке (20.10.2026) ----
   * Раздел статей лежит на lp.sandowfitness.ru/bogoroditsk/, но со страницы
   * клуба ссылки на него не было: человек не мог найти статьи из меню.
   * Ставим пункт в десктопное меню, бургер и подвал — везде, где у шаблона
   * есть список. Только для страницы Богородицка: московские страницы
   * шаблон использует другие, их не трогаем. */
  function статьиВМеню() {
    var путь = location.pathname.replace(/\/+$/, '');
    if (путь !== '/bogoroditsk') return;

    var ссылка = function () {
      var a = document.createElement('a');
      a.href = 'https://lp.sandowfitness.ru/bogoroditsk/';
      a.textContent = 'Статьи';
      a.setAttribute('target', '_blank');
      a.setAttribute('rel', 'noopener');
      return a;
    };

    ['.sndw2-nav-links', '.sndw2-nav-ovl', '.sndw2-footer-links'].forEach(function (сел) {
      var список = document.querySelector(сел);
      if (!список) return;
      if (список.querySelector('a[href*="lp.sandowfitness.ru/bogoroditsk"]')) return;
      список.appendChild(ссылка());
    });
  }

  function чужойПроект() {
    var путь = location.pathname.replace(/\/+$/, '').toLowerCase();
    for (var ч = 0; ч < ЧУЖИЕ_РАЗДЕЛЫ.length; ч++) {
      if (путь === ЧУЖИЕ_РАЗДЕЛЫ[ч] ||
          путь.indexOf(ЧУЖИЕ_РАЗДЕЛЫ[ч] + '/') === 0) return true;
    }
    if (ЧУЖИЕ_ИМЕНА.test(document.title || '')) return true;
    // Одно упоминание — это может быть ссылка «наш клуб в Богородицке»
    // со страницы московского клуба, и её трогать не надо. Пять и больше
    // означают, что страница ПРО другой клуб.
    var текст = (document.body && document.body.innerText) || '';
    var сколько = (текст.match(/богородиц/gi) || []).length;
    return сколько >= 5;
  }


  /* ---------- Богородицк: собственный FAQ в разметке (27.09.2026) ----
   * Общий head Тильды несёт московский FAQPage на все страницы домена.
   * Page-level скрипт Богородицка удаляет его, но ничего не ставит
   * взамен — JS-краулеры видели страницу без FAQ вовсе, а не-JS читали
   * московские факты («круглосуточно», «бассейн», 2500 м²). Этот блок
   * стоит ДО гейта чужойПроект() и работает ТОЛЬКО на /bogoroditsk. */
  function богородицкFAQ() {
    var путь = location.pathname.replace(/\/+$/, '');
    if (путь !== '/bogoroditsk') return;
    var МОСКОВСКИЕ = ['https://sandowfitness.ru/#faq',
                      'https://sandowfitness.ru/#organization'];
    var скрипты = document.querySelectorAll('script[type="application/ld+json"]');
    for (var i = 0; i < скрипты.length; i++) {
      try {
        var д = JSON.parse(скрипты[i].textContent);
        if (д && МОСКОВСКИЕ.indexOf(д['@id']) !== -1) {
          скрипты[i].parentNode.removeChild(скрипты[i]);
        }
      } catch (e) {}
    }
    /* 28.11.2026. Клуб в Богородицке закрыт: собственный FAQ больше не
     * добавляем. Страница теперь — уведомление о закрытии и возврате
     * предоплат, а прежний FAQ рассказывал про открытие и заявку.
     * Оставляем только снятие чужой (московской) разметки, чтобы в
     * сыром HTML не оставалось чужих фактов под адресом клуба. */
    var старый = document.getElementById('sndw-bog-faq');
    if (старый) { старый.parentNode.removeChild(старый); }
  }
  try { богородицкFAQ(); } catch (e) {}
  document.addEventListener('DOMContentLoaded', function () {
    try { богородицкFAQ(); } catch (e) {}
  });

  /* 11.10.2026 · /bogoroditsk: цель Метрики «клик по тарифу».
   *
   * ВЫЗОВ ОБЯЗАН СТОЯТЬ ДО ГЕЙТА чужойПроект() — как у богородицкFAQ выше.
   * Здесь он был ниже гейта (в готово()) и поэтому не выполнялся ни разу:
   * на /bogoroditsk гейт срабатывает и обрывает файл. Цель
   * bogoroditsk_tarif_click оказалась мёртвой — 0 срабатываний при 503
   * визитах за 29.09–10.10; два срабатывания за всё время дал ручной вызов
   * ym() из проверочного скрипта 02.10.2026, то есть проверка подтвердила
   * себя, а не кнопку.
   *
   * Сама функция объявлена ниже по файлу: объявления поднимаются, а
   * слушателю клика DOM не нужен — поэтому вызов сразу, без готово(). */
  try { богородицкТариф(); } catch (e) {}   // цель Метрики } catch (e) {}
  /* Пункт «Статьи» в меню /bogoroditsk — ВЫЗОВ ОБЯЗАН СТОЯТЬ ДО ГЕЙТА
   * чужойПроект() (как богородицкFAQ выше): ниже гейта файл на этой странице
   * обрывается и вызов не выполняется ни разу. Проверено 20.10.2026 —
   * первая версия стояла ниже и пункт в меню не появился.
   * Меню Тильда дорисовывает позже, поэтому не пара отложенных вызовов,
   * а попытки каждые полсекунды, пока пункт не встанет. */
  (function () {
    var попыток = 0;
    var ставить = function () {
      try { статьиВМеню(); } catch (e) {}
      попыток += 1;
      var меню = document.querySelector('.sndw2-nav-links');
      var есть = меню && меню.querySelector('a[href*=bogoroditsk]');
      if (!есть && попыток < 60) setTimeout(ставить, 500);
    };
    ставить();
    document.addEventListener('DOMContentLoaded', ставить);
    window.addEventListener('load', ставить);
  })();

  /* Кнопка оффера в шапке -----------------------------------------------
   * Правка 11.11.2026, просьба Ольги: «на сайте тоже поменяй». На главной в
   * шапке стоит «ХОЧУ ЛУЧШИЕ УСЛОВИЯ» — то есть текущий оффер, а на странице
   * «Наши клубы» осталась кнопка прежнего оффера «ЗАБРАТЬ ПЛАН». Снаружи это
   * две разные акции на одном сайте.
   *
   * СТОИТ ВЫШЕ ГЕЙТА чужойПроект() НАМЕРЕННО. «Наши клубы» — страница сети,
   * на ней есть упоминания Богородицка, и гейт считает её чужой: первая
   * редакция этой правки стояла ниже гейта и не срабатывала вовсе (проверено
   * на живой странице 11.11.2026 — кнопка оставалась прежней). Здесь правка
   * трогает только кнопки с ещё старым текстом и ничего не добавляет на
   * богородицкие страницы, поэтому гейт ей не нужен.
   *
   * Когда оффер сменится — поменять одну строку ниже или поставить
   * выключатель false: вернётся то, что написано в самой странице Тильды.
   */
  var КНОПКА_ОФФЕРА = 'ХОЧУ ЛУЧШИЕ УСЛОВИЯ';
  var ПОКАЗЫВАТЬ_КНОПКУ_ОФФЕРА = true;
  function кнопкиОффера() {
    if (!ПОКАЗЫВАТЬ_КНОПКУ_ОФФЕРА) return;
    var кнопки = document.querySelectorAll('.sndw2-nav-cta');
    for (var i = 0; i < кнопки.length; i++) {
      var текст = (кнопки[i].textContent || '').replace(/\s+/g, ' ').trim();
      if (/ЗАБРАТЬ\s+ПЛАН/i.test(текст)) кнопки[i].textContent = КНОПКА_ОФФЕРА;
    }
  }
  готово(кнопкиОффера);
  document.addEventListener('DOMContentLoaded', кнопкиОффера);
  window.addEventListener('load', кнопкиОффера);

  if (чужойПроект()) return;   // ничего не добавляем на чужую страницу

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
  // Официальные знаки мессенджеров (правка Ольги 14.10.2026: «надо чтобы иконки
  // мессенджеров выглядели также как на их официальных приложениях, иначе они
  // не так узнаваемы»). Оба файла — подлинники из официальных источников:
  //   znak-telegram.png — telegram.org/img/t_logo.png (синий круг, белый самолёт)
  //   znak-max.png      — max.ru/apple-touch-icon.png (официальный знак MAX)
  // Лежат в корне сайта, отдаются с того же адреса, что favicon.
  var ЗНАК_ТЕЛЕГРАМА = БАЗА + 'znak-telegram.png';
  var ЗНАК_МАКСА = БАЗА + 'znak-max.png';

  // MAX — задача Ольги 14.10.2026: «разместить иконку макс на сайте рядом с
  // иконкой ТГ, чтобы вела на московский макс-бот, и также липкой сделать
  // рядом с липкой иконкой ТГ». Только московский бот: богородицкий клуб
  // живёт на своём домене и через гейт чужойПроект() сюда не доходит (§0б).
  var ПОКАЗЫВАТЬ_МАКС = true;       // иконка MAX рядом с Телеграмом
  var МАКС = 'https://max.ru/id7722464364_bot';

  /* Иконка MAX -----------------------------------------------------------
   * Официальный знак мессенджера MAX (правка Ольги 14.10.2026). Раньше здесь
   * был нарисованный «по памяти» нейтральный круг с буквой M — Ольга сказала,
   * что такие иконки не узнаются, и попросила официальные. Файл скачан с
   * max.ru (apple-touch-icon.png), 96 px, лежит в корне сайта. */
  function знакМакс() {
    return '<img class="sndw-знак" src="' + ЗНАК_МАКСА + '" width="26" height="26" ' +
      'alt="MAX" loading="lazy">';
  }

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

  /* Кнопка и согласие на первом экране главной. 20.11.2026 Ольга:
   * «на кнопке текст в 2 строки и ни одну из них не видно» и «посмотри на
   * кнопку на хиро». Причина: у кнопки фиксированная высота 32/36 px,
   * overflow:hidden и подпись длиной ровно в доступную ширину — при крупном
   * системном шрифте на телефоне хвост обрезался. Плюс строке согласия
   * не хватало места: она уходила за край карточки.
   * Лечим не подгонкой текста, а самой кнопкой: высота не меньше 44 px,
   * перенос разрешён, кегль 15 px. Согласию разрешаем перенос и 12 px.
   * Только главная страница — правило 0б. */
  function кнопкаПервогоЭкрана() {
    var путь = location.pathname.replace(/\/+$/, '');
    if (путь !== '' && путь !== '/index.html') return false;
    if (document.getElementById('sndw-hero-fix')) return true;
    var стиль = document.createElement('style');
    стиль.id = 'sndw-hero-fix';
    стиль.textContent =
      '#form2478331411 button[type=submit]{min-height:44px!important;height:auto!important;' +
      'padding:11px 18px!important;font-size:15px!important;line-height:1.25!important;' +
      'white-space:normal!important;overflow:visible!important;text-overflow:clip!important}' +
      '#form2478331411 button[type=submit] *{white-space:normal!important;' +
      'overflow:visible!important;line-height:1.25!important}' +
      '#form2478331411 .t-input{min-height:44px!important}' +
      '#form2478331411 .t-checkbox__control{white-space:normal!important;' +
      'align-items:flex-start!important;overflow:visible!important}' +
      '#form2478331411 .t-checkbox__control span{white-space:normal!important;' +
      'overflow-wrap:break-word!important;font-size:12px!important;line-height:1.35!important}' +
      '#form2478331411 .t-checkbox__indicator{flex:0 0 auto!important;margin-top:2px!important}';
    document.head.appendChild(стиль);
    return true;
  }

  /* Подпись кнопки-призыва. 20.11.2026 Ольга выбрала на главной
   * «Хочу попробовать бесплатно» (первое занятие бесплатно по всем
   * направлениям — правило от 02.10.2026) и потребовала, чтобы липкая
   * панель и кнопки-якоря повторяли эту надпись слово в слово.
   * На остальных страницах подпись НЕ меняется: правка согласована
   * только для главной. */
  function подписьCTA() {
    var путь = location.pathname.replace(/\/+$/, '');
    return (путь === '' || путь === '/index.html')
      ? 'Хочу попробовать бесплатно'
      : 'Хочу лучшие условия';
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
      // Телеграм и MAX — официальными круглыми иконками приложений
      // (правка Ольги 14.10.2026). Рамку и фон убрал: вокруг официального
      // круглого знака золотое кольцо читалось как два круга.
      '#sndw-bar .sndw-tg,#sndw-bar .sndw-mx{flex:0 0 48px;width:48px;padding:0;' +
      'background:transparent;border:0}' +
      '#sndw-bar .sndw-знак{width:32px;height:32px;display:block;border-radius:50%}' +
      // С двумя иконками в строку уже не влезает оффер: замер 14.10.2026 на
      // живом сайте — кнопкам нужно ~470 px, а на 360–414 px вылезало на
      // 31–67 px. Поэтому до 480 px оффер уходит на вторую строку целиком:
      // ни один текст не режется и подписи остаются прежними (менять текст
      // оффера без слова Ольги нельзя).
      // ОДНА СТРОКА НА ТЕЛЕФОНЕ. Было две строки и 106 px: оффер не влезал к
      // иконкам и уходил вниз целиком. После того как «Позвонить» стало
      // иконкой трубки (44 px вместо ~110 px), всё помещается в одну строку —
      // панель становится низкой, как на богородицком сайте.
      '@media (max-width:479px){#sndw-bar{gap:5px;' +
      'padding:6px 10px calc(6px + env(safe-area-inset-bottom))}' +
      '#sndw-bar a{box-sizing:border-box;height:44px}' +
      // иконки: Телеграм, MAX, трубка — одного размера, чтобы читались группой
      '#sndw-bar .sndw-tg,#sndw-bar .sndw-mx,#sndw-bar .sndw-call{' +
      'flex:0 0 44px;width:44px;padding:0;border-radius:50%}' +
      '#sndw-bar .sndw-знак{width:30px;height:30px}' +
      // оффер занимает всё оставшееся место. 20.11.2026 подпись на главной
      // стала длиннее («Хочу попробовать бесплатно»), поэтому вместо обрезки
      // многоточием разрешаем две строки: кегль 11.5 px, высота кнопки 44 px,
      // две строки по 13 px помещаются целиком и не режутся.
      '#sndw-bar .sndw-lead{flex:1 1 auto;min-width:0;font-size:11.5px;line-height:1.15;' +
      'padding:2px 8px;white-space:normal;overflow:visible;display:flex;' +
      'align-items:center;justify-content:center;text-align:center}' +
      'body{padding-bottom:78px}}' +
      // на самых узких (360 px) обе иконки ужимаются до 44 px — запас на
      // случай, когда в первой строке окажется три элемента
      '@media (max-width:380px){#sndw-bar .sndw-tg,#sndw-bar .sndw-mx{' +
      'flex:0 0 44px;width:44px}' +
      '#sndw-bar .sndw-знак{width:28px;height:28px}}' +
      '#sndw-bar .sndw-call{background:' + ЗОЛОТО + ';color:' + ТЁМНЫЙ + '}' +
      // Трубка подрагивает, как звонит телефон. Пауза внутри цикла, чтобы
      // движение привлекало взгляд, но не раздражало.
      '@keyframes sndw-ring{0%,64%,100%{transform:rotate(0)}' +
      '8%{transform:rotate(-16deg)}16%{transform:rotate(13deg)}' +
      '24%{transform:rotate(-11deg)}32%{transform:rotate(9deg)}' +
      '40%{transform:rotate(-6deg)}48%{transform:rotate(3deg)}}' +
      '#sndw-bar .sndw-call svg{display:block;animation:sndw-ring 2.6s ease-in-out infinite;' +
      'transform-origin:50% 50%}' +
      '@media (prefers-reduced-motion:reduce){#sndw-bar .sndw-call svg{animation:none}}' +
      // Подпись для незрячих и для поисковика: визуально скрыта, из разметки
      // не убрана — иначе кнопка-иконка осталась бы без текста.
      '.sndw-visually-hidden{position:absolute;width:1px;height:1px;padding:0;margin:-1px;' +
      'overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap;border:0}' +
      '#sndw-bar .sndw-lead{background:transparent;color:' + ЗОЛОТО + ';' +
      'border:1px solid rgba(233,199,126,.55)}' +
      // Правка Ольги 16.10.2026: «под кнопками чернота». Причина — плавающая
      // золотая кнопка «Хочу лучшие условия» из блока главной страницы:
      // она закреплена на bottom:18px и висит ПОВЕРХ панели, оставляя под
      // собой чёрную полосу. Это дубль: тот же оффер уже есть в самой панели.
      // Пока панель на экране — плавающую кнопку прячем, иначе на телефоне
      // один и тот же оффер показан дважды и наползает сам на себя.
      'body:has(#sndw-bar.sndw-on) .sndw2-dock-mini{display:none !important}' +
      'body{padding-bottom:78px}';
    document.head.appendChild(стиль);

    var панель = document.createElement('div');
    панель.id = 'sndw-bar';
    // Замер 06–17.09: переходов в мессенджер 21 против 11 заявок через
    // форму — людям проще написать. Кнопка даёт этот путь явно.
    var тг = ПОКАЗЫВАТЬ_ТЕЛЕГРАМ
      ? '<a class="sndw-tg" href="' + ТЕЛЕГРАМ + '" target="_blank" rel="noopener" ' +
        'aria-label="Написать в Телеграм">' +
        '<img class="sndw-знак" src="' + ЗНАК_ТЕЛЕГРАМА + '" width="28" height="28" ' +
        'alt="Telegram" loading="lazy"></a>'
      : '';
    // MAX — сразу за Телеграмом (задача Ольги 14.10.2026), тот же размер,
    // чтобы пара читалась как одна группа
    var макс = ПОКАЗЫВАТЬ_МАКС
      ? '<a class="sndw-mx" href="' + МАКС + '" target="_blank" rel="noopener" ' +
        'aria-label="Написать в MAX">' + знакМакс() + '</a>'
      : '';
    // Телефон — иконкой трубки, а не текстом (идея Ольги 16.10.2026: «кнопку
    // позвонить можно заменить на иконку с изображением трубки телефона,
    // которое как бы подрагивает от звонка… и сократить место сэкономить»).
    // Текстовая кнопка «Позвонить» занимала ~110 px, иконка — 44 px; за счёт
    // этого оффер встаёт в одну строку с иконками, и панель на телефоне
    // становится низкой, как на богородицком сайте (65 px против 106 px).
    // Трубка «подрагивает» — понятно без подписи; для незрячих оставлен
    // aria-label, для поисковика — скрытая подпись.
    var ТРУБКА =
      '<svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor" aria-hidden="true">' +
      '<path d="M6.6 10.8c1.4 2.8 3.8 5.1 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 ' +
      '2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1C10.6 21 3 13.4 3 4c0-.6.4-1 ' +
      '1-1h3.5c.6 0 1 .4 1 1 0 1.2.2 2.4.6 3.6.1.4 0 .8-.2 1l-2.3 2.2z"/></svg>';
    панель.innerHTML =
      тг + макс +
      '<a class="sndw-call" href="tel:' + ТЕЛЕФОН + '" aria-label="Позвонить">' +
      ТРУБКА + '<span class="sndw-visually-hidden">Позвонить</span></a>' +
      '<a class="sndw-lead" href="#sndw-form">' + подписьCTA() + '</a>';
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

  /* Выбор мессенджера в липкой панели внизу экрана ----------------------
   * Панель `#sndw2Dock` — разметка самой Тильды, поэтому правим её из c.js:
   * при раскрытии («Хочу лучшие условия») вместо полей имени и телефона показываем
   * те же два пути, что и в форме первого экрана, а телефон остаётся за
   * мелкой строкой. Просьба Ольги 15.10.2026: на телефоне порядок должен
   * быть одинаковым и там, и там.
   *
   * Откат: ПОКАЗЫВАТЬ_ВЫБОР_В_ДОКЕ = false и перезалить файл.
   */
  var ПОКАЗЫВАТЬ_ВЫБОР_В_ДОКЕ = true;

  function выборВДоке() {
    if (!ПОКАЗЫВАТЬ_ВЫБОР_В_ДОКЕ) return 0;
    var док = document.getElementById('sndw2Dock');
    if (!док) return 0;
    var бар = док.querySelector('.sndw2-dock-bar');
    if (!бар) return 0;
    if (док.getAttribute('data-sndw-choice') === '1') return 1;
    док.setAttribute('data-sndw-choice', '1');

    if (!document.getElementById('sndw-dock-choice-css')) {
      var стиль = document.createElement('style');
      стиль.id = 'sndw-dock-choice-css';
      стиль.textContent =
        // пока человек не выбрал телефон — поля, согласие и кнопку не показываем
        '.sndw2-dock[data-sndw-choice="1"].sndw2-dock-exp .sndw2-dock-fields,' +
        '.sndw2-dock[data-sndw-choice="1"].sndw2-dock-exp .sndw2-dock-pd,' +
        '.sndw2-dock[data-sndw-choice="1"].sndw2-dock-exp #sndw2DockSubmit' +
        '{display:none !important}' +
        '.sndw2-dock[data-sndw-choice="1"][data-sndw-mode="phone"] .sndw2-dock-fields' +
        '{display:flex !important}' +
        '.sndw2-dock[data-sndw-choice="1"][data-sndw-mode="phone"] .sndw2-dock-pd' +
        '{display:flex !important}' +
        '.sndw2-dock[data-sndw-choice="1"][data-sndw-mode="phone"] #sndw2DockSubmit' +
        '{display:block !important}' +
        '#sndw-dock-choice{display:none;width:100%;box-sizing:border-box}' +
        '.sndw2-dock[data-sndw-choice="1"].sndw2-dock-exp #sndw-dock-choice{display:block}' +
        '.sndw2-dock[data-sndw-choice="1"][data-sndw-mode="phone"] #sndw-dock-choice' +
        '{display:none !important}' +
        '#sndw-dock-choice .sndw-dock-row{display:flex;gap:8px;margin:2px 0 6px}' +
        '#sndw-dock-choice .sndw-dock-btn{flex:1;box-sizing:border-box;display:flex;' +
        'align-items:center;justify-content:center;gap:8px;height:46px;border-radius:24px;' +
        'text-decoration:none;font-family:Archivo,Arial,sans-serif;font-weight:700;font-size:14px}' +
        '#sndw-dock-choice .sndw-dock-btn img{width:24px;height:24px;border-radius:50%;display:block}' +
        '#sndw-dock-choice .sndw-dock-tg{background:' + ЗОЛОТО + ';color:' + ТЁМНЫЙ + '}' +
        '#sndw-dock-choice .sndw-dock-mx{border:1px solid rgba(233,199,126,.55);color:#F0EADE}' +
        '#sndw-dock-choice .sndw-dock-phone{display:block;width:100%;background:none;border:0;' +
        'padding:2px 0 4px;cursor:pointer;font-family:Archivo,Arial,sans-serif;font-size:12.5px;' +
        'color:rgba(240,234,222,.75);text-decoration:underline;text-align:center}';
      document.head.appendChild(стиль);
    }

    var панель = document.createElement('div');
    панель.id = 'sndw-dock-choice';
    панель.innerHTML =
      '<div class="sndw-dock-row">' +
      '<a class="sndw-dock-btn sndw-dock-tg" href="' + ВХОД_В_БОТ + '" target="_blank" ' +
      'rel="noopener"><img src="' + ЗНАК_ТЕЛЕГРАМА + '" alt="Telegram" loading="lazy">' +
      'Telegram</a>' +
      '<a class="sndw-dock-btn sndw-dock-mx" href="' + МАКС + '" target="_blank" ' +
      'rel="noopener"><img src="' + ЗНАК_МАКСА + '" alt="MAX" loading="lazy">MAX</a>' +
      '</div>' +
      '<button type="button" class="sndw-dock-phone">или оставьте номер — перезвоним</button>';
    var поляДока = док.querySelector('.sndw2-dock-fields');
    if (поляДока) поляДока.insertAdjacentElement('beforebegin', панель);
    else бар.appendChild(панель);

    панель.querySelector('.sndw-dock-phone').addEventListener('click', function (e) {
      e.preventDefault();
      док.setAttribute('data-sndw-mode', 'phone');
      // форму первого экрана тоже переводим на телефоны: панель копирует
      // значения именно в неё, и без этого submit ушёл бы из скрытой формы
      var форма = document.getElementById(ФОРМА_ПЕРВОГО_ЭКРАНА);
      if (форма && форма.getAttribute('data-sndw-choice') === '1') {
        форма.setAttribute('data-sndw-mode', 'phone');
        var выбор = document.getElementById('sndw-choice');
        // Если форма первого экрана и так открыта (с 11.11.2026), панель с
        // кнопками мессенджеров прятать нельзя: она стоит над формой, и с ней
        // с экрана исчезли бы Telegram и MAX.
        if (выбор && !РАСКРЫВАТЬ_ФОРМУ_СРАЗУ) выбор.style.display = 'none';
      }
      if (поляДока) {
        var поле = поляДока.querySelector('input');
        if (поле && поле.focus) setTimeout(function () { поле.focus({ preventScroll: true }); }, 60);
      }
    });
    return 1;
  }

  /* 4. Кнопки-якоря по ходу страницы ----------------------------------- */
  function найти_живую_форму() {
    // Только настоящая форма (в неё переносят значения панели и липкий док).
    var формы = [].slice.call(document.querySelectorAll('form'));
    for (var i = 0; i < формы.length; i++) {
      var r = формы[i].getBoundingClientRect();
      if (r.width > 0 && r.height > 0) return формы[i];
    }
    return null;
  }

  function найти_форму() {
    // Куда вести человека по кнопке «Хочу лучшие условия». Панель выбора
    // мессенджера стоит перед формой первого экрана и на первом экране
    // ЗАМЕНЯЕТ её (форма в этом режиме скрыта). Без этой ветки липкая кнопка
    // не реагировала вовсе: форма скрыта, а поиск искал именно форму и не
    // находил ни одной видимой (найдено 15.10.2026).
    var выбор = document.getElementById('sndw-choice');
    if (выбор && выбор.getBoundingClientRect().height > 0) return выбор;
    return найти_живую_форму();
  }

  /* Перевести форму первого экрана в режим полей: панели (липкая внизу и на
   * компьютере) переносят значения именно в неё, а в режиме выбора она скрыта
   * и отправка ушла бы из невидимой формы. */
  function открыть_поля_формы() {
    var форма = document.getElementById(ФОРМА_ПЕРВОГО_ЭКРАНА);
    if (!форма || форма.getAttribute('data-sndw-choice') !== '1') return форма;
    форма.setAttribute('data-sndw-mode', 'phone');
    var выбор = document.getElementById('sndw-choice');
    if (выбор) выбор.style.display = 'none';
    return форма;
  }

  function к_форме() {
    var ф = найти_форму();
    if (!ф) return false;
    var верх = ф.getBoundingClientRect().top + window.scrollY - 90;
    window.scrollTo({ top: Math.max(0, верх), behavior: 'smooth' });
    // фокус ставим только в поле живой формы; у панели выбора полей нет
    if (ф.tagName === 'FORM') {
      var поле = ф.querySelector('input[type="text"],input[name*="ame"],input');
      if (поле && поле.focus) setTimeout(function () { поле.focus({ preventScroll: true }); }, 700);
    }
    return true;
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
        '<p>Расскажем про условия и подберём удобное время</p>' +
        '<a href="#sndw-form">' + подписьCTA() + '</a>';
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
      // Значения переносим именно в форму, а не в блок выбора: у блока полей нет.
      // Если форма в режиме выбора — сначала показываем её поля.
      var ф = открыть_поля_формы() || найти_живую_форму();
      if (ф && номер) {
        // Переносим ПОСЛЕ показа формы: пока она была скрыта, значение в поле
        // не доживало до отправки. Маске телефона Тильды нужен ещё и фокус —
        // без него скрытое поле Phone остаётся пустым (замер 15.10.2026).
        var внести = function () {
          // Только НАСТОЯЩЕЕ поле телефона. Раньше здесь стоял список
          // «input[type=tel],input[name*=hone],input[name*=el]», и
          // querySelector возвращал первое совпадение по документу — а это
          // служебное скрытое поле Тильды `tildaspec-phone-part[]-iso`,
          // которое стоит в разметке раньше телефона. Номер уходил в
          // невидимый инпут, и в форме оставалась пустота (найдено 15.10.2026).
          var поле = ф.querySelector('input[type="tel"]') ||
                     ф.querySelector('input[name="tildaspec-phone-part[]"]');
          if (!поле) return;
          поле.value = номер;
          поле.dispatchEvent(new Event('focus', { bubbles: true }));
          поле.dispatchEvent(new Event('input', { bubbles: true }));
          поле.dispatchEvent(new Event('change', { bubbles: true }));
        };
        setTimeout(внести, 260);
        setTimeout(внести, 800);
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

  /* Выбор мессенджера в форме первого экрана ---------------------------
   * Задача Ольги 14.10.2026: заявки с формы доходят до 1С и до чата заявок,
   * но дозвониться удаётся не до всех — автоответчики, антиспам, «недоступен».
   * Поэтому первым делом человек выбирает, куда ему удобнее написать
   * (Telegram или MAX), а телефон остаётся запасным путём для тех, у кого
   * мессенджеров нет.
   *
   * Как сделано: поля родной формы Тильды прячутся, вместо них панель с
   * вопросом, двумя кнопками и мелкой строкой «или оставьте номер —
   * перезвоним». Нажатие строки возвращает поля на место (data-sndw-mode=phone).
   *
   * ВАЖНО: имена и состав полей формы НЕ меняются. Любое новое поле Тильда
   * отправила бы в 1С вместе с заявкой, а 1С незнакомые поля отвергает
   * целиком (`Invalid structure attribute name`) — заявка потерялась бы
   * молча. Поэтому вторая галочка про рекламные сообщения в живой форме
   * НЕ добавлена: на сайте рассылок нет, спрашивать согласие не на что.
   *
   * Откат: ПОКАЗЫВАТЬ_ВЫБОР_МЕССЕНДЖЕРА = false и перезалить файл.
   */
  var ПОКАЗЫВАТЬ_ВЫБОР_МЕССЕНДЖЕРА = true;
  // 11.11.2026, прямая просьба Ольги: «форма заявки — раскрывай уже!».
  // До этого поле телефона было спрятано за мелкой строкой «или оставьте
  // номер — перезвоним»: человек видел две кнопки мессенджеров и уходил, а
  // форма оставалась за нажатием. Замер того же дня: 274 визита из Москвы за
  // 1–10 ноября дали одного нового человека с сайта.
  // Теперь форма раскрыта сразу, кнопка-раскрывашка не выводится вовсе.
  // Откат: поставить false и перезалить файл — вернётся прежний вид.
  // 11.11.2026, прямая просьба Ольги: «форма заявки — раскрывай уже!».
  // До этого поле телефона было спрятано за мелкой строкой «или оставьте
  // номер — перезвоним»: человек видел две большие кнопки мессенджеров и
  // уходил, а форма оставалась за нажатием. Замер того же дня: 274 визита из
  // Москвы за 1–10 ноября дали одного нового человека с сайта.
  // Теперь форма открыта сразу. Чтобы она уместилась в первый экран:
  //   * мессенджеры стали двумя компактными кнопками в одну строку;
  //   * на телефоне скрыто поле «Ваше имя» (телефон — главное, имя спросит
  //     менеджер), иначе кнопка отправки уезжала под следующий блок сайта;
  //   * у формы своя тёмная подложка, иначе сквозь поля читалась бегущая строка.
  // Нажимаемость кнопки проверена замером elementFromPoint на 390 и 1440 px.
  // Откат: поставить false и перезалить файл — вернётся прежний вид.
  var РАСКРЫВАТЬ_ФОРМУ_СРАЗУ = true;
  var ФОРМА_ПЕРВОГО_ЭКРАНА = 'form2478331411';
  var ВХОД_В_БОТ = 'https://t.me/sandowclub_bot?start=sayt';

  function выборМессенджера() {
    // 1. Строка под формой — прямая правка Ольги 14.10.2026: текста на
    //    первом экране слишком много, оффер из-за неё не читается.
    [].slice.call(document.querySelectorAll('p')).forEach(function (п) {
      if ((п.textContent || '').indexOf('Покупать ничего не нужно') >= 0) {
        п.style.display = 'none';
      }
    });

    if (!ПОКАЗЫВАТЬ_ВЫБОР_МЕССЕНДЖЕРА) return 0;
    var форма = document.getElementById(ФОРМА_ПЕРВОГО_ЭКРАНА);
    if (!форма) return 0;
    var коробка = форма.querySelector('.t-form__inputsbox');
    if (!коробка) return 0;

    if (форма.getAttribute('data-sndw-choice') === '1') return 1;   // уже сделано
    форма.setAttribute('data-sndw-choice', '1');

    if (!document.getElementById('sndw-choice-css')) {
      var стиль = document.createElement('style');
      стиль.id = 'sndw-choice-css';
      стиль.textContent =
        '#sndw-choice{box-sizing:border-box;width:100% !important;margin:26px 0 0;' +
        'border-radius:16px;background:rgba(240,234,222,.04);padding:16px 14px 12px}' +
        '#sndw-choice .sndw-choice-q{font-family:Archivo,Arial,sans-serif;font-weight:700;' +
        'font-size:15px;line-height:1.3;color:#F0EADE;margin:0 0 12px}' +
        '#sndw-choice .sndw-choice-btn{box-sizing:border-box;display:flex;align-items:center;' +
        'gap:10px;width:100% !important;height:46px;padding:0 15px;border-radius:34px;' +
        'text-decoration:none;font-family:Archivo,Arial,sans-serif;font-weight:700;' +
        'font-size:14px;margin-bottom:9px}' +
        '#sndw-choice .sndw-choice-btn img{width:22px;height:22px;border-radius:50%;' +
        'flex:0 0 22px;display:block}' +
        '#sndw-choice .sndw-choice-btn span{white-space:nowrap;overflow:hidden;' +
        'text-overflow:ellipsis}' +
        '#sndw-choice .sndw-choice-tg{background:' + ЗОЛОТО + ';color:' + ТЁМНЫЙ + '}' +
        '#sndw-choice .sndw-choice-mx{border:1px solid rgba(233,199,126,.45);color:#F0EADE;' +
        'margin-bottom:6px}' +
        '#sndw-choice .sndw-choice-phone{background:none;border:0;padding:4px 0;cursor:pointer;' +
        'font-family:Archivo,Arial,sans-serif;font-size:12.5px;color:rgba(240,234,222,.75);' +
        'text-decoration:underline}' +
        // Пока человек не выбрал телефон, саму форму не показываем: панель стоит
        // рядом с ней, а не внутри, поэтому ширина не зависит от вёрстки Тильды
        // (на мобильной версии блок внутри формы сжимался до 206 px — правка 15.10.2026).
        '.t-form[data-sndw-choice="1"]{display:none !important}' +
        '.t-form[data-sndw-choice="1"][data-sndw-mode="phone"]{display:block !important}' +
        // 11.11.2026: форма раскрыта с самого начала, и она стоит поверх бегущей
        // строки первого экрана. Без собственной подложки сквозь поля читалась
        // «ЧЁРНАЯ ПЯТНИЦА · ДО 15 НОЯБРЯ», а строка согласия сливалась с ней в
        // кашу — видно на снимке до правки. Даём форме плотный тёмный фон.
        // Рамку вокруг убрали по правке Ольги того же дня: «убери рамку вокруг».
        '.t-form[data-sndw-choice="1"][data-sndw-mode="phone"]' +
        '{position:relative;z-index:3;background:' + ТЁМНЫЙ + ';' +
        'border:0;border-radius:16px;' +
        'padding:14px 12px 16px;margin-top:10px}' +
        '.t-form[data-sndw-choice="1"][data-sndw-mode="phone"] .t-input,' +
        '.t-form[data-sndw-choice="1"][data-sndw-mode="phone"] .t-input-phonemask' +
        '{background:#161310 !important;color:#F0EADE !important;' +
        'border-color:rgba(233,199,126,.28) !important}' +
        // Кнопка отправки: не «сарделька» на всю ширину, а аккуратная пилюля
        // по центру. Правка Ольги 11.11.2026: «основную кнопку-пилюлю надо
        // сделать поменьше, более деликатно».
        // Селектор намеренно с id блока впереди: Тильда вставляет внутрь самой
        // кнопки свой стиль вида «#rec2478331411 .t-btnflex…» с !important, и
        // правка без id не применялась вовсе (проверено замером 11.11.2026:
        // кнопка оставалась 330x62 с отступами 12/20).
        '#rec2478331411 .t-form[data-sndw-choice="1"][data-sndw-mode="phone"] .t-submit' +
        '{display:flex !important;box-sizing:border-box !important;width:100% !important;min-width:0 !important;' +
        'height:auto !important;min-height:48px !important;padding:12px 16px !important;' +
        'align-items:center !important;justify-content:center !important;' +
        'line-height:1.3 !important;font-size:15px !important;white-space:normal !important;' +
        'overflow:visible !important;border-radius:24px !important;margin:0 auto !important}' +
        '#rec2478331411 .t-form[data-sndw-choice="1"][data-sndw-mode="phone"] .t-submit .t-btnflex__text' +
        '{display:block !important;flex:1 1 auto !important;min-width:0 !important;max-width:100% !important;' +
        'height:auto !important;line-height:1.3 !important;font-size:inherit !important;' +
        'white-space:normal !important;overflow-wrap:normal !important;text-align:center !important;' +
        'color:#0B0906 !important;-webkit-text-fill-color:#0B0906 !important}' +
        '#rec2478331411 .t-form[data-sndw-choice="1"][data-sndw-mode="phone"] .t-form__submit' +
        '{display:flex !important;justify-content:center !important;' +
        'padding:0 !important;margin:0 !important;text-align:center !important;width:100% !important}' +
        '.t-form[data-sndw-choice="1"][data-sndw-mode="phone"] .t-form__inputsbox' +
        '{padding-bottom:4px}' +
        // Тесная версия панели: форма открыта, а мессенджеры уходят в одну
        // строку двумя компактными кнопками. Замер 11.11.2026: в первом экране
        // блока под контент есть ~320 px, а «две большие кнопки + форма»
        // занимают 374 px — из-за этого нижняя часть формы уезжала под
        // следующий блок сайта, и кнопка отправки не нажималась.
        '#sndw-choice.sndw-choice-compact{margin:14px 0 0;padding:12px 12px 10px}' +
        // Первый экран удлиняем на 40 px на всех ширинах: раздел «01 — КЛУБ» и
        // всё, что ниже, отъезжает вниз (просьба Ольги 11.11.2026).
        '#sndw2-hero{padding-bottom:40px !important}' +
        '#sndw-choice.sndw-choice-compact .sndw-choice-q{font-size:13px;' +
        'font-weight:400;color:rgba(240,234,222,.75);margin:0 0 8px}' +
        // Ряд кнопок по центру блока и с переносом: если двум кнопкам тесно,
        // они встают одна под другой, а не выезжают за правый край.
        '#sndw-choice.sndw-choice-compact .sndw-choice-row{display:flex;gap:8px;' +
        'justify-content:center;flex-wrap:wrap}' +
        // 22.11.2026: подписи «Забрать в Телеграме» не влезали в два окна рядом —
        // замер на 320 px: ряд 240 px, кнопки 184+156 вылезали за край (right 388).
        // Поэтому действие переносим в строку над кнопками, а сами кнопки
        // называют канал: «В Телеграме» / «В Максе». min-width:0 не даёт flex-
        // элементу раздуться по тексту и выехать за блок.
        '#sndw-choice.sndw-choice-compact .sndw-choice-btn{flex:1 1 0;min-width:0;height:40px;' +
        'margin-bottom:0;justify-content:center;font-size:13px;padding:0 8px;gap:8px}' +
        '#sndw-choice.sndw-choice-compact .sndw-choice-btn img{width:19px;height:19px;' +
        'flex:0 0 19px}' +
        // Надпись на кнопке не обрезается многоточием: если места мало, кнопка
        // сжимает отступы, а на совсем узком экране ряд переходит в столбик
        // (правила ниже). Многоточие оставлено только как крайняя мера.
        '#sndw-choice.sndw-choice-compact .sndw-choice-btn span{white-space:nowrap}' +
        // Узкий телефон: мельче подпись, уже отступы и иконка — так «В Телеграме»
        // читается целиком. Пороги подобраны замером, а не на глаз
        // (320 / 344 / 360 / 375 / 390 / 414 px).
        '@media (max-width:380px){' +
        '#sndw-choice.sndw-choice-compact .sndw-choice-btn{font-size:12px;padding:0 6px;gap:6px}' +
        '#sndw-choice.sndw-choice-compact .sndw-choice-btn img{width:17px;height:17px;' +
        'flex:0 0 17px}' +
        '}' +
        // Совсем узкий экран (320–339 px): двум кнопкам в строке не хватает
        // места на подписи — ставим их одна под другой, обе во всю ширину.
        '@media (max-width:339px){' +
        '#sndw-choice.sndw-choice-compact .sndw-choice-row{flex-direction:column;gap:6px}' +
        '#sndw-choice.sndw-choice-compact .sndw-choice-btn{width:100%;height:38px;' +
        'flex:0 0 auto;font-size:13px;padding:0 10px;gap:8px}' +
        '}' +
        // Обе кнопки мессенджеров одинаковые и прозрачные: правка Ольги
        // 11.11.2026 — «кнопку тг сделай как у макса, прозрачную».
        '#sndw-choice.sndw-choice-compact .sndw-choice-tg,' +
        '#sndw-choice.sndw-choice-compact .sndw-choice-mx' +
        '{background:none;border:1px solid rgba(233,199,126,.45);color:#F0EADE;' +
        'margin-bottom:0}' +
        // Форма должна уместиться в первый экран целиком: панель поэтому тесная.
        '.t-form[data-sndw-choice="1"][data-sndw-mode="phone"]{margin-top:0}' +
        // На телефоне места меньше всего: замер 11.11.2026 — кнопка отправки
        // попадала под следующий блок (в её точке лежал SECTION.sndw2-club) и
        // не нажималась. Здесь ужимаем отступы и убираем поясняющую строку над
        // кнопками: две иконки и так понятны без подписи.
        '@media (max-width:480px){' +
        // Воздух под кнопкой и отступ под первым экраном — правка Ольги
        // 11.11.2026: «опустить блок про клуб и с ним всё дальше, бегущая
        // строка не должна подпирать кнопку». Сделано статично: попытка
        // считать отступы скриптом один раз дала на ноутбуке кнопку в 7 800 px
        // от строки, пришлось откатывать. Здесь числа подобраны замерами.
        //   1) блок «мессенджеры + форма» поднимаем — кнопка уходит от строки;
        //   2) первый экран удлиняем — клуб и всё дальше отъезжает вниз.
        '#sndw-choice.sndw-choice-compact{margin-top:-20px !important;padding:10px 10px 8px}' +
        // 2) Обёртку первого экрана удлиняем: раздел «01 — КЛУБ» и всё, что
        //    ниже, отъезжает вниз, а строка — вместе с низом обёртки.
        '#sndw2-hero{padding-bottom:40px !important}' +
        // 3) И сам блок с формой приподнимаем: кнопка уходит от строки.
        '#sndw-choice.sndw-choice-compact{margin-top:-20px !important}' +
        '#sndw-choice.sndw-choice-compact .sndw-choice-q{display:none}' +
        '.t-form[data-sndw-choice="1"][data-sndw-mode="phone"]' +
        '{padding:2px 10px 2px !important}' +
        '.t-form[data-sndw-choice="1"][data-sndw-mode="phone"] .t-form__item' +
        '{margin-bottom:4px !important}' +
        '.t-form[data-sndw-choice="1"][data-sndw-mode="phone"] .t-input' +
        '{height:40px !important;padding-top:0 !important;padding-bottom:0 !important}' +
        '.t-form[data-sndw-choice="1"][data-sndw-mode="phone"] .t-checkbox__label' +
        '{font-size:9.5px !important;line-height:1.15 !important}' +
        // Поле «Ваше имя» ОСТАВЛЯЕМ ВИДИМЫМ. 12.11.2026 выяснилось: Тильда
        // считает его обязательным, и пока оно было скрыто, КАЖДАЯ отправка
        // формы заканчивалась ошибкой «Пожалуйста, заполните все обязательные
        // поля». Заявки с главной страницы не создавались вовсе: в панели
        // Тильды последняя — 10.11 в 21:03, а следующая появилась только
        // после того, как поле вернули. Проверено вживую: без поля — ошибка,
        // с полем — отправка проходит.
        // Место в форме экономим высотой самого поля, а не его скрытием.
        '.t-form[data-sndw-choice="1"][data-sndw-mode="phone"] .t-input-group_nm' +
        '{display:block !important;margin-bottom:4px !important}' +
        '.t-form[data-sndw-choice="1"][data-sndw-mode="phone"] .t-input-group_nm .t-input' +
        '{height:40px !important}' +
        '.t-form[data-sndw-choice="1"][data-sndw-mode="phone"] .t-input-group_cb' +
        '{margin-top:0 !important;margin-bottom:0 !important}' +
        '.t-form[data-sndw-choice="1"][data-sndw-mode="phone"] .t-input-group_ph' +
        '{margin-bottom:0 !important;height:44px !important}' +
        '.t-form[data-sndw-choice="1"][data-sndw-mode="phone"] .t-input-block' +
        '{padding:0 !important}' +
        '#rec2478331411 .t-form[data-sndw-choice="1"][data-sndw-mode="phone"] .t-submit' +
        '{height:auto !important;min-height:48px !important;line-height:1.3 !important;border-radius:24px !important}' +
        '#rec2478331411 .t-form[data-sndw-choice="1"][data-sndw-mode="phone"] .t-form__submit' +
        '{margin-top:2px !important}' +
        '}';
      document.head.appendChild(стиль);
    }

    var панель = document.createElement('div');
    панель.id = 'sndw-choice';
    if (РАСКРЫВАТЬ_ФОРМУ_СРАЗУ) панель.className = 'sndw-choice-compact';
    панель.innerHTML =
      '<div class="sndw-choice-q">' +
      (РАСКРЫВАТЬ_ФОРМУ_СРАЗУ
        ? 'Заберите план тренировок в мессенджере — ответим там'
        : 'Как удобнее продолжить?') + '</div>' +
      '<div class="sndw-choice-row">' +
      '<a class="sndw-choice-btn sndw-choice-tg" href="' + ВХОД_В_БОТ + '"' +
      ' target="_blank" rel="noopener">' +
      '<img src="' + ЗНАК_ТЕЛЕГРАМА + '" alt="Telegram" loading="lazy">' +
      // 22.11.2026: подпись короткая, а действие названо строкой выше. Длинная
      // подпись раздувала кнопку и выталкивала вторую за край на узких экранах.
      '<span>В Телеграме</span></a>' +
      '<a class="sndw-choice-btn sndw-choice-mx" href="' + МАКС + '"' +
      ' target="_blank" rel="noopener">' +
      '<img src="' + ЗНАК_МАКСА + '" alt="MAX" loading="lazy">' +
      '<span>В Максе</span></a></div>' +
      // Строка-раскрывашка нужна только там, где форма ещё спрятана.
      (РАСКРЫВАТЬ_ФОРМУ_СРАЗУ ? '' :
        '<button type="button" class="sndw-choice-phone">' +
        'или оставьте номер — перезвоним</button>');
    // Ставим ПЕРЕД формой, а не внутрь неё: внутри на мобильной версии Тильды
    // блок попадал в обёртку 206 px и обрезался (найдено 15.10.2026 по снимку Ольги).
    форма.parentNode.insertBefore(панель, форма);

    if (РАСКРЫВАТЬ_ФОРМУ_СРАЗУ) {
      // Форма открыта с самого начала: нажатия не требуется.
      форма.setAttribute('data-sndw-mode', 'phone');
      // Бегущую строку НЕ двигаем: она лежит отдельным слоем с обрезкой у
      // родителя, и любая попытка сдвинуть её заканчивалась тем, что строка
      // исчезала с сайта (11.11.2026: «бегущей строки теперь нет нигде»).
      // Воздух под кнопкой делаем ужатием самой формы — см. стили ниже.
      return 1;
    }

    панель.querySelector('.sndw-choice-phone').addEventListener('click', function (e) {
      e.preventDefault();
      форма.setAttribute('data-sndw-mode', 'phone');
      панель.style.display = 'none';   // панель стоит перед формой, CSS назад её не выберет
      var поле = форма.querySelector('input[type="text"],input[name*="ame"]');
      if (поле && поле.focus) setTimeout(function () { поле.focus({ preventScroll: true }); }, 60);
    });
    return 1;
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

  /* ---------- разметка отзывов и крошек (добавлено 27.09.2026) ----------
   * На главной пять реальных отзывов с авторами и датами, но поисковик о
   * них не знает: разметки нет. Собираем её ИЗ САМОЙ СТРАНИЦЫ, а не из
   * зашитого списка — тогда она не разойдётся с видимым текстом.
   * Сводную оценку не добавляем: своя оценка на своём сайте — плохой тон
   * и поисковиками не приветствуется.
   * Только главная и только наш проект: c.js подключён ко всему домену,
   * включая раздел Богородицка. */
  function разметкаОтзывов() {
    if (document.getElementById('sndw-otzyvy-ld')) return;
    var путь = location.pathname.replace(/\/+$/, '');
    if (путь !== '') return;                       // только главная

    var МЕСЯЦЫ = {
      'январь': '01', 'января': '01', 'февраль': '02', 'февраля': '02',
      'март': '03', 'марта': '03', 'апрель': '04', 'апреля': '04',
      'май': '05', 'мая': '05', 'июнь': '06', 'июня': '06',
      'июль': '07', 'июля': '07', 'август': '08', 'августа': '08',
      'сентябрь': '09', 'сентября': '09', 'октябрь': '10', 'октября': '10',
      'ноябрь': '11', 'ноября': '11', 'декабрь': '12', 'декабря': '12'
    };

    var отзывы = [];
    var карточки = document.querySelectorAll('.s2-card');
    for (var i = 0; i < карточки.length; i++) {
      var к = карточки[i];
      var абз = к.querySelector('p');
      var подпись = к.querySelector('.s2-author');
      if (!абз || !подпись) continue;
      var текст = (абз.textContent || '').trim().replace(/^«|»$/g, '');
      var части = (подпись.textContent || '').split(',');
      if (!текст || !части[0]) continue;
      var отзыв = {
        '@type': 'Review',
        'reviewRating': {'@type': 'Rating', 'ratingValue': 5,
                         'bestRating': 5, 'worstRating': 1},
        'author': {'@type': 'Person', 'name': части[0].trim()},
        'reviewBody': текст,
        'itemReviewed': {'@type': 'SportsActivityLocation',
                         'name': 'Сандов Фитнес',
                         'url': 'https://sandowfitness.ru/'}
      };
      if (части[1]) отзыв.publisher = {'@type': 'Organization',
                                       'name': части[1].trim()};
      if (части[2]) {
        var д = части[2].trim().toLowerCase().match(/([а-яё]+)\s+(\d{4})/);
        if (д && МЕСЯЦЫ[д[1]]) отзыв.datePublished = д[2] + '-' + МЕСЯЦЫ[д[1]] + '-01';
      }
      отзывы.push(отзыв);
    }
    if (!отзывы.length) return;

    отзывы.push({
      '@type': 'BreadcrumbList',
      'itemListElement': [
        {'@type': 'ListItem', 'position': 1, 'name': 'Сандов Фитнес',
         'item': 'https://sandowfitness.ru/'},
        {'@type': 'ListItem', 'position': 2, 'name': 'Фитнес-клуб на Нижегородской',
         'item': 'https://sandowfitness.ru/'}
      ]
    });

    var с = document.createElement('script');
    с.type = 'application/ld+json';
    с.id = 'sndw-otzyvy-ld';
    с.textContent = JSON.stringify({'@context': 'https://schema.org',
                                    '@graph': отзывы});
    document.head.appendChild(с);
  }



  /* ---------- 13 ссылок с главной на лендинги (добавлено 27.09.2026) ----------
   * Показано Ольге макетом в Телеграм, одобрено («ок, публикуй»). Только
   * главная страница — не трогаем /contacts, /group, /fightclub,
   * /bogoroditsk (у него свой футер, но проверка path === '' лишней не будет). */
  function ссылкиНаЛендинги() {
    var путь = location.pathname.replace(/\/+$/, '');
    if (путь !== '') return;
    var блок = document.querySelector('.sndw2-footer-links');
    if (!блок || блок.getAttribute('data-sndw-footer-lp-links')) return;
    var НОВЫЕ = [["/personalnye-trenirovki-moskva/","Персональные тренировки"],["/fitnes-dlya-zhenshchin-moskva/","Фитнес для женщин"],["/boks-metro-nizhegorodskaya/","Бокс"],["/kikboksing-moskva/","Кикбоксинг"],["/boks-dlya-zhenshchin-moskva/","Бокс для женщин"],["/zumba-moskva/","Зумба"],["/yoga-moskva/","Йога"],["/rastyazhka-moskva/","Растяжка"],["/zdorovaya-spina/","Здоровая спина"],["/tyazhelaya-atletika-moskva/","Тяжёлая атлетика"],["/fitness-klub-s-saunoy-moskva/","Клуб с сауной"],["/sportivny-klub-moskva/","Спортивный клуб"]];
    var якорь = блок.querySelector('a[href*="lp.sandowfitness.ru/stati"]');
    for (var i = 0; i < НОВЫЕ.length; i++) {
      if (блок.querySelector('a[href="https://lp.sandowfitness.ru' + НОВЫЕ[i][0] + '"]')) continue;
      var a = document.createElement('a');
      a.href = 'https://lp.sandowfitness.ru' + НОВЫЕ[i][0];
      a.textContent = НОВЫЕ[i][1];
      if (якорь) блок.insertBefore(a, якорь);
      else блок.appendChild(a);
    }
    блок.setAttribute('data-sndw-footer-lp-links', '1');
  }



  /* ---------- сворачивание лендинг-ссылок подвала (29.09.2026) ----------
   * Просьба собственника (передала Ольга 29.09): перечень всех
   * направлений в подвале смотрится «полотном». Все ссылки на
   * lp.sandowfitness.ru уезжают в раскрывающийся блок «Направления и
   * услуги» (details/summary): в DOM они остаются — поисковики видят
   * их как раньше, — а глазу видна одна строка со стрелкой.
   * Только главная, только наш проект (чужойПроект отсёк c.js раньше).
   * Откат: СВОРАЧИВАТЬ_ПОДВАЛ = false и перезалить файл. */
  var СВОРАЧИВАТЬ_ПОДВАЛ = true;
  function свернутьПодвал() {
    if (!СВОРАЧИВАТЬ_ПОДВАЛ) return;
    var путь = location.pathname.replace(/\/+$/, '');
    if (путь !== '') return;
    var блок = document.querySelector('.sndw2-footer-links');
    if (!блок) return;
    var лп = [].slice.call(блок.querySelectorAll('a')).filter(function (a) {
      return a.href.indexOf('lp.sandowfitness.ru') !== -1;
    });
    var д = document.getElementById('sndw-footer-more');
    if (д) {
      // поздние дорисовки: доносим отставшие ссылки в уже созданный блок
      var в = д.querySelector('.sndw-footer-more-in');
      лп.forEach(function (a) { в.appendChild(a); });
      return;
    }
    if (лп.length < 4) return; // дорисовка ещё не прошла — рано сворачивать
    д = document.createElement('details');
    д.id = 'sndw-footer-more';
    var з = document.createElement('summary');
    з.textContent = 'Направления и услуги';
    д.appendChild(з);
    var внутр = document.createElement('div');
    внутр.className = 'sndw-footer-more-in';
    лп.forEach(function (a) { внутр.appendChild(a); });
    д.appendChild(внутр);
    // details живёт ВНУТРИ строки подвала: тогда ссылки остаются под
    // селектором «.sndw2-footer-links a» и не теряют фирменный стиль
    блок.appendChild(д);
    var ст = document.createElement('style');
    ст.textContent =
      '#sndw-footer-more{margin-top:10px;width:100%;flex-basis:100%}' +
      '#sndw-footer-more summary{cursor:pointer;list-style:none;' +
        'display:inline-flex;align-items:center;gap:8px;color:inherit;' +
        'opacity:.85;user-select:none}' +
      '#sndw-footer-more summary::-webkit-details-marker{display:none}' +
      '#sndw-footer-more summary::after{content:"\\25BE";font-size:11px;' +
        'transition:transform .2s;transform:rotate(-90deg)}' +
      '#sndw-footer-more[open] summary::after{transform:rotate(0)}' +
      '#sndw-footer-more summary:hover{opacity:1}' +
      '.sndw-footer-more-in{display:flex;flex-wrap:wrap;' +
        'gap:10px 22px;padding-top:12px}';
    document.head.appendChild(ст);
  }


  /* ---------- ОДНА ПИЛЮЛЯ ВМЕСТО ПОЛОТНА ССЫЛОК (18.11.2026) ----------
   * Ольга, 18.11.2026: «в подвале основного московского сайта надо
   * группировать в пилюлю список полезных статей, а то опять полотно».
   *
   * Замер живого сайта до правки: в конце главной шли подряд список
   * «Полезные статьи», тихая строка ссылок, пилюля «Тренажёрный зал и
   * клуб рядом» и подвал с 28 ссылками. Полотно из четырёх наборов.
   *
   * Что делает эта функция — сводит ВСЁ в одну закрытую строку-пилюлю
   * (details/summary) перед оффером:
   *   статьи → направления → залы и районы → клуб и документы.
   * Внутри ссылки живут полным списком: поисковики видят их как раньше,
   * человек видит одну строку и раскрывает её сам.
   *
   * Старые наборы прячутся стилем: их ссылки целиком перенесены сюда,
   * поэтому ничего не теряется.
   *
   * Список ссылок — единственное место, где он правится. Добавили статью
   * или зал — впишите строку сюда.
   *
   * Откат: ПОКАЗЫВАТЬ_ПИЛЮЛЮ = false и перезалить файл.
   */
  var ПОКАЗЫВАТЬ_ПИЛЮЛЮ = true;
  var ЛП = 'https://lp.sandowfitness.ru/';
  var САЙТ = 'https://sandowfitness.ru';

  var ПИЛЮЛЯ_ГРУППЫ = [
    ['Полезные статьи', [
      [ЛП + 'kak-vybrat-trenazhernyy-zal-ryadom-s-domom/', 'Как выбрать тренажёрный зал'],
      [ЛП + 'boks-i-kikboksing-s-nulya/', 'Бокс и кикбоксинг с нуля'],
      [ЛП + 'kikboksing-ili-boks-chto-vybrat/', 'Кикбоксинг или бокс: что выбрать'],
      [ЛП + 'abonement-v-trenazhernyy-zal-na-mesyac-ili-na-dolshe/', 'Абонемент в зал: что важно знать'],
      [ЛП + 'beg-dlya-nachinayuschih/', 'Бег для начинающих'],
      [ЛП + 'rastyazhka-dlya-edinoborstv-zachem-nuzhna-gibkost/', 'Растяжка для бокса и кикбоксинга'],
      [ЛП + 'sushka-tela/', 'Сушка тела: как это работает'],
      [ЛП + 'aktivnoe-i-passivnoe-vosstanovlenie-raznitsa/', 'Восстановление: активное и пассивное'],
      [ЛП + 'nalogovyy-vychet-za-fitnes/', 'Налоговый вычет за фитнес'],
      [ЛП + 'stati/', 'Все статьи о тренировках →']
    ]],
    ['Направления и услуги', [
      [ЛП + 'trenazherny-zal-nizhegorodskaya/', 'Тренажёрный зал'],
      [ЛП + 'personalnye-trenirovki-moskva/', 'Персональные тренировки'],
      [ЛП + 'gruppovye-programmy-moskva/', 'Групповые программы'],
      [ЛП + 'boytsovsky-klub-moskva/', 'Бокс и кикбоксинг'],
      [ЛП + 'boks-metro-nizhegorodskaya/', 'Бокс'],
      [ЛП + 'kikboksing-moskva/', 'Кикбоксинг'],
      [ЛП + 'boks-dlya-zhenshchin-moskva/', 'Бокс для женщин'],
      [ЛП + 'yoga-moskva/', 'Йога'],
      [ЛП + 'zumba-moskva/', 'Зумба'],
      [ЛП + 'rastyazhka-moskva/', 'Растяжка'],
      [ЛП + 'zdorovaya-spina/', 'Здоровая спина'],
      [ЛП + 'tyazhelaya-atletika-moskva/', 'Тяжёлая атлетика'],
      [ЛП + 'fitnes-dlya-zhenshchin-moskva/', 'Фитнес для женщин'],
      [ЛП + 'fitness-klub-s-saunoy-moskva/', 'Клуб с сауной'],
      [ЛП + 'krugosutochny-fitness-klub-metro/', 'Круглосуточно для членов клуба'],
      [ЛП + 'razovoe-poseschenie-sportzala/', 'Разовое посещение'],
      [ЛП + 'sportivny-klub-moskva/', 'Спортивный клуб']
    ]],
    ['Залы и районы рядом', [
      [САЙТ + '/trenazherny-zal-lefortovo', 'Тренажёрный зал в Лефортове'],
      [САЙТ + '/trenazherny-zal-dubrovka', 'Тренажёрный зал в районе Дубровки'],
      [САЙТ + '/trenazherny-zal-taganskaya', 'Тренажёрный зал недалеко от Таганской'],
      [САЙТ + '/trenazherny-zal-kozhuhovskaya', 'Тренажёрный зал недалеко от Кожуховской'],
      [САЙТ + '/trenazherny-zal-ryazanskiy', 'Тренажёрный зал на Рязанском проспекте'],
      [САЙТ + '/trenazherny-zal-proletarskaya', 'Тренажёрный зал недалеко от Пролетарской'],
      [САЙТ + '/trenazherny-zal-marino', 'Тренажёрный зал в районе Марьина'],
      [САЙТ + '/trenazherny-zal-lyublino', 'Тренажёрный зал в Люблине'],
      [САЙТ + '/trenazherny-zal-yuzhnoportovaya', 'Тренажёрный зал недалеко от метро Южнопортовая']
    ]],
    ['Клуб и документы', [
      ['#club', 'Клуб'],
      ['#zones', 'Залы'],
      ['#trainers', 'Тренеры'],
      ['/zamorozka', 'Заморозка абонемента'],
      ['https://t.me/sandowclub_bot', 'Telegram'],
      [МАКС, 'MAX'],
      ['/oferta', 'Публичная оферта'],
      ['/policy', 'Политика конфиденциальности'],
      ['/bogoroditsk', 'Клуб в Богородицке']
    ]]
  ];

  function стильПилюли() {
    if (document.getElementById('sndw-pill-css')) return;
    var ст = document.createElement('style');
    ст.id = 'sndw-pill-css';
    ст.textContent =
      /* старые наборы ссылок убираем с глаз: их ссылки перенесены в пилюлю */
      '.snd-articles,.snd-tail{display:none !important}' +
      '.sndw2-footer .sndw2-footer-links{display:none !important}' +
      '.sndw-pill{background:#0B0906;padding:30px 20px 4px}' +
      '.sndw-pill-in{max-width:1160px;margin:0 auto}' +
      '.sndw-pill summary{display:inline-flex;align-items:center;gap:10px;' +
        'cursor:pointer;list-style:none;padding:9px 18px;border-radius:999px;' +
        'border:1px solid rgba(154,143,124,.34);' +
        'font-family:"JetBrains Mono",ui-monospace,SFMono-Regular,Menlo,monospace;' +
        'font-size:12.5px;letter-spacing:.06em;color:#9A8F7C;' +
        'transition:color .25s ease,border-color .25s ease}' +
      '.sndw-pill summary::-webkit-details-marker{display:none}' +
      '.sndw-pill summary::marker{content:""}' +
      '.sndw-pill summary::after{content:"\\25BE";font-size:10px;opacity:.75;' +
        'transition:transform .25s ease;transform:rotate(-90deg)}' +
      '.sndw-pill details[open] summary::after{transform:rotate(0)}' +
      '.sndw-pill summary:hover{color:#E9C77E;border-color:rgba(233,199,126,.5)}' +
      '.sndw-pill summary:focus-visible{outline:2px solid #E9C77E;outline-offset:3px}' +
      '.sndw-pill-n{color:#8A8275;font-size:11px}' +
      '.sndw-pill-body{display:grid;gap:26px;padding:24px 2px 10px}' +
      '.sndw-pill-g b{display:block;margin-bottom:11px;color:#8A8275;' +
        'font-family:"JetBrains Mono",ui-monospace,monospace;font-size:10.5px;' +
        'font-weight:500;letter-spacing:.14em;text-transform:uppercase}' +
      '.sndw-pill-links{display:grid;gap:9px 24px;' +
        'grid-template-columns:repeat(auto-fill,minmax(250px,1fr))}' +
      '.sndw-pill-links a{color:#9A8F7C;text-decoration:none;border-bottom:1px solid transparent;' +
        'font-family:"Archivo",system-ui,Arial,sans-serif;font-size:13.5px;line-height:1.5;' +
        'transition:color .25s ease,border-color .25s ease}' +
      '.sndw-pill-links a:hover{color:#E9C77E;border-bottom-color:rgba(233,199,126,.45)}' +
      '.sndw-pill-links a:focus-visible{outline:2px solid #E9C77E;outline-offset:2px}' +
      '@media(max-width:640px){' +
        '.sndw-pill{padding:24px 16px 2px}' +
        '.sndw-pill summary{font-size:12px;padding:8px 15px}' +
        '.sndw-pill-body{gap:22px;padding-top:20px}' +
        '.sndw-pill-links{grid-template-columns:1fr;gap:8px}' +
        '.sndw-pill-links a{font-size:14px}}';
    document.head.appendChild(ст);
  }

  function однаПилюля() {
    if (!ПОКАЗЫВАТЬ_ПИЛЮЛЮ) return;
    var путь = location.pathname.replace(/\/+$/, '');
    if (путь !== '') return;                       // только главная
    стильПилюли();
    if (document.getElementById('sndw-pill')) return;

    var занято = {};
    var всего = 0;
    var тело = '';
    ПИЛЮЛЯ_ГРУППЫ.forEach(function (группа) {
      var ссылки = '';
      var сколько = 0;
      группа[1].forEach(function (п) {
        var адрес = п[0];
        if (занято[адрес]) return;                 // одна и та же ссылка — один раз
        занято[адрес] = 1;
        сколько++;
        var вкладка = адрес.indexOf('http') === 0 && адрес.indexOf('sandowfitness.ru') === -1;
        ссылки += '<a href="' + адрес + '"' +
          (вкладка ? ' target="_blank" rel="noopener"' : '') + '>' + п[1] + '</a>';
      });
      if (!сколько) return;
      всего += сколько;
      тело += '<div class="sndw-pill-g"><b>' + группа[0] + '</b>' +
              '<div class="sndw-pill-links">' + ссылки + '</div></div>';
    });
    if (!тело) return;

    var сек = document.createElement('section');
    сек.className = 'sndw-pill';
    сек.id = 'sndw-pill';
    сек.innerHTML =
      '<div class="sndw-pill-in"><details>' +
        '<summary>Полезные статьи и направления' +
          '<span class="sndw-pill-n">' + всего + '</span></summary>' +
        '<div class="sndw-pill-body">' + тело + '</div>' +
      '</details></div>';

    /* Место — перед оффером: с 18.11 сайт заканчивается оффером, а не
       списком ссылок. Оффер дорисовывает Тильда, поэтому пробуем
       несколько раз, пока он не появится. */
    var оффер = document.getElementById('join') || document.querySelector('.sndw2-cta');
    if (оффер && оффер.parentNode) {
      оффер.parentNode.insertBefore(сек, оффер);
      return true;
    }
    var подвал = document.querySelector('.sndw2-footer');
    if (подвал && подвал.parentNode) {
      подвал.parentNode.insertBefore(сек, подвал);
      return true;
    }
    return false;
  }


  /* ---------- ссылка на клуб в Богородицке с главной (27.09.2026) ----
   * На главной не было ни одного упоминания второго клуба — страница
   * /bogoroditsk оставалась сиротой внутри собственного домена. */
  function ссылкаБогородицк() {
    var путь = location.pathname.replace(/\/+$/, '');
    if (путь !== '') return;
    var блок = document.querySelector('.sndw2-footer-links');
    if (!блок || блок.querySelector('a[href="/bogoroditsk"]')) return;
    var a = document.createElement('a');
    a.href = '/bogoroditsk';
    a.textContent = 'Клуб в Богородицке';
    блок.appendChild(a);
  }


  /* Единый MAX ----------------------------------------------------------
   * То же по смыслу, что единый_телеграм() выше: если на московской странице
   * найдётся ссылка на ДРУГОЙ MAX-бот (старый адрес или чужой клуб), уводим
   * её на московский. Богородицкие адреса не трогаем — у второго клуба свой
   * бот и свой приёмник заявок (§0б). Сейчас ссылок max.ru на страницах нет
   * вовсе; функция стоит на будущее, чтобы «потом добавят и забудут» не
   * превратилось в битую кнопку. */
  function единый_макс() {
    var НЕ_ТРОГАТЬ = ['bogoroditsk', 'bogorodick'];
    var заменено = 0;
    [].slice.call(document.querySelectorAll('a[href*="max.ru/"]')).forEach(function (a) {
      var h = (a.getAttribute('href') || '').toLowerCase();
      if (h.indexOf(МАКС.toLowerCase()) >= 0) return;
      for (var i = 0; i < НЕ_ТРОГАТЬ.length; i++) {
        if (h.indexOf(НЕ_ТРОГАТЬ[i]) >= 0) return;
      }
      a.setAttribute('href', МАКС);
      заменено++;
    });
    return заменено;
  }


  /* Иконка MAX в плавающем блоке мессенджеров ---------------------------
   * Задача Ольги 14.10.2026: «разместить иконку макс на сайте рядом с
   * иконкой ТГ». Блок .sndw2-mess с кнопкой Телеграма уже есть в самой
   * странице Тильды — разметку страницы не правим, а ставим MAX рядом с
   * Телеграмом тем же размером и формой. Снимается одной строкой:
   * ПОКАЗЫВАТЬ_МАКС = false. */
  function иконкаМаксВМессенджерах() {
    var блок = document.querySelector('.sndw2-mess');
    if (!блок) return 0;
    var тг = блок.querySelector('.sndw2-mess-tg') ||
             блок.querySelector('a[href*="t.me/"]');
    var своя = блок.querySelector('.sndw2-mess-mx');
    if (своя && !ПОКАЗЫВАТЬ_МАКС) { своя.parentNode.removeChild(своя); своя = null; }
    if (своя) своя.setAttribute('href', МАКС);

    // Официальные знаки вместо нарисованных (правка Ольги 14.10.2026). Кнопки
    // остаются прежними по размеру и месту, меняется только картинка внутри —
    // поэтому «официальный вид» не ломает разметку страницы Тильды.
    if (!document.getElementById('sndw-mx-css')) {
      var стиль = document.createElement('style');
      стиль.id = 'sndw-mx-css';
      стиль.textContent =
        '.sndw2-mess-tg,.sndw2-mess-mx{background:transparent;border:0;padding:0}' +
        '.sndw2-mess-tg svg{display:none}' +
        '.sndw2-mess-tg img,.sndw2-mess-mx img{width:52px;height:52px;display:block;' +
        'border-radius:50%}';
      document.head.appendChild(стиль);
    }
    // Телеграм: подменяем иконку в кнопке, которая уже есть на странице
    if (тг && !тг.querySelector('img') && !(тг.textContent || '').trim()) {
      тг.innerHTML = '<img src="' + ЗНАК_ТЕЛЕГРАМА + '" width="52" height="52" ' +
        'alt="Telegram" loading="lazy">';
    }
    if (!ПОКАЗЫВАТЬ_МАКС || !тг || своя) return 0;
    var а = document.createElement('a');
    а.className = 'sndw2-mess-btn sndw2-mess-mx';
    а.setAttribute('href', МАКС);
    а.setAttribute('target', '_blank');
    а.setAttribute('rel', 'noopener');
    а.setAttribute('aria-label', 'Написать в MAX');
    а.innerHTML = знакМакс();
    тг.insertAdjacentElement('afterend', а);
    return 1;
  }


  /* Ссылка MAX в подвале — рядом с текстовой ссылкой «Telegram» -------- */
  function ссылкаМаксВПодвал() {
    var тг = null;
    [].slice.call(document.querySelectorAll('a[href*="t.me/"]')).forEach(function (a) {
      if (тг) return;
      if ((a.textContent || '').trim().toLowerCase() !== 'telegram') return;
      тг = a;
    });
    if (!тг || !тг.parentNode) return 0;
    var своя = тг.parentNode.querySelector('a[href*="max.ru/"]');
    if (своя) {
      if (!ПОКАЗЫВАТЬ_МАКС) { своя.parentNode.removeChild(своя); return 0; }
      своя.setAttribute('href', МАКС);
      return 0;
    }
    if (!ПОКАЗЫВАТЬ_МАКС) return 0;
    var а = тг.cloneNode(true);
    а.textContent = 'MAX';
    а.setAttribute('href', МАКС);
    а.setAttribute('target', '_blank');
    а.setAttribute('rel', 'noopener');
    а.setAttribute('aria-label', 'Написать в MAX');
    тг.insertAdjacentElement('afterend', а);
    return 1;
  }


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

  /* ---------- Бойцовский клуб: форма "Хочу попробовать бесплатно" (30.09.2026) ----
   * Ольга нашла три дефекта у кнопки/полей формы блока rec1523000501 на
   * /fightclub: 1) текст кнопки светлый на жёлтом фоне; 2) кнопка не по
   * центру контейнера формы; 3) у полей «Имя»/«Телефон» нет отступа слева.
   * Разведка Playwright 30.09 показала: родная настройка Тильды для текста
   * кнопки УЖЕ верная (color:#101010) — её перекрашивает main.js инлайном
   * с !important ПОСЛЕ загрузки (видит золотой градиент кнопки как «тёмный
   * фон» — тот же баг, что 16.09 на /bogoroditsk, см. память
   * tilda-project-script-repaints-buttons). Сам main.js трогать нельзя —
   * общий с московским сайтом. Чиним тем же приёмом: свой инлайн
   * !important поверх, переустанавливаем в том же стороже 1,5с x N, что
   * уже борется с перерисовками main.js ниже. Центрирование и отступы
   * полей main.js не трогает — их можно поставить один раз, но для
   * единообразия идут через ту же функцию (присвоение идемпотентно).
   *
   * ДОБАВЛЕНО 30.09.2026 вечером: центрирование margin:auto само по себе
   * не было сломано — Playwright-проверка (16 циклов перезагрузки, WebKit
   * 390px + Chromium 1440px, до 16с и после scroll) показала, что после
   * применения кнопка держит центр стабильно. Сломан был ТАЙМИНГ: Тильда
   * достраивает этот блок формы уже ПОСЛЕ готово() (DOMContentLoaded-
   * эквивалента), поэтому первый вызов функции промахивается мимо ещё не
   * отрисованного блока, а следующая попытка была только на первом тике
   * медленного стража ниже (setInterval 1500мс) — то есть кнопка реально
   * висела узкой и прижатой влево ~0.9–1.2с на КАЖДОЙ загрузке. Ольга
   * видела именно это окно на живом iPhone, не финальное состояние.
   * Исправление двойное: 1) кнопка растягивается на 100% ширины формы
   * (```width:100% !important```) вместо фикс. 230px + margin:auto — это
   * не требует центрирования вообще, ширина всегда = ширине полей, что
   * надёжнее произвольных вычислений отступа; 2) окно в ~1.2с до первого
   * исправления закрыто быстрым опросом ниже (каждые 100мс, до 3с), а не
   * ожиданием редкого 1.5с стража. */
  function формаБойцовскогоКлуба() {
    var путь = location.pathname.replace(/\/+$/, '');
    if (путь !== '/fightclub') return false;
    var блок = document.getElementById('rec1523000501');
    if (!блок) return false;

    var текстКнопки = блок.querySelectorAll('.t-submit .t-submit__text');
    [].slice.call(текстКнопки).forEach(function (el) {
      el.style.setProperty('color', '#101010', 'important');
    });

    var кнопка = блок.querySelector('.t-submit');
    var применено = false;
    if (кнопка) {
      // Ширина 100% вместо фикс. 230px + margin:auto — кнопка всегда
      // вровень с полями «Имя»/«Телефон», без вычисления центрирующего
      // отступа и без риска, что он разойдётся при смене ширины формы.
      кнопка.style.setProperty('width', '100%', 'important');
      кнопка.style.marginLeft = '0px';
      кнопка.style.marginRight = '0px';
      применено = true;
    }

    var поля = блок.querySelectorAll('.t-input-group .t-input');
    [].slice.call(поля).forEach(function (el) {
      el.style.setProperty('padding-left', '14px', 'important');
      el.style.setProperty('padding-right', '14px', 'important');
      el.style.setProperty('box-sizing', 'border-box', 'important');
    });

    return применено;
  }



  /* 02.10.2026 · /fightclub, /coaches, /contacts: мёртвый оффер «карта»
   * → «Хочу лучшие условия». На /coaches и /contacts найден 02.10 живым
   * рендером (в отчётах их не было): кнопки, попап и пункт меню.
   *
   * Почему через c.js, а не правкой в Тильде: тексты живут в Zero-блоках
   * (шапка rec1549265081, нижний rec1549264051) и в попапе T702
   * (rec1549265151). Их правка в визуальном редакторе заново собирает
   * страницу и рискует вернуть хрупкий фикс зависшего transform (30.09,
   * мобильный разъезд 140px). Здесь меняем только текст, геометрию не
   * трогаем вовсе.
   *
   * Ольга: «публикуй» 02.10.2026. Основание и карта блоков:
   * Сандов Фитнес\АНАЛИЗЫ-И-СТРАТЕГИЯ\Fightclub-мёртвый-оффер-карта-правок.md
   * Тексты прошли content-compliance-critic 02.10.2026 (ПРОПУСТИТЬ). */
  function офферГодВПодарок() {
    var путь = location.pathname.replace(/\/+$/, '').toLowerCase();
    // 02.10.2026: тот же мёртвый оффер «карта» живёт и на /coaches, и на
    // /contacts (найдено живым рендером). Список явный — правило 0б.
    if (['/fightclub', '/coaches', '/contacts'].indexOf(путь) === -1) return false;

    var карта = {
      'ПОЛУЧИТЬ КАРТУ': 'ЗАПИСАТЬСЯ',
      'ЗАБРАТЬ СВОЮ КАРТУ': 'ХОЧУ ЛУЧШИЕ УСЛОВИЯ',
      'Забери карту': 'Сейчас в клубе Black Friday',
      'Забрать свою карту': 'Хочу лучшие условия',
      'Карта с 100% CASH-BACK и персональная скидка до 45%': 'Сейчас в клубе Black Friday',
      'Введите свои контакты и мы вам перезвоним':
        'Оставьте контакты — менеджер позвонит, ответит на вопросы и подберёт удобное время первого занятия.',
      'Sandow Fitness Club © 2019-2024': 'Сандов Фитнес'
    };

    var заменено = 0;
    var все = document.querySelectorAll('body *');
    [].slice.call(все).forEach(function (el) {
      if (el.children.length) return;                    // только листья
      if (el.closest('script, style, noscript')) return;
      var т = (el.textContent || '').trim();
      if (Object.prototype.hasOwnProperty.call(карта, т)) {
        el.textContent = карта[т];
        заменено++;
      }
    });

    // доступность попапа: заголовок в aria-label
    ['#rec1549265151', '#rec1549249221', '#rec1549274891'].forEach(function (селектор) {
      var попап = document.querySelector(селектор + ' .t-popup');
      if (попап) попап.setAttribute('aria-label', 'Хочу лучшие условия');
    });

    return заменено > 0;
  }


  /* 02.10.2026 · /bogoroditsk: цель Метрики «клик по тарифу».
   *
   * Заявки второго клуба теперь считаются целью bogoroditsk_lead_sent
   * (создана в счётчике 111438633 02.10.2026 по решению Ольги), а намерение
   * оплатить — клик по «Оформить тариф →» / «Оплатить онлайн →» — не
   * считалось нигде. Цель bogoroditsk_tarif_click уже создана; здесь её
   * событие. Слушатель на документе: кнопки тарифов рисуются скриптом
   * страницы позже и перерисовываются, поэтому делегирование надёжнее
   * навешивания обработчиков на конкретные элементы.
   *
   * Гейт по pathname обязателен (правило 0б): на московских страницах
   * функция выходит сразу и ничего не делает. */
  function богородицкТариф() {
    var путь = location.pathname.replace(/\/+$/, '');
    if (путь !== '/bogoroditsk') return false;
    if (window.__sndwBogTarif) return true;
    window.__sndwBogTarif = true;
    document.addEventListener('click', function (e) {
      var t = e.target;
      var цель = (t && t.closest) ? t.closest('.sndw2-price-cta, .sndw2-lk, .sndw2-pay') : null;
      if (!цель) return;
      try {
        if (window.ym) ym(111438633, 'reachGoal', 'bogoroditsk_tarif_click');
      } catch (err) {}
    }, true);
    return true;
  }

  /* 02.10.2026 · снять устаревшую разметку организации (блок от 13.08.2026).
   *
   * На 14 страницах домена в head лежит старый JSON-LD с нарушениями правил
   * клуба: латиница «SANDOW FITNESS» в alternateName, адрес «29/33»,
   * «зона отдыха», priceRange и бассейн. Блок байт-в-байт одинаков и живёт
   * на уровне страницы (head проекта чист), добраться до него в редакторе
   * пока не вышло — поэтому снимаем на клиенте.
   *
   * Граница метода: это видят краулеры, исполняющие JS (Google, Яндекс),
   * и не видят те, кто не исполняет (GPTBot, ClaudeBot, PerplexityBot).
   * Серверное удаление блока остаётся отдельной задачей.
   *
   * Сигнатура точная: удаляем только блоки с «SANDOW» (латиница), «29/33»
   * (старый адрес) или «зона отдыха». У корректных блоков главной,
   * /fightclub и /bogoroditsk этих строк нет — их не трогаем.
   * Вызов — после гейта чужойПроект(), правило 0б соблюдено. */
  function снятьУстаревшуюРазметку() {
    var ПРИЗНАКИ = ['SANDOW', '29/33', 'зона отдыха'];
    var скрипты = document.querySelectorAll('script[type="application/ld+json"]');
    var снято = 0;
    for (var i = скрипты.length - 1; i >= 0; i--) {
      var текст = скрипты[i].textContent || '';
      for (var j = 0; j < ПРИЗНАКИ.length; j++) {
        if (текст.indexOf(ПРИЗНАКИ[j]) !== -1) {
          скрипты[i].parentNode.removeChild(скрипты[i]);
          снято++;
          break;
        }
      }
    }
    return снято;
  }

  try { снятьУстаревшуюРазметку(); } catch (e) {}

  /* 22.11.2026 · шапка на узком телефоне -----------------------------------
   *
   * Ольга, 22.11.2026: «на телефоне на хиро московского сайта съехали вправо
   * кнопки, надо центровать». Замер живого сайта: на ширине 320 px кнопка
   * меню стоит на 334…376 px — то есть ЦЕЛИКОМ за правым краем экрана, до неё
   * не добраться; на 360 px она обрезана на 16 px. Причина — шапка не сжимает
   * надпись «САНДОВ ФИТНЕС»: логотип 213 px, телефон 40, заморозка 33, меню 42
   * и отступы дают 380 px при экране 320.
   *
   * Лечим сжатием, а не прятаньем: на узком экране мельче надпись и знак,
   * меньше отступы. Совсем узкий экран (до 340 px) дополнительно убирает
   * значок «Заморозка» — та же ссылка есть в меню-гамбургере, ничего не
   * теряется. Замер после правки — 320/344/360/375/390/414 px: ничего не
   * выходит за край.
   *
   * Вызов — после гейта чужойПроект(), правило 0б соблюдено.
   */
  function узкаяШапка() {
    if (document.getElementById('sndw-uzkaya-shapka')) return 0;
    // !important здесь обязателен: стили шапки лежат не в head, а ВНУТРИ
    // страницы Тильды, то есть ниже по документу. При равном весе селекторов
    // побеждает тот, что ниже, — проверено замером 22.11.2026: без !important
    // размеры оставались прежними (надпись 14,5 px, отступы 14 px).
    var стиль = document.createElement('style');
    стиль.id = 'sndw-uzkaya-shapka';
    стиль.textContent =
      '@media (max-width:380px){' +
      '#sndw2-nav .sndw2-nav-in{padding:0 10px !important;gap:6px !important}' +
      '#sndw2-nav .sndw2-nav-logo{gap:6px !important;font-size:10.5px !important}' +
      '#sndw2-nav .sndw2-nav-emb{height:22px !important}' +
      '#sndw2-nav .sndw2-nav-word{font-size:10.5px !important;letter-spacing:.03em !important}' +
      '#sndw2-nav .sndw2-nav-tel{padding:9px !important}' +
      '#sndw2-nav .sndw2-nav-freeze{width:30px !important;height:30px !important}' +
      '#sndw2-nav .sndw2-nav-freeze svg{width:16px !important;height:16px !important}' +
      '#sndw2-nav .sndw2-nav-burger{margin-left:2px !important;padding:8px 6px !important}' +
      '}' +
      '@media (max-width:340px){' +
      '#sndw2-nav .sndw2-nav-freeze{display:none !important}' +
      '}';
    (document.head || document.documentElement).appendChild(стиль);
    return 1;
  }

  готово(function () {
    try { узкаяШапка(); } catch (e) {}
    try { фавикон(); } catch (e) {}
    try { единый_телеграм(); } catch (e) {}
    try { единый_макс(); } catch (e) {}
    try { иконкаМаксВМессенджерах(); } catch (e) {}
    try { ссылки_в_подвал(); } catch (e) {}
    try { ссылкаМаксВПодвал(); } catch (e) {}
    try { липкая_панель(); } catch (e) {}
    try { кнопкаПервогоЭкрана(); } catch (e) {}
    try { панель_пк(); } catch (e) {}
    try { первый_экран(); } catch (e) {}
    try { выборМессенджера(); } catch (e) {}
    try { выборВДоке(); } catch (e) {}
    try { строка_доверия(); } catch (e) {}
    try { формаБойцовскогоКлуба(); } catch (e) {}
    try { офферГодВПодарок(); } catch (e) {}
    try { снятьУстаревшуюРазметку(); } catch (e) {}
    // Блок формы rec1523000501 на /fightclub Тильда достраивает уже
    // ПОСЛЕ готово() — вызов выше почти всегда промахивается мимо ещё не
    // отрисованного блока. Ждать медленный 1.5с сторож ниже означало, что
    // кнопка реально висела узкой/смещённой ~1-1.2с на каждой загрузке
    // (подтверждено Playwright 30.09.2026). Добиваем быстрым опросом:
    // каждые 100мс, максимум 3с, останавливаемся, как только применилось.
    (function () {
      var попыток = 0;
      var быстрыйОпрос = setInterval(function () {
        var применено = false;
        try { применено = формаБойцовскогоКлуба(); } catch (e) {}
        if (применено || ++попыток > 30) clearInterval(быстрыйОпрос);
      }, 100);
    })();
    // Тильда достраивает блоки после загрузки — ждём, иначе .t-rec ещё нет
    setTimeout(function () { try { якоря(); } catch (e) {} }, 1200);
    // подвал рисуется одним из последних — повторяем, когда он уже есть
    setTimeout(function () { try { ссылки_в_подвал(); } catch (e) {} }, 2000);
    setTimeout(function () { try { ссылкаМаксВПодвал(); } catch (e) {} }, 2100);
    // плавающий блок мессенджеров Тильда тоже достраивает позже
    setTimeout(function () { try { иконкаМаксВМессенджерах(); } catch (e) {} }, 2200);
    setTimeout(function () { try { первый_экран(); } catch (e) {} }, 1400);
    setTimeout(function () { try { выборМессенджера(); } catch (e) {} }, 1500);
    setTimeout(function () { try { выборВДоке(); } catch (e) {} }, 1600);
    // Единый слой сайта (main.js) пересобирает первый экран шесть раз
    // с интервалом 1,5 с — и затирает строку доверия. Восстанавливаем,
    // пока он это делает: дешевле, чем встраиваться в его цикл.
    var восстановлений = 0;
    var сторож = setInterval(function () {
      try {
        первый_экран();
        выборМессенджера();
        выборВДоке();
        строка_доверия();
        единый_телеграм();
        единый_макс();
        иконкаМаксВМессенджерах();
        формаБойцовскогоКлуба();
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
    window.addEventListener('load', function () {
      setTimeout(function () { try { ссылкаБогородицк(); } catch (e) {} }, 350);
    });

    window.addEventListener('load', function () {
      setTimeout(function () { try { ссылкиНаЛендинги(); } catch (e) {} }, 300);
    });

    window.addEventListener('load', function () {
      setTimeout(function () { try { разметкаОтзывов(); } catch (e) {} }, 300);
    });

    // Оффер «Сейчас в клубе Black Friday»: Zero-блоки и попап Тильда достраивает позже,
    // поэтому догоняем тремя попытками (текст, геометрия не трогается).
    window.addEventListener('load', function () {
      [300, 1200, 2600].forEach(function (з) {
        setTimeout(function () { try { офферГодВПодарок(); } catch (e) {} }, з);
      });
    });

    // Одна пилюля в конце главной. Оффер и подвал Тильда дорисовывает
    // поздно, поэтому три попытки: секция встаёт, как только оффер есть.
    [1200, 2600, 5200].forEach(function (з) {
      setTimeout(function () { try { однаПилюля(); } catch (e) {} }, з);
    });

    // Сворачивание подвала — ПОСЛЕ всех дорисовок ссылок (самая поздняя —
    // повтор ссылки_в_подвал на 2000 мс). Второй вызов доносит отставшие.
    window.addEventListener('load', function () {
      setTimeout(function () { try { свернутьПодвал(); } catch (e) {} }, 2600);
      setTimeout(function () { try { свернутьПодвал(); } catch (e) {} }, 4500);
      // сворачивание подвала перестраивает список ссылок — MAX возвращаем
      // после него, иначе пара «Telegram / MAX» распадается
      setTimeout(function () { try { ссылкаМаксВПодвал(); } catch (e) {} }, 2900);
      setTimeout(function () { try { ссылкаМаксВПодвал(); } catch (e) {} }, 4800);
    });

  });
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
  // A phone tap is the only honest trace left when the call-tracking number is off.
  var lastPhoneClick = 0;
  function recordPhoneClick(a) {
    var now = Date.now();
    if (now - lastPhoneClick < 10000) return;   // one tap per ten seconds is enough
    lastPhoneClick = now;
    var data = fields(null);
    data.at = new Date(now).toISOString();
    data.page = page(location.href) || '';
    try {
      if (typeof w.fetch !== 'function') return;
      w.fetch(pointerEndpoint.replace('/lead-journey', '/phone-click'), {method: 'POST', mode: 'cors',
        credentials: 'omit', keepalive: true, headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(data)}).catch(function () {});
    } catch (_) {}
  }
  function phoneAnchorFrom(e) {
    var path = (e && e.composedPath && e.composedPath()) || [];
    for (var i = 0; i < path.length; i++) {
      var n = path[i];
      if (n && n.tagName === 'A' && /^tel:/i.test(String(n.getAttribute('href') || ''))) return n;
    }
    return null;
  }
  d.addEventListener('click', function (e) {
    var tel = phoneAnchorFrom(e);
    if (tel) recordPhoneClick(tel);
  }, true);
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
