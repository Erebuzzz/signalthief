# Extension Setup

The extension is optional. The core product must work through the web app and desktop worker without the extension installed.

## Development Install

1. Open `chrome://extensions`.
2. Enable Developer mode.
3. Click Load unpacked.
4. Select the `extension` folder.
5. Pin SignalThief if desired.

## Current Responsibilities

- Detect media elements and network media hints.
- Show current tab media candidates.
- Open the web app.
- Trigger simple browser downloads for direct media URLs.

## Target Responsibilities

- Detect the current page URL and tab metadata.
- Forward URL context to the web app or local desktop bridge.
- Avoid source-specific extraction logic.
- Avoid storing cookies.
- Avoid duplicating format and quality business logic.

## Migration Notes

The current popup still calls backend extraction routes. In Phase 2 or Phase 3, move that flow to:

1. Check local desktop bridge availability.
2. If paired, send the URL to the local worker.
3. If not paired, open the web app pairing screen.
4. If no desktop worker exists, show a helpful install prompt.
