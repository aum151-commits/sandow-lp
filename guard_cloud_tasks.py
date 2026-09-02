# -*- coding: utf-8 -*-
"""Сторож облачных задач клуба.

Повод: с 25.08.2026 задачи в приватном репозитории не запускались вообще —
кончились бесплатные минуты GitHub. Пять суток не собирались заявки с
карточки Яндекса, и никто этого не заметил: сообщений о таком GitHub не шлёт.

Что делает: смотрит на все задачи с расписанием в обоих репозиториях и
проверяет две вещи —
  * когда в последний раз был УСПЕШНЫЙ прогон (молчание дольше срока — тревога);
  * не падают ли прогоны подряд (три подряд — тревога).

Тревога уходит Ольге в личку и повторяется не чаще раза в сутки на задачу,
чтобы сломанная задача не звонила каждые три часа.
"""
from __future__ import annotations

import json
import os
import sys
from datetime import datetime, timedelta, timezone
from pathlib import Path

import requests

sys.stdout.reconfigure(encoding="utf-8", errors="replace")

ТОКЕН_GH = os.environ.get("PRIVATE_REPO_TOKEN", "").strip()
БОТ = os.environ.get("ALERT_BOT_TOKEN", "").strip()
ЧАТ = os.environ.get("ALERT_CHAT_ID", "").strip()

СОСТОЯНИЕ = Path("state_cloud_guard.json")

# сколько задача может молчать, прежде чем это станет тревогой.
# Считаем щедро: расписание GitHub само по себе опаздывает на часы.
# Сроки щедрые не от лени: расписание GitHub само опаздывает на часы
# (измерено — «каждые 20 минут» приходило раз в 4,4 часа). Ставить порог
# в 3 часа значит завести сторожа, который звенит на исправной системе,
# а на такого перестают обращать внимание.
СРОКИ = {
    "Заявки из карточки Яндекса": 8,      # заявки клиентов — самое важное
    "Отчёт о звонках": 12,
    "Задачи по звонкам": 12,
    "Конверсии отдела продаж": 26,        # раз в сутки достаточно
    "Проверка голосового тренажёра": 30,
    "Будильник сервисов": 8,
    "Сторож лид-бота": 8,
    # Недельные и месячные задачи. Без своих сроков они попадали под общий
    # порог в 26 часов и звенели каждый вторник, хотя работали правильно —
    # сторож, который поднимает ложную тревогу, обесценивает настоящую.
    "Трафик — еженедельно": 8 * 24,
    "Сверка состава отдела": 8 * 24,
    "Health score новичков": 8 * 24,
    "Трафик — ежемесячно": 33 * 24,
}
СРОК_ПО_УМОЛЧАНИЮ = 26

ЗАГОЛОВКИ = {"Authorization": f"Bearer {ТОКЕН_GH}",
             "Accept": "application/vnd.github+json"}


def состояние() -> dict:
    if СОСТОЯНИЕ.exists():
        try:
            return json.loads(СОСТОЯНИЕ.read_text(encoding="utf-8"))
        except json.JSONDecodeError:
            pass
    return {}


def сообщить(текст: str) -> None:
    if not (БОТ and ЧАТ):
        print("не задан бот для тревог")
        return
    requests.post(f"https://api.telegram.org/bot{БОТ}/sendMessage",
                  data={"chat_id": ЧАТ, "text": текст}, timeout=40)


def проверить(репо: str) -> list[str]:
    беды = []
    r = requests.get(f"https://api.github.com/repos/{репо}/actions/workflows",
                     headers=ЗАГОЛОВКИ, timeout=40)
    if r.status_code != 200:
        return [f"{репо}: не получить список задач (код {r.status_code})"]

    сейчас = datetime.now(timezone.utc)
    for wf in r.json().get("workflows", []):
        имя, путь = wf["name"], wf["path"]
        if "pages-build" in путь or wf["state"] != "active":
            continue

        runs = requests.get(
            f"https://api.github.com/repos/{репо}/actions/workflows/{wf['id']}/runs?per_page=10",
            headers=ЗАГОЛОВКИ, timeout=40,
        ).json().get("workflow_runs", [])
        по_расписанию = [x for x in runs if x["event"] == "schedule"]
        if not по_расписанию:
            continue  # задача только ручная — молчание не беда

        успешные = [x for x in по_расписанию if x["conclusion"] == "success"]
        срок = СРОКИ.get(имя, СРОК_ПО_УМОЛЧАНИЮ)

        if not успешные:
            беды.append(f"«{имя}»: ни одного успешного прогона за последние "
                        f"{len(по_расписанию)} попыток")
            continue

        когда = datetime.fromisoformat(успешные[0]["created_at"].replace("Z", "+00:00"))
        часов = (сейчас - когда).total_seconds() / 3600
        if часов > срок:
            беды.append(f"«{имя}»: последний успешный прогон {часов:.0f} ч назад "
                        f"(допустимо {срок} ч)")
            continue

        подряд = 0
        for x in по_расписанию:
            if x["conclusion"] == "failure":
                подряд += 1
            else:
                break
        if подряд >= 3:
            беды.append(f"«{имя}»: {подряд} падения подряд")

    return беды


def main() -> None:
    if not ТОКЕН_GH:
        print("нет токена GitHub")
        return

    все = []
    for репо in ("aum151-commits/sandow-lp", "aum151-commits/sandow-automation"):
        найдено = проверить(репо)
        for б in найдено:
            все.append(б)
            print(f"   {б}")
        print(f"{репо}: проблем {len(найдено)}")

    st = состояние()
    сегодня = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    новые = [б for б in все if st.get(б) != сегодня]

    if новые:
        текст = ("Облачные задачи требуют внимания:\n\n"
                 + "\n".join(f"• {б}" for б in новые)
                 + "\n\nЧаще всего это либо кончились минуты GitHub, либо "
                   "истёк доступ к сервису. Логи: github.com/aum151-commits")
        сообщить(текст)
        print("тревога отправлена, пунктов:", len(новые))
        for б in новые:
            st[б] = сегодня
        СОСТОЯНИЕ.write_text(json.dumps(st, ensure_ascii=False, indent=2),
                             encoding="utf-8")
    else:
        print("всё в порядке или уже сообщали сегодня")


if __name__ == "__main__":
    main()
