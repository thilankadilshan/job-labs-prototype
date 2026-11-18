# Job Labs prototype — build with Eleventy, serve with a tiny Node server.
# Uses only node:20-alpine (no nginx image needed).

# ---------- 1) Build the static site ----------
FROM node:20-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY eleventy.config.js ./
COPY src ./src
COPY public ./public
# Optional: absolute URL used for canonical / share links (e.g. http://localhost:8081)
ARG SITE_URL=""
ENV SITE_URL=${SITE_URL}
RUN npm run build

# ---------- 2) Serve it ----------
FROM node:20-alpine
WORKDIR /srv
ENV NODE_ENV=production PORT=80
COPY docker/server.mjs ./server.mjs
COPY --from=build /app/_site ./_site
EXPOSE 80
HEALTHCHECK --interval=30s --timeout=3s CMD wget -qO- http://127.0.0.1/ >/dev/null || exit 1
CMD ["node", "server.mjs", "_site"]
