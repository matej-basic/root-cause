"""Run once, before the app starts, by entrypoint.sh.

Reads the per-run flag the flagger sidecar wrote to the shared volume and
seeds a fresh sqlite database: an admin account whose `note` column holds
the flag, and a demo customer (for a normal login). The app itself never
reads /flag/flag.txt; recovering the flag means reaching the admin account
through the second-order SQL injection in app.py.
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
            id       INTEGER PRIMARY KEY,
            username TEXT NOT NULL UNIQUE,
            password TEXT NOT NULL,
            email    TEXT NOT NULL,
            role     TEXT NOT NULL,
            note     TEXT NOT NULL DEFAULT ''
        );
        CREATE TABLE resets (
            token   TEXT PRIMARY KEY,
            user_id INTEGER NOT NULL
        );
        """
    )
    conn.execute(
        "INSERT INTO users (username, password, email, role, note)"
        " VALUES (?, ?, ?, ?, ?)",
        (
            "admin",
            os.urandom(16).hex(),
            "a-4c1d9e@mail.harbor-logistics.example",
            "admin",
            flag,
        ),
    )
    conn.execute(
        "INSERT INTO users (username, password, email, role, note)"
        " VALUES (?, ?, ?, ?, ?)",
        ("jsmith", "Harbor2024!", "jsmith@harbor-logistics.example", "customer", ""),
    )
    conn.commit()
    conn.close()


if __name__ == "__main__":
    main()
