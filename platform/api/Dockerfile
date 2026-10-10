FROM node:24-slim

# Prisma's query engine needs OpenSSL at runtime; node:*-slim does not ship it.
RUN apt-get update -y \
    && apt-get install -y --no-install-recommends openssl ca-certificates \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install dependencies against the committed lockfile first for better caching.
COPY package.json package-lock.json ./
RUN npm ci

# Application source (node_modules, dist and .env are excluded via .dockerignore).
COPY . .

RUN npx prisma generate
RUN npm run build

ENV NODE_ENV=production

# Push the schema to the attached Postgres, then start the server.
CMD ["sh", "-c", "npx prisma db push && node dist/server.js"]
