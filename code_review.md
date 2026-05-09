# Code Review

## Scope

This review covers the Phase 1 local-first refactor. The goal was to create durable boundaries without breaking the current web and backend flow.

## Major Changes Reviewed

### Shared contracts

Files:

- `packages/shared/src/media.ts`
- `packages/shared/src/jobs.ts`
- `packages/shared/src/errors.ts`
- `packages/shared/src/local-device-protocol.ts`
- `shared/types.ts`

Review:

- Media, job, device, and protocol types are centralized.
- `shared/types.ts` remains as a compatibility export, so existing imports continue to compile.
- Job states are explicit: `queued`, `running`, `completed`, `failed`, and `canceled`.
- Retryability is stored on job errors rather than inferred from display text.

Risk:

- Frontend and extension still need a proper shared client package in Phase 2.

### Core extraction boundary

Files:

- `packages/core/src/media/yt-dlp.ts`
- `packages/core/src/media/ffmpeg.ts`
- `packages/core/src/media/local-media-engine.ts`
- `packages/core/src/process/run-spawn.ts`
- `backend/src/services/yt-dlp.ts`
- `backend/src/services/ffmpeg.ts`

Review:

- yt-dlp and FFmpeg code no longer lives inside backend service ownership.
- Backend services re-export the core implementation for compatibility.
- The local media engine contains reusable extraction and conversion orchestration.

Risk:

- Backend compatibility routes can still execute yt-dlp and FFmpeg until Phase 3 removes them.
- The desktop worker needs packaging work before it can be treated as an end-user app.

### Source adapters

Files:

- `packages/adapters/src/source-adapter.ts`
- `packages/adapters/src/yt-dlp-adapter.ts`

Review:

- Source-specific logic has a clear adapter interface.
- UI components do not need platform-specific checks.
- The generic yt-dlp adapter is intentionally broad and should be refined by source-specific adapters over time.

Risk:

- The adapter layer is introduced but not fully wired into all request paths yet.

### Backend orchestration

Files:

- `backend/src/routes/jobs.ts`
- `backend/src/services/job-store.ts`
- `backend/src/index.ts`
- `backend/src/routes/extract.ts`
- `backend/src/routes/download.ts`

Review:

- `/api/jobs` gives clients a migration path to orchestration.
- Existing extraction and download routes now include deprecation headers.
- Download route delegates extraction and conversion to `packages/core`.

Risk:

- The job store is in memory for Phase 1. Production persistence should be added before multi-instance deployment.

### Desktop worker

Files:

- `apps/desktop/src/index.ts`
- `apps/desktop/package.json`
- `apps/desktop/tsconfig.json`

Review:

- The worker exposes health, pairing, extract, download, jobs, and cancel routes.
- Pairing uses short-lived codes and bearer tokens.
- yt-dlp and FFmpeg run locally through `packages/core`.

Risk:

- Origin validation is currently narrow and development-focused.
- Binary streaming cleanup should be exercised with large files before packaging.

## Tests

Added:

- `packages/shared/src/jobs.test.ts`
- `packages/adapters/src/source-adapter.test.ts`

Recommended follow-up tests:

- Local pairing success and expiry.
- Backend job lifecycle.
- Desktop download cleanup after stream close.
- Web UI behavior when the desktop bridge is offline.

## Validation Checklist

- Backend typecheck passes.
- Shared and adapter tests pass.
- Frontend build passes.
- Desktop worker typecheck passes. Runtime `/health` should be checked after installing `apps/desktop` dependencies.
- Existing web extraction flow still has a compatibility route.
- Docs explain the new architecture and migration path.
