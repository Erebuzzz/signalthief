import type { DownloadRequest, MediaInfo } from '../../shared/src/index.js';
import type { SourceAdapter, SourceAdapterContext, SourceAdapterDetection } from './source-adapter.js';
import { extractInfo } from '../../core/src/media/yt-dlp.js';

export class YtDlpSourceAdapter implements SourceAdapter {
  readonly id = 'yt-dlp-generic';
  readonly displayName = 'yt-dlp Generic Adapter';
  readonly capabilities = ['metadata', 'format-list', 'download', 'subtitles', 'playlist'] as const;

  canHandle(url: URL): SourceAdapterDetection {
    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
      return { adapterId: this.id, confidence: 0, reason: 'Only HTTP and HTTPS URLs are supported' };
    }

    return {
      adapterId: this.id,
      confidence: 0.5,
      reason: 'Generic yt-dlp adapter can inspect supported web media URLs',
    };
  }

  async extractMetadata(url: URL, _context: SourceAdapterContext): Promise<MediaInfo> {
    return extractInfo(url.toString());
  }

  async listFormats(url: URL, context: SourceAdapterContext): Promise<MediaInfo['formats']> {
    const info = await this.extractMetadata(url, context);
    return info.formats;
  }

  async download(_request: DownloadRequest): Promise<never> {
    throw new Error('Downloads are executed by the local worker engine in Phase 1');
  }
}
