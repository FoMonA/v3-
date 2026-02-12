FROM oven/bun:1 AS base
WORKDIR /app

# Install deps
COPY packages/api/package.json packages/api/bun.lock ./
RUN bun install --frozen-lockfile

# Copy source
COPY packages/api/src ./src
COPY packages/api/tsconfig.json ./

EXPOSE 3000
CMD ["bun", "src/index.ts"]
