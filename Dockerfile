FROM node:22-bookworm-slim

WORKDIR /app

COPY package.json package-lock.json ./
COPY frontend/package.json ./frontend/
COPY backend/package.json ./backend/
COPY shared ./shared

RUN npm ci

COPY . .
RUN npm run build

ENV NODE_ENV=production
EXPOSE 3001

CMD ["npx", "tsx", "backend/src/index.ts"]
