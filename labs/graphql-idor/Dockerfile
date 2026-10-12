FROM node:20-slim

WORKDIR /app

COPY package.json ./
RUN npm install --omit=dev

COPY server.js entrypoint.sh ./
RUN chmod +x entrypoint.sh

ENV FLAG_PATH=/flag/flag.txt

EXPOSE 8080

ENTRYPOINT ["./entrypoint.sh"]
