import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { createTempDir, cleanupDir, scheduleCleanup } from '../services/cache.js';
import { downloadMediaLocally, openLocalFileStream } from '../../../packages/core/src/media/local-media-engine.js';
import type {
  DownloadRequest,
  DownloadResponse,
} from '../../../shared/types.js';
import { ApiError } from '../lib/errors.js';
import { logger } from '../lib/logger.js';
import { rateLimiter } from '../lib/rate-limit.js';

const DEPRECATED_DOWNLOAD_WARNING =
  'POST /api/download is a compatibility route. New clients should submit local-desktop jobs through the device bridge.';

export async function downloadRoutes(app: FastifyInstance) {
  // POST /api/download: compatibility route for existing web and extension clients.
  app.post('/api/download', async (
    request: FastifyRequest<{ Body: DownloadRequest }>,
    reply: FastifyReply
  ) => {
    const start = Date.now();
    const clientIp = request.ip;
    let tempDir: string | null = null;

    try {
      // Rate limiting
      rateLimiter.assert(clientIp);

      const { url, formatId, targetFormat, quality } = request.body;

      if (!url || !formatId) {
        throw new ApiError(400, 'URL and formatId are required');
      }

      const supportedFormats = ['mp3', 'aac', 'flac', 'opus', 'ogg', 'wav', 'm4a', 'mp4', 'webm', 'mkv', 'best'];
      if (!supportedFormats.includes(targetFormat)) {
        throw new ApiError(400, 'Unsupported target format');
      }

      logger.info('Downloading media', {
        url: url.slice(0, 80),
        formatId,
        targetFormat,
        quality,
        compatibilityRoute: true,
      });

      const result = await downloadMediaLocally(request.body, {
        createTempDir: async () => {
          tempDir = await createTempDir();
          return tempDir;
        },
        scheduleCleanup,
      });

      reply.header('Content-Type', result.contentType);
      reply.header('Content-Disposition', `attachment; filename="${result.filename}"`);
      reply.header('Content-Length', result.filesize);
      reply.header('Deprecation', 'true');
      reply.header('Sunset', 'Phase 3');
      reply.header('Link', '</api/jobs>; rel="successor-version"');
      reply.header('X-SignalThief-Warning', DEPRECATED_DOWNLOAD_WARNING);

      const stream = openLocalFileStream(result.filePath);

      stream.on('close', () => {
        if (tempDir) scheduleCleanup(tempDir, result.cleanupAfterMs);
      });

      stream.on('error', () => {
        if (tempDir) scheduleCleanup(tempDir, result.cleanupAfterMs);
      });

      logger.info('Download streaming', {
        filename: result.filename,
        fileSize: Math.round(result.filesize / 1024) + 'KB',
        contentType: result.contentType,
        duration: Date.now() - start,
      });

      return reply.send(stream);
    } catch (err: any) {
      if (tempDir) {
        await cleanupDir(tempDir).catch(() => {});
      }

      if (err instanceof ApiError) {
        logger.warn('Download failed (client error)', {
          statusCode: err.statusCode,
          error: err.message,
          duration: Date.now() - start,
        });
        return reply.status(err.statusCode).send({
          success: false,
          error: err.message,
        } as DownloadResponse);
      }

      logger.error('Download failed', err, {
        duration: Date.now() - start,
      });
      return reply.status(500).send({
        success: false,
        error: process.env.NODE_ENV === 'production'
          ? 'Internal server error'
          : err.message || 'Download failed',
      } as DownloadResponse);
    }
  });
}
