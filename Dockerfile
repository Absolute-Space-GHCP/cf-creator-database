# CatchFire Creator Matching Engine - Cloud Run Dockerfile
# Author: Charley Scholz, JLIT
# Co-authored: Claude Opus 4.5, Claude Code (coding assistant), Cursor (IDE)
# Last Updated: 2026-01-28

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

# Copy built React app from frontend stage
COPY --from=frontend-build /app/web/dist ./web/dist

# Cloud Run sets PORT env var
ENV PORT=8080
ENV NODE_ENV=production

# Start the server
CMD ["node", "src/index.js"]
