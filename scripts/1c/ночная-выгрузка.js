// Ночная выгрузка из 1С: клиенты, вся история задач, разведка заметок.
//
// Запускается по расписанию ночью: заход в 1С занимает живую лицензию, днём
// её отнимать у сотрудников нельзя (прямое требование Ольги, подтверждено
// 14.10.2026 — «разрешаю»).
//
// Почему так, а не через меню «Вывести список»: команда живёт в меню на
// канвасе, рядом «Удалить», вслепую жать нельзя (проверено 14.10.2026 —
// восемь способов, все тупики). Работают два пути:
//   * отчёты — выгрузка клиентов через «Список клиентов - таблица для CSV»;
//   * список задач — окно делается ОЧЕНЬ высоким, тогда виртуализация
//     отдаёт все строки месяца сразу (приём scan_one_month.js: высота окна
//     = число задач * 33 + запас).
//
// Задачи собираются по месяцам НАЗАД от текущего: раньше у нас было всего
// четыре месяца (сентябрь–декабрь 2026), а база живёт с 2022 года — поэтому
// задач и выходило меньше, чем клиентов.
//
// Запуск: node ночная-выгрузка.js
const { chromium } = require('playwright-core');
const { loginAndSwitch } = require('./lib');
const path = require('path');
const fs = require('fs');

// Папку можно задать снаружи: в облаке GitHub путей Windows не существует,
// поэтому там передаётся своя папка через переменную окружения.
// Имена переменных латиницей нарочно: GitHub не принимает кириллицу
// в выражениях рабочих процессов и отвечает 422 «failed to parse workflow».
const ПАПКА = process.env.VYGRUZKA_DIR
  || 'D:\\Проекты\\call-analysis\\векторизация-базы\\ночные';
const ЛОГ = process.env.VYGRUZKA_LOG
  || 'D:\\Проекты\\1c-выгрузка\\logs\\ночная-выгрузка.log';
const СНИМКИ = process.env.VYGRUZKA_SHOTS || 'D:/Проекты/1c-выгрузка/logs/';
// Локально работаем в установленном Edge, в облаке его нет — там обычный
// chromium из playwright, поэтому канал берём только под Windows.
// Без этой развилки скрипт падал бы в облаке на старте браузера.
const КАНАЛ = process.env.VYGRUZKA_BROWSER
  || (process.platform === 'win32' ? 'msedge' : undefined);
const МЕСЯЦЕВ_НАЗАД = parseInt(process.argv[2] || '60', 10);
// Ежедневный прогон запускается так: node ночная-выгрузка.js 2 --без-заметок
// Два месяца назад — потому что задачи менеджеры ставят и на будущее, и с
// опозданием: свежий месяц может ещё пополняться, а прошлый — закрываться.
const БЕЗ_ЗАМЕТОК = process.argv.includes('--без-заметок');
const ПУСТЫХ_ПОДРЯД_СТОП = 4;

fs.mkdirSync(ПАПКА, { recursive: true });
const логи = [];
const сказать = (s) => {
  const строка = `[${new Date().toISOString().slice(0, 19)}] ${s}`;
  console.log(строка);
  логи.push(строка);
  fs.writeFileSync(ЛОГ, логи.join('\n'), 'utf8');
};

const СЕГОДНЯ = new Date().toISOString().slice(0, 10);
const МЕСЯЦЫ = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль',
                'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'];

// Жёсткий предел на любую операцию со страницей.
//
// Зачем это отдельная обёртка, а не setDefaultTimeout: в Playwright
// page.evaluate НЕ подчиняется setDefaultTimeout — у него нет параметра
// timeout, и на замолчавшей странице вызов ждёт бесконечно. Именно на этом
// 15.10.2026 ночь ушла впустую: поиск стрелки шёл с 01:47 до 07:23, потому
// что страница перестала отвечать, а вызовы так и висели.
async function сТаймаутом(обещание, мс, что) {
  let таймер;
  const стоп = new Promise((_, отказ) => {
    таймер = setTimeout(() => отказ(new Error(`таймаут ${мс} мс: ${что}`)), мс);
  });
  try {
    return await Promise.race([обещание, стоп]);
  } finally {
    clearTimeout(таймер);
  }
}

async function clickText(page, text, exact = true) {
  const hit = await сТаймаутом(page.evaluate(([t, ex]) => {
    let found = null;
    document.querySelectorAll('*').forEach(el => {
      if (el.children.length !== 0) return;
      const s = (el.innerText || '').trim();
      const ok = ex ? s === t : s.indexOf(t) !== -1;
      if (!ok) return;
      const r = el.getBoundingClientRect();
      if (r.width > 0 && r.height > 0) found = { x: r.x + r.width / 2, y: r.y + r.height / 2, s };
    });
    return found;
  }, [text, exact]), 30000, `поиск «${text}»`);
  if (!hit) return null;
  await page.mouse.click(hit.x, hit.y);
  return hit.s;
}

// Месяц по САМИМ ДАННЫМ, а не по подписи в шапке.
//
// Почему так. 15.10.2026 выяснилось: подпись месяца то появляется в DOM, то
// нет (в замере — «подпись: null», хотя на экране «Октябрь 2026» написано).
// Определять смену месяца по ней нельзя: скрипт решает, что месяц не
// сменился, и уходит вхолостую. А даты в строках есть всегда и выглядят как
// «10.12.2026 15:00» — по ним месяц виден надёжно.
async function месяцПоДанным(page) {
  const текст = await сТаймаутом(page.evaluate(() => {
    const строки = Array.from(document.querySelectorAll('.gridLine')).slice(0, 10);
    return строки.map(с => с.innerText || '').join('\n');
  }), 30000, 'чтение дат из строк');
  const счёт = {};
  for (const м of текст.matchAll(/(\d{2})\.(\d{2})\.(\d{4})/g)) {
    const ключ = `${м[2]}.${м[3]}`;
    счёт[ключ] = (счёт[ключ] || 0) + 1;
  }
  const лучший = Object.entries(счёт).sort((a, b) => b[1] - a[1])[0];
  return лучший ? лучший[0] : null;
}

// Подпись вида «Октябрь 2026» — по ней понимаем, куда переключился календарь.
async function месяцНаЭкране(page) {
  return await сТаймаутом(page.evaluate((месяцы) => {
    const re = new RegExp('(' + месяцы.join('|') + ')\\s*\\d{4}', 'i');
    for (const el of document.querySelectorAll('*')) {
      if (el.children.length !== 0) continue;
      const s = (el.innerText || '').trim();
      const m = s.match(re);
      if (m) return m[0];
    }
    return null;
  }, МЕСЯЦЫ), 30000, 'чтение подписи месяца');
}

async function счётчикЗадач(page) {
  const s = await сТаймаутом(page.evaluate(() => {
    for (const el of document.querySelectorAll('*')) {
      if (el.children.length !== 0) continue;
      const t = (el.innerText || '').trim();
      if (/^\(\s*[\d\s\u00a0]+\s*задач/i.test(t)) return t;
    }
    return null;
  }), 30000, 'чтение счётчика задач');
  const m = s && s.match(/\(\s*([\d\s\u00a0]+)\s*задач/i);
  return { подпись: s, число: m ? parseInt(m[1].replace(/\D/g, ''), 10) : null };
}

function rowFromLine(line) {
  const cells = {};
  line.querySelectorAll('.gridBox').forEach(box => {
    const idx = box.getAttribute('colindex');
    const t = box.querySelector('.gridBoxText');
    cells[idx === null ? 'x' : idx] = t ? t.innerText.trim() : '';
  });
  return cells;
}

async function собратьСтроки(page) {
  return await сТаймаутом(page.evaluate((fnStr) => {
    const rowFromLine = eval('(' + fnStr + ')');
    // В DOM лежат строки РАЗНЫХ таблиц вперемешку: окно выбора организации,
    // открывавшееся при входе, остаётся в разметке. Из-за этого 15.10.2026 в
    // файл задач попали строки «MILLIY Fitness / Sandow Fitness (Богородицк)».
    // Отличаем по числу колонок: в окне выбора их три, у задачи — восемь и
    // больше (Дата, Переносов, Клиент, Телефон, Статус, Сделка, Тема,
    // Триггерное событие).
    return Array.from(document.querySelectorAll('.gridLine'))
      .filter(стр => стр.querySelectorAll('.gridBox').length >= 6)
      .map(rowFromLine);
  }, rowFromLine.toString()), 120000, 'сбор строк месяца');
}

// ─────────────────────────── этап 1: клиенты ───────────────────────────────
async function этапКлиенты(page) {
  сказать('=== этап 1: выгрузка клиентов ===');
  await page.mouse.click(28, 168);
  await page.waitForTimeout(6000);
  await clickText(page, 'Отчеты по клиентам', true);
  await page.waitForTimeout(11000);
  await clickText(page, 'Список клиентов - таблица для CSV', true);
  await page.waitForTimeout(14000);

  await clickText(page, 'Сформировать', true);
  for (let i = 0; i < 60; i++) {
    await page.waitForTimeout(5000);
    const t = await page.evaluate(() => document.body.innerText || '');
    if (!t.includes('Отчет формируется') && t.includes('Клиент')) { сказать('  отчёт сформирован'); break; }
  }

  await clickText(page, 'Сохранить', true);
  await page.waitForTimeout(3000);
  await page.mouse.click(966, 531);
  await page.waitForTimeout(2000);
  const форматы = await page.evaluate(() =>
    [...document.querySelectorAll('*')].filter(e => e.children.length === 0 && /\(\*\.\w+\)/.test(e.innerText || ''))
      .map(e => (e.innerText || '').trim()));
  const xlsx = форматы.find(s => s.toLowerCase().includes('.xlsx'));
  if (!xlsx) throw new Error('не нашёл формат xlsx в диалоге сохранения');
  await clickText(page, xlsx, true);
  await page.waitForTimeout(1500);

  const dl = page.waitForEvent('download', { timeout: 300000 });
  await clickText(page, 'OK', true);
  const download = await dl;
  const имя = `Клиенты-${СЕГОДНЯ}.xlsx`;
  await download.saveAs(path.join(ПАПКА, имя));
  сказать(`  сохранено: ${имя}`);
}

// ─────────────────────────── этап 2: задачи ────────────────────────────────
async function найтиСтрелкуНазад(page) {
  // Стрелка «<» нарисована канвасом, в DOM её нет. Позицию выяснили не
  // перебором, а распознаванием снимка экрана (36_найти-стрелки.py): на
  // снимке видно ««» на x=1173 при y=122, подпись «Октябрь 2026» на
  // x=1196..1256, а «>» на x=1645. То есть стрелки стоят по краям панели
  // периода, а между ними кнопки «Сегодня / 4 дня / Неделя / Месяц».
  //
  // Прошлый перебор бил по x=1528..1600 — это были кнопки «Неделя» и
  // «Месяц», поэтому месяц не менялся и история не собиралась.
  // Координаты стрелки «назад» получены разбором пикселей снимка шапки
  // (38_пиксели-шапки.py): стрелка занимает x 1173..1180, высота 16, центр
  // по вертикали около 123. Рядом подпись «Октябрь 2026» (1196..1287), правее
  // кнопки «Сегодня / 4 дня / Неделя / Месяц» (1342..1632) и стрелка «вперёд»
  // (1645..1652). Прежние попытки били по кнопкам и по подписи — отсюда и
  // пустые ночи.
  const было = await месяцПоДанным(page) || await месяцНаЭкране(page);
  сказать(`  месяц на экране: ${было}`);
  const X = 1176, Y = 123;
  const предел = Date.now() + 3 * 60 * 1000;
  for (let попытка = 1; попытка <= 3; попытка++) {
    if (Date.now() > предел) break;
    try {
      await page.mouse.click(X, Y, { timeout: 15000 });
      await page.waitForTimeout(7000);
      const стало = await месяцПоДанным(page) || await месяцНаЭкране(page);
      if (стало && стало !== было) {
        сказать(`  стрелка назад работает: «${было}» -> «${стало}»`);
        return { x: X, y: Y };
      }
      сказать(`  попытка ${попытка}: месяц не сменился (сейчас «${стало}»)`);
    } catch (ошибка) {
      сказать(`  попытка ${попытка}: ${ошибка.message.split('\n')[0]}`);
    }
  }
  return null;
}

async function этапЗадачи(page) {
  сказать('=== этап 2: вся история задач по месяцам ===');
  await page.mouse.click(29, 112);
  await page.waitForTimeout(6000);
  await clickText(page, 'Задачи', true);
  await page.waitForTimeout(9000);
  await clickText(page, 'Месяц', true);
  await page.waitForTimeout(7000);

  const стрелка = await найтиСтрелкуНазад(page);
  if (!стрелка) {
    сказать('  ОШИБКА: не нашёл стрелку перехода назад, история не собрана');
    сказать('  смотри снимок ночь-стрелки.png');
    await page.screenshot({ path: СНИМКИ + 'ночь-стрелки.png' });
    return;
  }
  await page.screenshot({ path: СНИМКИ + 'ночь-задачи-старт.png' });

  let пустыхПодряд = 0;
  for (let шаг = 0; шаг < МЕСЯЦЕВ_НАЗАД; шаг++) {
    const поДанным = await месяцПоДанным(page);
    const подпись = (await месяцНаЭкране(page)) || поДанным;
    const { подпись: счёт, число } = await счётчикЗадач(page);
    сказать(`  ${подпись} [данные: ${поДанным}]: ${счёт}`);

    if (число && число > 0) {
      пустыхПодряд = 0;
      // Высокое окно — единственный способ получить все строки месяца сразу.
      // Предел поднят до 400 000: на 60 000 в месяц попадало ровно 2061 строки
      // (упирались в высоту окна, а не в конец списка), на 200 000 август и
      // июль собрались полностью (5304/5304 и 5902/5902), а сентябрь — 6887 из
      // 7935, потому что 7935 строк требуют около 274 000 пикселей.
      // Строку-заголовок отбрасываем.
      const высота = Math.min(400000, Math.max(3000, число * 34 + 6000));
      await page.setViewportSize({ width: 1680, height: высота });
      await page.waitForTimeout(Math.min(45000, 6000 + число * 4));
      const все = await собратьСтроки(page);
      const строки = все.filter(з => (з['1'] || '').trim() !== 'Дата');
      сказать(`    строк в DOM: ${все.length} (заголовок отброшен), задач: ${строки.length} из ${число}`);
      // Имя файла — по месяцу из ДАННЫХ, а не по подписи в шапке: подпись
      // остаётся старой («Октябрь 2026»), и три разных месяца записались бы
      // в один файл, затирая друг друга (случилось 15.10.2026).
      const имя = `Задачи-${поДанным || подпись}.json`.replace(/\s+/g, '-');
      fs.writeFileSync(path.join(ПАПКА, имя),
        JSON.stringify({ месяц: поДанным || подпись, в1С: число,
                         собрано: строки.length, данные: строки }, null, 1), 'utf8');
      await page.setViewportSize({ width: 1680, height: 1050 });
      await page.waitForTimeout(4000);
    } else {
      пустыхПодряд++;
      if (пустыхПодряд >= ПУСТЫХ_ПОДРЯД_СТОП) {
        сказать(`  ${ПУСТЫХ_ПОДРЯД_СТОП} пустых месяца подряд — история закончилась`);
        break;
      }
    }

    await page.mouse.click(стрелка.x, стрелка.y);
    await page.waitForTimeout(6000);
    if (шаг % 6 === 5) await page.screenshot({ path: `${СНИМКИ}ночь-задачи-${шаг}.png` });
  }
}

// ─────────────────────────── этап 3: заметки ───────────────────────────────
async function этапЗаметки(page) {
  сказать('=== этап 3: разведка заметок ===');
  // Известно (Ольга, 14.10.2026): кроме задач менеджеры пишут «Заметки»,
  // и они видны в карточке клиента. Артюхов часто писал заметку вместо
  // задачи — значит часть истории мы теряем. Ищем, откуда их взять списком.
  await page.screenshot({ path: СНИМКИ + 'ночь-заметки-1-меню.png' });

  // Ищем в интерфейсе всё, что похоже на отдельный список заметок.
  const найдено = await page.evaluate(() => {
    const слова = [];
    document.querySelectorAll('*').forEach(el => {
      if (el.children.length !== 0) return;
      const s = (el.innerText || '').trim();
      if (/заметк/i.test(s) && s.length < 60) слова.push(s);
    });
    return [...new Set(слова)];
  });
  сказать('  элементы со словом «заметк» на экране: ' + JSON.stringify(найдено));

  // Открываем карточку клиента, у которого заметка точно есть (из обхода 28.09).
  const карточки = 'D:\\Проекты\\Анализ работы Отдела продаж\\Скрипты\\заметки_карточек.jsonl';
  let телефон = null;
  if (fs.existsSync(карточки)) {
    const строки = fs.readFileSync(карточки, 'utf8').split('\n').filter(Boolean);
    for (const s of строки) {
      try {
        const r = JSON.parse(s);
        if (r.телефон && r.признаки && r.признаки.length) { телефон = r.телефон; break; }
      } catch (e) { /* пропускаем битую строку */ }
    }
  }
  // Телефон в журнал не пишем: журнал уезжает в лог прогона, а тот виден
  // всем, у кого есть доступ к репозиторию. В облаке это была бы утечка
  // персональных данных в открытый лог.
  сказать('  телефон для проверки карточки: ' + (телефон ? 'найден, скрыт' : 'нет'));
  if (!телефон) return;

  // Ищем клиента через поиск в разделе «Клиенты».
  await page.mouse.click(29, 112);
  await page.waitForTimeout(5000);
  await clickText(page, 'Клиенты', true);
  await page.waitForTimeout(9000);
  await page.keyboard.press('Control+F');
  await page.waitForTimeout(2500);
  await page.keyboard.type(телефон, { delay: 60 });
  await page.keyboard.press('Enter');
  await page.waitForTimeout(7000);
  await page.screenshot({ path: СНИМКИ + 'ночь-заметки-2-поиск.png' });

  const первая = await page.evaluate(() => {
    const l = document.querySelector('.gridLine');
    if (!l) return null;
    const r = l.getBoundingClientRect();
    return { x: r.x + 120, y: r.y + r.height / 2 };
  });
  if (первая) {
    await page.mouse.dblclick(первая.x, первая.y);
    await page.waitForTimeout(9000);
    await page.screenshot({ path: СНИМКИ + 'ночь-заметки-3-карточка.png', fullPage: true });
    const текст = await page.evaluate(() => document.body.innerText || '');
    fs.writeFileSync(СНИМКИ + 'ночь-заметки-карточка.txt', текст, 'utf8');
    сказать('  карточка открыта, текст сохранён (' + текст.length + ' знаков)');
  }
}

(async () => {
  сказать('НОЧНАЯ ВЫГРУЗКА начата');
  const browser = await chromium.launch({ channel: КАНАЛ });
  const ctx = await browser.newContext({
    viewport: { width: 1680, height: 1050 }, locale: 'ru-RU', acceptDownloads: true,
  });
  const page = await ctx.newPage();

  // Жёсткие ограничения по времени — обязательно.
  // 15.10.2026 скрипт завис на 5,5 часов: поиск стрелки шёл с 22:47 до 04:23,
  // и всё это время сессия 1С держалась открытой. Причина в том, что у
  // page.evaluate по умолчанию НЕТ ограничения: если страница перестала
  // отвечать, вызов ждёт бесконечно. Теперь любая операция падает через
  // минуту, и ночь не тратится впустую.
  page.setDefaultTimeout(60000);
  page.setDefaultNavigationTimeout(120000);

  try {
    await loginAndSwitch(page);
    await page.waitForTimeout(4000);
  } catch (e) {
    сказать('НЕ УДАЛОСЬ ВОЙТИ: ' + e.message);
    await browser.close();
    process.exit(1);
  }

  for (const [имя, шаг] of [
    ['клиенты', этапКлиенты],
    ['задачи', этапЗадачи],
    // Разведку заметок в ежедневном прогоне пропускаем: она нужна была один
    // раз, чтобы понять, откуда брать заметки, а времени занимает больше, чем
    // сами задачи. Ольга просила, чтобы ежедневная выгрузка была быстрой.
    ...(БЕЗ_ЗАМЕТОК ? [] : [['заметки', этапЗаметки]]),
  ]) {
    try {
      await шаг(page);
    } catch (e) {
      сказать(`ЭТАП «${имя}» УПАЛ: ${e.message}`);
      await page.screenshot({ path: `${СНИМКИ}ночь-ошибка-${имя}.png` });
    }
  }

  сказать('НОЧНАЯ ВЫГРУЗКА закончена');
  fs.writeFileSync(path.join(ПАПКА, `итог-${СЕГОДНЯ}.txt`), логи.join('\n'), 'utf8');

  // Компактная сводка: её читает сессия утром вместо того, чтобы разбирать
  // журнал целиком. Одна строка на месяц — этого достаточно, чтобы понять,
  // что ночь прошла и сколько истории подтянулось, и не жечь лишние токены.
  const сводка = [`ночная выгрузка ${СЕГОДНЯ}`, ''];
  for (const файл of fs.readdirSync(ПАПКА).filter(f => f.startsWith('Задачи-')).sort()) {
    try {
      const д = JSON.parse(fs.readFileSync(path.join(ПАПКА, файл), 'utf8'));
      сводка.push(`${д.месяц}: в 1С ${д.в1С}, собрано ${д.собрано}`);
    } catch (e) {
      сводка.push(`${файл}: не прочитать`);
    }
  }
  const клиенты = fs.readdirSync(ПАПКА).filter(f => f.startsWith('Клиенты-'));
  сводка.push('', 'файлы клиентов: ' + (клиенты.join(', ') || 'нет'));
  fs.writeFileSync(path.join(ПАПКА, `сводка-${СЕГОДНЯ}.txt`), сводка.join('\n'), 'utf8');
  сказать('сводка записана: ' + сводка.length + ' строк');

  // ── трек выгрузок ────────────────────────────────────────────────────────
  // Ольга 15.10.2026: «надо сохранить трек этой выгрузки». Трек — это журнал
  // каждого запуска: когда был, что собрал, сколько. Две формы сразу:
  //   трек.jsonl        — машиночитаемая, по строке на запуск;
  //   трек-выгрузок.md  — таблица для человека.
  // Ничего личного здесь нет: только даты и количества, поэтому трек можно
  // хранить в репозитории и видеть историю запусков глазами.
  try {
    let месяцевЗадач = 0, задачВсего = 0, месяцевПолных = 0;
    for (const файл of fs.readdirSync(ПАПКА).filter(f => f.startsWith('Задачи-'))) {
      try {
        const д = JSON.parse(fs.readFileSync(path.join(ПАПКА, файл), 'utf8'));
        месяцевЗадач++;
        задачВсего += д.собрано || 0;
        if (д.в1С && д.собрано >= д.в1С) месяцевПолных++;
      } catch (e) { /* битый файл в трек не берём */ }
    }
    const запись = {
      когда: new Date().toISOString().slice(0, 19),
      что: БЕЗ_ЗАМЕТОК ? 'ежедневная выгрузка' : 'полная выгрузка',
      месяцев_назад: МЕСЯЦЕВ_НАЗАД,
      месяцев_собрано: месяцевЗадач,
      месяцев_полностью: месяцевПолных,
      задач: задачВсего,
      клиенты: клиенты.length ? клиенты[клиенты.length - 1] : null,
    };
    fs.appendFileSync(path.join(ПАПКА, 'трек.jsonl'),
                      JSON.stringify(запись) + '\n', 'utf8');

    const таблица = path.join(ПАПКА, 'трек-выгрузок.md');
    if (!fs.existsSync(таблица)) {
      fs.writeFileSync(таблица,
        '# Трек выгрузок из 1С\n\n' +
        'Каждая строка — один запуск. «Месяцев полностью» — сколько месяцев\n' +
        'собрано целиком (`собрано` равно числу задач в 1С), без недобора.\n\n' +
        '| Когда (UTC) | Что | Месяцев собрано | Полностью | Задач | Клиенты |\n' +
        '|---|---|---|---|---|---|\n', 'utf8');
    }
    fs.appendFileSync(таблица,
      `| ${запись.когда} | ${запись.что} | ${запись.месяцев_собрано} | ` +
      `${запись.месяцев_полностью} | ${запись.задач} | ` +
      `${запись.клиенты || '—'} |\n`, 'utf8');
    сказать(`трек записан: ${запись.месяцев_собрано} мес., ${запись.задач} задач`);
  } catch (e) {
    сказать('трек записать не удалось: ' + e.message);
  }

  await browser.close();
  process.exit(0);
})().catch(e => { сказать('ОБЩАЯ ОШИБКА: ' + e.message); process.exit(1); });
