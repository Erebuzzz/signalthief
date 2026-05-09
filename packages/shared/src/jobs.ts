import type { DownloadQuality, OutputFormat } from './media.js';

export type JobState = 'queued' | 'running' | 'completed' | 'failed' | 'canceled';

export type JobKind = 'metadata-extract' | 'media-download' | 'media-conversion' | 'playlist-import';

export type JobExecutionTarget = 'local-desktop' | 'cloud-orchestrator' | 'extension-helper';

export type JobErrorKind =
  | 'validation'
  | 'auth-required'
  | 'source-unavailable'
  | 'rate-limited'
  | 'tool-missing'
  | 'network'
  | 'filesystem'
  | 'canceled'
  | 'unknown';

export interface JobError {
  kind: JobErrorKind;
  message: string;
  retryable: boolean;
  detail?: string;
}

export interface MediaJobInput {
  url: string;
  formatId?: string;
  targetFormat?: OutputFormat;
  quality?: DownloadQuality;
  destination?: string;
}

export interface MediaJob {
  id: string;
  userId?: string;
  deviceId?: string;
  kind: JobKind;
  state: JobState;
  executionTarget: JobExecutionTarget;
  input: MediaJobInput;
  progress: number;
  attempts: number;
  maxAttempts: number;
  createdAt: string;
  updatedAt: string;
  startedAt?: string;
  completedAt?: string;
  error?: JobError;
  result?: Record<string, unknown>;
  traceId?: string;
}

export interface CreateJobRequest {
  kind: JobKind;
  input: MediaJobInput;
  deviceId?: string;
  executionTarget?: JobExecutionTarget;
}

export interface CreateJobResponse {
  success: boolean;
  job?: MediaJob;
  error?: string;
}

export interface JobStatusResponse {
  success: boolean;
  job?: MediaJob;
  error?: string;
}

export function isTerminalJobState(state: JobState): boolean {
  return state === 'completed' || state === 'failed' || state === 'canceled';
}

export function isRetryableJobError(error: JobError | undefined): boolean {
  return Boolean(error?.retryable);
}
