# CatchFire Creator Matching Engine - Cloud Run Dockerfile
# Author: Charley Scholz, JLIT
# Co-authored: Claude Opus 4.5, Claude Code (coding assistant), Cursor (IDE)
# Last Updated: 2026-01-28

FROM node:22-slim

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install ALL dependencies (including devDependencies for TypeScript build)
RUN npm install

# Copy source code
COPY src/ ./src/
COPY tsconfig.json ./

# Build TypeScript
RUN npm run build

# Copy public assets (dashboard, analytics)
COPY public/ ./public/

# Copy data files
COPY data/ ./data/

# Cloud Run sets PORT env var
ENV PORT=8080
ENV NODE_ENV=production

# Start the server (runs compiled JS)
CMD ["node", "src/index.js"]
