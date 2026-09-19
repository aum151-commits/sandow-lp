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
  const r = await fetch(url, { method: 'PUT', headers: { ...ghHeaders(), 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  if (!r.ok) log(`ОШИБКА записи очереди обратно: ${r.status} ${await r.text()}`);
  return r.ok;
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

async function login(page) {
  await page.goto(BASE, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(4000);
  await page.fill('#userName', LOGIN);
  await page.fill('#userPassword', PASS);
  const enter = await page.$('text=Войти');
  if (enter) await enter.click();
  await page.waitForTimeout(15000);
  await dismissOk(page);
}

async function openLeadsList(page) {
  let leadsLink = null;
  for (let i = 0; i < 4 && !leadsLink; i++) {
    await page.mouse.click(29, 125); // иконка CRM в левом сайдбаре
    await page.waitForTimeout(3500);
    await dismissOk(page);
    leadsLink = await findByText(page, 'Заявки', true);
  }
  if (!leadsLink) throw new Error('не нашёл ссылку «Заявки» в меню CRM');
  await page.mouse.click(leadsLink.x, leadsLink.y);
  await page.waitForTimeout(9000);
  await dismissOk(page);
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
  await dismissOk(page);

  await selectBogoroditsk(page);

  const name = sanitizeText(entry.name);
  const nameBox = await fieldNear(page, 'Имя:');
  if (nameBox && name) {
    await page.mouse.click(nameBox.x, nameBox.y);
    await page.waitForTimeout(400);
    await page.keyboard.type(name.slice(0, 60), { delay: 25 });
    await page.waitForTimeout(400);
  }

  const phoneBox = await fieldNear(page, 'Телефон');
  if (!phoneBox) throw new Error('не нашёл поле «Телефон»');
  await page.mouse.click(phoneBox.x, phoneBox.y);
  await page.waitForTimeout(400);
  await page.keyboard.type(entry.phone.replace(/\D/g, '').slice(-10), { delay: 25 });
  await page.waitForTimeout(400);

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
  await dismissOk(page);

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

  const { entries, sha } = await fetchQueue();
  if (!entries.length) { log('очередь пуста — в 1С не захожу'); return; }
  log(`в очереди ${entries.length} заявок`);

  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1700, height: 1050 }, locale: 'ru-RU' });
  const page = await ctx.newPage();

  await login(page);

  const failed = [];
  for (const entry of entries) {
    try {
      await openLeadsList(page);
      await createLead(page, entry);
      log(`создано: ${entry.phone} (${entry.tranid})`);
    } catch (e) {
      log(`ОШИБКА для ${entry.tranid} (${entry.phone}): ${e.message}`);
      try { await page.screenshot({ path: path.join(__dirname, `error-${entry.tranid}.png`), fullPage: true }); } catch (e2) {}
      failed.push(entry);
    }
  }

  await browser.close();

  const ok = await writeQueue(failed, sha);
  log(ok
    ? `готово: успешно ${entries.length - failed.length}, осталось в очереди ${failed.length}`
    : 'готово, но очередь на GitHub не обновилась — при следующем запуске возможны повторы');
}

run().catch((e) => { log('НЕОЖИДАННАЯ ОШИБКА: ' + (e && e.stack || e)); process.exit(1); });
