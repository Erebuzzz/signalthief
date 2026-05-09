import { execFile } from 'child_process';
import { existsSync } from 'fs';
import { promisify } from 'util';
import type { MediaInfo, MediaFormat, SubtitleTrack } from '../../../shared/types.js';

const execFileAsync = promisify(execFile);

const YT_DLP_PATH = process.env.YT_DLP_PATH || 'yt-dlp';
let INSTALL_PROMISE: Promise<boolean> | null = null;

/** Ordered YouTube player_client strategies for datacenter / bot-check resilience */
const YOUTUBE_PLAYER_CLIENT_STRATEGIES = [
  'youtube:player_client=android,ios,web',
  'youtube:player_client=tv_embedded',
  'youtube:player_client=android_creator',
  'youtube:player_client=web_embedded',
];

function cookiesArgs(): string[] {
  const p = process.env.YTDLP_COOKIES_FILE;
  if (p && existsSync(p)) {
    return ['--cookies', p];
  }
  return [];
}

/** User-facing text when YouTube blocks the server (bot / sign-in). Keep in sync with DEPLOYMENT.md. */
export const YT_DLP_YOUTUBE_BOT_CHECK_MESSAGE =
  'YouTube blocked this request from the server (bot check). Try exporting cookies per DEPLOYMENT.md or use another video.';

function isYoutubeBotSignInOrCaptcha(lower: string): boolean {
  if (lower.includes('sign in to confirm')) return true;
  if (lower.includes('not a bot')) return true;
  if (lower.includes('captcha')) return true;
  if (lower.includes('cookies-from-browser') || lower.includes('cookies from browser')) return true;
  if (
    lower.includes('cookies') &&
    (lower.includes('youtube') || lower.includes('sign in') || lower.includes('bot'))
  ) {
    return true;
  }
  return false;
}

function trimClientError(msg: string, maxLen: number): string {
  const t = msg.replace(/\s+/g, ' ').trim();
  return t.length > maxLen ? `${t.slice(0, maxLen)}…` : t;
}

/**
 * Map yt-dlp stderr / thrown message to HTTP status and a short client-safe message.
 * Log the full raw string server-side only.
 */
export function mapYtDlpFailureForApi(message: string): { statusCode: number; clientMessage: string } | null {
  const lower = message.toLowerCase();

  if (isYoutubeBotSignInOrCaptcha(lower)) {
    return { statusCode: 422, clientMessage: YT_DLP_YOUTUBE_BOT_CHECK_MESSAGE };
  }

  const unavailableOrRestricted =
    lower.includes('video unavailable') ||
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

  if (unavailableOrRestricted) {
    return { statusCode: 422, clientMessage: trimClientError(message, 200) };
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
    return { statusCode: 503, clientMessage: trimClientError(message, 200) };
  }

  return null;
}

/**
 * For YouTube hosts, normalize music.youtube.com/watch and youtu.be links to
 * canonical https://www.youtube.com/watch?v=VIDEO_ID when the id is parsable.
 */
export function normalizeMediaUrl(url: string): string {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return url;
  }

  const host = parsed.hostname.replace(/^www\./i, '').toLowerCase();

  if (host === 'youtu.be') {
    const segment = parsed.pathname.replace(/^\//, '').split('/')[0]?.split('?')[0];
    if (segment && /^[\w-]{11}$/.test(segment)) {
      return `https://www.youtube.com/watch?v=${segment}`;
    }
    return url;
  }

  if (host === 'music.youtube.com' && parsed.pathname.startsWith('/watch')) {
    const v = parsed.searchParams.get('v');
    if (v && /^[\w-]{11}$/.test(v)) {
      return `https://www.youtube.com/watch?v=${v}`;
    }
  }

  return url;
}

async function tryAutoInstall(): Promise<boolean> {
  if (await isInstalled()) return true;

  console.log('[yt-dlp] Not found — attempting auto-install...');

  // Try pip first (most reliable)
  const installCommands = [
    { args: ['python3', '-m', 'pip', 'install', '-q', 'yt-dlp'], bin: 'python3' },
    { args: ['python', '-m', 'pip', 'install', '-q', 'yt-dlp'], bin: 'python' },
    { args: ['pip3', 'install', '-q', 'yt-dlp'], bin: 'pip3' },
    { args: ['pip', 'install', '-q', 'yt-dlp'], bin: 'pip' },
    { args: ['npx', '-y', 'yt-dlp'], bin: 'npx' },
  ];

  for (const { args } of installCommands) {
    try {
      await execFileAsync(args[0], args.slice(1), { timeout: 60000 });
      // Re-check if yt-dlp is now available
      if (await isInstalled()) {
        console.log('[yt-dlp] Auto-installed successfully');
        return true;
      }
    } catch {
      // Try next method
    }
  }

  console.error('[yt-dlp] Auto-install failed. Please install manually:');
  console.error('  Windows: winget install yt-dlp.yt-dlp');
  console.error('  macOS:   brew install yt-dlp');
  console.error('  Linux:   pip install yt-dlp');
  return false;
}

export async function ensureInstalled(): Promise<boolean> {
  if (await isInstalled()) return true;
  if (!INSTALL_PROMISE) {
    INSTALL_PROMISE = tryAutoInstall();
  }
  return INSTALL_PROMISE;
}

// Known audio codecs, sorted by quality (best first)
const AUDIO_QUALITY_ORDER: Record<string, number> = {
  'opus': 100,
  'aac': 90,
  'vorbis': 80,
  'mp3': 70,
  'mp4a': 65,
  'flac': 60,
  'alac': 55,
  'wav': 40,
};

function getAudioQuality(acodec: string | null): number {
  if (!acodec) return 0;
  const codec = acodec.toLowerCase();
  for (const [key, val] of Object.entries(AUDIO_QUALITY_ORDER)) {
    if (codec.includes(key)) return val;
  }
  return 10;
}

async function runExtractOnce(url: string, extractorArgs: string): Promise<MediaInfo> {
  const args = [
    '--dump-json',
    '--no-playlist',
    '--no-check-certificates',
    '--extractor-retries', '3',
    '--socket-timeout', '30',
    '--js-runtimes', 'node',
    '--extractor-args', extractorArgs,
    ...cookiesArgs(),
    url,
  ];

  try {
    const { stdout } = await execFileAsync(YT_DLP_PATH, args, {
      maxBuffer: 10 * 1024 * 1024, // 10MB
      timeout: 60000,
    });

    const raw = JSON.parse(stdout);
    return parseMediaInfo(raw);
  } catch (err: any) {
    if (err.killed) {
      throw new Error('Extraction timed out');
    }
    // yt-dlp exits with non-zero on some warnings — check stderr
    if (err.stdout) {
      try {
        const raw = JSON.parse(err.stdout);
        return parseMediaInfo(raw);
      } catch {
        throw new Error(`Failed to extract: ${err.stderr || err.message}`);
      }
    }
    throw new Error(`yt-dlp error: ${err.stderr || err.message}`);
  }
}

async function extractInfoWithFallback(url: string): Promise<MediaInfo> {
  let lastErr: Error | undefined;
  for (const strategy of YOUTUBE_PLAYER_CLIENT_STRATEGIES) {
    try {
      return await runExtractOnce(url, strategy);
    } catch (e: any) {
      lastErr = e instanceof Error ? e : new Error(String(e));
    }
  }
  throw lastErr ?? new Error('yt-dlp: all player client strategies failed');
}

export async function extractInfo(url: string): Promise<MediaInfo> {
  const normalized = normalizeMediaUrl(url);
  return extractInfoWithFallback(normalized);
}

async function runDownloadOnce(
  url: string,
  formatId: string,
  outputPath: string,
  extractorArgs: string,
  extraArgs: string[],
): Promise<void> {
  const args = [
    '-f', formatId,
    '-o', outputPath,
    '--no-playlist',
    '--no-check-certificates',
    '--no-progress',
    '--no-part',
    '--js-runtimes', 'node',
    '--extractor-args', extractorArgs,
    ...cookiesArgs(),
    ...extraArgs,
    url,
  ];

  try {
    await execFileAsync(YT_DLP_PATH, args, {
      maxBuffer: 10 * 1024 * 1024,
      timeout: 300000, // 5 minutes
    });
  } catch (err: any) {
    throw new Error(`Download failed: ${err.stderr || err.message}`);
  }
}

export async function downloadMedia(
  url: string,
  formatId: string,
  outputPath: string,
  extraArgs: string[] = [],
): Promise<void> {
  const normalized = normalizeMediaUrl(url);
  let lastErr: Error | undefined;
  for (const strategy of YOUTUBE_PLAYER_CLIENT_STRATEGIES) {
    try {
      await runDownloadOnce(normalized, formatId, outputPath, strategy, extraArgs);
      return;
    } catch (e: any) {
      lastErr = e instanceof Error ? e : new Error(String(e));
    }
  }
  throw lastErr ?? new Error('Download failed: all player client strategies failed');
}

export async function extractAudio(
  url: string,
  formatId: string,
  outputPath: string,
): Promise<void> {
  return downloadMedia(url, formatId, outputPath, [
    '--extract-audio',
    '--audio-format', 'best',
  ]);
}

export async function isInstalled(): Promise<boolean> {
  try {
    await execFileAsync(YT_DLP_PATH, ['--version'], { timeout: 10000 });
    return true;
  } catch {
    return false;
  }
}

export async function getVersion(): Promise<string> {
  try {
    const { stdout } = await execFileAsync(YT_DLP_PATH, ['--version'], { timeout: 10000 });
    return stdout.trim();
  } catch {
    return 'unknown';
  }
}

function parseMediaInfo(raw: any): MediaInfo {
  const formats: MediaFormat[] = (raw.formats || []).map((f: any) => ({
    formatId: f.format_id,
    ext: f.ext || '',
    audioExt: f.audio_ext || 'none',
    formatNote: f.format_note || f.format || '',
    audioBitrate: f.abr || f.asr || null,
    filesize: f.filesize || f.filesize_approx || null,
    url: f.url || '',
    protocol: f.protocol || '',
    resolution: f.resolution || undefined,
    vcodec: f.vcodec || undefined,
    acodec: f.acodec || undefined,
  }));

  const subtitles: Record<string, SubtitleTrack[]> = {};
  if (raw.subtitles) {
    for (const [lang, tracks] of Object.entries(raw.subtitles) as [string, any[]][]) {
      subtitles[lang] = tracks.map((t: any) => ({
        url: t.url || '',
        ext: t.ext || 'vtt',
        language: lang,
        name: t.name || lang,
      }));
    }
  }
  if (raw.automatic_captions) {
    for (const [lang, tracks] of Object.entries(raw.automatic_captions) as [string, any[]][]) {
      const key = `${lang}-auto`;
      subtitles[key] = tracks.map((t: any) => ({
        url: t.url || '',
        ext: t.ext || 'vtt',
        language: lang,
        name: `${lang} (auto)`,
      }));
    }
  }

  // Find best audio-only format
  const audioFormats = formats.filter(f => f.acodec && f.acodec !== 'none' && (!f.vcodec || f.vcodec === 'none'));
  audioFormats.sort((a, b) => {
    // Sort by bitrate then codec quality
    const brDiff = (b.audioBitrate || 0) - (a.audioBitrate || 0);
    if (brDiff !== 0) return brDiff;
    return getAudioQuality(b.acodec!) - getAudioQuality(a.acodec!);
  });

  // Find best video+audio format
  const videoFormats = formats.filter(f => f.vcodec && f.vcodec !== 'none' && f.acodec && f.acodec !== 'none');
  videoFormats.sort((a, b) => {
    const resA = parseResolution(a.resolution);
    const resB = parseResolution(b.resolution);
    return resB - resA;
  });

  return {
    id: raw.id || raw.display_id || '',
    title: raw.title || raw.fulltitle || 'Unknown',
    description: raw.description || undefined,
    thumbnail: raw.thumbnail || raw.thumbnails?.[0]?.url || undefined,
    duration: raw.duration || 0,
    formats,
    subtitles,
    webpageUrl: raw.webpage_url || raw.original_url || '',
    uploader: raw.uploader || undefined,
    uploadDate: raw.upload_date || undefined,
    viewCount: raw.view_count || undefined,
    likeCount: raw.like_count || undefined,
    bestAudio: audioFormats[0] || undefined,
    bestVideo: videoFormats[0] || undefined,
  };
}

function parseResolution(resolution?: string): number {
  if (!resolution) return 0;
  const match = resolution.match(/(\d+)p/);
  return match ? parseInt(match[1]) : parseInt(resolution) || 0;
}
