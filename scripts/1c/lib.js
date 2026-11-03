// Общие функции: вход в 1С и переключение на Sandow Fitness.
const fs = require('fs');
const path = require('path');

const CRED_FILE = path.join('D:', 'Проекты', 'Мотивация ОП и РОПа', '1c-доступ.txt');
const BASE = 'https://cloud.1c.fitness/app04/7095/ru/';

// 1С придерживает аккаунт после ~25-30 быстрых входов за день (найдено
// экспериментально 23.08.2026) — ONEC_LOGIN/ONEC_PASSWORD позволяют
// переключиться на второй аккаунт, не трогая файл доступов.
function readCreds() {
  if (process.env.ONEC_LOGIN && process.env.ONEC_PASSWORD) {
    return { login: process.env.ONEC_LOGIN, pass: process.env.ONEC_PASSWORD };
  }
  const text = fs.readFileSync(CRED_FILE, 'utf8');
  return {
    login: (text.match(/логин:\s*(.+)/i) || [])[1].trim(),
    pass: (text.match(/пароль:\s*(.+)/i) || [])[1].trim(),
  };
}

// Журнал входа: внешний скрипт может подписаться на подробности (что набрано,
// какая кнопка нажата, что стало после). Нужно, чтобы разбирать отказы 1С без
// догадок: 03.11.2026 после «Войти» пароль в поле оказался пустым, и было
// непонятно — его не приняли или его не набрали вовсе.
let ЖУРНАЛ = null;
function журналировать(функция) { ЖУРНАЛ = функция; }
function сказать(что) { if (ЖУРНАЛ) { try { ЖУРНАЛ(что); } catch (e) { /* не мешаем входу */ } } }

function длиныПолей(page) {
  return page.evaluate(() => {
    const л = document.querySelector('#userName');
    const п = document.querySelector('#userPassword');
    return { логин: л ? (л.value || '').length : null, пароль: п ? (п.value || '').length : null };
  }).catch(() => ({ логин: null, пароль: null }));
}

async function loginAndSwitch(page) {
  const { login, pass } = readCreds();
  сказать(`вход: логин ${login ? login.length : 0} знаков, пароль ${pass ? pass.length : 0} знаков`);
  await page.goto(BASE, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(4000);
  // 03.11.2026: поля входа ищем и по имени, и по смыслу. Если у формы сменились
  // идентификаторы, page.fill('#userName') падал бы таймаутом, и было бы
  // непонятно, что дело в разметке, а не в пароле.
  const полеЛогин = await page.$('#userName')
    || await page.$('input[name=userName]')
    || await page.$('input[type=text]:visible');
  const полеПароль = await page.$('#userPassword')
    || await page.$('input[type=password]:visible');
  if (!полеЛогин || !полеПароль) {
    throw new Error('на странице входа 1С не нашлось полей «Пользователь» и «Пароль» — '
      + 'изменилась форма входа, нужен разбор разметки');
  }
  await полеЛогин.fill(login);
  await полеПароль.fill(pass);
  const после = await длиныПолей(page);
  сказать(`после набора: логин ${после.логин} знаков, пароль ${после.пароль} знаков`);
  // 29.09.2026: форма входа 1С бывает НА АНГЛИЙСКОМ («User / Password /
  // Log in») — тогда поиск кнопки «Войти» не находил ничего, клик не
  // происходил, и скрипт молча оставался на экране логина: дальше он
  // «искал» клиента в пустоте и честно печатал «найдено 0». Именно так
  // сорвалась сверка автора отзыва 2ГИС. Жмём кнопку в любом языке, а
  // если её нет — Enter в поле пароля.
  const enter = await page.$('text=Войти') || await page.$('text=Log in')
             || await page.$('input[type=submit], button[type=submit]');
  if (enter) {
    const подпись = await enter.evaluate((el) => (el.innerText || el.value || el.tagName || '').toString().trim()).catch(() => '?');
    сказать(`нажимаю кнопку входа: «${подпись.slice(0, 40)}»`);
    await enter.click();
  } else {
    сказать('кнопку входа не нашёл — жму Enter в поле пароля');
    await page.keyboard.press('Enter');
  }
  await page.waitForTimeout(15000);
  const стало = await длиныПолей(page).catch(() => null);
  if (стало) сказать(`после нажатия: логин ${стало.логин}, пароль ${стало.пароль}`);
  const подсказка = await page.evaluate(() => {
    const т = ((document.body && document.body.innerText) || '').replace(/\s+/g, ' ').trim();
    return т.slice(0, 300);
  }).catch(() => '');
  сказать(`после нажатия на экране: ${подсказка || '(пусто)'}`);

  await page.mouse.click(319, 134);
  await page.waitForTimeout(4000);
  const target = await page.evaluate(() => {
    let sandowY = null; const picks = [];
    document.querySelectorAll('div, span, td, a').forEach(el => {
      const t = (el.innerText || '').trim();
      if (el.children.length !== 0) return;
      const r = el.getBoundingClientRect();
      if (r.width === 0 || r.height === 0) return;
      if (t === 'Sandow Fitness') sandowY = r.y + r.height / 2;
      if (t === 'Выбрать') picks.push({ x: r.x + r.width / 2, y: r.y + r.height / 2 });
    });
    if (sandowY === null || !picks.length) return null;
    picks.sort((a, b) => Math.abs(a.y - sandowY) - Math.abs(b.y - sandowY));
    return picks[0];
  });
  if (target) { await page.mouse.click(target.x, target.y); await page.waitForTimeout(10000); }
  return !!target;
}

// Открывает пункт главного меню по названию
async function openMenuItem(page, name) {
  await page.mouse.click(60, 15);
  await page.waitForTimeout(3500);
  const pos = await page.evaluate((n) => {
    let found = null;
    document.querySelectorAll('div, span, td, a, li').forEach(el => {
      if (el.children.length !== 0) return;
      if ((el.innerText || '').trim() !== n) return;
      const r = el.getBoundingClientRect();
      if (r.width > 0 && r.height > 0) found = { x: r.x + r.width / 2, y: r.y + r.height / 2 };
    });
    return found;
  }, name);
  if (!pos) return false;
  await page.mouse.click(pos.x, pos.y);
  await page.waitForTimeout(12000);
  return true;
}

// Переключает структурную единицу на Sandow в любом открытом разделе.
// 1С сбрасывает выбор при переходе в новый раздел, поэтому вызывать после каждого открытия.
async function ensureSandow(page) {
  const btn = await page.evaluate(() => {
    let found = null;
    document.querySelectorAll('div, span, td, a').forEach(el => {
      if (el.children.length !== 0) return;
      if ((el.innerText || '').trim() !== 'MILLIY Fitness') return;
      const r = el.getBoundingClientRect();
      if (r.width > 0 && r.height > 0) found = { x: r.x + r.width / 2, y: r.y + r.height / 2 };
    });
    return found;
  });
  if (!btn) return 'уже Sandow или переключатель не найден';

  await page.mouse.click(btn.x, btn.y);
  await page.waitForTimeout(4000);

  // Баг найден 23.08.2026: клик по надписи "Sandow Fitness" только выделяет
  // текст, диалог "Выберите структурную единицу" остаётся открытым. Нужно
  // нажать ссылку "Выбрать" именно в строке Sandow (та же логика, что уже
  // работает в loginAndSwitch выше) — искать по позиции ближайшую к строке
  // с текстом "Sandow Fitness".
  const target = await page.evaluate(() => {
    let sandowY = null; const picks = [];
    document.querySelectorAll('div, span, td, a').forEach(el => {
      const t = (el.innerText || '').trim();
      if (el.children.length !== 0) return;
      const r = el.getBoundingClientRect();
      if (r.width === 0 || r.height === 0) return;
      if (t === 'Sandow Fitness') sandowY = r.y + r.height / 2;
      if (t === 'Выбрать') picks.push({ x: r.x + r.width / 2, y: r.y + r.height / 2 });
    });
    if (sandowY === null || !picks.length) return null;
    picks.sort((a, b) => Math.abs(a.y - sandowY) - Math.abs(b.y - sandowY));
    return picks[0];
  });
  if (!target) return 'Sandow в списке не найден';
  await page.mouse.click(target.x, target.y);
  await page.waitForTimeout(10000);
  return 'переключено на Sandow';
}

module.exports = { readCreds, loginAndSwitch, openMenuItem, ensureSandow, журналировать, BASE };
