FROM node:20.19 AS build

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma/

RUN npm install

# ✅ Generate Prisma Client trước khi build
RUN npx prisma generate

COPY . .

RUN npm run build

# Runtime stage
FROM node:20.19 AS runtime

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma/

RUN npm install --only=production

# ✅ Generate Prisma Client trong runtime
RUN npx prisma generate

COPY --from=build /app/dist ./dist

EXPOSE 3000

CMD ["node", "dist/src/main.js"]