# -*- coding: utf-8 -*-
"""Отдаёт ночную выгрузку в Яндекс.Диск клуба — по WebDAV.

ПОЧЕМУ ИМЕННО ТАК (выбор сделан 14.10.2026, разбор всех вариантов — в ИТОГ.md):

* **Данные не в GitHub.** Репозиторий публичный, а выгрузка — база клиентов.
  Артефакты публичного репозитория доступны любому, у кого есть учётная запись
  GitHub, поэтому GitHub остаётся только площадкой для запуска.
* **Данные в России.** Яндекс.Диск — российское хранилище, база не покидает
  страну. Это снимает вопрос трансграничной передачи персональных данных
  (152-ФЗ), который возникает при любом зарубежном варианте.
* **Доступ закрыт.** Папка лежит в личном Диске клуба; наружу ничего не
  публикуется, ссылок «поделиться» скрипт не создаёт.
* **Ничего не надо регистрировать.** WebDAV принимает обычный пароль
  приложения («Файлы (WebDAV)» в настройках Яндекс-аккаунта) — это 30 секунд,
  в отличие от OAuth-приложения для REST API Диска.
* **Удобно смотреть.** Ольге файлы видны в привычном Яндекс.Диске, а ноутбук
  забирает их тем же WebDAV, без установки клиента.

Запуск: python3 scripts/1c/otdat-v-hranilishche.py <папка-с-выгрузкой>
Секреты: YADISK_LOGIN, YADISK_APP_PASSWORD
"""
import base64
import os
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from datetime import date
from pathlib import Path

ХОСТ = "https://webdav.yandex.ru"
ПАПКА_НА_ДИСКЕ = os.environ.get("YADISK_DIR", "Сандов/выгрузки-1С")
ЛОГИН = os.environ.get("YADISK_LOGIN", "")
ПАРОЛЬ = os.environ.get("YADISK_APP_PASSWORD", "")


def заголовки():
    пара = f"{ЛОГИН}:{ПАРОЛЬ}".encode("utf-8")
    return {"Authorization": "Basic " + base64.b64encode(пара).decode("ascii")}


def проверить(путь, ожидаемый_размер=None):
    """Есть ли файл на Диске и того ли он размера.

    Нужно потому, что Яндекс может оборвать загрузку и ответить ошибкой — тогда
    файла нет вовсе. Но бывает и хуже: соединение рвётся уже после ответа, и мы
    считаем файл отданным, а его нет. Проверка закрывает оба случая.
    """
    url = ХОСТ + "/" + urllib.parse.quote(путь)
    req = urllib.request.Request(url, method="PROPFIND")
    for ключ, значение in заголовки().items():
        req.add_header(ключ, значение)
    req.add_header("Depth", "0")
    try:
        with urllib.request.urlopen(req, timeout=120) as ответ:
            тело = ответ.read().decode("utf-8", "replace")
    except urllib.error.HTTPError as ошибка:
        if ошибка.code == 404:
            return False
        raise
    if ожидаемый_размер is None:
        return True
    размер = re.search(r"<d:getcontentlength>(\d+)</d:getcontentlength>", тело)
    return True if not размер else int(размер.group(1)) == ожидаемый_размер


def запрос(метод, путь, данные=None, попыток=8):
    """Запрос к Диску с повторами.

    Повторы обязательны: проверено 15.10.2026 — файл на 1,4 МБ с первого и
    второго раза отваливался («EOF occurred in violation of protocol»,
    «Remote end closed connection»), а с третьего загрузился. В облачном
    прогоне того же дня Яндекс оборвал уже файл клиентов на 2,1 МБ — без
    повторов выгрузка осталась бы без самого важного файла.
    """
    последняя = None
    for попытка in range(1, попыток + 1):
        url = ХОСТ + "/" + urllib.parse.quote(путь)
        req = urllib.request.Request(url, data=данные, method=метод)
        for ключ, значение in заголовки().items():
            req.add_header(ключ, значение)
        try:
            with urllib.request.urlopen(req, timeout=600) as ответ:
                return ответ.status
        except urllib.error.HTTPError as ошибка:
            # 4xx повторять бессмысленно: это наша ошибка, а не сбой сети.
            if 400 <= ошибка.code < 500:
                raise
            последняя = ошибка
        except Exception as ошибка:
            последняя = ошибка
        if попытка < попыток:
            time.sleep(4 * попытка)
    raise последняя


def создать_папки(путь):
    """Создаём путь по частям: WebDAV не умеет создавать вложенные папки разом."""
    части = путь.strip("/").split("/")
    текущий = ""
    for часть in части:
        текущий = f"{текущий}/{часть}" if текущий else часть
        try:
            запрос("MKCOL", текущий)
        except urllib.error.HTTPError as ошибка:
            if ошибка.code not in (405, 301):  # уже существует — это нормально
                raise


def main():
    if not ЛОГИН or not ПАРОЛЬ:
        print("Хранилище не настроено: нет YADISK_LOGIN / YADISK_APP_PASSWORD.")
        print("Данные наружу намеренно НЕ отдаются.")
        return 1

    папка = Path(sys.argv[1] if len(sys.argv) > 1 else "vygruzka")
    день = date.today().isoformat()
    цель = f"{ПАПКА_НА_ДИСКЕ}/{день}"

    try:
        создать_папки(цель)
    except Exception as ошибка:
        print(f"Не удалось подготовить папку на Диске: {ошибка}")
        return 1

    файлы = [f for f in папка.rglob("*") if f.is_file()]
    if not файлы:
        print("Нечего отдавать: папка выгрузки пуста")
        return 1

    # Порядок важен: файл клиентов и задачи — самое ценное, их отдаём первыми.
    # В облачном прогоне 15.10.2026 Яндекс оборвал именно файл клиентов, а
    # журналы и снимки прошли — если бы они шли первыми, времени на главное
    # не осталось бы вовсе.
    def важность(ф):
        имя = ф.name.lower()
        if имя.startswith("клиенты"):
            return 0
        if имя.startswith("задачи"):
            return 1
        if имя.startswith("трек"):
            return 2
        if имя.endswith(".png") or имя.endswith(".log"):
            return 9
        return 5

    файлы.sort(key=важность)

    # В лог идут только имена файлов и размеры — никакого содержимого базы.
    отдано = 0
    провалы = []
    for ф in файлы:
        размер = ф.stat().st_size
        try:
            запрос("PUT", f"{цель}/{ф.name}", ф.read_bytes())
            # Проверяем, что файл действительно лёг и целиком: оборванная
            # загрузка может не дать ошибки, и тогда о потере узнали бы
            # только по недостаче данных.
            if проверить(f"{цель}/{ф.name}", размер):
                отдано += 1
                print(f"отдано: {ф.name} ({размер // 1024} КБ, проверено)")
            else:
                провалы.append(ф.name)
                print(f"НЕ отдалось: {ф.name} — на Диске нет или размер другой")
        except Exception as ошибка:
            провалы.append(ф.name)
            print(f"НЕ отдалось: {ф.name} — {ошибка}")

    print(f"итого отдано файлов: {отдано} из {len(файлы)}")
    if провалы:
        print("не ушли: " + ", ".join(провалы))
    # Возвращаем ошибку только если не ушло что-то важное: журналы и снимки
    # не повод валить весь прогон.
    важное_потеряно = any(ф.name.lower().startswith(("клиенты", "задачи"))
                          for ф in файлы if ф.name in провалы)
    return 0 if отдано and not важное_потеряно else 1


if __name__ == "__main__":
    sys.exit(main())
