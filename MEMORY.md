# Git Commit Signing Requires Explicit `--no-gpg-sign` In This Repo

- Git has `commit.gpgsign=true` in this repo environment; use `git commit --no-gpg-sign` when the user explicitly wants an unsigned commit.

# Backend Foundation Uses FastAPI, SQLite, Alembic, And Local `.venv`

- Local backend setup uses `python3 -m venv .venv`, `pip install -r server/requirements.txt`, and `alembic -c server/alembic.ini upgrade head`.
- SQLite lives at `data/app.db`; `.gitignore` excludes the DB file, WAL sidecars, and `.venv`.

# Plan And Main Backend-Workspace Foundation Are Already Committed

- The implementation plan is committed as `c3b82ee` with message `docs: add PoC implementation plan`.
- The backend foundation and settings workspace are committed as `52c42ef` with message `feat: add backend foundation and settings workspace`.

# Frontend Now Has Dashboard, Settings, Quote Workspace, LLM Chat, And Print Review Flow

- The app has moved beyond the original starter and now includes routed pages for dashboard, settings, and quote workspace.
- The quote workspace already supports manual editing, deterministic totals, and LLM chat updates.
- Demo polish work added a review-before-print card, visible needs-review highlighting, and a print-only quote sheet driven from the latest saved quote.

# Demo Auth Now Uses Ignored `.env` Secrets And Can Support Shared Session Login

- `.env` is intentionally ignored by git now; `git status --short --ignored .env` should show `!! .env` rather than a tracked file state.
- Production/demo auth credentials are expected to come from env vars like `APP_USERNAME`, `APP_PASSWORD`, and `APP_SESSION_SECRET`.
- The next auth direction chosen by the user is a shared login screen with cookie session, not full per-user data isolation yet.

# Be Careful Around Existing Uncommitted User Changes In Backend LLM Files And Docs

- There are user-local uncommitted changes in files such as `README.md`, `docs/poc-implementation-plan.md`, `server/app/core/config.py`, `server/app/services/chat_service.py`, `server/app/services/llm_service.py`, `src/i18n/resources.ts`, and `.env`.
- Read carefully before editing those files and avoid overwriting or reverting user changes.
