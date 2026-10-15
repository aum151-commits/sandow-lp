# -*- coding: utf-8 -*-
"""Сторож клиентских данных — облачная половина.

Локальная половина (`Инструменты\\сторож-данных.py`) проверяет ноутбук: нет ли
у истории удалённого адреса, не завелись ли в ней файлы с ФИО и телефонами, не
поехали ли снимки входов в облачную копию. Она бессильна, когда ноутбук
выключен, а именно там живёт вторая половина риска: клиентские данные заявок
лежат в приватном репозитории на GitHub и на Render — обе площадки в США.

Эта половина запускается в облаке и проверяет то, что видно только оттуда:

  1. Приватный бакет в Яндекс.Облаке закрыт (открытая ссылка отдаёт 403).
  2. Облачная функция «по номеру — имя» без ключа отвечает 403.
  3. В приватном репозитории нет файлов с клиентскими данными и снимков
     входов — ни по именам, ни по содержимому.
  4. В этом (публичном) репозитории тоже нет выгрузок клиентов.

Правила те же, что у локальной половины, и по той же причине: имя обманывает.
Признак базы — скопление: пять и более РАЗНЫХ мобильных номеров в одном
файле-данных. Одиночный номер — норма (телефон клуба, тренера, блогера).

Сообщение уходит только Ольге в личку (правило §0г) и только когда есть
проблема; в понедельник и при ручном запуске — короткая строка «всё в порядке»,
чтобы молчание сторожа нельзя было спутать с его смертью.

Переменные окружения:
    GH_TOKEN     — токен GitHub (читает приватный репозиторий);
    TG_TOKEN     — бот для сообщения;
    LOOKUP_URL   — адрес облачной функции;
    CHECK_REPORT — «1», чтобы прислать отчёт при любом исходе.
"""
from __future__ import annotations

import json
import os
import re
import sys
import urllib.error
import urllib.parse
import urllib.request
from datetime import datetime, timezone

sys.stdout.reconfigure(encoding="utf-8", errors="replace")

ПРИВАТНЫЙ_РЕПО = "aum151-commits/sandow-automation"
ВЕТКА = "main"

# Приватный бакет: снаружи обязан отвечать 403.
# Бакет, куда переезжают клиентские данные (перенос хранения, шаг 3).
БАКЕТ_ПЕРЕНОСА = "sandow-lead-data"
БАКЕТ = "https://sandow-calls-lookup.storage.yandexcloud.net/справочник.json.gz"

ЛИЧКА_ОЛЬГИ = "220285486"

# Номер мобильного: разделителей внутри бывает до трёх подряд («+7 (904)»).
НОМЕР = re.compile(r"(?:\+7|8)[^0-9]{0,3}9\d{2}[^0-9]{0,3}\d{3}[^0-9]{0,3}\d{2}[^0-9]{0,3}\d{2}")
ПОРОГ_НОМЕРОВ = 5
РАСШИРЕНИЯ_ДАННЫХ = (".txt", ".json", ".jsonl", ".csv")
ПРЕДЕЛ_ФАЙЛА = 1024 * 1024
ПРЕДЕЛ_ФАЙЛОВ = 400

МАСКИ_ИМЁН = [
    r"Клиенты-таблица", r"Клиенты-из-1С", r"ПотКлиенты", r"Список_клиентов",
    r"БЧК\.xls", r"Истекают .*\.xlsx", r"справочник\.json",
    r"телефоны-имена\.json", r"годы-окончания\.json",
    r"trainer_subscribers\.json", r"tg_subscribers\.json",
    r"lead_response_log", r"векторизация-базы/.*\.(csv|xlsx|json)$",
]
# Переносится прямо сейчас (шаг 3, 15.10.2026): эти файлы ещё лежат в приватном
# репозитории, но у них уже есть свежая копия в России — бот зеркалит их при
# каждой записи, остальной контур обновляется задачей каждые 15 минут.
# Сообщать о них каждое утро как о проблеме — значит приучать не читать
# сторожа; поэтому они идут отдельной строкой, а не в списке бед.
ПЕРЕНОСИТСЯ = (
    "data/lead_response_log.json",
    "data/tg_subscribers.json",
    "data/trainer_subscribers.json",
    "data/max_subscribers.json",
)
МАСКИ_СЕССИЙ = [
    r"storage_state", r"_lk_state\.json$", r"skillspace_state\.json$",
    r"сессия-.*\.json$", r"1c-выгрузка/state\.json$",
]
ПРОПУСКАТЬ_ПАПКИ = ("node_modules", ".venv", "venv", "__pycache__", ".git")

ОТЧЁТ_ВСЕГДА = (os.environ.get("CHECK_REPORT") or "").strip() in ("1", "true", "да")


def env(имя: str) -> str:
    return (os.environ.get(имя) or "").strip()


def мобильные_в_тексте(текст: str) -> set:
    итог = set()
    for найдено in НОМЕР.finditer(текст):
        цифры = re.sub(r"\D", "", найдено.group(0))
        if len(цифры) == 11 and цифры[0] in "78" and цифры[1] == "9":
            итог.add(цифры[1:])
    return итог


def имя_подозрительно(путь: str) -> str:
    """Пустая строка — имя чистое, иначе причина, по которой файл не место в git."""
    for маска in МАСКИ_ИМЁН:
        if re.search(маска, путь, re.IGNORECASE):
            return "файл с клиентскими данными"
    for маска in МАСКИ_СЕССИЙ:
        if re.search(маска, путь, re.IGNORECASE):
            return "снимок входа"
    return ""


# --- 1. бакет --------------------------------------------------------------

def проверить_бакет() -> tuple[bool, str]:
    адрес = urllib.parse.quote(БАКЕТ, safe=":/?&=%")
    try:
        with urllib.request.urlopen(urllib.request.Request(адрес), timeout=25) as ответ:
            код = ответ.status
    except urllib.error.HTTPError as ошибка:
        код = ошибка.code
    except Exception as ошибка:  # noqa: BLE001
        return False, f"бакет не удалось проверить ({type(ошибка).__name__})"
    if код == 200:
        return False, "БАКЕТ ОТКРЫТ ВСЕМ: база клиентов доступна без ключа"
    if код not in (403, 404):
        return False, f"бакет отвечает кодом {код}, ждали 403"
    return True, "бакет закрыт (403 без ключа)"


# --- 2. функция «по номеру — имя» -----------------------------------------

def проверить_функцию() -> tuple[bool, str]:
    адрес = env("LOOKUP_URL")
    if not адрес:
        return False, "не задан LOOKUP_URL — про облачную функцию ничего не знаю"
    запрос = urllib.request.Request(адрес + "?phone=9000000000")
    try:
        with urllib.request.urlopen(запрос, timeout=25) as ответ:
            код = ответ.status
    except urllib.error.HTTPError as ошибка:
        код = ошибка.code
    except Exception as ошибка:  # noqa: BLE001
        return False, f"функция не ответила ({type(ошибка).__name__})"
    if код == 200:
        return False, "ОБЛАЧНАЯ ФУНКЦИЯ ОТКРЫТА: отдаёт имена без ключа"
    if код not in (401, 403):
        return False, f"функция отвечает кодом {код}, ждали 403 без ключа"
    return True, "функция закрыта (403 без ключа)"


# --- 3. приватный репозиторий ---------------------------------------------

def проверить_приватный_репозиторий() -> list:
    токен = env("GH_TOKEN")
    if not токен:
        return ["не задан GH_TOKEN — приватный репозиторий не проверен"]
    шапки = {"Authorization": f"Bearer {токен}", "Accept": "application/vnd.github+json"}
    адрес = (f"https://api.github.com/repos/{ПРИВАТНЫЙ_РЕПО}/git/trees/"
             f"{ВЕТКА}?recursive=1")
    try:
        with urllib.request.urlopen(urllib.request.Request(адрес, headers=шапки),
                                    timeout=45) as ответ:
            дерево = json.loads(ответ.read())
    except Exception as ошибка:  # noqa: BLE001
        return [f"приватный репозиторий не прочитан ({type(ошибка).__name__})"]

    беды = []
    проверено = 0
    for узел in дерево.get("tree", []):
        путь = узел.get("path", "")
        if узел.get("type") != "blob":
            continue
        if any(часть in путь for часть in ПРОПУСКАТЬ_ПАПКИ):
            continue
        что = имя_подозрительно(путь)
        if что:
            if путь in ПЕРЕНОСИТСЯ:
                continue      # переносится, копия в России уже есть — см. main
            беды.append(f"в приватном репозитории {что}: {путь}")
            continue
        if not путь.lower().endswith(РАСШИРЕНИЯ_ДАННЫХ):
            continue
        if (узел.get("size") or 0) > ПРЕДЕЛ_ФАЙЛА or проверено >= ПРЕДЕЛ_ФАЙЛОВ:
            continue
        проверено += 1
        сырой = f"https://raw.githubusercontent.com/{ПРИВАТНЫЙ_РЕПО}/{ВЕТКА}/{urllib.parse.quote(путь)}"
        try:
            with urllib.request.urlopen(urllib.request.Request(сырой, headers=шапки),
                                        timeout=30) as ответ:
                текст = ответ.read().decode("utf-8", errors="ignore")
        except Exception:  # noqa: BLE001
            continue
        найдено = мобильные_в_тексте(текст)
        if len(найдено) >= ПОРОГ_НОМЕРОВ:
            беды.append(f"в приватном репозитории {len(найдено)} телефонов в одном файле: {путь}")
    print(f"  приватный репозиторий: файлов просмотрено {проверено}")
    return беды


# --- 4. этот (публичный) репозиторий --------------------------------------

def проверить_публичный_репозиторий() -> list:
    """Идёт по уже склонированной рабочей копии — то есть по этому репозиторию."""
    беды = []
    корень = os.getcwd()
    for папка, папки, файлы in os.walk(корень):
        папки[:] = [п for п in папки if п not in ПРОПУСКАТЬ_ПАПКИ]
        for имя in файлы:
            полный = os.path.join(папка, имя)
            относительный = os.path.relpath(полный, корень)
            что = имя_подозрительно(относительный)
            if что:
                беды.append(f"в публичном репозитории {что}: {относительный}")
                continue
            if not имя.lower().endswith(РАСШИРЕНИЯ_ДАННЫХ):
                continue
            try:
                if os.path.getsize(полный) > ПРЕДЕЛ_ФАЙЛА:
                    continue
                with open(полный, encoding="utf-8", errors="ignore") as фх:
                    текст = фх.read()
            except OSError:
                continue
            найдено = мобильные_в_тексте(текст)
            if len(найдено) >= ПОРОГ_НОМЕРОВ:
                беды.append(f"в публичном репозитории {len(найдено)} телефонов "
                            f"в одном файле: {относительный}")
    return беды


def отправить(текст: str) -> bool:
    токен = env("TG_TOKEN")
    чат = env("TG_CHAT") or ЛИЧКА_ОЛЬГИ
    if not токен:
        print("нет бота — сообщение не отправлено")
        print(текст)
        return False
    данные = urllib.parse.urlencode({"chat_id": чат, "text": текст,
                                     "parse_mode": "HTML",
                                     "disable_web_page_preview": "true"}).encode()
    try:
        with urllib.request.urlopen(f"https://api.telegram.org/bot{токен}/sendMessage",
                                    данные, timeout=40) as ответ:
            тело = json.loads(ответ.read())
            print("сообщение отправлено:", тело.get("ok"))
            return bool(тело.get("ok"))
    except Exception as ошибка:  # noqa: BLE001
        print("сообщение не ушло:", type(ошибка).__name__, str(ошибка)[:150])
        print(текст)
        return False


def проверить_российскую_копию() -> tuple[bool | None, str]:
    """Свежа ли копия данных в России.

    Возвращает (True/False/None, чем это видно). None — проверить не удалось
    (нет ключей): это не беда, но и не «всё хорошо», поэтому так и говорим.

    Зачем проверять: перенос хранения в Россию держится на зеркалах — бота
    и задачи каждые 15 минут. Зеркало может замолчать молча, как это было
    с отзывами 2ГИС (295 прогонов подряд без результата), и без этой проверки
    «данные в России» осталось бы нашим обещанием, а не фактом.
    """
    ключ = env("YC_S3_KEY_ID")
    секрет = env("YC_S3_SECRET")
    if not (ключ and секрет):
        return None, "копия в России: ключей нет, проверить не могу"
    try:
        import hashlib
        import hmac
        from email.utils import parsedate_to_datetime

        объект = "data/tg_subscribers.json"
        # Имя бакета — своё: выше в файле БАКЕТ это адрес справочника
        # «телефон — имя», и подставлять его сюда нельзя (URL с кириллицей
        # падает на UnicodeEncodeError — поймано 15.10.2026).
        адрес = (f"https://storage.yandexcloud.net/{БАКЕТ_ПЕРЕНОСА}/"
                 f"{urllib.parse.quote(объект, safe='/')}")
        хост = "storage.yandexcloud.net"
        сейчас = datetime.now(timezone.utc)
        дата, метка = сейчас.strftime("%Y%m%d"), сейчас.strftime("%Y%m%dT%H%M%SZ")
        пустой = hashlib.sha256(b"").hexdigest()
        подписываем = "host;x-amz-content-sha256;x-amz-date"
        канонический = "\n".join([
            "HEAD", "/" + БАКЕТ_ПЕРЕНОСА + "/" + urllib.parse.quote(объект, safe="/"), "",
            f"host:{хост}", f"x-amz-content-sha256:{пустой}", f"x-amz-date:{метка}",
            "", подписываем, пустой])
        область = f"{дата}/ru-central1/s3/aws4_request"
        к_подписи = "\n".join(["AWS4-HMAC-SHA256", метка, область,
                               hashlib.sha256(канонический.encode()).hexdigest()])
        к = ("AWS4" + секрет).encode()
        for часть in (дата, "ru-central1", "s3", "aws4_request"):
            к = hmac.new(к, часть.encode(), hashlib.sha256).digest()
        подпись = hmac.new(к, к_подписи.encode(), hashlib.sha256).hexdigest()
        запрос = urllib.request.Request(адрес, method="HEAD", headers={
            "x-amz-date": метка, "x-amz-content-sha256": пустой,
            "Authorization": (f"AWS4-HMAC-SHA256 Credential={ключ}/{область}, "
                              f"SignedHeaders={подписываем}, Signature={подпись}")})
        with urllib.request.urlopen(запрос, timeout=25) as ответ:
            изменён = ответ.headers.get("Last-Modified")
    except Exception as ошибка:  # noqa: BLE001
        return None, f"копия в России: не проверить ({type(ошибка).__name__})"

    if not изменён:
        return None, "копия в России: нет отметки времени"
    # Оба времени приводим к UTC с зоной: вычитать «наивное» из «сознательного»
    # Python не даёт (TypeError — поймано 15.10.2026).
    изменён_когда = parsedate_to_datetime(изменён)
    if изменён_когда.tzinfo is None:
        изменён_когда = изменён_когда.replace(tzinfo=timezone.utc)
    возраст = datetime.now(timezone.utc) - изменён_когда.astimezone(timezone.utc)
    минуты = int(возраст.total_seconds() // 60)
    if минуты > 90:
        return False, (f"копия в России устарела: последнее обновление {минуты // 60} ч "
                       f"{минуты % 60} мин назад")
    return True, f"копия в России свежая ({минуты} мин назад)"


def main() -> int:
    проблемы = []
    хорошее = []

    for название, проверка in (("бакет", проверить_бакет),
                               ("облачная функция", проверить_функцию)):
        ок, что = проверка()
        print(("  ок: " if ок else "  ПЛОХО: ") + f"{название} — {что}")
        (хорошее if ок else проблемы).append(что)

    беды_приват = проверить_приватный_репозиторий()
    проблемы += беды_приват
    if not беды_приват:
        хорошее.append("в приватном репозитории клиентских данных нет")

    беды_публич = проверить_публичный_репозиторий()
    проблемы += беды_публич
    if not беды_публич:
        хорошее.append("в публичном репозитории клиентских данных нет")

    свежо, чтоКопия = проверить_российскую_копию()
    print("  " + ("ок: " if свежо else "ПЛОХО: " if свежо is False else "?: ") + чтоКопия)
    if свежо is False:
        проблемы.append(чтоКопия)
    elif свежо is True:
        хорошее.append(чтоКопия)

    понедельник = datetime.now().weekday() == 0

    if проблемы:
        строки = ["<b>Сторож клиентских данных: нашёл проблему</b>", ""]
        строки += [f"• {п}" for п in проблемы[:12]]
        if len(проблемы) > 12:
            строки.append(f"…и ещё {len(проблемы) - 12}")
        строки += ["", "Разбор: data_guard.py в репозитории sandow-lp."]
        отправить("\n".join(строки))
        return 1   # красный прогон — сбой видно и в GitHub, а не только в Телеграме

    if ОТЧЁТ_ВСЕГДА or понедельник:
        # Отдельной строкой — что ещё переезжает: об этом знать полезно,
        # но это не беда, и будить этим каждое утро нельзя.
        хвост = ("" if not ПЕРЕНОСИТСЯ else
                 "\nПереносится в Россию: " + ", ".join(ПЕРЕНОСИТСЯ) +
                 " (копия уже есть, основным пока остаётся репозиторий).")
        отправить("Сторож клиентских данных: всё в порядке. " + "; ".join(хорошее) + "." + хвост)
    print("всё в порядке")
    return 0


if __name__ == "__main__":
    sys.exit(main())
