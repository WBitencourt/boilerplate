FROM node:lts-alpine AS base
RUN npm install -g corepack@latest
RUN corepack enable pnpm

# ---------
FROM base AS deps
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

# ---------
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/package.json /app/pnpm-lock.yaml /app/pnpm-workspace.yaml ./
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN pnpm prisma generate
RUN pnpm run build
RUN pnpm prune --prod

# ---------
FROM base AS runner
WORKDIR /app
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 app
COPY --from=builder --chown=app:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=app:nodejs /app/package.json ./package.json
COPY --from=builder --chown=app:nodejs /app/dist ./dist

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
EXPOSE 3333

CMD ["node", "dist/src/main"]