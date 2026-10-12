"""Seeds the wallet app's sqlite database before the app starts.

Reads the per-run flag the Root Cause flagger wrote to the shared volume and
stores it as the delivered contents of the "Flag Voucher" catalog item. The
app itself never reads /flag/flag.txt; the flag only ever lives inside this
database and is only returned by a successful purchase.
"""

import os
import sqlite3

FLAG_PATH = os.environ.get("FLAG_PATH", "/flag/flag.txt")
DB_PATH = os.environ.get("DB_PATH", "/app/store.db")

GIFTCARD_CODE = "WELCOME10"
GIFTCARD_VALUE_CENTS = 1000  # $10.00
FLAG_VOUCHER_PRICE_CENTS = 5000  # $50.00


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
        CREATE TABLE giftcards (
            code TEXT PRIMARY KEY,
            value_cents INTEGER NOT NULL,
            used INTEGER NOT NULL DEFAULT 0
        );
        CREATE TABLE wallets (
            sid TEXT PRIMARY KEY,
            balance_cents INTEGER NOT NULL
        );
        """
    )

    cur.execute(
        "INSERT INTO items VALUES (?, ?, ?, ?)",
        (
            "flag-voucher",
            "Flag Voucher",
            FLAG_VOUCHER_PRICE_CENTS,
            "Voucher redeemed. Contents: " + read_flag(),
        ),
    )
    cur.execute(
        "INSERT INTO giftcards VALUES (?, ?, 0)",
        (GIFTCARD_CODE, GIFTCARD_VALUE_CENTS),
    )

    conn.commit()
    conn.close()


if __name__ == "__main__":
    main()
