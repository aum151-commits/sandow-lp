# -*- coding: utf-8 -*-
"""Перелинковка лендингов: у каждой страницы появляются родственные ссылки.

ЗАЧЕМ. Замер 16.10.2026: в индексе Яндекса **6 адресов из 128**. В каждой
странице лендинга ровно 5 внутренних ссылок, и ведут они всегда на ОДНИ И ТЕ
ЖЕ пять коммерческих страниц. Значит эти пять и получают весь внутренний вес,
а остальные 120+ — сироты. Страницы-сироты Яндекс в индекс не берёт; это
подтверждает и Bing Webmaster прямой рекомендацией «недостаточно входящих
ссылок с качественных доменов».

ЧТО ДЕЛАЕТ. Считает близость страниц по словам в адресе (папка = тема) и
вписывает в каждую страницу блок «Читайте также» — 6 ссылок на самые близкие
страницы. Получается связный граф: у каждой страницы появляются входящие
ссылки с родственных, а не с одних и тех же пяти.

ПОЧЕМУ СТАТИЧНО, А НЕ ЧЕРЕЗ JS. Ссылка, вставленная скриптом, для поисковика
весит меньше и может не учитываться вовсе. Здесь блок вписывается прямо в
HTML.

БЕЗОПАСНОСТЬ:
  - пишем только в файлы, где ещё нет блока `lp-related` (повторный запуск
    ничего не дублирует);
  - вставляем строго перед `</body>`, вёрстку не трогаем;
  - сама страница на себя не ссылается;
  - ссылки только на существующие папки (проверяется по списку);
  - есть режим пробы и полный отчёт.

Запуск:
    python lp_perelinkovka.py            # проба, покажет план
    python lp_perelinkovka.py --записать
"""
import re
import sys
from collections import Counter
from pathlib import Path

sys.stdout.reconfigure(encoding='utf-8', errors='replace')

РЕПО = Path(r'D:\Проекты\_deploy_sandow_lp')
ЗАПИСАТЬ = '--записать' in sys.argv
ССЫЛОК_НА_СТРАНИЦУ = 9

# Группировка по темам — как разделы в подвале основного сайта. Ольга
# 16.10.2026: «можно ли эти тексты как-то аккуратно сгруппировать, как в
# подвале основного сайта? чтобы не выглядело как полотно». Поэтому ссылки
# идут не одной простыней, а тремя колонками с заголовками.
ТЕМЫ = [
    ('Тренажёрный зал', r'тренаж|зал|штанг|гантел|силов|упражнен|техник|прогресс|кардио|novich|nachinay'),
    ('Единоборства', r'бокс|kikbok|кикбокс|бойцовск|oktagon|oktagon|edinoborstv|mechk'),
    ('Групповые занятия', r'gruppov|группов|joga|йога|zumba|зумб|stretch|стретч|tanc|танц|pilates|пилатес|aerob'),
    ('Восстановление и отдых', r'saun|саун|vosstanov|восстановл|spin|спин|roll|ролл|сон|отдых|массаж'),
    ('Персональный тренер', r'personal|персональн|тренер|trener|individual'),
    ('Питание и результат', r'pitan|питани|nutric|нутриц|pohuden|похуде|ves|вес|massa|масс|kgs'),
    ('Как устроен клуб', r'krugosutoch|круглосуточ|abonement|абонемент|razovoe|разовое|gostev|гостев|cen|цен|oplat|оплат|zamoroz|замороз'),
    ('Район и дорога', r'tekstilshchik|tekstil|печатник|pechatnik|karacharov|карачаров|nizhegorodsk|нижегородск|metro|метро|ryadom|рядом|дом'),
    ('О клубе', r'sandow|сандов|istoriy|истори|klub|клуб|otzyv|отзыв|preimushchestv|преимуществ'),
]

ЗАГОЛОВОК_ПО_УМОЛЧАНИЮ = 'Полезное'


def тема_страницы(папка: str):
    н = папка.lower()
    for название, шаблон in ТЕМЫ:
        if re.search(шаблон, н):
            return название
    return ЗАГОЛОВОК_ПО_УМОЛЧАНИЮ

# Слова, которые есть почти в каждом адресе и не различают темы.
СТОП = {
    'moskva', 'moskvy', 'metro', 'nizhegorodskaya', 'nizhegorodskoy', 'i', 'v',
    'na', 'dlya', 's', 'kak', 'chto', 'klub', 'fitness', 'fitnes', 'fitnessa',
    'sandov', 'goda', 'god', 'vybrat', 'luchshe', 'chem', 'ili', 'a', 'the',
}

НАЧАЛО = '<!-- SNDW · перелинковка лендингов · 16.10.2026 -->'

# Страницы, на которые ссылаться НЕ надо. `mma-i-greppling-moskva` уже
# переписана на «программы больше не идут» (правило Ольги 16.10: групповые
# ММА и грэпплинг ушли с тренером Артуром) — вести на неё поток незачем.
ИСКЛЮЧИТЬ = {'mma-i-greppling-moskva'}


def тема(имя: str):
    части = re.split(r'[-_]+', имя.lower())
    return {ч for ч in части if len(ч) > 2 and ч not in СТОП}


def близость(а, б):
    sa, sb = тема(а), тема(б)
    if not sa or not sb:
        return 0
    общие = sa & sb
    if not общие:
        return 0
    # Жаккар: штрафует за длинные адреса со случайным совпадением
    return len(общие) / len(sa | sb)


def блок(ссылки, заголовки):
    """Блок «Читайте также»: кнопки по темам, по нажатию раскрывается список.

    Идея Ольги 16.10.2026: «а если просто такие как по форме наши кнопки с
    названием блока и уже при нажатии на эту тему выходит список подтем?»

    Сделано на родном <details>, а не на скрипте, и это осознанно:
      - содержимое лежит прямо в странице, поэтому поисковик видит ссылки,
        даже пока блок закрыт (нам для индексации именно это и нужно);
      - работает без JavaScript — если он не загрузился, ссылки всё равно
        доступны;
      - открыть можно несколько тем сразу, ничего не «захлопывается».
    """
    группы = {}
    for п in ссылки:
        т = тема_страницы(п)
        группы.setdefault(т, []).append(п)
    # Колонки идут в осмысленном порядке — как в подвале сайта, а не в том,
    # в каком темы случайно встретились среди ссылок.
    вес = {название: i for i, (название, _) in enumerate(ТЕМЫ)}
    вес[ЗАГОЛОВОК_ПО_УМОЛЧАНИЮ] = len(ТЕМЫ)
    порядок = sorted(группы, key=lambda т: (вес.get(т, 99), т))

    строки = [
        '',
        НАЧАЛО,
        '<nav class="lp-related" aria-label="Читайте также">',
        '<p class="lp-related__h">Читайте также</p>',
        '<div class="lp-related__cols">',
    ]
    for т in порядок:
        строки.append('<details class="lp-related__col">')
        строки.append(f'<summary class="lp-related__t">{т}'
                      f'<span class="lp-related__n">{len(группы[т])}</span></summary>')
        строки.append('<ul class="lp-related__list">')
        for папка in группы[т]:
            строки.append(f'<li><a href="/{папка}/">{заголовки[папка]}</a></li>')
        строки += ['</ul>', '</details>']
    строки += ['</div>', '</nav>', '']
    return '\n'.join(строки)


СТИЛЬ = (
    '<style>'
    '.lp-related{max-width:1180px;margin:48px auto 30px;padding:30px 24px 6px;'
    'border-top:1px solid var(--line,rgba(240,234,222,.13));'
    "font-family:var(--body,'Archivo',system-ui,sans-serif)}"
    '.lp-related__h{font-family:var(--head,"Unbounded",sans-serif);font-weight:600;'
    'font-size:15px;letter-spacing:.02em;margin:0 0 18px;color:var(--ink,#F0EADE);opacity:.92}'
    '.lp-related__cols{display:grid;grid-template-columns:repeat(auto-fit,minmax(210px,1fr));'
    'gap:12px 14px;align-items:start}'
    # Кнопка темы — по форме наших кнопок. Ширину тянем на всю колонку, чтобы
    # кнопки были ОДИНАКОВЫЕ и стояли ровно, а не сбивались кучкой слева
    # (замечание Ольги 16.10.2026: «они как-то все слева? Кучкой?»).
    '.lp-related__t{display:flex;align-items:center;justify-content:space-between;gap:10px;'
    'width:100%;box-sizing:border-box;padding:11px 20px;border-radius:999px;'
    'border:1px solid rgba(233,199,126,.45);background:transparent;cursor:pointer;'
    'font-size:13px;font-weight:500;letter-spacing:.06em;text-transform:uppercase;'
    'color:var(--ink,#F0EADE);list-style:none;transition:background .16s,color .16s,border-color .16s}'
    '.lp-related__t::-webkit-details-marker{display:none}'
    '.lp-related__t::after{content:"+";font-size:15px;line-height:1;color:var(--gold,#E9C77E);'
    'transition:transform .18s}'
    '.lp-related__col[open] .lp-related__t{background:var(--gold,#E9C77E);'
    'border-color:var(--gold,#E9C77E);color:#0B0906}'
    '.lp-related__col[open] .lp-related__t::after{content:"−";color:#0B0906}'
    '.lp-related__n{font-size:11px;opacity:.55}'
    '.lp-related__list{list-style:none;padding:14px 4px 4px 20px;margin:0}'
    '.lp-related__list li{margin:0 0 9px}'
    '.lp-related__list a{font-size:14.5px;line-height:1.45;'
    'color:var(--muted,#B0AA9C);text-decoration:none;border-bottom:1px solid transparent;'
    'transition:color .15s,border-color .15s}'
    '.lp-related__list a:hover{color:var(--gold,#E9C77E);'
    'border-bottom-color:rgba(233,199,126,.4)}'
    '@media (max-width:560px){.lp-related{margin-top:34px;padding:24px 18px 0}'
    '.lp-related__cols{grid-template-columns:1fr;gap:10px}'
    '.lp-related__t{font-size:12.5px;padding:10px 18px}}'
    '</style>'
)


def красивое_имя(папка: str):
    ч = папка.replace('-', ' ').strip()
    return ч[:1].upper() + ч[1:]


def чистое(текст: str):
    """Убирает мягкие переносы и лишние пробелы из заголовка для ссылки."""
    return re.sub(r'\s+', ' ', текст.replace('\xad', '').replace('\u200b', '')).strip()


def главное():
    if not РЕПО.exists():
        raise SystemExit(f'нет папки {РЕПО}')

    папки = sorted(d.name for d in РЕПО.iterdir()
                   if d.is_dir() and (d / 'index.html').exists()
                   and d.name not in ИСКЛЮЧИТЬ)
    print(f'страниц с index.html: {len(папки)}')

    заголовки = {}
    файлы = {}
    for п in папки:
        ф = РЕПО / п / 'index.html'
        файлы[п] = ф
        текст = ф.read_text(encoding='utf-8', errors='replace')
        м = re.search(r'<h1[^>]*>(.*?)</h1>', текст, re.DOTALL)
        if м:
            t = re.sub(r'<[^>]+>', '', м.group(1))
            заголовки[п] = чистое(t)[:70]
        else:
            заголовки[п] = красивое_имя(п)

    print('\n=== БЛИЗОСТЬ ТЕМ: сколько пар нашли друг друга ===')
    план = {}
    без_пары = []
    for п in папки:
        оценки = sorted(((близость(п, д), д) for д in папки if д != п),
                        key=lambda x: (-x[0], x[1]))
        выбранные = [д for о, д in оценки if о > 0][:ССЫЛОК_НА_СТРАНИЦУ]
        if not выбранные:
            без_пары.append(п)
        план[п] = выбранные

    # ДОБОР. У 23 страниц тема в адресе ни с чем не пересекается («фитнес в
    # Текстильщиках», «что взять на первую тренировку»). Оставлять их с тремя
    # ссылками нельзя: они и так сироты. Добираем до нормы страницами,
    # которые получают МЕНЬШЕ ВСЕГО входящих, — так добор не возвращает вес
    # обратно тем же пяти, а размазывает его по периферии.
    def входящие_сейчас(план_):
        счёт = Counter()
        for ссылки in план_.values():
            for с in ссылки:
                счёт[с] += 1
        return счёт

    for п in папки:
        добор_нужен = ССЫЛОК_НА_СТРАНИЦУ - len(план[п])
        if добор_нужен <= 0:
            continue
        счёт = входящие_сейчас(план)
        # сначала родственные по одному общему слову, потом просто редкие
        близкие = sorted(((близость(п, д), счёт[д], д) for д in папки
                          if д != п and д not in план[п]),
                         key=lambda x: (-x[0], x[1], x[2]))
        план[п] += [д for _, _, д in близкие[:добор_нужен]]

    с_парой = sum(1 for п in папки if план[п])
    print(f'  страниц с родственными ссылками: {с_парой} из {len(папки)}')
    print(f'  без пары (получат ссылки с общих коммерческих): {len(без_пары)}')
    if без_пары:
        print('  примеры:', ', '.join(без_пары[:6]))

    # Сколько входящих ссылок получит каждая страница
    входящие = Counter()
    for п, ссылки in план.items():
        for с in ссылки:
            входящие[с] += 1
    было_бы = Counter()
    for п in папки:
        было_бы[п] = 0
    print(f'\n  страниц БЕЗ входящих ссылок сейчас (кроме 5 общих): '
          f'{sum(1 for п in папки if входящие[п] == 0)}')
    print(f'  минимум/максимум входящих после правки: '
          f'{min(входящие[п] for п in папки)} / {max(входящие[п] for п in папки)}')
    print(f'  всего новых ссылок: {sum(len(в) for в in план.values())}')

    пример = папки[0] if папки else None
    if пример:
        print(f'\n=== ПРИМЕР: «{пример}» ===')
        print(f'  заголовок: {заголовки[пример]}')
        for с in план[пример]:
            print(f'    → /{с}/   ({заголовки[с]})')

    if not ЗАПИСАТЬ:
        print('\nПРОБА: ничего не записываю.')
        return

    # ---- запись ----
    правлено = 0
    пропущено = 0
    for п, ссылки in план.items():
        if not ссылки:
            continue
        ф = файлы[п]
        текст = ф.read_text(encoding='utf-8', errors='replace')
        if 'lp-related' in текст:
            # Повторный запуск: старый блок убираем и ставим заново, иначе
            # правки (исключения, чистка переносов) до страницы не дойдут.
            текст = re.sub(re.escape(НАЧАЛО) + r'.*?</nav>', '', текст, flags=re.DOTALL)
            текст = re.sub(r'<style>\.lp-related\{.*?</style>', '', текст, flags=re.DOTALL)
        if '</body>' not in текст:
            пропущено += 1
            continue
        стиль = СТИЛЬ
        новый = текст.replace('</body>', стиль + блок(ссылки, заголовки) + '</body>', 1)
        ф.write_text(новый, encoding='utf-8')
        правлено += 1

    print(f'\nзаписано: {правлено}; пропущено: {пропущено}')

    # Контроль: сколько страниц теперь без входящих ссылок
    пусто = [п for п in папки if входящие[п] == 0]
    print(f'страниц без входящих ссылок после правки: {len(пусто)}')


if __name__ == '__main__':
    главное()
