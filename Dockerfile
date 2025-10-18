# ---------- Base Image ----------
FROM node:20-alpine AS base
WORKDIR /app

# ---------- Install Dependencies ----------
COPY package*.json ./
RUN npm install

# ---------- Copy Code ----------
COPY . .

# ---------- Build Prisma ----------
RUN npx prisma generate

# ---------- Expose & Start ----------
EXPOSE 5000
CMD ["npm", "start"]