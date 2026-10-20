/* Меню и гамбургер для московских страниц lp.sandowfitness.ru
 * ============================================================
 * Ольга, 20.10.2026: «сделай гамбургеры на московском сайте также, там их
 * тоже видимо нет».
 *
 * Факт на момент правки: на главной sandowfitness.ru меню и гамбургер есть
 * (кнопка 42×40, 14 px от правого края), а на 124 страницах lp — лендингах и
 * статьях — в шапке только логотип и телефон. Человек, попавший на лендинг,
 * навигацию не находит.
 *
 * Что делает файл: дорисовывает в шапку те же пункты, что на главной, и на
 * телефоне убирает их в гамбургер справа — так же, как на главной.
 *
 * Где работает: только на lp.sandowfitness.ru и только вне раздела
 * Богородицка (§0б — проекты не смешиваются).
 */
(function () {
  var хост = location.hostname;
  var путь = location.pathname;
  if (хост.indexOf('lp.sandowfitness.ru') === -1) return;
  if (путь.indexOf('/bogoroditsk') === 0) return;

  var ГЛАВНАЯ = 'https://sandowfitness.ru';
  var ПУНКТЫ = [
    ['Клуб', ГЛАВНАЯ + '/#club'],
    ['Залы', ГЛАВНАЯ + '/#zones'],
    ['Тренеры', ГЛАВНАЯ + '/#trainers'],
    ['Бойцовский клуб', ГЛАВНАЯ + '/fightclub'],
    ['Наши клубы', ГЛАВНАЯ + '/clubs'],
    ['Статьи', 'https://lp.sandowfitness.ru/stati/']
  ];

  function стили() {
    if (document.getElementById('sndw-nav-moskva-css')) return;
    var с = document.createElement('style');
    с.id = 'sndw-nav-moskva-css';
    с.textContent = [
      '.nav-moskva{display:flex;align-items:center;gap:18px;margin-left:auto}',
      '.nav-moskva a{color:#cfc3ae;text-decoration:none;font-size:14px;white-space:nowrap}',
      '.nav-moskva a:hover{color:#e9c77e}',
      '.nav-moskva .nav-cta{background:linear-gradient(180deg,#f3dca6,#e9c77e);color:#1a1408;',
      'border-radius:999px;padding:10px 16px;font-weight:600;font-size:13.5px}',
      '.nav-burger{display:none;width:42px;height:40px;border:1px solid #2e2415;border-radius:10px;',
      'background:transparent;padding:9px 10px;cursor:pointer;box-sizing:border-box}',
      '.nav-burger span{display:block;height:2px;background:#e9c77e;border-radius:2px;margin:3px 0;',
      'transition:transform .2s ease,opacity .2s ease}',
      '.nav-burger[aria-expanded="true"] span:nth-child(1){transform:translateY(5px) rotate(45deg)}',
      '.nav-burger[aria-expanded="true"] span:nth-child(2){opacity:0}',
      '.nav-burger[aria-expanded="true"] span:nth-child(3){transform:translateY(-5px) rotate(-45deg)}',
      '.nav-drop{display:flex;flex-direction:column;gap:2px;position:absolute;left:0;right:0;top:100%;',
      'background:rgba(11,9,6,.98);border-bottom:1px solid #2e2415;padding:8px 16px 14px;z-index:60}',
      '.nav-drop[hidden]{display:none !important}',
      '.nav-drop a{color:#e6dcc8;text-decoration:none;padding:11px 2px;font-size:15.5px;',
      'border-bottom:1px solid rgba(233,199,126,.10)}',
      '.nav-drop .nav-drop-cta{margin-top:12px;background:linear-gradient(180deg,#f3dca6,#e9c77e);',
      'color:#1a1408;border-radius:999px;padding:14px;text-align:center;font-weight:600;border-bottom:0}',
      '@media (max-width:900px){',
      '.nav-moskva{display:none}',
      '.nav-burger{display:block;margin-left:auto;margin-right:-6px}',
      '}',
      '@media (min-width:901px){.nav-drop{display:none !important}}'
    ].join('');
    document.head.appendChild(с);
  }

  function поставить() {
    var шапка = document.querySelector('header');
    if (!шапка || шапка.querySelector('.nav-burger')) return false;
    var ряд = шапка.querySelector('.header-in') || шапка;
    стили();
    if (getComputedStyle(ряд).position === 'static') ряд.style.position = 'relative';

    var меню = document.createElement('nav');
    меню.className = 'nav-moskva';
    меню.setAttribute('aria-label', 'Разделы клуба');
    ПУНКТЫ.forEach(function (п) {
      var а = document.createElement('a');
      а.href = п[1]; а.textContent = п[0];
      меню.appendChild(а);
    });

    var кнопка = document.createElement('button');
    кнопка.className = 'nav-burger';
    кнопка.type = 'button';
    кнопка.setAttribute('aria-label', 'Меню');
    кнопка.setAttribute('aria-expanded', 'false');
    кнопка.innerHTML = '<span></span><span></span><span></span>';

    var панель = document.createElement('div');
    панель.className = 'nav-drop';
    панель.hidden = true;
    ПУНКТЫ.forEach(function (п) {
      var а = document.createElement('a');
      а.href = п[1]; а.textContent = п[0];
      панель.appendChild(а);
    });
    var звонок = документЗвонок();
    if (звонок) панель.appendChild(звонок);

    ряд.appendChild(меню);
    ряд.appendChild(кнопка);
    ряд.appendChild(панель);

    кнопка.addEventListener('click', function () {
      var открыто = кнопка.getAttribute('aria-expanded') === 'true';
      кнопка.setAttribute('aria-expanded', String(!открыто));
      панель.hidden = открыто;
    });
    панель.addEventListener('click', function (е) {
      if (е.target.closest('a')) {
        кнопка.setAttribute('aria-expanded', 'false');
        панель.hidden = true;
      }
    });
    return true;
  }

  /* В панель кладём тот же телефон, что уже стоит в шапке страницы —
   * номер у московского клуба один, выдумывать нечего. */
  function документЗвонок() {
    var тел = document.querySelector('header a[href^="tel:"]');
    if (!тел) return null;
    var а = document.createElement('a');
    а.className = 'nav-drop-cta';
    а.href = тел.getAttribute('href');
    а.textContent = 'Позвонить: ' + (тел.textContent || '').trim();
    return а;
  }

  var попыток = 0;
  function попробовать() {
    if (поставить()) return;
    попыток += 1;
    if (попыток < 40) setTimeout(попробовать, 400);
  }
  попробовать();
  document.addEventListener('DOMContentLoaded', попробовать);
  window.addEventListener('load', попробовать);
})();
