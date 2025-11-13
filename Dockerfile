FROM node:20-alpine
WORKDIR /app

RUN apk add --no-cache openssl dumb-init

COPY package*.json ./
COPY prisma ./prisma

RUN npm install --force --legacy-peer-deps
RUN npx prisma generate

COPY src ./src

RUN addgroup -S app && adduser -S app -G app && chown -R app:app /app
USER app

EXPOSE 5300

CMD ["dumb-init", "sh", "-c", "npx prisma migrate deploy && node ./src/server.js"]

