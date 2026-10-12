FROM node:20-bookworm-slim

# Bundle MongoDB server in the same image so the lab stays a single
# container: no separate `mongo` service, no second port to publish. mongod
# is started from entrypoint.sh before the app, and seed.js waits for it.
RUN apt-get update && apt-get install -y --no-install-recommends \
      gnupg curl ca-certificates \
    && curl -fsSL https://pgp.mongodb.com/server-7.0.asc | gpg --dearmor -o /usr/share/keyrings/mongodb-server-7.0.gpg \
    && echo "deb [ signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] https://repo.mongodb.org/apt/debian bookworm/mongodb-org/7.0 main" \
      > /etc/apt/sources.list.d/mongodb-org-7.0.list \
    && apt-get update \
    && apt-get install -y --no-install-recommends mongodb-org-server \
    && rm -rf /var/lib/apt/lists/* \
    && mkdir -p /data/db /var/log

WORKDIR /app

COPY package.json ./
RUN npm install --omit=dev

COPY server.js seed.js entrypoint.sh ./
RUN chmod +x entrypoint.sh

EXPOSE 8080

ENTRYPOINT ["./entrypoint.sh"]
