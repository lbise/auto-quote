# auto-quote

React + TypeScript + Vite frontend with a FastAPI + SQLite backend foundation for the AutoQuote PoC.

## Local development

### Frontend

```bash
npm install
npm run dev
```

### Backend

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r server/requirements.txt
alembic -c server/alembic.ini upgrade head
uvicorn app.main:app --reload --app-dir server
```

The backend runs on `http://127.0.0.1:8000` and exposes:

- `GET /api/health`
- `GET /api/settings`
- `PATCH /api/settings`

The SQLite database file is created at `data/app.db`.

## Build the app

```bash
npm run build
```

## Build the frontend image locally

```bash
docker build -t auto-quote .
docker run --rm -p 8080:8080 auto-quote
```

The container currently serves the built Vite app through nginx on port `8080`.

Backend production packaging will be updated in a later PoC phase.

## GitHub Actions + GHCR

The workflow at `.github/workflows/docker-image.yml` does this automatically:

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

- port: `8080`
- restart policy: always
- image pull policy: always or on deploy

If your GitHub package is private, SwiftWave will also need GitHub Container Registry credentials with access to that package.
