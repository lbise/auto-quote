from __future__ import annotations

import argparse
import os
import shutil
import sqlite3
import tempfile
from pathlib import Path


def main() -> int:
    parser = argparse.ArgumentParser(description="Restore a SQLite database backup. Stop the app before running this.")
    parser.add_argument("--source", required=True, help="Backup file to restore from")
    parser.add_argument("--db", default="data/app.db", help="Target SQLite database path")
    args = parser.parse_args()

    source = Path(args.source).resolve()
    target = Path(args.db).resolve()

    if not source.exists():
        raise SystemExit(f"Backup file not found: {source}")

    target.parent.mkdir(parents=True, exist_ok=True)

    with tempfile.NamedTemporaryFile(delete=False, suffix=".db", dir=target.parent) as temp_file:
        temp_path = Path(temp_file.name)

    try:
        with sqlite3.connect(f"file:{source}?mode=ro", uri=True) as source_db:
            with sqlite3.connect(temp_path) as restored_db:
                source_db.backup(restored_db)

        for suffix in ("-wal", "-shm"):
            stale_file = Path(f"{target}{suffix}")
            if stale_file.exists():
                stale_file.unlink()

        shutil.move(temp_path, target)
    finally:
        if temp_path.exists():
            os.unlink(temp_path)

    print(target)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
