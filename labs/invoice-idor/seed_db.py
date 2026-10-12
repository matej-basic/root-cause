"""Seeds the billing portal's sqlite database before the app starts.

Reads the per-run flag the Root Cause flagger wrote to the shared volume and
stores it in a low-id invoice that belongs to an internal account, alongside
a handful of ordinary invoices for the demo customer. The app itself never
reads /flag/flag.txt; the flag only ever lives inside this database.
"""

import os
import sqlite3

FLAG_PATH = os.environ.get("FLAG_PATH", "/flag/flag.txt")
DB_PATH = os.environ.get("DB_PATH", "/app/billing.db")

DEMO_CUSTOMER_ID = 4471
DEMO_CUSTOMER_NAME = "Acme Retail Ltd."


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
    cur.execute(
        """
        CREATE TABLE invoices (
            id INTEGER PRIMARY KEY,
            customer_id INTEGER NOT NULL,
            customer_name TEXT NOT NULL,
            amount_due TEXT NOT NULL,
            status TEXT NOT NULL,
            notes TEXT NOT NULL
        )
        """
    )

    flag = read_flag()

    # Hidden internal invoice, well below the demo customer's own id range.
    # Nothing in the UI links to it; it only exists because ids are
    # sequential and the detail endpoint never checks who is asking.
    cur.execute(
        "INSERT INTO invoices (id, customer_id, customer_name, amount_due, status, notes) "
        "VALUES (?, ?, ?, ?, ?, ?)",
        (
            7,
            0,
            "Root Cause Internal",
            "0.00",
            "internal",
            "Reconciliation hold, pending finance sign-off. " + flag,
        ),
    )

    # Ordinary invoices for the demo customer, the ones the portal's own
    # listing is meant to show.
    demo_invoices = [
        (1041, "412.50", "paid", "Q1 hosting renewal, net 30."),
        (1042, "1280.00", "due", "Bulk order, awaiting wire transfer."),
        (1043, "97.20", "paid", "Support plan top-up."),
    ]
    for inv_id, amount, status, notes in demo_invoices:
        cur.execute(
            "INSERT INTO invoices (id, customer_id, customer_name, amount_due, status, notes) "
            "VALUES (?, ?, ?, ?, ?, ?)",
            (inv_id, DEMO_CUSTOMER_ID, DEMO_CUSTOMER_NAME, amount, status, notes),
        )

    conn.commit()
    conn.close()


if __name__ == "__main__":
    main()
