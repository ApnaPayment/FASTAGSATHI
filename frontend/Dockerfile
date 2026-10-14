# ── Build stage: CRA build + SSG prerender ────────────────────────────────────
FROM node:20-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
# --legacy-peer-deps: date-fns v4 conflicts with react-day-picker's peer range,
# matching how the lockfile was generated locally
RUN npm ci --legacy-peer-deps

COPY . .
RUN npm run build

# ── Runtime stage: only server.js + the built assets ──────────────────────────
FROM node:20-alpine
WORKDIR /app

COPY --from=build /app/build ./build
COPY server.js .

ENV PORT=8080
EXPOSE 8080
CMD ["node", "server.js"]
