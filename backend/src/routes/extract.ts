import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { extractInfo, ensureInstalled } from '../services/yt-dlp.js';
import type { ExtractRequest, ExtractResponse } from '../../../shared/types.js';
import { ApiError } from '../lib/errors.js';
import { logger } from '../lib/logger.js';
import { rateLimiter } from '../lib/rate-limit.js';

function trimClientError(msg: string, maxLen = 400): string {
  const t = msg.replace(/\s+/g, ' ').trim();
  return t.length > maxLen ? `${t.slice(0, maxLen)}…` : t;
}

/** Map known yt-dlp failures to 422 (content/bot/geo) or 503 (transient). */
function mapYtDlpFailureToStatus(message: string): { statusCode: number; message: string } | null {
  const trimmed = trimClientError(message);
  const lower = message.toLowerCase();

  const unavailableOrBot =
    lower.includes('video unavailable') ||
    lower.includes('sign in to confirm') ||
    lower.includes("you're not a bot") ||
    lower.includes('not a bot') ||
    lower.includes('confirm your age') ||
    lower.includes('age-restricted') ||
    lower.includes('private video') ||
    lower.includes('this video is private') ||
    lower.includes('video is private') ||
    lower.includes('this video is not available') ||
    lower.includes('no longer available') ||
    lower.includes('has been removed') ||
    lower.includes('members only') ||
    lower.includes('members-only') ||
    lower.includes('live event will begin') ||
    (lower.includes('blocked') &&
      (lower.includes('copyright') ||
        lower.includes('country') ||
        lower.includes('uploader') ||
        lower.includes('site')));

  if (unavailableOrBot) {
    return { statusCode: 422, message: trimmed };
  }

  const transient =
    lower.includes('http error 503') ||
    lower.includes('http error 502') ||
    lower.includes('http error 429') ||
    /\b429\b/.test(lower) ||
    lower.includes('too many requests') ||
    lower.includes('rate limit') ||
    lower.includes('timed out') ||
    lower.includes('timeout') ||
    lower.includes('econnreset') ||
    lower.includes('socket hang up');

  if (transient) {
    return { statusCode: 503, message: trimmed };
  }

  return null;
}

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

      const rawMsg = err?.message || String(err);
      const mapped = mapYtDlpFailureToStatus(rawMsg);
      if (mapped) {
        logger.warn('Extraction failed (mapped yt-dlp/client)', {
          statusCode: mapped.statusCode,
          error: mapped.message.slice(0, 120),
          duration: Date.now() - start,
        });
        return reply.status(mapped.statusCode).send({
          success: false,
          error: mapped.message,
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
