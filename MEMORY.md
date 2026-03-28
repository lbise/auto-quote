# Project Memory

- The implementation plan is committed as `c3b82ee` with message `docs: add PoC implementation plan`.
- Git has `commit.gpgsign=true` in this repo environment; use `git commit --no-gpg-sign` when the user explicitly wants an unsigned commit.
- Phase 1 backend foundation is in progress under `server/` with FastAPI, SQLite, Alembic, `GET /api/health`, and settings endpoints.
- Local backend setup uses `python3 -m venv .venv`, `pip install -r server/requirements.txt`, and `alembic -c server/alembic.ini upgrade head`.
- SQLite lives at `data/app.db`; `.gitignore` already excludes the DB file and `.venv`.
