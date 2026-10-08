/* Разгружает очередь заявок Богородицка (data/intake/bogoroditsk_1c_queue.jsonl,
 * репозиторий aum151-commits/sandow-automation) в 1С:Фитнес — создаёт каждую
 * заявку через веб-интерфейс под структурной единицей «Sandow Fitness
 * (Богородицк)».
 *
 * Почему через интерфейс, а не вебхуком: вебхук `hs/lead/Tilda/<GUID>` —
 * собственный код внутри базы 1С (модуль HTTPСервис.Lead), жёстко
 * привязанный к структурной единице «Sandow Fitness» (Москва). Поле club_id
 * в вебхуке принимается, но эффекта не даёт (проверено 19.09.2026). Люди,
 * которые писали этот код, в команде больше не работают — чинить код
 * некому. В форме создания заявки в самом интерфейсе 1С поле «Структурная
 * единица» есть и работает (спрятано за ссылкой «Дополнительно»),
 * проверено вживую 19-20.09.2026: тестовая заявка легла ровно в нужную
 * структурную единицу.
 *
 * Очередь пишут функции Cloudflare tg-bog.js и lead.js (_common.js →
 * queueFor1c). Если очередь пуста — скрипт выходит, не логинясь в 1С
 * (логины 1С ограничены по количеству в день).
 *
 * Живёт в облаке — GitHub Actions, публичный репозиторий aum151-commits/
 * sandow-lp (workflow bogoroditsk_1c_leads.yml, диспетчеризуется
 * sandow-cron-worker раз в 30 минут). Не зависит ни от ноутбука, ни от
 * Клода: приватный репозиторий однажды уже исчерпал бесплатные минуты
 * GitHub Actions и 5,5 суток молча не работал (25-31.08.2026) — поэтому
 * код и запуск в публичном репозитории (минуты бесплатны без лимита), а
 * данные (очередь, телефоны) остаются в приватном sandow-automation,
 * берутся и возвращаются по токену. Повтор запуска, пока предыдущий не
 * закончился, исключён настройкой `concurrency` в самом workflow — не
 * файлом-блокировкой (раннеры GitHub одноразовые, локальный lock-файл
 * между запусками не сохранился бы).
 *
 * Секреты (переменные окружения GitHub Actions, из репозитория sandow-lp):
 *   FITNESS_1C_LOGIN, FITNESS_1C_PASSWORD — учётка 1С (та же, что у Ольги)
 *   PRIVATE_REPO_TOKEN — токен с правом читать/писать sandow-automation
 *
 * Локальный запуск для отладки (берёт те же переменные из .env):
 *   node bog_lead_consumer.js
 */
const { chromium } = require('playwright-core');
const fs = require('fs');
const path = require('path');

function readLocalEnv(name) {
  try {
    const ENV_FILE = path.join('D:', 'Проекты', 'yandex-business-automation', '.env');
    const text = fs.readFileSync(ENV_FILE, 'utf8');
    const m = text.match(new RegExp('^' + name + '=(.*)$', 'm'));
    return m ? m[1].trim() : '';
  } catch (e) {
    return '';
  }
}
/* В GitHub Actions переменные уже в process.env (из secrets); локально
   на ноутбуке их там нет — тогда читаем из .env как раньше. */
function readEnv(name) {
  return process.env[name] || readLocalEnv(name);
}

const BASE = readEnv('FITNESS_1C_URL') || 'https://cloud.1c.fitness/app04/7095/ru/';
const LOGIN = readEnv('FITNESS_1C_LOGIN');
const PASS = readEnv('FITNESS_1C_PASSWORD');
const GH_TOKEN = readEnv('PRIVATE_REPO_TOKEN') || readEnv('GITHUB_TOKEN_WORKFLOW');
const GH_REPO = readEnv('GITHUB_REPO') || 'aum151-commits/sandow-automation';
const QUEUE_PATH = 'data/intake/bogoroditsk_1c_queue.jsonl';

/* Сколько раз за прогон разрешено войти в 1С заново, если сеанс выбили.
   Предел маленький намеренно: каждый повторный вход — это ещё один вход под
   учёткой Ольги, то есть ещё один повод выбить ЕЁ сеанс. Двух попыток хватает
   на случайную потерю, а если сеанс теряется снова и снова — значит в базе
   работает человек, и настойчивость тут вредит: робот сдаётся, оставшиеся
   заявки падают мгновенно (без новых входов) и прогон честно краснеет. */
const ПРЕДЕЛ_ПОВТОРНЫХ_ВХОДОВ = 2;
let повторныхВходов = 0;

/* Тихие часы (правка 08.10.2026).

   Разбор прогона 37765646115 показал: робот входит в 1С, видит рабочий стол
   (8 секций меню, «Заявки · 7 новых»), а через 30 секунд оказывается на форме
   входа — и так шесть раз подряд. Это не поломка меню и не проблема логина:
   вход каждый раз проходит, а потом сеанс выбивают. Причина — 1С:Фитнес держит
   одну активную сессию на пользователя, а робот ходит под учёткой Ольги.
   Пока она работает в 1С, они выбивают друг друга по кругу.

   Поэтому робот работает ночью, когда человека в базе нет: заявки за сутки
   никуда не денутся, а Ольгу из 1С выкидывать нельзя — это её рабочий
   инструмент, и она об этом не просила.

   Часы задаются переменными BOG_1C_QUIET_FROM / BOG_1C_QUIET_TO (по Москве).
   Флаг BOG_1C_NOW=1 отменяет тихие часы — им пользуется ручной запуск
   конвейера, когда заявки нужно завести немедленно. */
const ОКНО_С = Number(readEnv('BOG_1C_QUIET_FROM') || 22);
const ОКНО_ДО = Number(readEnv('BOG_1C_QUIET_TO') || 8);
const СЕЙЧАС_МОЖНО = /^(1|true|да|yes)$/i.test(readEnv('BOG_1C_NOW') || '');

function московскийЧас() {
  const мск = new Date(Date.now() + (3 * 60 + new Date().getTimezoneOffset()) * 60000);
  return мск.getHours();
}

/* Рабочее окно робота: с 22:00 до 08:00 по Москве. Внутри окна — работаем,
   вне окна — не заходим в 1С. Ветки две, потому что окно переходит через
   полночь: 23 больше 22 и меньше 8 одновременно быть не может. */
function окноРобота() {
  if (СЕЙЧАС_МОЖНО) return true;
  const ч = московскийЧас();
  return ОКНО_С <= ОКНО_ДО
    ? (ч >= ОКНО_С && ч < ОКНО_ДО)
    : (ч >= ОКНО_С || ч < ОКНО_ДО);
}

const LOG_FILE = path.join(__dirname, 'logs', 'bog_lead_consumer.log');

function log(msg) {
  const line = `[${new Date().toISOString()}] ${msg}`;
  console.log(line);
  try {
    fs.mkdirSync(path.dirname(LOG_FILE), { recursive: true });
    fs.appendFileSync(LOG_FILE, line + '\n');
  } catch (e) {}
}

function ghHeaders() {
  return {
    Authorization: `token ${GH_TOKEN}`,
    Accept: 'application/vnd.github+json',
    'User-Agent': 'bog-lead-consumer',
  };
}

async function fetchQueue() {
  const url = `https://api.github.com/repos/${GH_REPO}/contents/${QUEUE_PATH}`;
  const r = await fetch(url, { headers: ghHeaders() });
  if (r.status === 404) return { entries: [], sha: null };
  if (!r.ok) throw new Error(`не удалось прочитать очередь: ${r.status}`);
  const j = await r.json();
  const text = Buffer.from(j.content || '', 'base64').toString('utf8');
  const entries = text.split('\n').map((s) => s.trim()).filter(Boolean).map((s) => {
    try { return JSON.parse(s); } catch (e) { return null; }
  }).filter(Boolean);
  return { entries, sha: j.sha };
}

async function writeQueue(entries, sha) {
  const url = `https://api.github.com/repos/${GH_REPO}/contents/${QUEUE_PATH}`;
  const content = entries.map((e) => JSON.stringify(e)).join('\n') + (entries.length ? '\n' : '');
  const body = {
    message: `Очередь Богородицка: обработано, осталось ${entries.length}`,
    content: Buffer.from(content, 'utf8').toString('base64'),
  };
  if (sha) body.sha = sha;
  let r = await fetch(url, { method: 'PUT', headers: { ...ghHeaders(), 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  if (r.ok) return true;

  /* 409 — файл изменили, пока шёл прогон (08.10.2026: параллельно чистили
     очередь, и запись не прошла — заявки остались в очереди, а часть была уже
     создана, то есть повис риск дублей). Перечитываем очередь и пишем заново,
     выкидывая уже созданные записи по tranid. */
  if (r.status === 409) {
    log('очередь изменилась во время прогона — перечитываю и пишу заново');
    const свежая = await fetchQueue();
    const созданные = new Set(entries.map((e) => e.tranid));
    const остаток = свежая.entries.filter((e) => !созданные.has(e.tranid));
    const тело2 = {
      message: `Очередь Богородицка: обработано, осталось ${остаток.length}`,
      content: Buffer.from(остаток.map((e) => JSON.stringify(e)).join('\n') + (остаток.length ? '\n' : ''), 'utf8').toString('base64'),
    };
    if (свежая.sha) тело2.sha = свежая.sha;
    r = await fetch(url, { method: 'PUT', headers: { ...ghHeaders(), 'Content-Type': 'application/json' }, body: JSON.stringify(тело2) });
    if (r.ok) { log(`очередь обновлена со второй попытки, осталось ${остаток.length}`); return true; }
  }
  log(`ОШИБКА записи очереди обратно: ${r.status} ${await r.text()}`);
  return false;
}

function findByText(page, needle, exact) {
  return page.evaluate(({ needle, exact }) => {
    let found = null;
    document.querySelectorAll('div, span, td, a, button').forEach((el) => {
      const t = (el.innerText || '').trim();
      const match = exact ? t === needle : t.includes(needle);
      if (match && el.children.length === 0) {
        const r = el.getBoundingClientRect();
        if (r.width > 0 && r.height > 0) found = { x: r.x + r.width / 2, y: r.y + r.height / 2, t };
      }
    });
    return found;
  }, { needle, exact });
}

async function dismissOk(page) {
  for (let i = 0; i < 4; i++) {
    const ok = await findByText(page, 'OK', true);
    if (!ok) break;
    await page.mouse.click(ok.x, ok.y);
    await page.waitForTimeout(1200);
  }
}

/* Закрыть любые всплывающие окна (правка 08.10.2026).

   Что нашлось: на снимках экрана при сбое видно модальное окно «Клиент с таким
   данным уже существует» — телефон уже есть в базе, и 1С спрашивает, что
   делать. Кнопка в этом окне называется не «OK», а иначе, поэтому dismissOk()
   его не закрывал: окно висело, перекрывало интерфейс, и следующий шаг робота
   («найти ссылку „Заявки“») не мог ничего нажать. Так он и «слеп» с 3 октября,
   создав первые 2-3 заявки.

   Здесь два действия: сначала честные кнопки по приоритету (для диалога о
   существующем клиенте важнее всего продолжить — заявку всё равно надо
   завести), потом Escape как универсальный «закрыть окно». Что именно нажали —
   пишем в лог, чтобы причина сбоя читалась, а не угадывалась. */
async function закрытьОкна(page, где) {
  /* Правка 08.10.2026 (вторая). Из списка убраны «Закрыть» и «Отмена»:
     прогон 37763149007 показал, что пустая страница (about:blank) получалась
     ровно через 13 мс после клика по «Отмена». Похоже, это кнопка диалога
     «не удалось соединиться» — она не закрывает окно, а прекращает попытку
     подключения, и клиент 1С уходит в about:blank. Робот сам себе гасил
     страницу, а в логе это выглядело как «не удалось открыть список заявок».

     Теперь вслепую жмём только безопасные кнопки подтверждения. Если ничего
     из списка нет — не жмём ничего, а записываем в лог тексты видимых окон:
     причина сбоя должна читаться, а не угадываться. */
  const метки = ['Да', 'Продолжить', 'Создать', 'OK', 'Ok', 'Понятно'];
  const окна = await page.evaluate(() => {
    return [...document.querySelectorAll('div[class*=modal], div[class*=wnd], div[class*=dialog], div[class*=message]')]
      .filter((el) => {
        const r = el.getBoundingClientRect();
        const с = getComputedStyle(el);
        return r.width > 200 && r.height > 80 && с.visibility !== 'hidden' && с.display !== 'none';
      })
      .map((el) => (el.innerText || '').replace(/\s+/g, ' ').trim().slice(0, 200));
  });
  if (окна.length) log(`${где}: на экране окон ${окна.length} — ${окна.join(' | ').slice(0, 500)}`);
  for (let i = 0; i < 3; i++) {
    let нажали = null;
    for (const метка of метки) {
      const к = await findByText(page, метка, true);
      if (к) {
        await page.mouse.click(к.x, к.y);
        await page.waitForTimeout(1200);
        нажали = метка;
        break;
      }
    }
    if (!нажали) break;
    log(`${где}: закрыл окно кнопкой «${нажали}»`);
  }
  const остались = await page.evaluate(() => {
    const модалок = [...document.querySelectorAll('div[class*=modal], div[class*=wnd], div[class*=dialog], div[class*=message]')]
      .filter((el) => {
        const r = el.getBoundingClientRect();
        const с = getComputedStyle(el);
        return r.width > 200 && r.height > 80 && с.visibility !== 'hidden' && с.display !== 'none';
      });
    return модалок.length;
  });
  if (остались) {
    log(`${где}: окон на экране ${остались} — пробую Escape`);
    for (let i = 0; i < 2; i++) {
      await page.keyboard.press('Escape');
      await page.waitForTimeout(900);
    }
  }
}

/* Страховка от повреждённого текста на входе (кривая кодировка в источнике,
   символ замены U+FFFD) — такой текст один раз уже сорвал сохранение
   заявки в 1С (запись 094, 19-20.09.2026): комментарий с "кракозябрами"
   не прошёл валидацию формы. Реальные заявки из Telegram/сайта всегда в
   нормальном UTF-8 — это страховка на редкий случай, не основной путь. */
function sanitizeText(s) {
  return String(s || '').replace(/�/g, '').trim();
}

async function fieldNear(page, label) {
  return page.evaluate((label) => {
    let labelBox = null;
    document.querySelectorAll('div, span').forEach((el) => {
      if ((el.innerText || '').trim() === label && el.children.length === 0) {
        const r = el.getBoundingClientRect();
        if (r.width > 0) labelBox = r;
      }
    });
    if (!labelBox) return null;
    const labelY = labelBox.y + labelBox.height / 2;
    let best = null, bestScore = 1e9;
    document.querySelectorAll('input, textarea').forEach((inp) => {
      const r = inp.getBoundingClientRect();
      if (r.width === 0) return;
      if (r.x < labelBox.x) return;
      const dy = Math.abs((r.y + r.height / 2) - labelY);
      if (dy > 20) return;
      const score = dy + (r.x - labelBox.x) * 0.01;
      if (score < bestScore) { bestScore = score; best = { x: r.x + r.width / 2, y: r.y + r.height / 2 }; }
    });
    return best;
  }, label);
}

/* Потеряли ли сеанс 1С и нужно ли входить заново (правка 08.10.2026).

   Разбор артефактов прогона 37764194184 показал прямо: после входа интерфейс
   был на месте (8 секций меню, на экране «Заявки · 7 новых»), а через 15-30
   секунд страница оказалась формой входа — «Пользователь», «Пароль», «Войти».
   То есть робота не «слепого» водили по меню, его выбрасывало из базы.
   Причина — вторая сеансная сессия под той же учёткой: 1С:Фитнес держит одну
   активную сессию на пользователя, и кто вошёл позже, того и выкидывает.
   Та самая «учётка как у Ольги» — она же у робота.

   Что это значит на практике: робот должен уметь войти заново, а не падать.
   Ниже — вход по требованию; число повторных входов за прогон ограничено,
   чтобы не устраивать перепалку сессий с человеком, который в этот момент
   работает в 1С. */
async function нуженВход(page) {
  try {
    return await page.evaluate(() => {
      const u = document.querySelector('#userName');
      if (!u) return false;
      const r = u.getBoundingClientRect();
      return r.width > 0 && r.height > 0;
    });
  } catch (e) {
    return false;
  }
}

async function войтиЗаново(page) {
  if (повторныхВходов >= ПРЕДЕЛ_ПОВТОРНЫХ_ВХОДОВ) {
    throw new Error(`сеанс 1С терялся ${повторныхВходов} раза за прогон — похоже, под этой учёткой ` +
                    'работает человек; роботу нужен отдельный пользователь 1С');
  }
  повторныхВходов += 1;
  log(`сеанс 1С потерян (на экране форма входа) — вхожу заново, раз ${повторныхВходов}`);
  await page.goto(BASE, { waitUntil: 'domcontentloaded', timeout: 60000 }).catch(() => {});
  await page.waitForTimeout(5000);
  if (await нуженВход(page)) {
    await page.fill('#userName', LOGIN).catch(() => {});
    await page.fill('#userPassword', PASS).catch(() => {});
    const enter = await page.$('text=Войти');
    if (enter) await enter.click();
    await page.waitForTimeout(16000);
  }
}

async function login(page) {
  await page.goto(BASE, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(4000);
  await page.fill('#userName', LOGIN);
  await page.fill('#userPassword', PASS);
  const enter = await page.$('text=Войти');
  if (enter) await enter.click();
  await page.waitForTimeout(15000);
  await закрытьОкна(page, 'окна');
  return осмотрВхода(page);
}

/* Осмотр сразу после входа (правка 08.10.2026).

   Зачем: прогоны 10:15 и 10:23 (UTC) падали все до одной с «не удалось
   открыть список заявок», а слепок показывал about:blank — то есть 1С не
   открылся вовсе, и виноват был не поиск меню. В логе при этом не было ни
   слова о том, что именно показал 1С. Здесь после входа пишем адрес, число
   секций меню и первые тексты экрана — этого достаточно, чтобы отличить
   «не пустило по логину», «превышено число соединений» и «меню поменялось». */
async function осмотрВхода(page) {
  try {
    const снять = () => page.evaluate(() => {
      const тексты = [];
      document.querySelectorAll('div, span, td, a, button, h1, h2').forEach((el) => {
        if (el.children.length) return;
        const t = (el.innerText || '').replace(/\s+/g, ' ').trim();
        if (t && t.length > 1 && t.length < 60 && !тексты.includes(t)) тексты.push(t);
      });
      return {
        адрес: location.href,
        заголовок: document.title,
        секций: document.querySelectorAll('.themeBox').length,
        полей: document.querySelectorAll('input').length,
        тексты: тексты.slice(0, 60),
      };
    });
    let д = await снять();
    if (д.секций === 0) {
      /* Одна попытка перезагрузки: клиент 1С иногда отдаёт страницу раньше,
         чем достраивает интерфейс. Если и после неё секций нет — в базу не
         пустили, и дальше идти некуда: 12 слепых попыток по 20 секунд только
         сожгут время и создадут вид бурной работы. */
      log(`после входа интерфейса нет (секций 0, адрес ${д.адрес}) — перезагружаю страницу и жду 25 секунд`);
      await page.goto(BASE, { waitUntil: 'domcontentloaded', timeout: 60000 }).catch(() => {});
      await page.waitForTimeout(25000);
      д = await снять();
    }
    log(`после входа: адрес ${д.адрес}, заголовок «${д.заголовок}», секций ${д.секций}, полей ввода ${д.полей}`);
    log(`после входа, что на экране: ${д.тексты.join(' · ').slice(0, 1500)}`);
    await page.screenshot({ path: path.join(__dirname, 'posle-vhoda.png'), fullPage: false }).catch(() => {});
    return д.секций > 0;
  } catch (e) {
    log(`осмотр входа не удался: ${e.message}`);
    return true; /* не мешаем работе из-за самой диагностики */
  }
}

async function openLeadsList(page) {
  /* Правка 08.10.2026. Было: клик по жёсткой координате (29,125) — «иконка CRM
     в сайдбаре» — и поиск ссылки ровно с текстом «Заявки». После обновления
     интерфейса 1С по этой координате оказался переключатель темы, меню CRM не
     раскрывалось, и робот писал «не нашёл ссылку «Заявки» в меню CRM». За один
     прогон он успевал завести 2-3 заявки (пока форма открыта с прошлого шага) и
     слеп на всех остальных — а шаг воркфлоу при этом рапортовал «успех».

     Теперь: сначала пробуем найти «Заявки» как есть; если нет — перебираем
     иконки секций в левой полосе (.themeBox) и после каждого клика проверяем,
     не появилась ли ссылка. Координата (29,125) больше не используется.
     Три попытки, между ними — возврат на стартовую страницу приложения
     (сессия сохраняется, повторного входа и лимита логинов нет). */
  const найти = async () => {
    const точное = await findByText(page, 'Заявки', true);
    if (точное) return точное;
    return page.evaluate(() => {
      let найденное = null;
      document.querySelectorAll('div, span, td, a, button').forEach((el) => {
        if (el.children.length) return;
        const t = (el.innerText || '').trim();
        if (!/^Заявки\b/.test(t) || t.length > 14) return;
        const r = el.getBoundingClientRect();
        if (r.width > 0 && r.height > 0) найденное = { x: r.x + r.width / 2, y: r.y + r.height / 2, t };
      });
      return найденное;
    });
  };
  const секции = () => page.evaluate(() => [...document.querySelectorAll('.themeBox')].map((el, i) => {
    const r = el.getBoundingClientRect();
    return { i, x: Math.round(r.x + r.width / 2), y: Math.round(r.y + r.height / 2) };
  }));

  for (let попытка = 1; попытка <= 3; попытка++) {
    if (await нуженВход(page)) await войтиЗаново(page);
    if (попытка > 1) {
      log(`список заявок не открылся — попытка ${попытка}: возвращаюсь на стартовую страницу`);
      await page.goto(BASE, { waitUntil: 'domcontentloaded', timeout: 60000 }).catch(() => {});
      await page.waitForTimeout(9000);
    }
    await закрытьОкна(page, 'перед списком');
    let ссылка = await найти();
    if (!ссылка) {
      for (const с of await секции()) {
        /* Меню секции в 1С раскрывается НАВЕДЕНИЕМ, а не кликом (проверено
           08.10.2026: клик по иконке меню состояния не менял, наведение —
           меняло). Поэтому сначала ведём курсор и ждём, и только если ссылка
           появилась — жмём её; клик остаётся как вторая попытка. */
        await page.mouse.move(с.x, с.y);
        await page.waitForTimeout(1400);
        ссылка = await найти();
        if (ссылка) break;
        await page.mouse.click(с.x, с.y);
        await page.waitForTimeout(2200);
        await закрытьОкна(page, 'секция');
        ссылка = await найти();
        if (ссылка) break;
      }
    }
    if (ссылка) {
      await page.mouse.click(ссылка.x, ссылка.y);
      await page.waitForTimeout(9000);
      await закрытьОкна(page, 'список заявок');
      return;
    }
  }
  throw new Error('не удалось открыть список заявок в меню CRM (три попытки)');
}

/* Текстовый слепок экрана — вместо картинок.

   Диагностировать сбой робота по скриншотам неудобно: картинку смотрит
   человек, а в логе её нет (08.10.2026 на разбор ушёл час). Здесь снимаем то
   же самое текстом: адрес, сколько секций в сайдбаре, какие пункты меню
   видны, есть ли где-то «Заявки» и какие окна открыты. Файл кладётся рядом с
   логом и уезжает артефактом прогона. */
async function слепокЭкрана(page, tranid) {
  try {
    const данные = await page.evaluate(() => {
      const тексты = new Set();
      document.querySelectorAll('div, span, td, a, button').forEach((el) => {
        if (el.children.length) return;
        const t = (el.innerText || '').trim();
        if (t && t.length < 50) тексты.add(t);
      });
      const модалки = [...document.querySelectorAll('div[class*=modal], div[class*=wnd], div[class*=dialog], div[class*=message]')]
        .filter((el) => { const r = el.getBoundingClientRect(); return r.width > 200 && r.height > 80; })
        .map((el) => (el.innerText || '').replace(/\s+/g, ' ').trim().slice(0, 160));
      return {
        адрес: location.href,
        заголовок: document.title,
        формаВхода: !!(document.querySelector('#userName') && document.querySelector('#userPassword')),
        секций: document.querySelectorAll('.themeBox').length,
        пунктовМеню: [...document.querySelectorAll('.functionItem')].map((el) => (el.innerText || '').trim().slice(0, 30)),
        естьЗаявки: [...тексты].some((t) => t.includes('Заявк')),
        модалки,
        тексты: [...тексты].slice(0, 120),
      };
    });
    fs.writeFileSync(path.join(__dirname, `error-${tranid}.txt`),
                     JSON.stringify(данные, null, 2), 'utf8');
    log(`слепок экрана: error-${tranid}.txt — адрес ${данные.адрес}, ` +
        `${данные.формаВхода ? 'НА ЭКРАНЕ ФОРМА ВХОДА (сеанс выбит), ' : ''}` +
        `секций ${данные.секций}, ` +
        `пунктов меню ${данные.пунктовМеню.length}, «Заявки» ${данные.естьЗаявки ? 'есть' : 'нет'}, ` +
        `окон ${данные.модалки.length}`);
  } catch (e) {
    log(`слепок экрана не снялся: ${e.message}`);
  }
}

async function selectBogoroditsk(page) {
  // раскрыть "Дополнительно"
  const dop = await findByText(page, 'Дополнительно', true);
  if (!dop) throw new Error('нет ссылки «Дополнительно» в форме заявки');
  await page.mouse.click(dop.x, dop.y);
  await page.waitForTimeout(2500);

  // клик по значению поля "Структурная единица" — фиксированные координаты,
  // проверенные вживую 19-20.09.2026: после раскрытия "Дополнительно" поле
  // всегда на одном месте (Номер/от, Автор, Структурная единица — в этом
  // порядке, сразу под «Внешняя система»). Значение — внутри <input>,
  // findByText его не видит (ищет только div/span/td/a/button).
  await page.mouse.click(625, 677);
  await page.waitForTimeout(2500);

  const showAll = await findByText(page, 'Показать все', true);
  if (showAll) { await page.mouse.click(showAll.x, showAll.y); await page.waitForTimeout(3000); }

  const bogOption = await findByText(page, 'Sandow Fitness (Богородицк)', true);
  if (!bogOption) throw new Error('«Sandow Fitness (Богородицк)» не найдена в списке структурных единиц');
  await page.mouse.click(bogOption.x, bogOption.y);
  await page.waitForTimeout(1500);

  const selectBtn = await findByText(page, 'Выбрать', true);
  if (!selectBtn) throw new Error('нет кнопки «Выбрать» после клика по Богородицку');
  await page.mouse.click(selectBtn.x, selectBtn.y);
  await page.waitForTimeout(3000);
  /* Значение выбора живёт внутри <input> — findByText (div/span/td/a/button)
     его не видит, поэтому здесь не проверяем текстом. Реальная проверка —
     после сохранения (см. конец createLead). */
}

async function createLead(page, entry) {
  await page.mouse.click(195, 229); // "+ Создать заявку" в колонке "Не обработана"
  await page.waitForTimeout(7000);
  await закрытьОкна(page, 'окна');

  await selectBogoroditsk(page);

  /* Фамилия/Имя/Отчество — фиксированные координаты, а не fieldNear по
     подписи "Имя:". Причина: fieldNear стабильно находил "Телефон" и
     "Комментарий:", но раз за разом не находил именно "Имя:" (проверено
     на нескольких прогонах 19-20.09.2026, включая ручные заявки
     Георгия/Алины — телефон и структурная единица сохранялись верно, имя
     оставалось пустым). Причина не выяснена (возможно, у строки "Имя:"
     на странице оказывается более одного совпадения текста), но три
     поля в шапке формы (Фамилия/Имя/Отчество) всегда на одном и том же
     месте — так надёжнее.
     Имя обязательно: без него в 1С падает заявка без опознавательных
     данных, а имя — то, что реально сообщает клиент боту/форме. */
  const name = sanitizeText(entry.name);
  if (name) {
    const nameValue = name.slice(0, 60);
    let typed = '';
    for (let attempt = 0; attempt < 3 && typed !== nameValue; attempt++) {
      await page.mouse.click(642, 206); // средняя строка — "Имя"
      await page.waitForTimeout(500);
      // на случай, если предыдущая попытка что-то уже вписала не туда —
      // выделить и стереть перед вводом заново
      await page.keyboard.press('Control+A');
      await page.keyboard.press('Delete');
      await page.waitForTimeout(200);
      await page.keyboard.type(nameValue, { delay: 30 });
      await page.waitForTimeout(500);
      // проверяем, что значение реально попало именно в поле "Имя" —
      // раньше клик по координате иногда не долетал до нужного input, и
      // заявка сохранялась без имени, никак об этом не сообщая (проверено
      // 19-20.09.2026 на реальных заявках Георгия и Алины: канал и
      // структурная единица сохранялись, имя — нет, ошибок не было).
      typed = await page.evaluate((y) => {
        let best = null, bestDy = 1e9;
        document.querySelectorAll('input').forEach((inp) => {
          const r = inp.getBoundingClientRect();
          if (r.width === 0) return;
          const dy = Math.abs((r.y + r.height / 2) - y);
          if (dy < bestDy) { bestDy = dy; best = inp; }
        });
        return best ? best.value : '';
      }, 206);
      if (typed !== nameValue) console.log(`  имя не закрепилось с попытки ${attempt + 1} (в поле: "${typed}") — повтор`);
    }
    if (typed !== nameValue) throw new Error(`не удалось ввести имя «${nameValue}» после трёх попыток (в поле осталось: «${typed}»)`);
  }

  const phoneBox = await fieldNear(page, 'Телефон');
  if (!phoneBox) throw new Error('не нашёл поле «Телефон»');
  await page.mouse.click(phoneBox.x, phoneBox.y);
  await page.waitForTimeout(400);
  await page.keyboard.type(entry.phone.replace(/\D/g, '').slice(-10), { delay: 25 });
  await page.waitForTimeout(400);

  /* Канал привлечения = "Заявка" — тот же канонический канал, которым
     размечены и заявки, которые вручную регистрируют по звонку/чату
     менеджеры (см. "заявка" в marks.js). Поле фильтруется набором
     текста и коммитится одним кликом по варианту — без отдельной кнопки
     "Выбрать". */
  await page.mouse.click(620, 374);
  await page.waitForTimeout(2000);
  await page.keyboard.type('Заявка', { delay: 40 });
  await page.waitForTimeout(2000);
  let kanalOption = await findByText(page, 'Заявка', true);
  if (!kanalOption) {
    const showAllKanal = await findByText(page, 'Показать все', true);
    if (showAllKanal) {
      await page.mouse.click(showAllKanal.x, showAllKanal.y);
      await page.waitForTimeout(3000);
      kanalOption = await findByText(page, 'Заявка', true);
      if (kanalOption) {
        await page.mouse.click(kanalOption.x, kanalOption.y);
        await page.waitForTimeout(1500);
        const selectBtn1 = await findByText(page, 'Выбрать', true);
        if (selectBtn1) { await page.mouse.click(selectBtn1.x, selectBtn1.y); await page.waitForTimeout(1500); }
      }
      kanalOption = true; // цикл обработан через "Показать все", не дублировать клик ниже
    }
  } else {
    await page.mouse.click(kanalOption.x, kanalOption.y);
    await page.waitForTimeout(1500);
  }

  /* Рекламный источник — "tilda" для заявок с формы сайта (сайт
     Богородицка собран на Тильде, то же значение, что у реальных заявок
     Москвы), "Он-Лайн" для Telegram-бота (отдельной строки под бота в
     справочнике 1С нет, это ближайшее по смыслу существующее значение). */
  /* Ольга 08.10.2026: «Рекламный источник — Стойка, а не онлайн!».
     Личная встреча на стойке в ТЦ — отдельный источник, и в отчётах 1С он
     должен читаться именно так. «Он-Лайн» остаётся для Telegram-бота:
     отдельной строки под бота в справочнике 1С нет, это ближайшее по смыслу
     существующее значение. */
  const sourceLabel = entry.adSource === 'tilda' ? 'tilda'
    : entry.adSource === 'stoyka' ? 'Стойка' : 'Он-Лайн';
  await page.mouse.click(620, 408);
  await page.waitForTimeout(2000);
  const showAllSource = await findByText(page, 'Показать все', true);
  if (showAllSource) {
    await page.mouse.click(showAllSource.x, showAllSource.y);
    await page.waitForTimeout(3000);
    const sourceOption = await findByText(page, sourceLabel, true);
    if (sourceOption) {
      await page.mouse.click(sourceOption.x, sourceOption.y);
      await page.waitForTimeout(1500);
      const selectBtn2 = await findByText(page, 'Выбрать', true);
      if (selectBtn2) { await page.mouse.click(selectBtn2.x, selectBtn2.y); await page.waitForTimeout(2000); }
    } else {
      /* Значения нет в справочнике — поле останется пустым, и молчать об
         этом нельзя: по логу должно быть видно, что справочник надо
         дополнить, а не что робот сломался (грабля «форма отработала, а
         поля нет» из истории с именем и структурной единицей). */
      log(`ВНИМАНИЕ: в справочнике 1С нет рекламного источника «${sourceLabel}» — поле оставлено пустым`);
    }
  }

  const comment = sanitizeText(entry.comment);
  const commentBox = await fieldNear(page, 'Комментарий:');
  if (commentBox && comment) {
    await page.mouse.click(commentBox.x, commentBox.y);
    await page.waitForTimeout(400);
    await page.keyboard.type(comment.slice(0, 500), { delay: 15 });
    await page.waitForTimeout(400);
  }

  const saveBtn = await findByText(page, 'Сохранить', true);
  if (!saveBtn) throw new Error('нет кнопки «Сохранить»');
  await page.mouse.click(saveBtn.x, saveBtn.y);
  await page.waitForTimeout(7000);
  await закрытьОкна(page, 'после сохранения');

  /* Настоящая проверка сохранения — не «клик прошёл без ошибки JS».
     Один раз (заявка 094, 19-20.09.2026) форма 1С показала диалог с
     кнопкой «OK» после «Сохранить» (похоже, ошибка валидации из-за
     повреждённого текста в комментарии) — dismissOk() эту кнопку закрыл
     как обычную подсказку, скрипт отчитался об успехе, а заявка не
     создалась. Теперь: если вкладка «Заявка (создание)» всё ещё видна —
     сохранение не прошло, это ошибка, а не успех. */
  const stillEditing = await findByText(page, 'Заявка (создание)', false);
  if (stillEditing) {
    throw new Error('после «Сохранить» форма создания всё ещё открыта — заявка не сохранилась');
  }
}

async function run() {
  if (!GH_TOKEN) { log('нет токена GitHub (PRIVATE_REPO_TOKEN/GITHUB_TOKEN_WORKFLOW) — стоп'); return; }

  const { entries: все, sha } = await fetchQueue();
  if (!все.length) { log('очередь пуста — в 1С не захожу'); return; }

  if (окноРобота()) {
    log(`рабочее окно робота (${московскийЧас()}:00 по Москве, окно ${ОКНО_С}:00–${ОКНО_ДО}:00) — иду в 1С`);
  } else {
    log(`вне рабочего окна: сейчас ${московскийЧас()}:00 по Москве, робот работает ${ОКНО_С}:00–${ОКНО_ДО}:00 — ` +
        `в 1С не захожу, чтобы не выбивать Ольгу из базы; заявок в очереди ${все.length}`);
    return;
  }

  /* Чистим очередь перед работой (правка 08.10.2026):
     - тестовые записи (в имени «Тест», «ТЕСТ», «проверка») в CRM не заводим;
     - один и тот же телефон оставляем один раз: дубли появляются, когда
       запись очереди не удалось записать обратно, и в 1С уезжают две заявки
       на одного человека (в API 1С прямо сказано: на один номер в сутки —
       одна заявка). */
  const видели = new Set();
  const entries = [];
  for (const e of все) {
    if (/тест|проверк/i.test(String(e.name || ''))) { log(`пропускаю тестовую запись: ${e.name} (${e.phone})`); continue; }
    if (видели.has(e.phone)) { log(`пропускаю дубль по номеру: ${e.phone}`); continue; }
    видели.add(e.phone);
    entries.push(e);
  }
  if (!entries.length) {
    log('после чистки заводить нечего — обновляю очередь и выхожу');
    await writeQueue([], sha);
    return;
  }
  log(`в очереди ${все.length} заявок, к заведению ${entries.length}`);

  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1700, height: 1050 }, locale: 'ru-RU' });
  const page = await ctx.newPage();

  const вошли = await login(page);
  if (!вошли) {
    /* Раньше на этом месте робот 12 раз подряд пытался открыть меню на пустой
       странице, писал «успешно 0» и оставлял очередь нетронутой — провал
       выглядел как обычная работа. Теперь падаем сразу и громко: очередь при
       этом не переписывается, заявки остаются и уедут следующим прогоном. */
    await browser.close();
    log('ВХОД В 1С НЕ СОСТОЯЛСЯ: интерфейс не загрузился (см. «после входа» выше). ' +
        'Заявки не тронуты, очередь осталась как была.');
    process.exitCode = 1;
    return;
  }

  const failed = [];
  for (const entry of entries) {
    try {
      /* Перед каждой заявкой — заново открываем список: после сохранения
         интерфейс остаётся в другом состоянии, и именно на этом робот и
         спотыкался (первая-вторая заявка проходили, дальше он слеп). */
      await openLeadsList(page);
      await createLead(page, entry);
      log(`создано: ${entry.phone} (${entry.tranid})`);
    } catch (e) {
      log(`ОШИБКА для ${entry.tranid} (${entry.phone}): ${e.message}`);
      try { await page.screenshot({ path: path.join(__dirname, `error-${entry.tranid}.png`), fullPage: true }); } catch (e2) {}
      await слепокЭкрана(page, entry.tranid);
      failed.push(entry);
    }
  }

  await browser.close();

  const ok = await writeQueue(failed, sha);
  log(ok
    ? `готово: успешно ${entries.length - failed.length}, осталось в очереди ${failed.length}`
    : 'готово, но очередь на GitHub не обновилась — при следующем запуске возможны повторы');

  /* Честный сигнал: если хоть одна заявка не завелась — прогон красный.
     Раньше шаг рапортовал «успех» при нуле созданных заявок, и поломка
     робота (08.10.2026, слепые клики по меню CRM) жила незамеченной. */
  if (failed.length) {
    log(`ПРОВАЛ: ${failed.length} заявок не заведены — это ошибка прогона, а не норма`);
    process.exitCode = 1;
  }
}

run().catch((e) => { log('НЕОЖИДАННАЯ ОШИБКА: ' + (e && e.stack || e)); process.exit(1); });
