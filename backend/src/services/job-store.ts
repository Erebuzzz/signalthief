import { randomUUID } from 'crypto';
import type {
  CreateJobRequest,
  JobError,
  JobState,
  MediaJob,
} from '../../../shared/types.js';

const jobs = new Map<string, MediaJob>();

function now(): string {
  return new Date().toISOString();
}

export function createJob(request: CreateJobRequest): MediaJob {
  const timestamp = now();
  const job: MediaJob = {
    id: randomUUID(),
    kind: request.kind,
    state: 'queued',
    executionTarget: request.executionTarget ?? 'local-desktop',
    input: request.input,
    deviceId: request.deviceId,
    progress: 0,
    attempts: 0,
    maxAttempts: 3,
    createdAt: timestamp,
    updatedAt: timestamp,
    traceId: randomUUID(),
  };

  jobs.set(job.id, job);
  return job;
}

export function getJob(id: string): MediaJob | undefined {
  return jobs.get(id);
}

export function updateJobState(
  id: string,
  state: JobState,
  updates: Partial<Pick<MediaJob, 'progress' | 'result'>> & { error?: JobError } = {},
): MediaJob | undefined {
  const job = jobs.get(id);
  if (!job) return undefined;

  const timestamp = now();
  const next: MediaJob = {
    ...job,
    ...updates,
    state,
    updatedAt: timestamp,
    startedAt: state === 'running' && !job.startedAt ? timestamp : job.startedAt,
    completedAt: state === 'completed' || state === 'failed' || state === 'canceled' ? timestamp : job.completedAt,
  };

  jobs.set(id, next);
  return next;
}

export function listJobs(): MediaJob[] {
  return [...jobs.values()].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}
