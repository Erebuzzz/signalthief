import { execFile } from 'child_process';
import { promisify } from 'util';
import { existsSync } from 'fs';

const execFileAsync = promisify(execFile);

const FFMPEG_PATH = process.env.FFMPEG_PATH || 'ffmpeg';

export interface ConversionOptions {
  input: string;
  output: string;
  format: 'mp3' | 'aac' | 'flac' | 'opus' | 'ogg' | 'wav' | 'm4a';
  audioBitrate?: string; // e.g. '320k', '256k', '128k'
  sampleRate?: number; // e.g. 44100, 48000
  channels?: number; // 1 for mono, 2 for stereo
  startTime?: number; // seconds
  duration?: number; // seconds
}

const FORMAT_CODECS: Record<string, { codec: string; defaultBitrate: string }> = {
  mp3: { codec: 'libmp3lame', defaultBitrate: '320k' },
  aac: { codec: 'aac', defaultBitrate: '256k' },
  flac: { codec: 'flac', defaultBitrate: '' },
  opus: { codec: 'libopus', defaultBitrate: '160k' },
  ogg: { codec: 'libvorbis', defaultBitrate: '192k' },
  wav: { codec: 'pcm_s16le', defaultBitrate: '' },
  m4a: { codec: 'aac', defaultBitrate: '256k' },
};

export async function convertAudio(options: ConversionOptions): Promise<void> {
  const codecInfo = FORMAT_CODECS[options.format];
  if (!codecInfo) {
    throw new Error(`Unsupported format: ${options.format}`);
  }

  const args: string[] = ['-y', '-i', options.input];

  // Codec
  args.push('-codec:a', codecInfo.codec);

  // Bitrate
  const bitrate = options.audioBitrate || codecInfo.defaultBitrate;
  if (bitrate) {
    args.push('-b:a', bitrate);
  }

  // Sample rate
  if (options.sampleRate) {
    args.push('-ar', options.sampleRate.toString());
  }

  // Channels
  if (options.channels) {
    args.push('-ac', options.channels.toString());
  }

  // Trim
  if (options.startTime !== undefined) {
    args.push('-ss', options.startTime.toString());
  }
  if (options.duration !== undefined) {
    args.push('-t', options.duration.toString());
  }

  // Output format specific
  if (options.format === 'm4a') {
    args.push('-movflags', '+faststart');
  }

  // Disable video stream
  args.push('-vn');

  args.push(options.output);

  try {
    await execFileAsync(FFMPEG_PATH, args, {
      maxBuffer: 10 * 1024 * 1024,
      timeout: 300000,
    });
  } catch (err: any) {
    throw new Error(`FFmpeg conversion failed: ${err.stderr || err.message}`);
  }
}

export async function convertVideo(
  input: string,
  output: string,
  format: 'mp4' | 'webm' | 'mkv',
  quality?: 'best' | 'high' | 'medium' | 'low',
): Promise<void> {
  const args: string[] = ['-y', '-i', input];

  switch (format) {
    case 'mp4':
      args.push('-codec:v', 'libx264', '-preset', 'fast');
      args.push('-codec:a', 'aac', '-b:a', '192k');
      if (quality === 'low') {
        args.push('-crf', '28');
      } else if (quality === 'medium') {
        args.push('-crf', '23');
      } else if (quality === 'high') {
        args.push('-crf', '18');
      } else {
        args.push('-crf', '18'); // best
      }
      args.push('-movflags', '+faststart');
      break;
    case 'webm':
      args.push('-codec:v', 'libvpx-vp9', '-cpu-used', '2');
      args.push('-codec:a', 'libopus');
      if (quality === 'low') {
        args.push('-crf', '40', '-b:v', '500k');
      } else if (quality === 'medium') {
        args.push('-crf', '33', '-b:v', '1M');
      } else if (quality === 'high') {
        args.push('-crf', '24', '-b:v', '2M');
      } else {
        args.push('-crf', '18', '-b:v', '0'); // best
      }
      break;
    case 'mkv':
      args.push('-codec:v', 'copy');
      args.push('-codec:a', 'copy');
      break;
  }

  args.push(output);

  try {
    await execFileAsync(FFMPEG_PATH, args, {
      maxBuffer: 10 * 1024 * 1024,
      timeout: 600000, // 10 minutes
    });
  } catch (err: any) {
    throw new Error(`FFmpeg video conversion failed: ${err.stderr || err.message}`);
  }
}

export async function isInstalled(): Promise<boolean> {
  try {
    await execFileAsync(FFMPEG_PATH, ['-version'], { timeout: 10000 });
    return true;
  } catch {
    return false;
  }
}

export async function getVersion(): Promise<string> {
  try {
    const { stdout } = await execFileAsync(FFMPEG_PATH, ['-version'], { timeout: 10000 });
    return stdout.split('\n')[0]?.trim() || 'unknown';
  } catch {
    return 'unknown';
  }
}