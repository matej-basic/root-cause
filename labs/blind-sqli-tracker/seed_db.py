"""Run once, before the app starts, by entrypoint.sh.

Reads the per-run flag the flagger sidecar wrote to the shared volume and
seeds a fresh sqlite database: a handful of demo tracking codes (for a
normal "found" lookup) and a secrets row holding the flag. The app itself
never reads /flag/flag.txt; recovering the flag means going through the
blind SQL injection in app.py, one character at a time.
"""

import os
import sqlite3

DB_PATH = os.environ.get("DB_PATH", "/app/data.db")
FLAG_PATH = os.environ.get("FLAG_PATH", "/flag/flag.txt")


def main():
    with open(FLAG_PATH, "r") as f:
        flag = f.read().strip()

    if os.path.exists(DB_PATH):
        os.remove(DB_PATH)

    conn = sqlite3.connect(DB_PATH)
    conn.executescript(
        """
        CREATE TABLE packages (
            id       INTEGER PRIMARY KEY,
            tracking TEXT NOT NULL,
            status   TEXT NOT NULL
        );
        CREATE TABLE secrets (
            id    INTEGER PRIMARY KEY,
            label TEXT NOT NULL,
            value TEXT NOT NULL
        );
        """
    )
    conn.executemany(
        "INSERT INTO packages (tracking, status) VALUES (?, ?)",
        [
            ("HBL10492837", "in transit"),
            ("HBL10492901", "delivered"),
            ("HBL10493115", "out for delivery"),
        ],
    )
    conn.execute(
        "INSERT INTO secrets (label, value) VALUES (?, ?)",
        ("ops-flag", flag),
    )
    conn.commit()
    conn.close()


if __name__ == "__main__":
    main()
