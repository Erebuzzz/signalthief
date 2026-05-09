import { createServer, type IncomingMessage, type ServerResponse } from 'http';
import { randomBytes, randomUUID, timingSafeEqual } from 'crypto';
import { mkdtemp, rm } from 'fs/promises';
import { createReadStream } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import {
  downloadMediaLocally,
  extractMediaLocally,
  isYtDlpInstalled,
  getYtDlpVersion,
} from '../../../packages/core/src/index.js';
import {
  isFfmpegInstalled,
  getFfmpegVersion,
} from '../../../packages/core/src/index.js';
import type {
  CreateJobRequest,
  DeviceDescriptor,
  DownloadRequest,
  ExtractRequest,
  MediaJob,
  PairingConfirmRequest,
  PairingStartRequest,
} from '../../../packages/shared/src/index.js';

const PORT = Number(process.env.SIGNALTHIEF_DESKTOP_PORT || 43173);
const HOST = process.env.SIGNALTHIEF_DESKTOP_HOST || '127.0.0.1';
const TOKEN_TTL_MS = 12 * 60 * 60 * 1000;
const PAIRING_TTL_MS = 5 * 60 * 1000;

type PairingChallenge = {
  pairingId: string;
  pairingCode: string;
  clientName: string;
  origin: string;
  expiresAt: number;
};

type Session = {
  token: string;
  expiresAt: number;
};

const pairings = new Map<string, PairingChallenge>();
const sessions = new Map<string, Session>();
const jobs = new Map<string, MediaJob>();

function json(reply: ServerResponse, statusCode: number, body: unknown) {
  const payload = JSON.stringify(body);
  reply.writeHead(statusCode, {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(payload),
    'Access-Control-Allow-Origin': 'http://localhost:5173',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  });
  reply.end(payload);
}

function getDeviceDescriptor(): DeviceDescriptor {
  return {
    deviceId: process.env.SIGNALTHIEF_DEVICE_ID || 'local-dev-device',
    name: process.env.SIGNALTHIEF_DEVICE_NAME || 'SignalThief Desktop Worker',
    platform: process.platform,
    appVersion: '0.1.0',
    protocolVersion: '2026-05-09',
    capabilities: ['yt-dlp', 'ffmpeg', 'metadata-extract', 'download', 'convert', 'subtitle-list'],
    lastSeenAt: new Date().toISOString(),
    connectionState: 'connected',
  };
}

async function readJson<T>(request: IncomingMessage): Promise<T> {
  const chunks: Buffer[] = [];
  for await (const chunk of request) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  const raw = Buffer.concat(chunks).toString('utf8');
  return raw ? JSON.parse(raw) as T : {} as T;
}

function createSessionToken(): Session {
  const token = randomBytes(32).toString('base64url');
  const session = { token, expiresAt: Date.now() + TOKEN_TTL_MS };
  sessions.set(token, session);
  return session;
}

function constantTimeEquals(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}

function requireSession(request: IncomingMessage): boolean {
  const header = request.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice('Bearer '.length) : '';
  const session = sessions.get(token);
  if (!session || session.expiresAt < Date.now()) return false;
  return true;
}

function createJobRecord(request: CreateJobRequest): MediaJob {
  const timestamp = new Date().toISOString();
  const job: MediaJob = {
    id: randomUUID(),
    kind: request.kind,
    state: 'queued',
    executionTarget: 'local-desktop',
    input: request.input,
    deviceId: getDeviceDescriptor().deviceId,
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

function updateJob(job: MediaJob, updates: Partial<MediaJob>): MediaJob {
  const next = {
    ...job,
    ...updates,
    updatedAt: new Date().toISOString(),
  };
  jobs.set(next.id, next);
  return next;
}

async function route(request: IncomingMessage, reply: ServerResponse) {
  const url = new URL(request.url || '/', `http://${request.headers.host || `${HOST}:${PORT}`}`);

  if (request.method === 'OPTIONS') {
    json(reply, 204, {});
    return;
  }

  if (request.method === 'GET' && url.pathname === '/health') {
    const [ytDlpInstalled, ffmpegInstalled, ytDlpVersion, ffmpegVersion] = await Promise.all([
      isYtDlpInstalled(),
      isFfmpegInstalled(),
      getYtDlpVersion(),
      getFfmpegVersion(),
    ]);
    json(reply, 200, {
      ...getDeviceDescriptor(),
      tools: {
        ytDlp: { installed: ytDlpInstalled, version: ytDlpVersion },
        ffmpeg: { installed: ffmpegInstalled, version: ffmpegVersion },
      },
    });
    return;
  }

  if (request.method === 'POST' && url.pathname === '/pair/start') {
    const body = await readJson<PairingStartRequest>(request);
    const pairing: PairingChallenge = {
      pairingId: randomUUID(),
      pairingCode: randomBytes(3).toString('hex').toUpperCase(),
      clientName: body.clientName,
      origin: body.origin,
      expiresAt: Date.now() + PAIRING_TTL_MS,
    };
    pairings.set(pairing.pairingId, pairing);
    json(reply, 200, {
      success: true,
      pairingId: pairing.pairingId,
      pairingCode: pairing.pairingCode,
      expiresAt: new Date(pairing.expiresAt).toISOString(),
    });
    return;
  }

  if (request.method === 'POST' && url.pathname === '/pair/confirm') {
    const body = await readJson<PairingConfirmRequest>(request);
    const pairing = pairings.get(body.pairingId);
    if (!pairing || pairing.expiresAt < Date.now() || !constantTimeEquals(pairing.pairingCode, body.pairingCode)) {
      json(reply, 401, { success: false, error: 'Invalid or expired pairing code' });
      return;
    }

    pairings.delete(pairing.pairingId);
    const session = createSessionToken();
    json(reply, 200, {
      success: true,
      sessionToken: session.token,
      expiresAt: new Date(session.expiresAt).toISOString(),
      device: getDeviceDescriptor(),
    });
    return;
  }

  if (!requireSession(request)) {
    json(reply, 401, { success: false, error: 'Missing or expired local session token' });
    return;
  }

  if (request.method === 'POST' && url.pathname === '/api/extract') {
    const body = await readJson<ExtractRequest>(request);
    try {
      const data = await extractMediaLocally(body);
      json(reply, 200, { success: true, data });
    } catch (err: any) {
      json(reply, 500, { success: false, error: err?.message || 'Local extraction failed' });
    }
    return;
  }

  if (request.method === 'POST' && url.pathname === '/api/download') {
    const body = await readJson<DownloadRequest>(request);
    let activeTempDir: string | undefined;
    try {
      const result = await downloadMediaLocally(body, {
        createTempDir: async () => {
          const dir = await mkdtemp(join(tmpdir(), 'signalthief-'));
          activeTempDir = dir;
          return dir;
        },
        scheduleCleanup: () => {},
      });

      reply.writeHead(200, {
        'Content-Type': result.contentType,
        'Content-Disposition': `attachment; filename="${result.filename}"`,
        'Content-Length': result.filesize,
        'Access-Control-Allow-Origin': 'http://localhost:5173',
        'Access-Control-Expose-Headers': 'Content-Disposition, Content-Length, Content-Type',
      });
      const stream = createReadStream(result.filePath);
      stream.on('close', () => {
        if (activeTempDir) {
          setTimeout(() => rm(activeTempDir!, { recursive: true, force: true }).catch(() => {}), result.cleanupAfterMs);
        }
      });
      stream.pipe(reply);
    } catch (err: any) {
      if (activeTempDir) {
        await rm(activeTempDir, { recursive: true, force: true }).catch(() => {});
      }
      json(reply, 500, { success: false, error: err?.message || 'Local download failed' });
    }
    return;
  }

  if (request.method === 'POST' && url.pathname === '/api/jobs') {
    const body = await readJson<CreateJobRequest>(request);
    const job = createJobRecord(body);
    json(reply, 202, { success: true, job });
    return;
  }

  const jobMatch = url.pathname.match(/^\/api\/jobs\/([^/]+)$/);
  if (request.method === 'GET' && jobMatch) {
    const job = jobs.get(jobMatch[1]);
    json(reply, job ? 200 : 404, job ? { success: true, job } : { success: false, error: 'Job not found' });
    return;
  }

  const cancelMatch = url.pathname.match(/^\/api\/jobs\/([^/]+)\/cancel$/);
  if (request.method === 'POST' && cancelMatch) {
    const job = jobs.get(cancelMatch[1]);
    if (!job) {
      json(reply, 404, { success: false, error: 'Job not found' });
      return;
    }
    const next = updateJob(job, {
      state: 'canceled',
      error: { kind: 'canceled', message: 'Job canceled locally', retryable: false },
    });
    json(reply, 200, { success: true, job: next });
    return;
  }

  json(reply, 404, { success: false, error: 'Route not found' });
}

createServer((request: IncomingMessage, reply: ServerResponse) => {
  route(request, reply).catch(err => {
    json(reply, 500, { success: false, error: err?.message || 'Desktop worker error' });
  });
}).listen(PORT, HOST, () => {
  console.log(JSON.stringify({
    ts: new Date().toISOString(),
    level: 'info',
    msg: 'SignalThief desktop worker started',
    host: HOST,
    port: PORT,
  }));
});
