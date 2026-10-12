#!/bin/sh
# Root Cause flag wrapper: seed the billing database from the per-run flag
# the flagger sidecar wrote to the shared volume, then hand off to the app.
set -e

python seed_db.py
exec python app.py
