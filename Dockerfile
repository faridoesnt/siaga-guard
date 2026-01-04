# =========================
# Builder
# =========================
FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json yarn.lock .yarnrc.yml ./
COPY .yarn/releases .yarn/releases
COPY .yarn/install-state.gz .yarn/install-state.gz
RUN corepack enable && yarn install --immutable

# ⬇️ copy env BEFORE build
COPY .env.production .env.production
COPY . .

RUN yarn build

# =========================
# Runtime
# =========================
FROM node:20-alpine

WORKDIR /app
RUN apk add --no-cache wget

COPY --from=builder /app ./

ENV NODE_ENV=production
EXPOSE 3000

HEALTHCHECK --interval=10s --timeout=3s --retries=5 \
  CMD wget -qO- http://localhost:3000/api/health || exit 1

CMD ["yarn", "start"]
