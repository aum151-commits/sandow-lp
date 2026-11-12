#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Сколько заявок с сайта реально доходило по дням — по журналам бота.

Читает из российского хранилища два файла, которые ведёт бот:
    data/site_leads_by_day.json  — счётчик заявок по дням;
    data/lead_response_log.json  — журнал заявок и того, что по ним сделано.

Печатает ТОЛЬКО даты и количества. Ни телефонов, ни имён: журнал прогона
публичного репозитория читается кем угодно.

Запуск (в облаке, при разведке канала):
    python разведка-заявок.py
"""
from __future__ import annotations

import json
import os
import sys
from collections import Counter

import boto3

sys.stdout.reconfigure(encoding="utf-8", errors="replace")

БАКЕТ = os.environ.get("S3_BUCKET", "sandow-lead-data")
ТОЧКА = os.environ.get("S3_ENDPOINT", "https://storage.yandexcloud.net")
КЛЮЧ = os.environ.get("S3_KEY_ID", "")
СЕКРЕТ = os.environ.get("S3_SECRET", "")


def клиент():
    return boto3.client(
        "s3",
        endpoint_url=ТОЧКА,
        region_name="ru-central1",
        aws_access_key_id=КЛЮЧ,
        aws_secret_access_key=СЕКРЕТ,
    )


def прочитать(путь: str, s3) -> bytes | None:
    try:
        ответ = s3.get_object(Bucket=БАКЕТ, Key=путь)
        return ответ["Body"].read()
    except Exception as ошибка:
        код = getattr(ошибка, "response", {}).get("Error", {}).get("Code", "")
        print(f"{путь}: не прочиталось ({код or type(ошибка).__name__})")
        return None


def дни_из_журнала(данные: bytes) -> Counter:
    """Даты заявок по журналу: понимаем и jsonl, и список, и словарь."""
    текст = данные.decode("utf-8", "replace").strip()
    if not текст:
        return Counter()
    записи: list = []
    if текст.startswith("{") and "\n{" not in текст:
        try:
            содержимое = json.loads(текст)
        except json.JSONDecodeError:
            return Counter()
        if isinstance(содержимое, dict):
            # либо счётчик по дням, либо один объект
            ключи_дат = [к for к in содержимое if str(к)[:2] == "20"]
            if ключи_дат:
                итог = Counter()
                for к, з in содержимое.items():
                    if isinstance(з, int):
                        итог[str(к)] += з
                return итог
            записи = [содержимое]
        elif isinstance(содержимое, list):
            записи = содержимое
    else:
        for строка in текст.splitlines():
            строка = строка.strip().rstrip(",")
            if not строка or строка in ("[", "]"):
                continue
            try:
                записи.append(json.loads(строка))
            except json.JSONDecodeError:
                continue

    итог = Counter()
    for запись in записи:
        if not isinstance(запись, dict):
            continue
        метка = (запись.get("дата") or запись.get("date") or запись.get("время")
                 or запись.get("timestamp") or запись.get("created_at")
                 or запись.get("ts") or "")
        метка = str(метка)
        if len(метка) >= 10:
            итог[метка[:10].replace(".", "-")] += 1
    return итог


def main() -> int:
    if not КЛЮЧ or not СЕКРЕТ:
        print("нет ключей хранилища в окружении")
        return 2
    s3 = клиент()

    print("=== счётчик заявок бота (data/site_leads_by_day.json) ===")
    счётчик = прочитать("data/site_leads_by_day.json", s3)
    if счётчик:
        try:
            данные = json.loads(счётчик.decode("utf-8", "replace"))
            for день in sorted(данные)[-20:]:
                print(f"  {день}: {данные[день]}")
        except json.JSONDecodeError:
            print("  файл не разобрался как JSON")

    print("\n=== журнал заявок (data/lead_response_log.json) ===")
    журнал = прочитать("data/lead_response_log.json", s3)
    if журнал:
        print(f"  размер: {len(журнал)} байт")
        текст = журнал.decode("utf-8", "replace").strip()
        try:
            содержимое = json.loads(текст)
        except json.JSONDecodeError:
            содержимое = None
        if isinstance(содержимое, dict):
            print(f"  это словарь, ключей: {len(содержимое)}")
            # Главное: сколько заявок бот принял и по каким дням. Печатаем
            # только даты и количества — ни телефонов, ни имён.
            даты = Counter()
            взято = 0
            с_сайта = 0
            for ключ, запись in содержимое.items():
                if str(ключ).startswith("site-"):
                    с_сайта += 1
                if not isinstance(запись, dict):
                    continue
                когда = str(запись.get("lead_created_at") or "")[:10].replace(".", "-")
                if len(когда) == 10:
                    даты[когда] += 1
                if запись.get("taken_at"):
                    взято += 1
            print(f"  заявок с сайта (ключ site-…): {с_сайта}")
            print(f"  заявок взято в работу: {взято}")
            if даты:
                print("  заявки по дням (когда создана):")
                for день in sorted(даты)[-16:]:
                    print(f"    {день}: {даты[день]}")
            else:
                print("  дат создания в журнале не нашлось")
        elif isinstance(содержимое, list):
            print(f"  это список, записей: {len(содержимое)}")
            if содержимое and isinstance(содержимое[0], dict):
                print("  поля записи:", ", ".join(str(п)[:20] for п in list(содержимое[0])[:12]))
        else:
            строки = текст.splitlines()
            print("  построчный файл, строк:", len(строки))
            if строки:
                print("  первая строка начинается с:", строки[0].strip()[:40].split(":")[0])
        дни = дни_из_журнала(журнал)
        if дни:
            print("  заявок по дням:")
            for день in sorted(дни)[-20:]:
                print(f"    {день}: {дни[день]}")
            print(f"  всего в журнале: {sum(дни.values())}")
        else:
            print("  дат в журнале не нашлось")

    print("\n=== что ещё лежит в хранилище (имена файлов, без содержимого) ===")
    try:
        ответ = s3.list_objects_v2(Bucket=БАКЕТ, Prefix="data/")
        for объект in ответ.get("Contents", [])[:40]:
            print(f"  {объект['Key']} — {объект['Size']} байт, "
                  f"{объект['LastModified']:%d.%m %H:%M}")
    except Exception as ошибка:
        print("  список не получился:", type(ошибка).__name__)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
