#!/bin/sh
set -eu

ROOT_DIR=$(CDPATH= cd -- "$(dirname "$0")/.." && pwd)
DATA_DIR="${DATA_DIR:-$ROOT_DIR/data}"
SOURCE_DB="${DATABASE_FILE:-$DATA_DIR/app.db}"
BACKUP_DIR="${BACKUP_DIR:-$ROOT_DIR/backups}"
TIMESTAMP=$(date -u +"%Y%m%dT%H%M%SZ")
KEEP_COUNT="${KEEP_COUNT:-14}"

if [ ! -f "$SOURCE_DB" ]; then
  echo "Database file not found: $SOURCE_DB" >&2
  exit 1
fi

mkdir -p "$BACKUP_DIR"

python3 - "$SOURCE_DB" "$BACKUP_DIR/autoquote-$TIMESTAMP.sqlite3" <<'PY'
import shutil
import sqlite3
import sys

source, target = sys.argv[1], sys.argv[2]
src = sqlite3.connect(source)
dst = sqlite3.connect(target)
with dst:
    src.backup(dst)
src.close()
dst.close()
shutil.copystat(source, target, follow_symlinks=True)
PY

ls -1t "$BACKUP_DIR"/autoquote-*.sqlite3 2>/dev/null | tail -n +$((KEEP_COUNT + 1)) | xargs -r rm -f

echo "Created backup: $BACKUP_DIR/autoquote-$TIMESTAMP.sqlite3"
