FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY app.py ./
COPY reports/ /app/data/reports/customer/

ENV REPORTS_DIR=/app/data/reports/customer

EXPOSE 8080

ENTRYPOINT ["python", "app.py"]
