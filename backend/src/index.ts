import Fastify from 'fastify';
import cors from '@fastify/cors';
import { extractRoutes } from './routes/extract.js';
import { downloadRoutes } from './routes/download.js';
import { startPeriodicCleanup } from './services/cache.js';
import { isInstalled, getVersion } from './services/yt-dlp.js';
import { isInstalled as ffmpegInstalled, getVersion as ffmpegVersion } from './services/ffmpeg.js';
import { rateLimiter } from './lib/rate-limit.js';
import { logger } from './lib/logger.js';

const PORT = parseInt(process.env.PORT || '3001', 10);
const HOST = process.env.HOST || '0.0.0.0';

async function main() {
  const app = Fastify({
    logger: {
      level: process.env.LOG_LEVEL || 'info',
      transport: process.env.NODE_ENV === 'production'
        ? undefined
        : { target: 'pino-pretty', options: { colorize: true } },
    },
    bodyLimit: 10 * 1024 * 1024, // 10MB
    requestTimeout: 300000, // 5 minutes
  });

  // CORS
  await app.register(cors, {
    origin: true,
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // Routes
  await app.register(extractRoutes);
  await app.register(downloadRoutes);

  // Health check
  app.get('/api/health', async () => {
    const [ytDlpOk, ffmpegOk] = await Promise.all([
      isInstalled(),
      ffmpegInstalled(),
    ]);

    const [ytDlpVer, ffmpegVer] = await Promise.all([
      getVersion(),
      ffmpegVersion(),
    ]);

    return {
      status: 'ok',
      version: '1.0.0',
      name: 'SignalThief API',
      tools: {
        ytDlp: { installed: ytDlpOk, version: ytDlpVer },
        ffmpeg: { installed: ffmpegOk, version: ffmpegVer },
      },
      uptime: process.uptime(),
    };
  });

  // Start periodic maintenance
  const cleanupInterval = startPeriodicCleanup(300000);
  const rateLimitCleanup = rateLimiter.startCleanup(300000);
  app.addHook('onClose', () => {
    clearInterval(cleanupInterval);
    clearInterval(rateLimitCleanup);
  });

  // Start server
  try {
    await app.listen({ port: PORT, host: HOST });
    logger.info('Server started', { port: PORT, host: HOST });
  } catch (err) {
    logger.error('Failed to start server', err as Error, { port: PORT });
    process.exit(1);
  }
}

main();