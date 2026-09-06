FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm install --omit=dev --no-audit --no-fund

FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production
RUN apk add --no-cache postgresql-client curl && addgroup -S flowly && adduser -S flowly -G flowly
COPY --from=deps /app/node_modules ./node_modules
COPY package*.json ./
COPY src ./src
COPY migrations ./migrations
COPY scripts ./scripts
COPY docs ./docs
RUN mkdir -p /app/logs /app/backups && chown -R flowly:flowly /app
USER flowly
EXPOSE 8787
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 CMD curl -fsS http://127.0.0.1:8787/api/v1/health || exit 1
CMD ["node", "src/server.js"]
