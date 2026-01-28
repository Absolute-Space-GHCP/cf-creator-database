# AI Golden Master - Cloud Run Dockerfile
FROM node:20-slim

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install --omit=dev

# Copy source code
COPY src/ ./src/

# Copy public assets (dashboard)
COPY public/ ./public/

# Cloud Run sets PORT env var
ENV PORT=8080

# Start the server
CMD ["node", "src/index.js"]

