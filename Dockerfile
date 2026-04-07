FROM node:22-alpine AS frontend-build
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM python:3.12-slim AS runtime

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PORT=8000

WORKDIR /app

RUN apt-get update \
    && apt-get install -y --no-install-recommends ffmpeg \
    && rm -rf /var/lib/apt/lists/*

COPY server/requirements.txt server/requirements.txt
RUN pip install --no-cache-dir -r server/requirements.txt

COPY server server
COPY scripts scripts
COPY --from=frontend-build /app/dist dist

RUN mkdir -p /app/data && chmod +x /app/scripts/start.sh

EXPOSE 8000

CMD ["/app/scripts/start.sh"]
