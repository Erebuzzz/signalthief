import type { CreateJobRequest, CreateJobResponse, JobStatusResponse, MediaJob } from './jobs.js';
import type { DownloadRequest, DownloadResponse, ExtractRequest, ExtractResponse } from './media.js';

export type DeviceConnectionState = 'offline' | 'pairing' | 'connected' | 'stale' | 'revoked';

export interface DeviceDescriptor {
  deviceId: string;
  name: string;
  platform: string;
  appVersion: string;
  protocolVersion: '2026-05-09';
  capabilities: DeviceCapability[];
  lastSeenAt?: string;
  connectionState: DeviceConnectionState;
}

export type DeviceCapability =
  | 'yt-dlp'
  | 'ffmpeg'
  | 'metadata-extract'
  | 'download'
  | 'convert'
  | 'subtitle-list'
  | 'playlist-import';

export interface PairingStartRequest {
  clientName: string;
  origin: string;
}

export interface PairingStartResponse {
  success: boolean;
  pairingId?: string;
  pairingCode?: string;
  expiresAt?: string;
  error?: string;
}

export interface PairingConfirmRequest {
  pairingId: string;
  pairingCode: string;
}

export interface PairingConfirmResponse {
  success: boolean;
  sessionToken?: string;
  expiresAt?: string;
  device?: DeviceDescriptor;
  error?: string;
}

export interface LocalBridgeErrorResponse {
  success: false;
  error: string;
  code?: string;
}

export interface LocalBridgeApi {
  'GET /health': { response: DeviceDescriptor };
  'POST /pair/start': { body: PairingStartRequest; response: PairingStartResponse };
  'POST /pair/confirm': { body: PairingConfirmRequest; response: PairingConfirmResponse };
  'POST /api/extract': { body: ExtractRequest; response: ExtractResponse };
  'POST /api/download': { body: DownloadRequest; response: DownloadResponse };
  'POST /api/jobs': { body: CreateJobRequest; response: CreateJobResponse };
  'GET /api/jobs/:id': { response: JobStatusResponse };
  'POST /api/jobs/:id/cancel': { response: JobStatusResponse };
}

export interface LocalJobEnvelope {
  job: MediaJob;
  acceptedBy: DeviceDescriptor;
}
