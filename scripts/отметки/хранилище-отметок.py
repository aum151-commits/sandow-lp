#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Отметки задач: читать и сохранять в приватном репозитории, не трогая сайт.

Зачем этот файл. До 12.11.2026 сторожа сохраняли свои отметки («о чём уже
сообщили», «какой трек выгрузок записан») коммитом в публичный репозиторий, из
которого GitHub собирает сайт lp.sandowfitness.ru. Каждый такой коммит запускал
пересборку сайта: за час их набиралось столько, что GitHub упирался в лимит,
пересборки валились пачками, очередь забивалась — и вместе с ними переставали
запускаться задачи по заявкам («стартовый сбой»).

Как устроено теперь. Отметки живут в приватном репозитории `sandow-automation`,
а работа с ними идёт не через git, а через обычные запросы к GitHub: так нет ни
клонирования, ни отправки коммитов, и нечему конфликтовать с ключом самого сайта
(на этом упал первый заход: `git clone` приватного репозитория получал отказ,
потому что checkout оставлял в окружении ключ от публичного).

Использование:
    python хранилище-отметок.py взять  state_cloud_guard.json
    python хранилище-отметок.py положить state_cloud_guard.json "Сторож задач: отметка"

Проверка без записи:
    python хранилище-отметок.py проверить state_cloud_guard.json

Настройки берутся из окружения:
    PRIVATE_REPO_TOKEN — ключ с правом записи в приватный репозиторий;
    STATE_REPO         — «владелец/репозиторий», по умолчанию
                         aum151-commits/sandow-automation.
"""
from __future__ import annotations

import base64
import json
import os
import sys
import urllib.error
import urllib.parse
import urllib.request

РЕПОЗИТОРИЙ = os.environ.get("STATE_REPO", "aum151-commits/sandow-automation")
КЛЮЧ = os.environ.get("PRIVATE_REPO_TOKEN", "")
АДРЕС = "https://api.github.com/repos/{}/contents/{}"


def _запрос(способ: str, путь: str, тело: dict | None = None) -> tuple[int, dict]:
    # Путь в репозитории всегда с прямыми косыми чертами: на ноутбуке он
    # приходит из Windows с обратными, и файл иначе ложится под другим именем
    # (проверено 12.11.2026).
    путь = путь.replace("\\", "/").lstrip("/")
    # Кириллицу в пути кодируем: иначе запрос падает ещё до отправки.
    адрес = АДРЕС.format(РЕПОЗИТОРИЙ, urllib.parse.quote(путь))
    данные = json.dumps(тело).encode() if тело is not None else None
    запрос = urllib.request.Request(адрес, data=данные, method=способ)
    запрос.add_header("Authorization", "Bearer " + КЛЮЧ)
    запрос.add_header("Accept", "application/vnd.github+json")
    if данные:
        запрос.add_header("Content-Type", "application/json")
    try:
        with urllib.request.urlopen(запрос, timeout=60) as ответ:
            return ответ.status, json.loads(ответ.read().decode("utf-8"))
    except urllib.error.HTTPError as ошибка:
        текст = ошибка.read().decode("utf-8", "replace")
        return ошибка.code, {"текст": текст}
    except Exception as ошибка:  # сеть, таймаут и прочее
        return 0, {"текст": str(ошибка)}


def взять(путь: str) -> bytes | None:
    код, ответ = _запрос("GET", путь)
    if код == 200 and "content" in ответ:
        return base64.b64decode(ответ["content"])
    if код == 404:
        return None
    print(f"не удалось прочитать отметку {путь}: {код} {ответ.get('текст', '')[:200]}")
    return None


def положить(путь: str, содержимое: bytes, сообщение: str) -> bool:
    код, ответ = _запрос("GET", путь)
    тело = {
        "message": сообщение,
        "content": base64.b64encode(содержимое).decode(),
    }
    if код == 200 and "sha" in ответ:
        тело["sha"] = ответ["sha"]
        if base64.b64decode(ответ["content"]) == содержимое:
            print(f"{путь}: не изменилось, отправлять нечего")
            return True
    код, ответ = _запрос("PUT", путь, тело)
    if код in (200, 201):
        print(f"{путь}: сохранено ({len(содержимое)} байт)")
        return True
    print(f"{путь}: не сохранилось — {код} {ответ.get('текст', '')[:200]}")
    return False


def main() -> int:
    if len(sys.argv) < 3:
        print(__doc__)
        return 2
    действие, путь = sys.argv[1], sys.argv[2]
    if not КЛЮЧ:
        print("нет ключа PRIVATE_REPO_TOKEN в окружении")
        return 2

    if действие == "взять":
        данные = взять(путь)
        if данные is None:
            print(f"{путь}: в приватном репозитории нет — оставляю то, что рядом")
            return 0
        with open(путь, "wb") as файл:
            файл.write(данные)
        print(f"{путь}: взято из приватного репозитория ({len(данные)} байт)")
        return 0

    if действие == "положить":
        сообщение = sys.argv[3] if len(sys.argv) > 3 else "Отметка задачи"
        try:
            with open(путь, "rb") as файл:
                данные = файл.read()
        except FileNotFoundError:
            print(f"{путь}: локального файла нет — сохранять нечего")
            return 0
        return 0 if положить(путь, данные, сообщение) else 1

    if действие == "проверить":
        данные = взять(путь)
        print(f"{путь}: {'есть, ' + str(len(данные)) + ' байт' if данные else 'нет'}")
        return 0

    print(f"неизвестное действие: {действие}")
    return 2


if __name__ == "__main__":
    raise SystemExit(main())
