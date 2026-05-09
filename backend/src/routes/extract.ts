import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { extractInfo, ensureInstalled, mapYtDlpFailureForApi } from '../services/yt-dlp.js';
import type { ExtractRequest, ExtractResponse } from '../../../shared/types.js';
import { ApiError } from '../lib/errors.js';
import { logger } from '../lib/logger.js';
import { rateLimiter } from '../lib/rate-limit.js';

const DEPRECATED_EXTRACT_WARNING =
  'POST /api/extract is a compatibility route. New clients should prefer the local desktop bridge for source extraction.';

export async function extractRoutes(app: FastifyInstance) {
  // POST /api/extract: compatibility route for existing web and extension clients.
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
        compatibilityRoute: true,
      });

      reply.header('Deprecation', 'true');
      reply.header('Sunset', 'Phase 3');
      reply.header('Link', '</api/jobs>; rel="successor-version"');
      reply.header('X-SignalThief-Warning', DEPRECATED_EXTRACT_WARNING);

      return reply.send({
        success: true,
        data: info,
        warning: DEPRECATED_EXTRACT_WARNING,
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

      const rawMsg = err?.message || String(err);
      const mapped = mapYtDlpFailureForApi(rawMsg);
      if (mapped) {
        logger.warn('Extraction failed (mapped yt-dlp/client)', {
          statusCode: mapped.statusCode,
          clientMessage: mapped.clientMessage,
          duration: Date.now() - start,
          detail: rawMsg.slice(0, 32000),
        });
        return reply.status(mapped.statusCode).send({
          success: false,
          error: mapped.clientMessage,
        } as ExtractResponse);
      }

      logger.error('Extraction failed', err, {
        duration: Date.now() - start,
      });
      return reply.status(500).send({
        success: false,
        error: process.env.NODE_ENV === 'production'
          ? 'Internal server error'
          : rawMsg || 'Failed to extract media info',
      } as ExtractResponse);
    }
  });
}
