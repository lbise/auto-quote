# Deployment Operations

## Runtime Environment

Production can now run as a single container with FastAPI serving both the API and the built frontend.

Recommended environment variables:

- `APP_ENV=production`
- `PORT=8000`
- `DATABASE_URL=sqlite:////app/data/app.db`
- `APP_USERNAME=owner`
- `APP_PASSWORD=<shared-demo-password>`
- `OPENAI_API_KEY=<provider-key>`
- `OPENAI_BASE_URL=https://generativelanguage.googleapis.com/v1beta/openai`
- `OPENAI_MODEL=gemini-2.5-flash`

If `APP_PASSWORD` is set, the whole app is protected with HTTP Basic Auth except `GET /api/health`.

## Persistent Storage

Mount `/app/data` as a persistent volume so SQLite survives container restarts.

Example runtime path inside the container:

- `/app/data/app.db`

## Backup Procedure

Use the backup script to create a point-in-time SQLite backup without copying the live file directly:

```bash
./scripts/backup-db.sh
```

Optional environment overrides:

- `DATA_DIR=/app/data`
- `DATABASE_FILE=/app/data/app.db`
- `BACKUP_DIR=/app/backups`
- `KEEP_COUNT=14`

The script:

1. opens the live SQLite database
2. creates a timestamped backup via SQLite's backup API
3. stores it as `autoquote-<timestamp>.sqlite3`
4. keeps only the newest `KEEP_COUNT` backups

## Suggested Automation

Run the backup script nightly from the host or your platform scheduler.

Example cron entry:

```cron
0 2 * * * cd /path/to/repo && DATA_DIR=/app/data BACKUP_DIR=/srv/autoquote-backups ./scripts/backup-db.sh
```

## Restore Drill

Before demos, test restoration at least once:

1. stop the app
2. copy a backup file over the main SQLite file
3. restart the container
4. open the dashboard and a recent quote to confirm the restore worked
