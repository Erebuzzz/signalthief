import { createReadStream, existsSync, readdirSync } from 'fs';
import { stat } from 'fs/promises';
import { join } from 'path';
import type {
  DownloadQuality,
  DownloadRequest,
  ExtractRequest,
  MediaInfo,
  OutputFormat,
} from '../../../shared/src/index.js';
import { extractInfo, downloadMedia } from './yt-dlp.js';
import { convertAudio, convertVideo } from './ffmpeg.js';

export interface LocalDownloadResult {
  filePath: string;
  filename: string;
  contentType: string;
  filesize: number;
  cleanupAfterMs: number;
}

export interface TempDirectoryProvider {
  createTempDir(): Promise<string>;
  scheduleCleanup(path: string, delayMs: number): void;
}

const AUDIO_FORMATS = new Set(['mp3', 'aac', 'flac', 'opus', 'ogg', 'wav', 'm4a', 'best']);
const VIDEO_FORMATS = new Set(['mp4', 'webm', 'mkv', 'best']);

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

export async function extractMediaLocally(request: ExtractRequest): Promise<MediaInfo> {
  return extractInfo(request.url);
}

export function isSupportedOutputFormat(format: string): format is OutputFormat {
  return AUDIO_FORMATS.has(format) || VIDEO_FORMATS.has(format);
}

export function outputContentType(formatOrExt: string): string {
  return CONTENT_TYPES[formatOrExt] || 'application/octet-stream';
}

export function qualityToAudioBitrate(quality?: DownloadQuality): string | undefined {
  const bitrateMap: Record<DownloadQuality, string> = {
    low: '128k',
    medium: '192k',
    high: '256k',
    best: '320k',
  };
  return quality ? bitrateMap[quality] : undefined;
}

export async function downloadMediaLocally(
  request: DownloadRequest,
  tempDirs: TempDirectoryProvider,
): Promise<LocalDownloadResult> {
  if (!request.url || !request.formatId) {
    throw new Error('URL and formatId are required');
  }

  if (!isSupportedOutputFormat(request.targetFormat)) {
    throw new Error('Unsupported target format');
  }

  const tempDir = await tempDirs.createTempDir();
  const rawPath = join(tempDir, `raw_${request.formatId}`);

  await downloadMedia(request.url, request.formatId, rawPath);

  let actualRawPath = rawPath;
  for (const file of readdirSync(tempDir)) {
    if (file.startsWith('raw_')) {
      actualRawPath = join(tempDir, file);
      break;
    }
  }

  if (!existsSync(actualRawPath)) {
    throw new Error('Download failed because the output file was not found');
  }

  const isAudio = AUDIO_FORMATS.has(request.targetFormat);
  const isVideo = VIDEO_FORMATS.has(request.targetFormat);
  let finalPath = actualRawPath;
  let finalExt: string;
  let finalContentType: string;

  if (isAudio && request.targetFormat !== 'best') {
    const ext = AUDIO_EXT[request.targetFormat] || request.targetFormat;
    const outputPath = join(tempDir, `output.${ext}`);
    await convertAudio({
      input: actualRawPath,
      output: outputPath,
      format: request.targetFormat as 'mp3' | 'aac' | 'flac' | 'opus' | 'ogg' | 'wav' | 'm4a',
      audioBitrate: qualityToAudioBitrate(request.quality),
    });

    finalPath = outputPath;
    finalExt = ext;
    finalContentType = outputContentType(request.targetFormat);
  } else if (isVideo && request.targetFormat !== 'best') {
    const ext = VIDEO_EXT[request.targetFormat] || request.targetFormat;
    const outputPath = join(tempDir, `output.${ext}`);
    await convertVideo(
      actualRawPath,
      outputPath,
      request.targetFormat as 'mp4' | 'webm' | 'mkv',
      request.quality,
    );

    finalPath = outputPath;
    finalExt = ext;
    finalContentType = outputContentType(request.targetFormat);
  } else {
    finalExt = actualRawPath.split('.').pop() || 'unknown';
    finalContentType = outputContentType(finalExt);
  }

  const fileInfo = await stat(finalPath);
  return {
    filePath: finalPath,
    filename: `signalthief_${Date.now()}.${finalExt}`,
    contentType: finalContentType,
    filesize: fileInfo.size,
    cleanupAfterMs: 60000,
  };
}

export function openLocalFileStream(filePath: string) {
  return createReadStream(filePath);
}
