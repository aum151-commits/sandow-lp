# Образ будильника. Нужен потому, что у Render отвалилась связь с GitHub и
# обычный деплой «из репозитория» перестал собираться на всех сервисах разом.
# Готовый образ Render забирает из реестра напрямую, git ему при этом не нужен.
FROM python:3.12-slim

WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY app.py .

ENV PORT=10000
CMD gunicorn app:app --bind 0.0.0.0:$PORT --workers 1 --threads 4 --timeout 30
