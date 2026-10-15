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


def запрос(метод, путь, данные=None, попыток=5):
    """Запрос к Диску с повторами.

    Повторы обязательны: проверено 15.10.2026 — файл на 1,4 МБ с первого и
    второго раза отваливался («EOF occurred in violation of protocol»,
    «Remote end closed connection»), а с третьего загрузился. Яндекс после
    атак на свои дата-центры сам пишет, что «некоторые функции могут не
    работать», поэтому без повторов выгрузка теряла бы крупные файлы —
    а именно они и самые важные.
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
            time.sleep(3 * попытка)
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

    # В лог идут только имена файлов и размеры — никакого содержимого базы.
    отдано = 0
    for ф in файлы:
        try:
            запрос("PUT", f"{цель}/{ф.name}", ф.read_bytes())
            отдано += 1
            print(f"отдано: {ф.name} ({ф.stat().st_size // 1024} КБ)")
        except Exception as ошибка:
            print(f"НЕ отдалось: {ф.name} — {ошибка}")

    print(f"итого отдано файлов: {отдано} из {len(файлы)}")
    return 0 if отдано else 1


if __name__ == "__main__":
    sys.exit(main())
