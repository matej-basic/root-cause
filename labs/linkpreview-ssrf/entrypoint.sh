#!/bin/sh
set -e

FLAG_PATH="${FLAG_PATH:-/flag/flag.txt}"
export FLAG_VALUE="$(cat "$FLAG_PATH")"

# Start the loopback-only internal service in the background, then hand off
# to the public-facing link preview app.
python3 /app/internal_service.py &

exec python3 /app/app.py
