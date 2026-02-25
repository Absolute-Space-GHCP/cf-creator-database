# CatchFire Creator Matching Engine - Cloud Run Dockerfile
# Author: Charley Scholz, JLIT
# Co-authored: Claude Opus 4.6, Claude Code (coding assistant), Cursor (IDE)
# Last Updated: 2026-02-25

FROM node:22-slim AS base

# ── Stage 1: Build React frontend ─────────────────────────
FROM base AS frontend-build
WORKDIR /app/web
COPY web/package*.json ./
RUN npm ci
COPY web/ ./
RUN npm run build

# ── Stage 2: Build backend + assemble ─────────────────────
FROM base
WORKDIR /app

# Install Python 3 for scraper pipeline
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 python3-pip python3-venv && \
    rm -rf /var/lib/apt/lists/*

# Install backend dependencies
COPY package*.json ./
RUN npm install

# Copy backend source and build TypeScript
COPY src/ ./src/
COPY tsconfig.json ./
RUN npm run build

# Copy public assets (legacy dashboard, analytics)
COPY public/ ./public/

# Copy data files
COPY data/ ./data/

# Copy scraper pipeline and install Python deps
COPY scraper/ ./scraper/
RUN pip3 install --no-cache-dir --break-system-packages -r scraper/requirements.txt

# Copy built React app from frontend stage
COPY --from=frontend-build /app/web/dist ./web/dist

# Cloud Run sets PORT env var
ENV PORT=8080
ENV NODE_ENV=production

# Start the server
CMD ["node", "src/index.js"]
