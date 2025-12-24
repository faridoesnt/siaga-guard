# =========================
# Builder
# =========================
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

# ⬇️ copy env BEFORE build
COPY .env.production .env.production
COPY . .

RUN npm run build

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

CMD ["npm", "start"]