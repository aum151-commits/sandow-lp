/* Точки действия на sandowfitness.ru — под лидогенерацию. 18.09.2026.
 *
 * Почему отдельным файлом: head-код проекта Тильды занят на 49 912 знаков
 * из 50 000, туда помещается только строка подключения.
 *
 * Что делает:
 *   1. favicon 120x120 — рекомендация Яндекс.Вебмастера от 11.02.2026;
 *   2. (снято 19.09) подпись с номером в шапке — на десктопе номер там
 *      уже есть своей кнопкой, вышел дубль; на мобильном работает панель;
 *   3. липкая панель внизу на мобильном: «Позвонить» и «План тренировок в подарок»;
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
    if (document.getElementById('sndw-bog-faq')) return;
    var s = document.createElement('script');
    s.type = 'application/ld+json';
    s.id = 'sndw-bog-faq';
    s.textContent = "{\"@context\": \"https://schema.org\", \"@type\": \"FAQPage\", \"@id\": \"https://sandowfitness.ru/bogoroditsk/#faq\", \"mainEntity\": [{\"@type\": \"Question\", \"name\": \"Когда открывается клуб в Богородицке?\", \"acceptedAnswer\": {\"@type\": \"Answer\", \"text\": \"Открытие — 2026 год, клуб готовится в ТЦ «МегаБум» (Заводской проезд, 6А). Оставьте заявку на странице — сообщим об открытии первыми.\"}}, {\"@type\": \"Question\", \"name\": \"Какой режим работы будет у клуба?\", \"acceptedAnswer\": {\"@type\": \"Answer\", \"text\": \"Ежедневно с 7:00 до 23:00.\"}}, {\"@type\": \"Question\", \"name\": \"Что будет в клубе?\", \"acceptedAnswer\": {\"@type\": \"Answer\", \"text\": \"Тренажёрный зал от 700 м² на двух уровнях: силовые тренажёры, свободные веса, кардиотренажёры, душевые и раздевалки. Групповые программы будут — их состав сейчас определяется.\"}}, {\"@type\": \"Question\", \"name\": \"Как оплачивается членство?\", \"acceptedAnswer\": {\"@type\": \"Answer\", \"text\": \"Помесячная подписка без годовой карты: оплата раз в месяц, отменить можно в любой месяц. Тарифы — на этой странице.\"}}, {\"@type\": \"Question\", \"name\": \"Это тот же «Сандов Фитнес», что в Москве?\", \"acceptedAnswer\": {\"@type\": \"Answer\", \"text\": \"Да, это второй клуб сети «Сандов Фитнес» — московский клуб работает с 2017 года. Форматы, режим работы и условия у клубов разные.\"}}]}";
    document.head.appendChild(s);
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
      '@media (max-width:479px){#sndw-bar{flex-wrap:wrap;gap:6px}' +
      '#sndw-bar a{box-sizing:border-box}' +
      '#sndw-bar .sndw-lead{flex:1 0 100%;width:100%;max-width:100%}' +
      'body{padding-bottom:140px}}' +
      // на самых узких (360 px) обе иконки ужимаются до 44 px — запас на
      // случай, когда в первой строке окажется три элемента
      '@media (max-width:380px){#sndw-bar .sndw-tg,#sndw-bar .sndw-mx{' +
      'flex:0 0 44px;width:44px}' +
      '#sndw-bar .sndw-знак{width:28px;height:28px}}' +
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
        '<img class="sndw-знак" src="' + ЗНАК_ТЕЛЕГРАМА + '" width="28" height="28" ' +
        'alt="Telegram" loading="lazy"></a>'
      : '';
    // MAX — сразу за Телеграмом (задача Ольги 14.10.2026), тот же размер,
    // чтобы пара читалась как одна группа
    var макс = ПОКАЗЫВАТЬ_МАКС
      ? '<a class="sndw-mx" href="' + МАКС + '" target="_blank" rel="noopener" ' +
        'aria-label="Написать в MAX">' + знакМакс() + '</a>'
      : '';
    панель.innerHTML =
      тг + макс +
      '<a class="sndw-call" href="tel:' + ТЕЛЕФОН + '">Позвонить</a>' +
      '<a class="sndw-lead" href="#sndw-form">План тренировок в подарок</a>';
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
   * при раскрытии («Забрать план») вместо полей имени и телефона показываем
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
        if (выбор) выбор.style.display = 'none';
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
    // Куда вести человека по кнопке «План тренировок в подарок». Панель выбора
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
        '<p>Перезвоним и договоримся о времени визита</p>' +
        '<a href="#sndw-form">Забрать план</a>';
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
          var поле = ф.querySelector('input[type="tel"],input[name*="hone"],input[name*="el"]');
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
        'border:1px solid rgba(233,199,126,.28);' +
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
        '.t-form[data-sndw-choice="1"][data-sndw-mode="phone"]{display:block !important}';
      document.head.appendChild(стиль);
    }

    var панель = document.createElement('div');
    панель.id = 'sndw-choice';
    панель.innerHTML =
      '<div class="sndw-choice-q">Как удобнее продолжить?</div>' +
      '<a class="sndw-choice-btn sndw-choice-tg" href="' + ВХОД_В_БОТ + '"' +
      ' target="_blank" rel="noopener">' +
      '<img src="' + ЗНАК_ТЕЛЕГРАМА + '" alt="Telegram" loading="lazy">' +
      '<span>Написать в Telegram</span></a>' +
      '<a class="sndw-choice-btn sndw-choice-mx" href="' + МАКС + '"' +
      ' target="_blank" rel="noopener">' +
      '<img src="' + ЗНАК_МАКСА + '" alt="MAX" loading="lazy">' +
      '<span>Написать в MAX</span></a>' +
      '<button type="button" class="sndw-choice-phone">или оставьте номер — перезвоним</button>';
    // Ставим ПЕРЕД формой, а не внутрь неё: внутри на мобильной версии Тильды
    // блок попадал в обёртку 206 px и обрезался (найдено 15.10.2026 по снимку Ольги).
    форма.parentNode.insertBefore(панель, форма);

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
    var НОВЫЕ = [["/personalnye-trenirovki-moskva/","Персональные тренировки"],["/fitnes-dlya-zhenshchin-moskva/","Фитнес для женщин"],["/mma-i-greppling-moskva/","ММА и грэпплинг"],["/boks-metro-nizhegorodskaya/","Бокс"],["/kikboksing-moskva/","Кикбоксинг"],["/boks-dlya-zhenshchin-moskva/","Бокс для женщин"],["/zumba-moskva/","Зумба"],["/yoga-moskva/","Йога"],["/rastyazhka-moskva/","Растяжка"],["/zdorovaya-spina/","Здоровая спина"],["/tyazhelaya-atletika-moskva/","Тяжёлая атлетика"],["/fitness-klub-s-saunoy-moskva/","Клуб с сауной"],["/sportivny-klub-moskva/","Спортивный клуб"]];
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
   * → «План тренировок в подарок». На /coaches и /contacts найден 02.10 живым
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
      'ЗАБРАТЬ СВОЮ КАРТУ': 'ЗАБРАТЬ ПЛАН',
      'Забери карту': 'План тренировок в подарок',
      'Забрать свою карту': 'Забрать план',
      'Карта с 100% CASH-BACK и персональная скидка до 45%': 'План тренировок в подарок',
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
      if (попап) попап.setAttribute('aria-label', 'План тренировок в подарок');
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

  готово(function () {
    try { фавикон(); } catch (e) {}
    try { единый_телеграм(); } catch (e) {}
    try { единый_макс(); } catch (e) {}
    try { иконкаМаксВМессенджерах(); } catch (e) {}
    try { ссылки_в_подвал(); } catch (e) {}
    try { ссылкаМаксВПодвал(); } catch (e) {}
    try { липкая_панель(); } catch (e) {}
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

    // Оффер «План тренировок в подарок»: Zero-блоки и попап Тильда достраивает позже,
    // поэтому догоняем тремя попытками (текст, геометрия не трогается).
    window.addEventListener('load', function () {
      [300, 1200, 2600].forEach(function (з) {
        setTimeout(function () { try { офферГодВПодарок(); } catch (e) {} }, з);
      });
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
