from __future__ import annotations

import argparse
import sqlite3
from datetime import datetime, timezone
from pathlib import Path


def main() -> int:
    parser = argparse.ArgumentParser(description="Create a consistent SQLite backup using the sqlite3 backup API.")
    parser.add_argument("--db", default="data/app.db", help="Source SQLite database path")
    parser.add_argument(
        "--output-dir",
        default="data/backups",
        help="Directory where the backup file should be created",
    )
    parser.add_argument(
        "--output",
        default=None,
        help="Optional explicit backup file path. Overrides --output-dir when set.",
    )
    args = parser.parse_args()

    source = Path(args.db).resolve()
    if not source.exists():
        raise SystemExit(f"Database not found: {source}")

    if args.output:
        target = Path(args.output).resolve()
        target.parent.mkdir(parents=True, exist_ok=True)
    else:
        output_dir = Path(args.output_dir).resolve()
        output_dir.mkdir(parents=True, exist_ok=True)
        timestamp = datetime.now(timezone.utc).strftime("%Y%m%d-%H%M%S")
        target = output_dir / f"autoquote-{timestamp}.db"

    with sqlite3.connect(f"file:{source}?mode=ro", uri=True) as source_db:
        with sqlite3.connect(target) as backup_db:
            source_db.backup(backup_db)

    print(target)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
