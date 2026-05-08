FROM node:20-alpine

RUN apk add --no-cache python3 py3-pip ffmpeg curl

RUN pip3 install --break-system-packages yt-dlp

WORKDIR /app

COPY backend/package*.json ./
RUN npm ci --omit=dev

COPY backend/ ./
COPY shared/ ./shared/

ENV PORT=3001
ENV HOST=0.0.0.0
ENV NODE_ENV=production

EXPOSE 3001

CMD ["npx", "tsx", "src/index.ts"]