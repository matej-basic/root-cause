"""Seeds the store's sqlite database before the app starts.

Reads the per-run flag the Root Cause flagger wrote to the shared volume and
stores it as the delivered contents of the "Vault Access Key" catalog item.
The app itself never reads /flag/flag.txt; the flag only ever lives inside
this database and is only returned by a successful checkout.
"""

import os
import sqlite3

FLAG_PATH = os.environ.get("FLAG_PATH", "/flag/flag.txt")
DB_PATH = os.environ.get("DB_PATH", "/app/store.db")


def read_flag():
    try:
        with open(FLAG_PATH, "r") as f:
            flag = f.read().strip()
            if flag:
                return flag
    except OSError:
        pass
    # Local testing fallback so the app still boots without a flagger run.
    return "flag{local-dev-placeholder}"


def main():
    if os.path.exists(DB_PATH):
        os.remove(DB_PATH)

    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()
    cur.executescript(
        """
        CREATE TABLE items (
            sku TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            price_cents INTEGER NOT NULL,
            contents TEXT NOT NULL
        );
        CREATE TABLE wallets (
            sid TEXT PRIMARY KEY,
            balance_cents INTEGER NOT NULL
        );
        CREATE TABLE cart_lines (
            sid TEXT NOT NULL,
            sku TEXT NOT NULL,
            qty INTEGER NOT NULL,
            PRIMARY KEY (sid, sku)
        );
        """
    )

    items = [
        ("sticker", "Sticker pack", 400, "A pack of five laptop stickers."),
        ("notebook", "Notebook", 800, "A5 dotted notebook, 96 pages."),
        ("mug", "Coffee mug", 1200, "Ceramic mug, 330 ml."),
        ("hoodie", "Logo hoodie", 3900, "Heavy cotton hoodie, unisex."),
        ("vault-key", "Vault Access Key", 150000, flag_contents()),
    ]
    cur.executemany("INSERT INTO items VALUES (?, ?, ?, ?)", items)

    conn.commit()
    conn.close()


def flag_contents():
    return "Vault key delivered. Key material: " + read_flag()


if __name__ == "__main__":
    main()
