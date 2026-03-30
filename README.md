# auto-quote

React + TypeScript + Vite frontend with a FastAPI + SQLite backend foundation for the AutoQuote PoC.

## Local development

### One-time setup

```bash
npm install
npm run setup:backend
```

### Run the full app

```bash
npm run dev
```

That command now:

- runs the backend migrations
- starts the Vite frontend
- starts the FastAPI backend
- reuses an already-running backend on port `8000` instead of failing
- exposes the app on your local network
- falls back to another backend port if `8000` is occupied by an outdated process

If you only want one side of the app, you can also use:

- `npm run dev:web`
- `npm run dev:api`

From another device on the same network, open:

- `http://<your-machine-ip>:5173`

If port `5173` is already taken, Vite will choose another port and print it in the terminal.

The backend runs on `http://127.0.0.1:8000` and exposes:

- `GET /api/health`
- `GET /api/settings`
- `PATCH /api/settings`
- `GET /api/quotes`
- `POST /api/quotes`
- `GET /api/quotes/{id}`
- `PATCH /api/quotes/{id}`
- `POST /api/quotes/{id}/chat`

The SQLite database file is created at `data/app.db`.

The frontend now includes:

- `/` for the quote dashboard
- `/settings` for business defaults
- `/quotes/:id` for the quote workspace shell

Language support currently includes:

- French UI by default
- English and French interface translations
- a per-quote language field for the upcoming assistant flow

Assistant support currently includes:

- stored quote conversation history
- a chat panel inside the quote workspace
- automatic draft updates from a validated assistant response
- no mock fallback; chat only uses a real configured model

Gemini via the OpenAI-compatible endpoint:

- `LLM_MODE=openai`
- `OPENAI_API_KEY`
- `OPENAI_BASE_URL=https://generativelanguage.googleapis.com/v1beta/openai`
- `OPENAI_MODEL=gemini-2.5-flash`

If chat is not configured correctly or the upstream model fails, the workspace now shows the backend error clearly instead of falling back to fake assistant replies.

## Build the app

```bash
npm run build
```

## Build the production image locally

```bash
docker build -t auto-quote .
docker run --rm -p 8000:8000 -v "$(pwd)/data:/app/data" auto-quote
```

The production container now:

- serves the built frontend through FastAPI
- exposes the API and app on port `8000`
- runs Alembic migrations on startup
- stores SQLite at `/app/data/app.db`

## GitHub Actions + GHCR

The workflow at `.github/workflows/docker-image.yml` now builds the full-stack image automatically and:

- builds the Docker image on every pull request
- publishes the image to GitHub Container Registry (`ghcr.io`) on pushes to `main`
- also publishes version tags when you push a tag like `v1.0.0`

Published image names follow this pattern:

```text
ghcr.io/<github-owner>/auto-quote:latest
ghcr.io/<github-owner>/auto-quote:main
ghcr.io/<github-owner>/auto-quote:sha-<commit>
```

### First-time GitHub setup

1. Push this repository to GitHub.
2. Open the repository's `Settings -> Actions -> General` page and make sure workflows can read and write packages.
3. Run the workflow once by pushing to `main`.
4. Check the new package under the repository owner's `Packages` section on GitHub.

The workflow uses the built-in `GITHUB_TOKEN`, so no extra registry secret is needed for publishing to GHCR from the same repository.

## Deploy with SwiftWave

In SwiftWave, create an app that uses your GHCR image, for example:

```text
ghcr.io/<github-owner>/auto-quote:latest
```

Recommended container settings:

- port: `8000`
- restart policy: always
- image pull policy: always or on deploy
- health check path: `/api/health`

Recommended persistent volume:

- mount path: `/app/data`

Recommended environment variables:

- `APP_ENV=production`
- `DATABASE_URL=sqlite:////app/data/app.db`
- `LLM_MODE=auto` or `LLM_MODE=openai`
- `OPENAI_API_KEY` when using a real model

Important SQLite constraint:

- run a single replica only; do not scale this PoC horizontally while using SQLite

If your GitHub package is private, SwiftWave will also need GitHub Container Registry credentials with access to that package.
