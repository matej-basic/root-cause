#!/bin/sh
set -e

python3 /app/seed_db.py
exec python3 /app/app.py
