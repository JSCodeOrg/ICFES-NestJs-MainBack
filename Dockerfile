FROM node:20-alpine AS builder
WORKDIR /app
RUN npm install -g pnpm
COPY package.json pnpm-lock.yaml ./
RUN pnpm install
COPY . .
RUN pnpm run build

FROM node:20-alpine
WORKDIR /app
RUN npm install -g pnpm

# Fuentes para @napi-rs/canvas
RUN apk add --no-cache fontconfig ttf-dejavu && fc-cache -fv

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./
COPY --from=builder /app/pnpm-lock.yaml ./
RUN pnpm install --prod
EXPOSE 3000
CMD ["node", "dist/main.js"]