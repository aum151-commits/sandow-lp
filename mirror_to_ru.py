# -*- coding: utf-8 -*-
"""Свежая копия клиентских данных из приватного репозитория в Россию.

Зачем (шаг 3 переноса, 15.10.2026). По 152-ФЗ (ч. 5 ст. 18) запись и хранение
персональных данных россиян должны идти в базах на территории России. Основной
путь у нас пока — приватный репозиторий на GitHub, то есть США. Бот (заявки и
подписчики) уже зеркалит свои файлы в российский бакет сам, при каждой записи;
этот скрипт закрывает остальной контур: отметки продаж, встречи, очереди
приёма, авторов — те файлы, которые ведут облачные задачи.

Это КОПИЯ, а не перенос: пока основным остаётся репозиторий, а бакет лишь
повторяет его. Задача скрипта — чтобы в России всегда лежала свежая версия,
даже если ноутбук выключен, а не «когда-нибудь потом».

Как устроено:
  1. забирает список файлов данных из приватного репозитория (GitHub API);
  2. качает только те, у которых содержимое отличается от лежащего в бакете
     (сравнение по md5 — у S3 это ETag обычного объекта);
  3. заливает изменившиеся.

Что НЕ делает: не трогает снимки входов в кабинеты (это пароли, их место —
секреты GitHub, а не бакет), ничего не удаляет из репозитория и не пишет
в рабочие чаты.

Переменные окружения:
    GH_TOKEN     — доступ к приватному репозиторию;
    YC_S3_KEY_ID, YC_S3_SECRET — ключ облачной службы (есть в секретах sandow-lp);
    S3_BUCKET    — имя бакета, по умолчанию sandow-lead-data.
"""
from __future__ import annotations

import base64
import hashlib
import json
import os
import sys
import urllib.error
import urllib.parse
import urllib.request

sys.stdout.reconfigure(encoding="utf-8", errors="replace")

РЕПО = "aum151-commits/sandow-automation"
ВЕТКА = "main"
БАКЕТ = os.environ.get("S3_BUCKET", "sandow-lead-data").strip()
АДРЕС = "https://storage.yandexcloud.net"
ОБЛАСТЬ = "ru-central1"

# Что забираем. Список папок, а не файлов: новые выгрузки в этих папках
# должны уезжать сами, иначе про них придётся вспоминать — а это не работает.
ПАПКИ = ("data/",)
# Снимки входов и прочие состояния, которые в бакет не нужны.
ПРОПУСКАТЬ = ("storage_state", "state.json", ".png", ".log", ".md", "requirements")

# Файлы, у которых ОСНОВНОЕ хранилище — уже Россия (переключено 15.10.2026):
# их ведёт бот, он пишет в бакет первым, а GitHub получает копию. Копировать
# их сюда из репозитория НЕЛЬЗЯ: копия в GitHub отстаёт, и такое «зеркало»
# затёрло бы свежую российскую запись — то есть потеряло бы заявки и
# подписчиков, ради защиты которых всё и делается.
ВЕДЁТ_БОТ = (
    "data/tg_subscribers.json",
    "data/lead_response_log.json",
    "data/site_leads_by_day.json",
    "data/trainer_subscribers.json",
    "data/trainer_slots.json",
    "data/bot_scheduler_state.json",
    "data/tg_bookings.json",
    "data/op_active_manager.json",
    # Файлы MAX-бота (18.10.2026): их основное хранилище — Россия, и копировать
    # их сюда из репозитория нельзя по той же причине — копия отстаёт.
    "data/max_subscribers.json",
    "data/max_bookings.json",
    "data/max_trainer_subscribers.json",
    "data/max_bot_scheduler_state.json",
    "data/trainers/queue.json",
    # Журналы встреч и отметок продаж (19.10.2026): основное хранилище — Россия.
    # Пишут их облачная задача и бот пометками из чата; копия в репозитории
    # отстаёт, и зеркало затёрло бы свежую пометку.
    "data/conversions/meetings.jsonl",
    "data/conversions/sales_marks.jsonl",
)

ПРЕДЕЛ_ФАЙЛА = 5 * 1024 * 1024


def env(имя: str) -> str:
    return (os.environ.get(имя) or "").strip()


def список_файлов() -> list:
    токен = env("GH_TOKEN")
    if not токен:
        raise SystemExit("не задан GH_TOKEN — список файлов не получить")
    адрес = f"https://api.github.com/repos/{РЕПО}/git/trees/{ВЕТКА}?recursive=1"
    запрос = urllib.request.Request(адрес, headers={
        "Authorization": f"Bearer {токен}",
        "Accept": "application/vnd.github+json",
        "User-Agent": "sandow-mirror"})
    with urllib.request.urlopen(запрос, timeout=45) as ответ:
        дерево = json.loads(ответ.read())
    итог = []
    for узел in дерево.get("tree", []):
        путь = узел.get("path", "")
        if узел.get("type") != "blob" or not путь.startswith(ПАПКИ):
            continue
        if any(часть in путь for часть in ПРОПУСКАТЬ):
            continue
        if путь in ВЕДЁТ_БОТ:
            continue      # основное хранилище — Россия, отсюда копировать нельзя
        if not путь.endswith((".json", ".jsonl", ".csv", ".txt")):
            continue
        if (узел.get("size") or 0) > ПРЕДЕЛ_ФАЙЛА:
            continue
        итог.append(путь)
    return итог


def скачать(путь: str) -> bytes:
    токен = env("GH_TOKEN")
    адрес = (f"https://api.github.com/repos/{РЕПО}/contents/"
             f"{urllib.parse.quote(путь)}?ref={ВЕТКА}")
    запрос = urllib.request.Request(адрес, headers={
        "Authorization": f"Bearer {токен}",
        "Accept": "application/vnd.github+json",
        "User-Agent": "sandow-mirror"})
    with urllib.request.urlopen(запрос, timeout=45) as ответ:
        данные = json.loads(ответ.read())
    return base64.b64decode(данные["content"])


def клиент_бакета():
    try:
        import boto3
    except ImportError:
        raise SystemExit("нет boto3 — установите: pip install boto3")
    return boto3.client("s3", endpoint_url=АДРЕС,
                        aws_access_key_id=env("YC_S3_KEY_ID"),
                        aws_secret_access_key=env("YC_S3_SECRET"),
                        region_name=ОБЛАСТЬ)


def что_лежит(с3) -> dict:
    """md5 по каждому объекту бакета: по нему и решаем, нужна ли запись."""
    итог = {}
    продолжение = None
    while True:
        аргументы = {"Bucket": БАКЕТ}
        if продолжение:
            аргументы["ContinuationToken"] = продолжение
        ответ = с3.list_objects_v2(**аргументы)
        for объект in ответ.get("Contents", []):
            итог[объект["Key"]] = (объект.get("ETag") or "").strip('"')
        if not ответ.get("IsTruncated"):
            break
        продолжение = ответ.get("NextContinuationToken")
    return итог


def main() -> int:
    if not (env("YC_S3_KEY_ID") and env("YC_S3_SECRET")):
        print("нет ключей облака — ничего не делаю")
        return 1
    с3 = клиент_бакета()
    в_бакете = что_лежит(с3)

    файлы = список_файлов()
    обновлено, без_изменений, ошибок = [], 0, []
    for путь in файлы:
        try:
            данные = скачать(путь)
        except Exception as ошибка:  # noqa: BLE001
            ошибок.append(f"{путь}: {type(ошибка).__name__}")
            continue
        хэш = hashlib.md5(данные).hexdigest()
        if в_бакете.get(путь) == хэш:
            без_изменений += 1
            continue
        try:
            с3.put_object(Bucket=БАКЕТ, Key=путь, Body=данные,
                          ContentType="application/json; charset=utf-8",
                          Metadata={"source": "sandow-automation"})
            обновлено.append(путь)
        except Exception as ошибка:  # noqa: BLE001
            ошибок.append(f"{путь}: {type(ошибка).__name__}")

    print(f"файлов данных в репозитории: {len(файлы)}")
    print(f"обновлено в России: {len(обновлено)}")
    for путь in обновлено:
        print("  + " + путь)
    print(f"без изменений: {без_изменений}")
    if ошибок:
        print("не удалось: " + "; ".join(ошибок[:10]))
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
