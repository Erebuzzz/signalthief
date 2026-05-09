# SignalThief Deployment Guide

SignalThief is moving from a cloud-extraction model to a local-first model. Deployments should treat the web app, backend, desktop worker, and extension as separate distributable surfaces.

## Deployment Principles

- The web app can be deployed as static assets.
- The backend can be deployed as a lightweight orchestration API.
- The desktop worker is distributed to user devices and runs yt-dlp plus FFmpeg locally.
- The extension is optional and should never be required for the core app to work.
- The backend should not store user cookies or perform browser-session-dependent extraction.

## Web App Deployment

The current web app lives in `frontend`.

```bash
cd frontend
npm install
npm run build
```

Deploy `frontend/dist` to Vercel, Netlify, Cloudflare Pages, S3, or any static host.

Set:

| Variable | Example |
| --- | --- |
| `VITE_API_URL` | `https://api.example.com` |
| `VITE_DESKTOP_BRIDGE_URL` | `http://127.0.0.1:43173` |

`VITE_DESKTOP_BRIDGE_URL` is reserved for the Phase 2 web-to-desktop pairing UI. Phase 1 defines the protocol and worker.

## Backend Deployment

The backend lives in `backend`.

```bash
cd backend
npm install
npm run build
npm start
```

Deploy it to Render, Fly.io, Railway, a VPS, or any Node 20 capable host.

Backend responsibilities:

- Authentication.
- Device registration.
- Job creation and status.
- Metadata persistence.
- Sync state.
- Preferences.
- Billing hooks.
- Optional cloud storage hooks.

Compatibility responsibilities that are deprecated:

- `POST /api/extract`
- `POST /api/download`
- Server-side yt-dlp use.
- Server-side FFmpeg use for normal end-user downloads.
- Cookie-backed extraction from third-party sites.

The compatibility routes remain for migration only and return deprecation headers.

## Desktop Worker Distribution

The desktop worker lives in `apps/desktop`.

```bash
cd apps/desktop
npm install
npm run build
npm start
```

Production packaging options:

- Wrap the worker with Electron if the product needs a full desktop shell.
- Wrap the worker with Tauri if smaller native packaging is preferred.
- Run it as a background service if no desktop UI is required.

The worker requires local `yt-dlp` and `ffmpeg` availability through `YT_DLP_PATH` and `FFMPEG_PATH`, or through the system path.

## Extension Distribution

The extension lives in `extension`.

Development install:

1. Open `chrome://extensions`.
2. Enable Developer mode.
3. Load the `extension` folder as an unpacked extension.

Production distribution:

1. Keep the extension thin.
2. Send tab URL and page metadata to the desktop bridge or web app.
3. Avoid core extraction logic in extension scripts.
4. Package through Chrome Web Store when ready.

Detailed setup is in [docs/extension-setup.md](docs/extension-setup.md).

## Environment Variables

### Backend

| Variable | Required | Description |
| --- | --- | --- |
| `PORT` | No | API port, default `3001` |
| `HOST` | No | API bind host, default `0.0.0.0` |
| `NODE_ENV` | No | Set to `production` for production |
| `LOG_LEVEL` | No | `debug`, `info`, `warn`, or `error` |
| `CACHE_MAX_AGE` | No | Cache TTL in milliseconds |
| `CORS_ORIGINS` | Usually | Comma-separated frontend origins |
| `YT_DLP_PATH` | Deprecated | Server compatibility route only |
| `FFMPEG_PATH` | Deprecated | Server compatibility route only |
| `YTDLP_COOKIES_FILE` | Deprecated | Server compatibility route only |

### Frontend

| Variable | Required | Description |
| --- | --- | --- |
| `VITE_API_URL` | Yes in production | Backend API base URL |
| `VITE_DESKTOP_BRIDGE_URL` | Phase 2 | Local desktop bridge URL |

### Desktop Worker

| Variable | Required | Description |
| --- | --- | --- |
| `SIGNALTHIEF_DESKTOP_PORT` | No | Local worker port, default `43173` |
| `SIGNALTHIEF_DESKTOP_HOST` | No | Local bind host, default `127.0.0.1` |
| `SIGNALTHIEF_DEVICE_ID` | Recommended | Stable device id |
| `SIGNALTHIEF_DEVICE_NAME` | No | Human-readable device name |
| `YT_DLP_PATH` | Usually | yt-dlp binary path |
| `FFMPEG_PATH` | Usually | FFmpeg binary path |

## Validation Checklist

- Web app renders at the deployed URL.
- Backend `/api/health` returns `status: ok`.
- Backend `/api/jobs` accepts a local-desktop job.
- Desktop worker `/health` returns device capabilities.
- Pairing flow returns a short-lived session token.
- Local worker can extract metadata through `/api/extract`.
- Local worker can download and convert through `/api/download`.
- Extension loads without requiring the backend for core business logic.
- Backend compatibility routes emit deprecation headers.

## Migration Concern

Cloud backends that run yt-dlp at scale are likely to hit shared-IP blocks and bot challenges. This architecture intentionally moves those workflows onto the user's device, where user-authorized browser context and local network identity belong.
