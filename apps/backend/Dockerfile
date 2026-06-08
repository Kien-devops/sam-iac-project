# ─── Backend API (Local Development) ───────────────────────
FROM node:22-alpine

# Metadata
LABEL maintainer="hybrid-devops-team"
LABEL description="Backend API - local development"

# Create app directory
WORKDIR /usr/src/app

# Install production dependencies first (cache-friendly)
COPY package*.json ./
RUN npm ci --omit=dev

# Copy only source code
COPY src/ ./src/

# Security: run as non-root user
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser

# Expose port
EXPOSE 3000

# Environment
ENV NODE_ENV=production
ENV PORT=3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => r.statusCode === 200 ? process.exit(0) : process.exit(1))"

CMD ["node", "src/app.js"]
