# syntax=docker/dockerfile:1

FROM node:20-alpine AS base
WORKDIR /app

FROM base AS deps
COPY package*.json ./
COPY prisma ./prisma
RUN npm install --legacy-peer-deps
RUN npx prisma generate

FROM base AS build
COPY package*.json ./
COPY prisma ./prisma
COPY tsconfig*.json ./
COPY nest-cli.json ./
COPY eslint.config.mjs ./
COPY src ./src
COPY test ./test
COPY docs ./docs
COPY --from=deps /app/node_modules ./node_modules
RUN npm run build

FROM base AS production
ENV NODE_ENV=production
COPY package*.json ./
COPY prisma ./prisma
COPY tsconfig*.json ./
COPY scripts ./scripts
COPY --from=deps /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
EXPOSE 3000
CMD ["node", "dist/main"]
