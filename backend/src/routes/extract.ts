import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { extractInfo, ensureInstalled } from '../services/yt-dlp.js';
import type { ExtractRequest, ExtractResponse } from '../../../shared/types.js';
import { ApiError } from '../lib/errors.js';
import { logger } from '../lib/logger.js';
import { rateLimiter } from '../lib/rate-limit.js';

export async function extractRoutes(app: FastifyInstance) {
  // POST /api/extract — get media info from URL
  app.post('/api/extract', async (
    request: FastifyRequest<{ Body: ExtractRequest }>,
    reply: FastifyReply
  ) => {
    const start = Date.now();
    const clientIp = request.ip;

    try {
      // Rate limiting
      rateLimiter.assert(clientIp);

      const { url } = request.body;

      if (!url || typeof url !== 'string') {
        throw new ApiError(400, 'URL is required');
      }

      // Basic URL validation
      try {
        new URL(url);
      } catch {
        throw new ApiError(400, 'Invalid URL format');
      }

      // Check if yt-dlp is installed (auto-install if missing)
      const installed = await ensureInstalled();
      if (!installed) {
        throw new ApiError(503, 'yt-dlp is not installed on the server');
      }

      const info = await extractInfo(url);

      logger.info('Extraction succeeded', {
        url: url.slice(0, 80),
        title: info.title?.slice(0, 60),
        formats: info.formats?.length,
        duration: Date.now() - start,
      });

      return reply.send({
        success: true,
        data: info,
      } as ExtractResponse);
    } catch (err: any) {
      if (err instanceof ApiError) {
        logger.warn('Extraction failed (client error)', {
          statusCode: err.statusCode,
          error: err.message,
          duration: Date.now() - start,
        });
        return reply.status(err.statusCode).send({
          success: false,
          error: err.message,
        } as ExtractResponse);
      }

      logger.error('Extraction failed', err, {
        duration: Date.now() - start,
      });
      return reply.status(500).send({
        success: false,
        error: process.env.NODE_ENV === 'production'
          ? 'Internal server error'
          : err.message || 'Failed to extract media info',
      } as ExtractResponse);
    }
  });
}
