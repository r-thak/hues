FROM oven/bun:1 AS base
WORKDIR /app

COPY package.json bun.lock ./
COPY packages/client/package.json packages/client/
COPY packages/server/package.json packages/server/
COPY packages/shared/package.json packages/shared/

RUN bun install --frozen-lockfile

COPY . .
RUN bun run build:client

EXPOSE 54052

CMD ["bun", "run", "start"]