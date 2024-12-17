# Install dependencies, added the platform tag so it can run on my M1 mac
FROM --platform=linux/amd64 node:20-alpine3.17 AS deps
# TODO: fijate q no te levanta por la misma razón que en ATFI. fijate como está en atfi y cambialo.
WORKDIR /app

COPY package.json ./
COPY yarn.lock ./

RUN yarn install --frozen-lockfile

# Build source code
FROM --platform=linux/amd64 node:20-alpine3.17 AS builder

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN yarn db:generate
RUN yarn build

# Production runtime
FROM --platform=linux/amd64 node:20-alpine3.17 AS runner

WORKDIR /app

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/dist ./dist

EXPOSE 8080

CMD yarn prod

# Development runtime
FROM --platform=linux/amd64 node:20-alpine3.17 AS dev

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/package.json ./
COPY nodemon.json ./nodemon.json
COPY tsconfig.json ./tsconfig.json
COPY . .

CMD yarn dev
