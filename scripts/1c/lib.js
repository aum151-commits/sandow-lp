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

async function loginAndSwitch(page) {
  const { login, pass } = readCreds();
  await page.goto(BASE, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(4000);
  await page.fill('#userName', login);
  await page.fill('#userPassword', pass);
  // 29.09.2026: форма входа 1С бывает НА АНГЛИЙСКОМ («User / Password /
  // Log in») — тогда поиск кнопки «Войти» не находил ничего, клик не
  // происходил, и скрипт молча оставался на экране логина: дальше он
  // «искал» клиента в пустоте и честно печатал «найдено 0». Именно так
  // сорвалась сверка автора отзыва 2ГИС. Жмём кнопку в любом языке, а
  // если её нет — Enter в поле пароля.
  const enter = await page.$('text=Войти') || await page.$('text=Log in')
             || await page.$('input[type=submit], button[type=submit]');
  if (enter) await enter.click();
  else await page.keyboard.press('Enter');
  await page.waitForTimeout(15000);

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

module.exports = { readCreds, loginAndSwitch, openMenuItem, ensureSandow, BASE };
