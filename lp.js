/* Общий скрипт для lp.sandowfitness.ru — 19.09.2026.
 *
 * До него каждая из 128 страниц жила сама по себе: ни одна не подключала
 * favicon, и Яндекс.Вебмастер с 03.09 держал три рекомендации подряд
 * («файл favicon недоступен роботу», «нет favicon 120×120»). За последнее
 * обновление поиска из индекса ушли 4 страницы, добавились 0.
 *
 * Второе: в поиске у лендингов живут только статьи («что лучше бокс или
 * кикбоксинг» — 51 показ). Призывы на страницах есть, но кончаются рано:
 * замер на статье высотой 9304 px показал последнюю форму на 5656 —
 * дальше 39% текста идут без единой точки действия. Блок ниже ставится
 * только там, где хвост без призыва длиннее 22% страницы.
 *
 * Откат: удалить строку подключения из страниц (или поставить
 * ПОКАЗЫВАТЬ_БЛОК = false и перезалить файл — блок исчезнет, favicon
 * останется).
 */
(function () {
  'use strict';

  var ПОКАЗЫВАТЬ_БЛОК = true;
  var БАЗА = 'https://lp.sandowfitness.ru/';
  var ТЕЛЕФОН = '+74957956957';
  var ЗОЛОТО = '#E9C77E';
  var ТЁМНЫЙ = '#0B0906';

  function фавикон() {
    if (document.querySelector('link[rel*="icon"]')) return;
    [{ rel: 'icon', sizes: '120x120', href: БАЗА + 'favicon-120.png' },
     { rel: 'icon', sizes: '32x32', href: БАЗА + 'favicon-32.png' },
     { rel: 'apple-touch-icon', sizes: '120x120', href: БАЗА + 'favicon-120.png' }
    ].forEach(function (о) {
      var l = document.createElement('link');
      l.rel = о.rel;
      l.type = 'image/png';
      l.sizes = о.sizes;
      l.href = о.href;
      document.head.appendChild(l);
    });
  }

  function блок_в_конце() {
    if (!ПОКАЗЫВАТЬ_БЛОК) return;
    if (document.getElementById('sndw-lp-cta')) return;

    // Призывы на страницах есть (формы «Попросить перезвонить» и кнопки
    // «Позвонить и записаться»), но замер показал: на статье высотой
    // 9304 px последний из них стоит на 5656 — дальше 39% текста идут
    // без единой точки действия. Блок ставим только в этом случае.
    var высота = document.documentElement.scrollHeight;
    if (!высота) return;
    var точки = [].slice.call(document.querySelectorAll('form,a,button')).filter(function (e) {
      var t = (e.innerText || '').trim();
      var r = e.getBoundingClientRect();
      return r.height > 0 && (e.tagName === 'FORM' ||
             /позвон|запис|заяв|подар|пробн|перезвон/i.test(t));
    });
    var последняя = 0;
    точки.forEach(function (e) {
      var низ = e.getBoundingClientRect().bottom + window.scrollY;
      if (низ > последняя) последняя = низ;
    });
    // хвост меньше четверти страницы — призыв и так рядом, не мешаем
    if (последняя > высота * 0.78) return;

    var стиль = document.createElement('style');
    стиль.textContent =
      '#sndw-lp-cta{margin:36px auto 28px;max-width:720px;padding:26px 22px;' +
      'border:1px solid rgba(233,199,126,.35);border-radius:18px;background:' + ТЁМНЫЙ + ';' +
      'font-family:Arial,sans-serif;text-align:center}' +
      '#sndw-lp-cta .sndw-h{color:#F0EADE;font:700 20px/1.3 Arial,sans-serif;margin:0 0 8px}' +
      '#sndw-lp-cta .sndw-p{color:#9A8F7C;font:400 15px/1.5 Arial,sans-serif;margin:0 0 18px}' +
      '#sndw-lp-cta a{display:inline-block;padding:15px 28px;border-radius:26px;' +
      'background:' + ЗОЛОТО + ';color:' + ТЁМНЫЙ + ';font:700 16px Arial,sans-serif;' +
      'text-decoration:none}' +
      '#sndw-lp-cta .sndw-sub{display:block;margin-top:12px;color:#9A8F7C;' +
      'font:400 13px Arial,sans-serif}' +
      '#sndw-lp-cta .sndw-site{display:inline-block;margin-top:14px;padding:0;' +
      'background:none;color:' + ЗОЛОТО + ';font:600 14px Arial,sans-serif;' +
      'text-decoration:underline;text-underline-offset:3px}';
    document.head.appendChild(стиль);

    // заголовок подбираем под тему статьи — так призыв не выглядит чужим
    var текст = (document.title || '') + ' ' + (document.body.innerText || '').slice(0, 2000);
    var заголовок = 'Приходите в клуб на Нижегородской';
    var описание = 'Тренажёрный зал 1100 м², групповые программы, бойцовский клуб ' +
                   'и финская сауна. Клуб 2500 м², работаем круглосуточно.';
    if (/бокс|кикбокс|единоборств|мма|октагон/i.test(текст)) {
      заголовок = 'Бойцовский клуб 500 м² на Нижегородской';
      описание = 'Октагон, татами и семь мешков. Кикбоксинг по четвергам. ' +
                 'Приходить можно одному или с друзьями.';
    } else if (/спина|осанк|поясниц|грыж|реабилит/i.test(текст)) {
      заголовок = 'Здоровая спина — в клубе на Нижегородской';
      описание = 'Групповые программы для спины идут по расписанию в трёх залах. ' +
                 'Клуб 2500 м², работаем круглосуточно.';
    } else if (/похуд|сушк|калори|жир|масса тела/i.test(текст)) {
      заголовок = 'Начните в клубе на Нижегородской';
      описание = 'Тренажёрный зал 1100 м², групповые программы и персональные ' +
                 'тренировки. Клуб 2500 м², работаем круглосуточно.';
    }

    var б = document.createElement('div');
    б.id = 'sndw-lp-cta';
    б.innerHTML =
      '<p class="sndw-h">' + заголовок + '</p>' +
      '<p class="sndw-p">' + описание + '</p>' +
      '<a href="tel:' + ТЕЛЕФОН + '">Позвонить и записаться</a>' +
      '<span class="sndw-sub">+7 (495) 795-69-57</span>' +
      // Ссылка на основной сайт: для человека — куда посмотреть подробнее,
      // для Google — связь поддомена с основным доменом. Сейчас с лендинга
      // на sandowfitness.ru ведёт одна ссылка на всю страницу.
      '<a class="sndw-site" href="https://sandowfitness.ru/">Смотреть клуб на сайте</a>';

    var куда = document.querySelector('main') || document.querySelector('article') ||
               document.body;
    куда.appendChild(б);
  }

  function готово(что) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', что);
    } else {
      что();
    }
  }

  готово(function () {
    try { фавикон(); } catch (e) {}
    try { блок_в_конце(); } catch (e) {}
  });
})();
