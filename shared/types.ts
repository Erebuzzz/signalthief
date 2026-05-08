// Shared types for SignalThief

export interface MediaFormat {
  formatId: string;
  ext: string;
  audioExt: string;
  formatNote: string;
  audioBitrate: number | null;
  filesize: number | null;
  url: string;
  protocol: string;
  resolution?: string;
  vcodec?: string;
  acodec?: string;
}

export interface SubtitleTrack {
  url: string;
  ext: string;
  language: string | null;
  name: string;
}

export interface MediaInfo {
  id: string;
  title: string;
  description?: string;
  thumbnail?: string;
  duration: number; // seconds
  formats: MediaFormat[];
  subtitles: Record<string, SubtitleTrack[]>;
  webpageUrl: string;
  uploader?: string;
  uploadDate?: string;
  viewCount?: number;
  likeCount?: number;
  // Best format for quick download
  bestAudio?: MediaFormat;
  bestVideo?: MediaFormat;
}

export interface ExtractRequest {
  url: string;
}

export interface ExtractResponse {
  success: boolean;
  data?: MediaInfo;
  error?: string;
}

export interface DownloadRequest {
  url: string;
  formatId: string;
  targetFormat: AudioFormat; // Output format
  quality?: 'best' | 'high' | 'medium' | 'low';
}

export interface DownloadResponse {
  success: boolean;
  downloadUrl?: string;
  filename?: string;
  contentType?: string;
  filesize?: number;
  error?: string;
}

export type AudioFormat = 'mp3' | 'aac' | 'flac' | 'opus' | 'ogg' | 'wav' | 'm4a' | 'best';

export type VideoFormat = 'mp4' | 'webm' | 'mkv' | 'best';

export interface DetectedMediaSource {
  url: string;
  mimeType: string;
  tabId: number;
  pageUrl: string;
  pageTitle: string;
  duration?: number;
  isAudio: boolean;
  isVideo: boolean;
  source: 'element' | 'network' | 'tabCapture';
}

export const AUDIO_FORMATS: { id: AudioFormat; label: string; mimeType: string; ext: string }[] = [
  { id: 'best', label: 'Best Available', mimeType: 'audio/webm', ext: 'webm' },
  { id: 'mp3', label: 'MP3 (320kbps)', mimeType: 'audio/mpeg', ext: 'mp3' },
  { id: 'aac', label: 'AAC (256kbps)', mimeType: 'audio/aac', ext: 'aac' },
  { id: 'flac', label: 'FLAC (Lossless)', mimeType: 'audio/flac', ext: 'flac' },
  { id: 'opus', label: 'Opus (160kbps)', mimeType: 'audio/opus', ext: 'opus' },
  { id: 'ogg', label: 'OGG Vorbis', mimeType: 'audio/ogg', ext: 'ogg' },
  { id: 'm4a', label: 'M4A (AAC)', mimeType: 'audio/mp4', ext: 'm4a' },
];

export const VIDEO_FORMATS: { id: VideoFormat; label: string; mimeType: string; ext: string }[] = [
  { id: 'best', label: 'Best Available', mimeType: 'video/mp4', ext: 'mp4' },
  { id: 'mp4', label: 'MP4 (H.264 + AAC)', mimeType: 'video/mp4', ext: 'mp4' },
  { id: 'webm', label: 'WebM (VP9 + Opus)', mimeType: 'video/webm', ext: 'webm' },
  { id: 'mkv', label: 'MKV (Original)', mimeType: 'video/x-matroska', ext: 'mkv' },
];

export const AUDIO_MIME_TYPES = [
  'audio/mpeg',
  'audio/mp3',
  'audio/mp4',
  'audio/aac',
  'audio/ogg',
  'audio/opus',
  'audio/flac',
  'audio/wav',
  'audio/wave',
  'audio/webm',
  'audio/x-wav',
  'audio/x-m4a',
  'audio/x-flac',
  'application/octet-stream',
  'application/x-mpegURL', // HLS
  'application/vnd.apple.mpegurl', // HLS
  'video/mp4',
  'video/webm',
  'video/x-matroska',
];

export const VIDEO_MIME_TYPES = [
  'video/mp4',
  'video/webm',
  'video/x-matroska',
  'video/quicktime',
  'video/x-msvideo',
  'video/ogg',
  'video/x-flv',
];