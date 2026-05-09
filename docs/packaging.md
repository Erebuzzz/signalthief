# Packaging

SignalThief has four separately distributable parts.

## Web App

Build:

```bash
cd frontend
npm install
npm run build
```

Output:

```text
frontend/dist
```

Deploy the output to static hosting.

## Backend

Build:

```bash
cd backend
npm install
npm run build
```

Run:

```bash
npm start
```

The backend can be packaged as a Docker image or deployed directly as a Node service.

## Desktop Worker

Build:

```bash
cd apps/desktop
npm install
npm run build
```

Production packaging options:

- Electron for a full desktop app and tray UI.
- Tauri for smaller native bundles.
- A signed background service for headless worker mode.

Bundled prerequisites:

- `yt-dlp`
- `ffmpeg`

Packaging should keep these binaries local to the user's device.

## Extension

Development:

```text
Load extension/ as an unpacked extension in Chrome.
```

Distribution:

```text
Package extension/ and publish through the Chrome Web Store.
```

The extension should remain a companion. It should detect page context and forward URLs, not own extraction or conversion.
