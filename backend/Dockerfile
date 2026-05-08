FROM node:20-alpine

RUN apk add --no-cache python3 py3-pip ffmpeg curl

RUN pip3 install --break-system-packages yt-dlp

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build || true

ENV PORT=3001
ENV HOST=0.0.0.0
ENV NODE_ENV=production

EXPOSE 3001

CMD ["node", "dist/index.js"]