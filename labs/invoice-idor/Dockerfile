FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY app.py seed_db.py entrypoint.sh ./
RUN chmod +x entrypoint.sh

ENV FLAG_PATH=/flag/flag.txt
ENV DB_PATH=/app/billing.db

EXPOSE 8080

ENTRYPOINT ["./entrypoint.sh"]
