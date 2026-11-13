# Sweety API - Node 22 on Alpine, production dependencies only.
FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
# bcrypt ships a musl prebuild, so no compiler toolchain is needed.
RUN npm ci --omit=dev && npm cache clean --force

FROM node:22-alpine
ENV NODE_ENV=production
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY package.json index.js ./
COPY src ./src
USER node
EXPOSE 3000
HEALTHCHECK --interval=10s --timeout=3s --start-period=10s --retries=5 \
  CMD wget -qO- http://127.0.0.1:3000/ >/dev/null || exit 1
CMD ["node", "index.js"]
