import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { createReadStream, existsSync } from 'fs';
import { join } from 'path';
import { downloadMedia } from '../services/yt-dlp.js';
import { convertAudio, convertVideo } from '../services/ffmpeg.js';
import { createTempDir, cleanupDir, scheduleCleanup } from '../services/cache.js';
import type {
  DownloadRequest,
  DownloadResponse,
  AudioFormat,
} from '../../../shared/types.js';
import { ApiError } from '../lib/errors.js';
import { logger } from '../lib/logger.js';
import { rateLimiter } from '../lib/rate-limit.js';

const AUDIO_EXT: Record<string, string> = {
  mp3: 'mp3',
  aac: 'aac',
  flac: 'flac',
  opus: 'opus',
  ogg: 'ogg',
  wav: 'wav',
  m4a: 'm4a',
  best: 'webm',
};

const VIDEO_EXT: Record<string, string> = {
  mp4: 'mp4',
  webm: 'webm',
  mkv: 'mkv',
  best: 'mp4',
};

const CONTENT_TYPES: Record<string, string> = {
  mp3: 'audio/mpeg',
  aac: 'audio/aac',
  flac: 'audio/flac',
  opus: 'audio/opus',
  ogg: 'audio/ogg',
  wav: 'audio/wav',
  m4a: 'audio/mp4',
  webm: 'audio/webm',
  mp4: 'video/mp4',
  mkv: 'video/x-matroska',
  best: 'audio/webm',
};

export async function downloadRoutes(app: FastifyInstance) {
  // POST /api/download — download and optionally convert media
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

      // Check if it's audio or video format
      const isAudio = ['mp3', 'aac', 'flac', 'opus', 'ogg', 'wav', 'm4a', 'best'].includes(targetFormat);
      const isVideo = ['mp4', 'webm', 'mkv', 'best'].includes(targetFormat);

      if (!isAudio && !isVideo) {
        throw new ApiError(400, 'Unsupported target format');
      }

      tempDir = await createTempDir();

      // Step 1: Download from source
      const rawFileName = `raw_${formatId}`;
      const rawPath = join(tempDir, rawFileName);

      logger.info('Downloading media', {
        url: url.slice(0, 80),
        formatId,
        targetFormat,
        quality,
      });

      await downloadMedia(url, formatId, rawPath);

      // yt-dlp may append an extension, find the actual file
      let actualRawPath = rawPath;
      const { readdirSync } = await import('fs');
      const files = readdirSync(tempDir);
      for (const file of files) {
        if (file.startsWith('raw_')) {
          actualRawPath = join(tempDir, file);
          break;
        }
      }

      if (!existsSync(actualRawPath)) {
        throw new Error('Download failed — output file not found');
      }

      // Step 2: Convert if needed
      let finalPath = actualRawPath;
      let finalExt: string;
      let finalContentType: string;

      if (isAudio && targetFormat !== 'best') {
        // Audio conversion
        const ext = AUDIO_EXT[targetFormat] || targetFormat;
        const outputPath = join(tempDir, `output.${ext}`);

        const bitrateMap: Record<string, string> = {
          low: '128k',
          medium: '192k',
          high: '256k',
          best: '320k',
        };
        const bitrate = quality ? (bitrateMap[quality] || undefined) : undefined;

        await convertAudio({
          input: actualRawPath,
          output: outputPath,
          format: targetFormat as 'mp3' | 'aac' | 'flac' | 'opus' | 'ogg' | 'wav' | 'm4a',
          audioBitrate: bitrate,
        });

        finalPath = outputPath;
        finalExt = ext;
        finalContentType = CONTENT_TYPES[targetFormat] || 'audio/webm';
      } else if (isVideo && targetFormat !== 'best') {
        // Video conversion
        const ext = VIDEO_EXT[targetFormat] || targetFormat;
        const outputPath = join(tempDir, `output.${ext}`);

        await convertVideo(
          actualRawPath,
          outputPath,
          targetFormat as 'mp4' | 'webm' | 'mkv',
          quality as 'best' | 'high' | 'medium' | 'low' | undefined,
        );

        finalPath = outputPath;
        finalExt = ext;
        finalContentType = CONTENT_TYPES[targetFormat] || 'video/mp4';
      } else {
        // Best format — use as-is
        const parsedExt = actualRawPath.split('.').pop() || 'unknown';
        finalExt = parsedExt;
        finalContentType = CONTENT_TYPES[parsedExt] || 'application/octet-stream';
      }

      // Step 3: Generate filename
      const filename = `signalthief_${Date.now()}.${finalExt}`;

      // Step 4: Stream the file
      const stat = await import('fs/promises').then(m => m.stat(finalPath));
      const fileSize = stat.size;

      reply.header('Content-Type', finalContentType);
      reply.header('Content-Disposition', `attachment; filename="${filename}"`);
      reply.header('Content-Length', fileSize);

      const stream = createReadStream(finalPath);

      // Clean up after stream ends
      stream.on('close', () => {
        scheduleCleanup(tempDir!, 60000);
      });

      stream.on('error', () => {
        scheduleCleanup(tempDir!, 60000);
      });

      logger.info('Download streaming', {
        filename,
        fileSize: Math.round(fileSize / 1024) + 'KB',
        contentType: finalContentType,
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
