import type {
  DownloadRequest,
  MediaInfo,
  MediaSourceKind,
  SubtitleTrack,
} from '../../shared/src/index.js';

export type SourceAdapterCapability =
  | 'metadata'
  | 'format-list'
  | 'download'
  | 'subtitles'
  | 'playlist';

export interface SourceAdapterContext {
  requestId: string;
  deviceId?: string;
  userAgent?: string;
  sourceKind?: MediaSourceKind;
}

export interface SourceAdapterDetection {
  adapterId: string;
  confidence: number;
  reason: string;
}

export interface SourceAdapterDownloadResult {
  filePath: string;
  filename: string;
  contentType: string;
  filesize: number;
}

export interface SourceAdapter {
  readonly id: string;
  readonly displayName: string;
  readonly capabilities: readonly SourceAdapterCapability[];

  canHandle(url: URL): SourceAdapterDetection;
  extractMetadata(url: URL, context: SourceAdapterContext): Promise<MediaInfo>;
  listFormats(url: URL, context: SourceAdapterContext): Promise<MediaInfo['formats']>;
  listSubtitles?(url: URL, context: SourceAdapterContext): Promise<Record<string, SubtitleTrack[]>>;
  download?(request: DownloadRequest, context: SourceAdapterContext): Promise<SourceAdapterDownloadResult>;
}

export function chooseSourceAdapter(adapters: SourceAdapter[], rawUrl: string): SourceAdapter | null {
  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    return null;
  }

  const ranked = adapters
    .map(adapter => ({ adapter, detection: adapter.canHandle(parsed) }))
    .filter(item => item.detection.confidence > 0)
    .sort((a, b) => b.detection.confidence - a.detection.confidence);

  return ranked[0]?.adapter ?? null;
}
