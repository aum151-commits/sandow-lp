"""Обновить сессию Тильды для ежедневной проверки недошедших заявок.

Зачем этот файл. Тильда пускает кабинет только тот браузер, которым сессию
снимали, и сессия живёт не вечно — раз в несколько недель истекает. Пока она
истекла, сторож заявок слеп: он не видит людей, которые оставили телефон на
сайте, а заявка не дошла до 1С. 21.11.2026 так и случилось: Ольге каждый день
приходило «не вижу журнал недошедших заявок».

Что делает: входит в Тильду логином и паролем из `rpa/.env` приватного
репозитория, проверяет, что журнал ошибок читается, снимает сессию и кладёт
её в секрет GitHub `TILDA_STORAGE_STATE` репозитория sandow-lp.

Запуск (с ноутбука, ничего печатать не нужно):
    python "D:\\Проекты\\_deploy_sandow_lp\\обновить-сессию-тильды.py"

Нужны: playwright в питоне, папка приватного репозитория рядом с проектом
(по умолчанию `D:\\Проекты\\_анализ-сен-окт-ноя\\приватный-репозиторий`),
токен GitHub — берётся из настроек репозитория `_deploy_sandow_lp`.

Если Тильда просит подтвердить, что мы не робот, — подождать час-полтора и
повторить: проверка спадает сама.
"""
import base64
import json
import re
import subprocess
import sys
import time
import urllib.request
from pathlib import Path

РЕПО = 'aum151-commits/sandow-lp'
СЕКРЕТ = 'TILDA_STORAGE_STATE'
ПРИВАТНЫЙ = Path(r'D:\Проекты\_анализ-сен-окт-ноя\приватный-репозиторий')
ПУБЛИЧНЫЙ = Path(r'D:\Проекты\_deploy_sandow_lp')
URL_ЖУРНАЛА = 'https://tilda.ru/projects/leads/errors/?projectid=1390263'


def токен():
    remote = subprocess.run(
        ['git', '-C', str(ПУБЛИЧНЫЙ), 'config', '--get', 'remote.origin.url'],
        capture_output=True, text=True, check=True).stdout
    м = re.search(r'ghp_[A-Za-z0-9]+', remote)
    if not м:
        sys.exit('в настройках репозитория нет токена — обновить секрет нечем')
    return м.group(0)


def api(адрес, метод='GET', тело=None, ткн=None):
    данные = json.dumps(тело).encode() if тело is not None else None
    з = urllib.request.Request(адрес, data=данные, method=метод, headers={
        'Authorization': f'Bearer {ткн}',
        'Accept': 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
        'Content-Type': 'application/json'})
    with urllib.request.urlopen(з, timeout=60) as о:
        raw = о.read()
        return о.status, (json.loads(raw) if raw else {})


def снять_сессию():
    from playwright.sync_api import sync_playwright
    sys.path.insert(0, str(ПРИВАТНЫЙ / 'rpa'))
    import os
    os.chdir(ПРИВАТНЫЙ / 'rpa')
    from src.rpa.tilda_session import STORAGE, open_tilda  # noqa: E402

    with sync_playwright() as p:
        браузер, ctx, страница = open_tilda(p)
        if 'Sandow' not in страница.locator('body').inner_text():
            браузер.close()
            sys.exit('войти в Тильду не удалось — вероятно, капча; повторить позже')
        страница.goto(URL_ЖУРНАЛА, wait_until='load', timeout=120000)
        time.sleep(12)
        текст = страница.locator('body').inner_text()
        if 'Sandow' not in текст:
            браузер.close()
            sys.exit('журнал ошибок не открылся — сессию не снимаем')
        ctx.storage_state(path=str(STORAGE))
        браузер.close()
    return Path(STORAGE).read_text(encoding='utf-8')


def main():
    from nacl import encoding, public

    сессия = снять_сессию()
    json.loads(сессия)          # снимаем битую сессию до записи в секрет
    print('сессия снята: %d байт' % len(сессия))

    # В секрет кладём в base64 — так было принято раньше. Задача «Разложить
    # сессии кабинетов» понимает обе записи, но одна общая конвенция
    # избавляет от сюрпризов: 22.11.2026 сырой JSON уронил всю задачу.
    открытым = base64.b64encode(сессия.encode()).decode()

    ткн = токен()
    _, ключ = api(f'https://api.github.com/repos/{РЕПО}/actions/secrets/public-key', ткн=ткн)
    запечатано = public.SealedBox(
        public.PublicKey(ключ['key'].encode(), encoding.Base64Encoder())
    ).encrypt(открытым.encode())
    api(f'https://api.github.com/repos/{РЕПО}/actions/secrets/{СЕКРЕТ}',
        метод='PUT', ткн=ткн,
        тело={'encrypted_value': base64.b64encode(запечатано).decode(),
              'key_id': ключ['key_id']})
    _, ответ = api(f'https://api.github.com/repos/{РЕПО}/actions/secrets/{СЕКРЕТ}', ткн=ткн)
    print('секрет %s обновлён: %s' % (ответ.get('name'), ответ.get('updated_at')))
    print('готово. Проверка заявок пойдёт в ближайшие часы по расписанию.')


if __name__ == '__main__':
    main()
