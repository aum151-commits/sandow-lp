# -*- coding: utf-8 -*-
"""Общая проверка: работает ли автоматика клуба на самом деле.

Чем отличается от сторожа облачных задач. Сторож смотрит, завершилась ли
задача успешно. Этого мало: 02.09.2026 выяснилось, что проверка пропущенных
звонков полсуток подряд завершалась успешно и при этом ничего не
отправляла — внутри стоял отказ по «тихим часам», посчитанным по чужому
времени. Для сторожа всё было исправно.

Поэтому здесь проверяется результат, а не отметка о запуске: живы ли
сервисы, доходят ли сообщения ботам, есть ли свежие следы настоящей работы
(сформированные планы, записанное состояние звонков), и держит ли ритм
будильник задач.

Отчёт уходит Ольге в личку человеческим языком: что в порядке и что нет.
Запускается раз в сутки и вручную. Ничего не чинит — только сообщает.
"""
from __future__ import annotations

import os
import sys
from datetime import datetime, timedelta, timezone

import requests

sys.stdout.reconfigure(encoding="utf-8", errors="replace")

МОСКВА = timezone(timedelta(hours=3))
СЕЙЧАС = datetime.now(МОСКВА)

ТОКЕН_GH = os.environ.get("PRIVATE_REPO_TOKEN", "").strip()
БОТ = os.environ.get("ALERT_BOT_TOKEN", "").strip()
ЧАТ = os.environ.get("ALERT_CHAT_ID", "").strip()
КЛИЕНТСКИЙ = os.environ.get("CLIENT_BOT_TOKEN", "").strip()
СЛУЖЕБНЫЙ = os.environ.get("TELEGRAM_REPORT_BOT_TOKEN", "").strip()
СЕКРЕТ_БУДИЛЬНИКА = os.environ.get("CRON_SECRET", "").strip()

ЗАГОЛОВКИ = {"Authorization": f"Bearer {ТОКЕН_GH}",
             "Accept": "application/vnd.github+json"}

порядок: list[str] = []
беды: list[str] = []


def хорошо(строка: str) -> None:
    порядок.append(строка)


def плохо(строка: str) -> None:
    беды.append(строка)


def часов_назад(момент: str) -> float:
    когда = datetime.fromisoformat(момент.replace("Z", "+00:00"))
    return (datetime.now(timezone.utc) - когда).total_seconds() / 3600


# --------------------------------------------------------------- проверки

def сервисы() -> None:
    адреса = [
        ("бот заявок", "https://sandow-lead-bot.onrender.com/health", (200,)),
        ("сайт клуба", "https://sandowfitness.ru/", (200,)),
        ("обучение «Лига Сандов»", "https://sandow-wiki.onrender.com/", (200, 302)),
        ("голосовой тренажёр", "https://sandow-voice-trainer.onrender.com/", (200, 401)),
    ]
    for имя, адрес, годные in адреса:
        try:
            о = requests.get(адрес, timeout=90)
            if о.status_code in годные:
                хорошо(f"{имя} отвечает")
            else:
                плохо(f"{имя}: ответ {о.status_code} вместо обычного")
        except Exception as сбой:
            плохо(f"{имя} не отвечает ({type(сбой).__name__})")


def будильник() -> None:
    """Тот, кто задаёт время задачам. Если встал — всё поедет с опозданием."""
    try:
        о = requests.get("https://sandow-cron.onrender.com/health", timeout=90).json()
    except Exception as сбой:
        плохо(f"будильник задач не отвечает ({type(сбой).__name__}) — "
              f"задачи пойдут с задержкой в несколько часов")
        return
    тик = о.get("последний_тик")
    if not о.get("настроен"):
        плохо("будильник задач поднялся, но не настроен (нет доступа к GitHub)")
        return
    if not тик:
        # сервис только что перезапустился — сам себя заведёт в ближайшие минуты
        хорошо("будильник задач жив (только запустился)")
        return
    try:
        было = datetime.strptime(тик, "%d.%m %H:%M").replace(
            year=СЕЙЧАС.year, tzinfo=МОСКВА)
        минут = (СЕЙЧАС - было).total_seconds() / 60
        if минут > 20:
            плохо(f"будильник задач молчит {int(минут)} минут — задачи опаздывают")
        else:
            хорошо(f"будильник задач в ритме (последний раз {тик})")
    except ValueError:
        хорошо("будильник задач отвечает")


def боты() -> None:
    for имя, токен in [("бот для клиентов", КЛИЕНТСКИЙ),
                       ("бот отдела продаж", СЛУЖЕБНЫЙ)]:
        if not токен:
            continue
        try:
            о = requests.get(f"https://api.telegram.org/bot{токен}/getWebhookInfo",
                             timeout=40).json().get("result", {})
        except Exception:
            плохо(f"{имя}: не удалось спросить Telegram")
            continue
        if not о.get("url"):
            плохо(f"{имя}: не подключён к серверу — сообщения не доходят")
            continue
        ждут = о.get("pending_update_count", 0)
        ошибка = о.get("last_error_message")
        if ждут > 5:
            плохо(f"{имя}: {ждут} необработанных сообщений")
        elif ошибка and о.get("last_error_date", 0) > (
                datetime.now(timezone.utc) - timedelta(hours=6)).timestamp():
            плохо(f"{имя}: свежая ошибка «{ошибка}»")
        else:
            хорошо(f"{имя} принимает сообщения")


def задачи() -> None:
    """Облачные задачи: давно ли был успешный прогон и не падают ли подряд."""
    сроки = {
        "Заявки из карточки Яндекса": 8,
        "Отчёт о звонках": 12,
        "Задачи по звонкам": 12,
        "Звонки — пропущенные и ночные": 12,
        "Конверсии отдела продаж": 26,
        "Планы менеджерам": 26,
        "Охрана сайта": 26,
        "Проверка голосового тренажёра": 30,
        "Трафик — еженедельно": 8 * 24,
        "Сверка состава отдела": 8 * 24,
        "Health score новичков": 8 * 24,
        "Трафик — ежемесячно": 33 * 24,
    }
    по_умолчанию = 26
    сломанные = []
    молчащие = []
    for репо in ("aum151-commits/sandow-lp", "aum151-commits/sandow-automation"):
        о = requests.get(f"https://api.github.com/repos/{репо}/actions/workflows",
                         headers=ЗАГОЛОВКИ, timeout=40)
        if о.status_code != 200:
            плохо(f"не удалось прочитать список задач в {репо}")
            continue
        for wf in о.json().get("workflows", []):
            if wf["state"] != "active" or "pages-build" in wf["path"]:
                continue
            прогоны = requests.get(
                f"https://api.github.com/repos/{репо}/actions/workflows/{wf['id']}/runs?per_page=6",
                headers=ЗАГОЛОВКИ, timeout=40).json().get("workflow_runs", [])
            если_нет = сроки.get(wf["name"], по_умолчанию)
            успешные = [r for r in прогоны if r["conclusion"] == "success"]
            if not успешные:
                if прогоны:
                    сломанные.append(wf["name"])
                continue
            прошло = часов_назад(успешные[0]["created_at"])
            if прошло > если_нет:
                молчащие.append(f"{wf['name']} ({int(прошло)} ч)")
            подряд = 0
            for r in прогоны:
                if r["conclusion"] == "failure":
                    подряд += 1
                elif r["conclusion"]:
                    break
            if подряд >= 3:
                сломанные.append(wf["name"])

    if сломанные:
        плохо("падают подряд: " + ", ".join(sorted(set(сломанные))))
    if молчащие:
        плохо("давно не выполнялись: " + ", ".join(sorted(set(молчащие))))
    if not сломанные and not молчащие:
        хорошо("все облачные задачи выполняются вовремя")


def следы_работы() -> None:
    """Самая честная проверка: осталась ли настоящая работа, а не отметка."""
    файлы = [
        ("rpa/data/calls_watch_state.json", 6,
         "проверка пропущенных звонков"),
        ("data/intake/done.json", 30,
         "формирование планов менеджерам"),
    ]
    for путь, срок, что in файлы:
        о = requests.get(
            f"https://api.github.com/repos/aum151-commits/sandow-automation/commits"
            f"?path={путь}&per_page=1", headers=ЗАГОЛОВКИ, timeout=40)
        данные = о.json() if о.status_code == 200 else []
        if not данные:
            плохо(f"{что}: следов работы нет вовсе")
            continue
        прошло = часов_назад(данные[0]["commit"]["committer"]["date"])
        if прошло > срок:
            плохо(f"{что}: последний раз работало {int(прошло)} ч назад")
        else:
            хорошо(f"{что} — работало {int(прошло)} ч назад")


def отправить(текст: str) -> None:
    print(текст)
    if not (БОТ and ЧАТ):
        return
    requests.post(f"https://api.telegram.org/bot{БОТ}/sendMessage",
                  data={"chat_id": ЧАТ, "text": текст}, timeout=40)


def main() -> int:
    for проверка in (сервисы, будильник, боты, задачи, следы_работы):
        try:
            проверка()
        except Exception as сбой:
            плохо(f"проверка «{проверка.__name__}» сама сломалась: {сбой}")

    шапка = f"Проверка автоматики клуба, {СЕЙЧАС:%d.%m %H:%M}"
    if беды:
        текст = (f"⚠️ {шапка}\n\nТребует внимания:\n"
                 + "\n".join(f"• {с}" for с in беды)
                 + f"\n\nОстальное в порядке ({len(порядок)} проверок).")
    else:
        текст = (f"✅ {шапка}\n\nВсё работает. Проверено:\n"
                 + "\n".join(f"• {с}" for с in порядок))
    отправить(текст)
    return 0


if __name__ == "__main__":
    sys.exit(main())
