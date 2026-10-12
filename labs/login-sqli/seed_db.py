"""Run once, before the app starts, by entrypoint.sh.

Reads the per-run flag the flagger sidecar wrote to the shared volume and
seeds a fresh sqlite database: a demo staff user (for a normal login) and a
secrets row holding the flag. The app itself never reads /flag/flag.txt;
recovering the flag means going through the SQL injection in app.py.
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
        CREATE TABLE users (
            id   INTEGER PRIMARY KEY,
            user TEXT NOT NULL,
            pass TEXT NOT NULL,
            role TEXT NOT NULL
        );
        CREATE TABLE secrets (
            id    INTEGER PRIMARY KEY,
            label TEXT NOT NULL,
            value TEXT NOT NULL
        );
        """
    )
    conn.execute(
        "INSERT INTO users (user, pass, role) VALUES (?, ?, ?)",
        ("jsmith", "Harbor2024!", "staff"),
    )
    conn.execute(
        "INSERT INTO secrets (label, value) VALUES (?, ?)",
        ("ops-flag", flag),
    )
    conn.commit()
    conn.close()


if __name__ == "__main__":
    main()
