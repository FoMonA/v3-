FROM oven/bun:1 AS base
WORKDIR /app

# Install deps
COPY packages/api/package.json packages/api/bun.lock ./
RUN bun install --frozen-lockfile

# Copy source
COPY packages/api/src ./src
COPY packages/api/tsconfig.json ./
COPY packages/api/healthcheck.ts ./healthcheck.ts

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD ["bun", "healthcheck.ts"]

CMD ["bun", "src/index.ts"]
