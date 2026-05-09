# SignalThief Migration Plan

## Phase 1: Stabilize Boundaries

Status: started.

What changed:

- Shared contracts moved into `packages/shared`.
- Source adapter contracts were added in `packages/adapters`.
- yt-dlp and FFmpeg wrappers moved into `packages/core`.
- Backend service files became compatibility exports.
- Backend `/api/jobs` was added for orchestration.
- Desktop local worker was added under `apps/desktop`.
- Old backend extraction routes were marked as compatibility routes.

Migration concerns:

- Existing web and extension clients still call `/api/extract` and `/api/download`.
- Desktop pairing UI is not wired into the web app yet.
- Server compatibility routes still run local binaries if called.

How to test:

- `cd backend && npm run build`
- `cd backend && npm run test`
- `cd frontend && npm run build`
- Start `apps/desktop` and call `/health`.

## Phase 2: Connect Desktop Execution

Planned work:

- Add web UI for device pairing and connection state.
- Move job submission to `/api/jobs`.
- Have the web app prefer local bridge execution for extraction and downloads.
- Persist backend job metadata while desktop performs the heavy work.
- Add job progress events through WebSocket or server-sent events.
- Add local diagnostics export.

Migration concerns:

- Existing users need a clear desktop install prompt.
- Browser download behavior must remain simple.
- Backend jobs must not expose local file paths.

## Phase 3: Simplify Extension And Remove Duplication

Planned work:

- Convert extension to a thin page-context companion.
- Send URL and tab metadata to the desktop bridge or web app.
- Remove duplicated format and quality logic from extension popup code.
- Remove backend extraction compatibility routes after client migration.
- Move app folders to `apps/web`, `apps/backend`, and `apps/extension`.

Migration concerns:

- Published extension users need versioned update notes.
- API deprecation should include a stable sunset window.
- Docs must show extension as optional.
