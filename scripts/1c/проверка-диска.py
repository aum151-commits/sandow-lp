# -*- coding: utf-8 -*-
"""Диагностика Яндекс.Диска клуба: что именно отвечает ВебДАВ и почему.

03.11.2026. Ночная выгрузка 1С падала с `HTTP Error 402: Payment Required`
и на создании папки, и на чтении списка папок. Ольга сказала: «там вроде полно
места, это новый Яндекс.Диск под корпоративную почту sandow.reports@yandex.ru».
Значит 402 — не про место. Этот скрипт показывает, что отвечает Диск шаг за
шагом: корень, папка клуба, пробная папка. Печатает только коды и заголовки,
никаких данных клуба.
"""
import base64
import os
import sys
import urllib.error
import urllib.parse
import urllib.request

ХОСТ = "https://webdav.yandex.ru"
ЛОГИН = os.environ.get("YADISK_LOGIN", "")
ПАРОЛЬ = os.environ.get("YADISK_APP_PASSWORD", "")
ПАПКА = os.environ.get("YADISK_DIR", "Сандов/выгрузки-1С")


def авторизация():
    пара = f"{ЛОГИН}:{ПАРОЛЬ}".encode("utf-8")
    return "Basic " + base64.b64encode(пара).decode("ascii")


def проба(метод, путь="", глубина=None, данные=None, заголовки_доп=None):
    url = ХОСТ + ("/" + urllib.parse.quote(путь) if путь else "/")
    req = urllib.request.Request(url, data=данные, method=метод)
    req.add_header("Authorization", авторизация())
    if глубина:
        req.add_header("Depth", str(глубина))
    for к, з in (заголовки_доп or {}).items():
        req.add_header(к, з)
    print(f"\n--- {метод} /{путь or ''} (Depth={глубина or '-'})")
    try:
        with urllib.request.urlopen(req, timeout=60) as ответ:
            тело = ответ.read().decode("utf-8", "replace")
            print("код:", ответ.status)
            for имя in ("DAV", "Content-Type", "X-Content-Type-Options"):
                if ответ.headers.get(имя):
                    print(f"{имя}: {ответ.headers.get(имя)}")
            print("ответ (первые 400):", " ".join(тело.split())[:400])
            return ответ.status, тело
    except urllib.error.HTTPError as ошибка:
        тело = ""
        try:
            тело = ошибка.read().decode("utf-8", "replace")
        except Exception:
            pass
        print("код:", ошибка.code)
        print("причина:", ошибка.reason)
        for имя in ("WWW-Authenticate", "X-Disk-Error", "Retry-After"):
            if ошибка.headers.get(имя):
                print(f"{имя}: {ошибка.headers.get(имя)}")
        print("ответ:", " ".join(тело.split())[:400])
        return ошибка.code, тело
    except Exception as ошибка:
        print("сбой связи:", repr(ошибка))
        return None, ""


def main():
    print("логин задан:", bool(ЛОГИН), "| пароль приложения задан:", bool(ПАРОЛЬ))
    print("логин:", (ЛОГИН[:3] + "…" + ЛОГИН[-18:]) if len(ЛОГИН) > 21 else "короткий/пустой")
    print("папка клуба:", ПАПКА)
    if not ЛОГИН or not ПАРОЛЬ:
        print("НЕТ: не заданы YADISK_LOGIN / YADISK_APP_PASSWORD")
        return 2

    проба("PROPFIND", "", глубина=0)                 # есть ли вход вообще
    проба("PROPFIND", "", глубина=1)                 # список того, что лежит
    первый = ПАПКА.split("/")[0]
    if первый and первый != ПАПКА:
        проба("PROPFIND", первый, глубина=1)         # папка «Сандов»
    проба("PROPFIND", ПАПКА, глубина=0)              # папка выгрузок
    проба("PROPFIND", ПАПКА, глубина=1)              # дни внутри
    проба("MKCOL", ПАПКА.split("/")[-1] + "-проверка-доступа")  # можно ли создавать
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
