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
  var ПОКАЗЫВАТЬ_ФОРМУ_В_HERO = true;
  var БАЗА = 'https://lp.sandowfitness.ru/';
  var ТЕЛЕФОН = '+74957956957';
  var ПРИЁМ = 'https://sandow-emergency-leads.pages.dev/site-lead';
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

  /* Форма в первом экране коммерческих посадочных.
   *
   * Замер 20.09.2026: 12 страниц под запросы («фитнес Текстильщики» 59
   * визитов, «бойцовский клуб Москва» 26, «налоговый вычет» 26 и ещё
   * девять) дали за 28 дней 191 визит и НОЛЬ лидов. Статьи на том же
   * поддомене при таком же трафике дают 10–40%. Разница видна на
   * рендере: на коммерческих первая форма стоит после 54–64% прокрутки
   * (у «Текстильщиков» — 6629 px при высоте 12 264), а в первом экране
   * только «Позвонить» и «Написать в Телеграм» — поля, куда оставить
   * номер, нет вообще. На главной сайта форма стоит сразу, и главная
   * даёт 12,3%.
   *
   * Что здесь НЕ делается: ничего не убирается. Заголовок, описание,
   * блок подарка и обе кнопки остаются на местах — требование Ольги
   * 20.09: «чтобы было чем заинтересовать на hero, а не только форма».
   * Добавляются строка доверия и два поля.
   *
   * Цифры строки доверия: 4,6 и 1089 оценок — замер Яндекс.Карт
   * 17.09.2026, МАРКЕТИНГ-СИСТЕМА\Сбор-оценок\КАК-СОБИРАТЬ-ОЦЕНКИ.md.
   * НЕ путать с кабинетом Яндекс Бизнеса: там 603 — это отзывы с
   * текстом, другая величина (оценку ставят и без текста, поэтому их
   * больше). Писать «более 1000 оценок» верно, «более 1000 отзывов» —
   * ложь. Не «поправлять» это число на 603.
   *
   * Текст кнопки подбирается под оффер конкретной страницы. Так надо,
   * потому что подарки на страницах разные: на боксовых в первом экране
   * «первое занятие боксом в подарок», на фитнес-страницах «5
   * персональных тренировок», а на части страниц подарка нет вообще.
   * Одна кнопка на всех давала бы два разных обещания на одном экране —
   * ровно то, что раздел 5 CLAUDE.md называет обещанием, которого
   * воронка не выполнит.
   *
   * Отправка идёт на тот же приёмник, что и нижняя форма страницы, —
   * Cloudflare, оттуда в группу менеджеров и в 1С. Свой обработчик, а
   * не чужой initQuickForms: тот привязывается к формам один раз при
   * загрузке, и наша появляется позже.
   *
   * Откат: ПОКАЗЫВАТЬ_ФОРМУ_В_HERO = false и перезалить файл.
   */
  /* Что обещает кнопка — берём из первого экрана самой страницы.
   *
   * Проверено критиком 20.09 на 19 живых страницах: на боксовых в hero
   * стоит «Первое занятие боксом — в подарок» (и повторяется по 4–5 раз
   * ниже), на фитнес-страницах «5 персональных тренировок — в подарок»,
   * а на «Разовое посещение» подарка нет вовсе — там платный визит.
   * Кнопка «Забрать 5 тренировок» на боксовой странице означала бы два
   * разных подарка рядом, а на странице разового визита — подарок из
   * ниоткуда. Где оффера нет, кнопка нейтральная и ничего не обещает.
   */
  function что_обещает(экран) {
    var т = (экран.innerText || '').toLowerCase();
    var есть_подарок = т.indexOf('подар') >= 0 || т.indexOf('дарим') >= 0;

    if (есть_подарок) {
      // Подарок уже назван в первом экране — повторяем его слово в слово,
      // своего не добавляем.
      if (/5\s*персональн/.test(т) || /пять\s*персональн/.test(т)) {
        return { кнопка: 'Забрать 5 тренировок', оффер: null };
      }
      if (/перв(ое|ая)\s+(занятие|тренировка)/.test(т)) {
        return { кнопка: 'Забрать первое занятие', оффер: null };
      }
      // [а-яё]*, а не \w*: в JS \w — только латиница с цифрами, поэтому
      // «персональные тренировки» этой проверкой НЕ ловились, страница
      // проваливалась дальше и получала свой оффер поверх чужого.
      if (/персональн[а-яё]*\s+тренировк/.test(т)) {
        return { кнопка: 'Забрать тренировку', оффер: null };
      }
    }

    // Подарка в первом экране нет — значит призыв без повода, а это
    // прямой запрет Ольги 20.08: «какой вообще оффер? почему надо
    // позвонить? Повод-то какой?». Ставим повод из канона офферов
    // (утверждён 31.08, кикбоксинг уточнён 13.09), подбирая под тему
    // страницы.
    //
    // Бокс и кикбоксинг разделены намеренно: на страницах про бокс ниже
    // первого экрана 2–4 раза стоит «первое занятие боксом — в подарок»,
    // и общая формулировка про кикбоксинг противоречила бы им. Канон
    // допускает обе — важно, чтобы на одной странице была одна.
    //
    // «мма» в список не берём: в кириллице границы слова (\b) не
    // работают, и подстрока нашлась внутри слова «программа» — страница
    // «Здоровая спина» получила кнопку про единоборства.
    if (/кикбоксинг/.test(т) && !/бокс[^и]/.test(т)) {
      return { кнопка: 'Забрать первое занятие',
               оффер: 'Первое занятие кикбоксингом — в подарок' };
    }
    if (/бокс|единоборств|октагон/.test(т)) {
      return { кнопка: 'Забрать первое занятие',
               оффер: 'Первое занятие боксом — в подарок' };
    }
    if (/разово[ег]|без абонемента|один визит/.test(т)) {
      // Страница про разовый визит: подарок к абонементу здесь означал бы
      // обещание не для того, кто пришёл именно за разовым. Повод даёт
      // сама цена — 990 ₽ входит в число публикуемых (ограниченные
      // форматы), и она уже стоит ниже по этой же странице.
      return { кнопка: 'Записаться на визит',
               оффер: 'Разовое посещение — 990 ₽' };
    }
    return { кнопка: 'Забрать 5 тренировок',
             оффер: '5 персональных тренировок — в подарок' };
  }

  function форма_в_hero() {
    if (!ПОКАЗЫВАТЬ_ФОРМУ_В_HERO) return;
    if (document.getElementById('sndw-hero-form')) return;

    // Две вёрстки первого экрана: у коммерческих посадочных .hero-cta,
    // у страниц-разборов (налоговый вычет, выбор абонемента) .cta-btns
    // внутри .article-hero. Вторые тоже коммерческие и тоже без формы.
    var кнопки = document.querySelector('.hero .hero-cta') ||
                 document.querySelector('.article-hero .cta-btns');
    if (!кнопки) return;
    var экран = кнопки.closest('.hero') || кнопки.closest('.article-hero');
    if (!экран) return;
    // если форма уже есть в первом экране — не трогаем страницу
    if (экран.querySelector('form, input[type="tel"]')) return;

    var обещание = что_обещает(экран);
    var подпись = обещание.кнопка;

    var стиль = document.createElement('style');
    стиль.textContent =
      '#sndw-hero-form{margin:18px 0 0;max-width:460px}' +
      // Строка оффера — крючок и повод позвонить. Выделена рамкой, как
      // блок подарка на страницах, где он есть: человек должен зацепиться
      // за неё раньше, чем за поля.
      '#sndw-hero-form .sndw-offer{margin:0 0 12px;padding:12px 16px;' +
      'border:1px solid rgba(233,199,126,.4);border-radius:14px;' +
      'background:rgba(233,199,126,.07);color:' + ЗОЛОТО + ';' +
      'font:700 17px/1.3 inherit}' +
      '#sndw-hero-form .sndw-trust{display:flex;align-items:center;gap:8px;' +
      'margin:0 0 14px;color:#C9BEA8;font:400 14px/1.2 inherit}' +
      '#sndw-hero-form .sndw-trust b{color:' + ЗОЛОТО + ';font-size:17px}' +
      '#sndw-hero-form .sndw-row{display:flex;gap:8px;flex-wrap:wrap}' +
      '#sndw-hero-form input[type="text"],#sndw-hero-form input[type="tel"]{' +
      'flex:1 1 150px;min-width:0;padding:14px 16px;border-radius:12px;' +
      'border:1px solid rgba(233,199,126,.34);background:rgba(11,9,6,.72);' +
      'color:#F0EADE;font:400 16px inherit;outline:none}' +
      '#sndw-hero-form input::placeholder{color:#8B8272}' +
      '#sndw-hero-form input:focus{border-color:' + ЗОЛОТО + '}' +
      '#sndw-hero-form button{width:100%;margin-top:8px;padding:15px 20px;' +
      'border:0;border-radius:26px;background:' + ЗОЛОТО + ';color:' + ТЁМНЫЙ + ';' +
      'font:700 16px inherit;cursor:pointer}' +
      '#sndw-hero-form button[disabled]{opacity:.6;cursor:default}' +
      // 13px — нижняя граница: согласие не то место, где экономят
      // высоту. Место для кнопки «Позвонить» находим за счёт отступов.
      '#sndw-hero-form .sndw-note{margin:8px 0 0;color:#8B8272;' +
      'font:400 13px/1.35 inherit}' +
      '#sndw-hero-form .sndw-note a{color:#A79A86;text-underline-offset:2px}' +
      '#sndw-hero-form .sndw-say{margin:10px 0 0;font:400 14px inherit;display:none}' +
      '#sndw-hero-form .sndw-hp{position:absolute;left:-9999px;width:1px;height:1px}' +
      // На широком экране hero и без того высокий: заголовок в четыре
      // строки, блок подарка, две кнопки в столбик. Поля и кнопка в один
      // ряд экономят ~80 px и оставляют форму выше сгиба.
      '@media (min-width:1024px){' +
      '#sndw-hero-form{max-width:620px}' +
      '#sndw-hero-form form{display:flex;gap:8px;align-items:stretch}' +
      '#sndw-hero-form .sndw-row{flex:1 1 auto;gap:8px}' +
      '#sndw-hero-form button{width:auto;margin-top:0;flex:0 0 auto;' +
      'padding:14px 22px;white-space:nowrap}}';
    document.head.appendChild(стиль);

    var б = document.createElement('div');
    б.id = 'sndw-hero-form';
    б.innerHTML =
      (обещание.оффер
        ? '<p class="sndw-offer">' + обещание.оффер + '</p>' : '') +
      '<p class="sndw-trust"><b>★ 4,6</b> · более 1000 оценок на Яндекс Картах</p>' +
      '<form novalidate>' +
      '<div class="sndw-row">' +
      '<input type="text" name="name" placeholder="Ваше имя" autocomplete="name">' +
      '<input type="tel" name="phone" placeholder="Телефон" autocomplete="tel" inputmode="tel">' +
      '</div>' +
      '<input class="sndw-hp" type="text" name="company" tabindex="-1" autocomplete="off" aria-hidden="true">' +
      '<button type="submit">' + подпись + '</button>' +
      '</form>' +
      '<p class="sndw-say" role="status"></p>' +
      // Текст согласия — дословно тот же, что у нижней формы этих же
      // страниц: с названной целью обработки и оговоркой про рекламу.
      // Без цели согласие слабее юридически, а два разных текста под
      // двумя формами одной страницы выглядят небрежно.
      '<p class="sndw-note">Нажимая кнопку, вы соглашаетесь на ' +
      '<a href="https://sandowfitness.ru/policy" target="_blank" rel="noopener">' +
      'обработку персональных данных</a> для ответа на обращение. ' +
      'Мы не рассылаем рекламу.</p>';

    // Ставим форму ПЕРЕД кнопками, а не после: замер показал, что после
    // них она падает на 912 px и уходит за сгиб на экране 900. Кнопка
    // «Позвонить» остаётся на месте — звонок по-прежнему главное действие.
    кнопки.parentNode.insertBefore(б, кнопки);

    var форма = б.querySelector('form');
    var кнопка = б.querySelector('button');
    var говорит = б.querySelector('.sndw-say');
    форма.addEventListener('submit', function (е) {
      е.preventDefault();
      var имя = форма.querySelector('input[name="name"]');
      var тел = форма.querySelector('input[name="phone"]');
      var цифры = (тел.value || '').replace(/[^0-9]/g, '');
      говорит.style.display = 'block';
      if (цифры.length < 10) {
        говорит.style.color = '#E09A8A';
        говорит.textContent = 'Проверьте номер — нужно 10 цифр.';
        тел.focus();
        return;
      }
      кнопка.disabled = true;
      var было = кнопка.textContent;
      кнопка.textContent = 'Отправляем…';
      говорит.style.color = '#9A8F7C';
      говорит.textContent = 'Отправляем…';
      fetch(ПРИЁМ, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: имя.value, phone: тел.value,
          company: форма.querySelector('input[name="company"]').value || '',
          page: location.pathname
        })
      }).then(function (о) { return о.json(); }).then(function (р) {
        if (р && р.ok) {
          говорит.style.color = ЗОЛОТО;
          говорит.textContent = 'Приняли. Скоро свяжемся.';
          форма.style.display = 'none';
        } else {
          throw new Error('отказ');
        }
      }).catch(function () {
        кнопка.disabled = false;
        кнопка.textContent = было;
        говорит.style.color = '#E09A8A';
        говорит.textContent = 'Не отправилось. Позвоните: +7 (495) 795-69-57';
      });
    });
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
    try { форма_в_hero(); } catch (e) {}
    try { блок_в_конце(); } catch (e) {}
  });
})();
