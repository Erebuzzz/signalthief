interface HowToUseProps {
  onBack: () => void;
}

export default function HowToUse({ onBack }: HowToUseProps) {
  return (
    <div className="space-y-8">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="terminal-text text-2xl text-accent">HOW TO USE</h2>
          <p className="text-dim text-xs mt-1 font-mono">
            A complete guide to extracting media with SignalThief
          </p>
        </div>
        <button onClick={onBack} className="btn-brutal btn-brutal-sm">
          BACK
        </button>
      </div>

      {/* ===== WEB APP ===== */}
      <section className="brutal-panel p-6">
        <h3 className="terminal-text text-lg text-accent mb-4">
          [~] WEB APPLICATION
        </h3>

        <div className="space-y-6">
          {/* Step 1 */}
          <div>
            <div className="flex items-start gap-4">
              <span className="text-accent font-mono text-sm mt-0.5 shrink-0">
                01.
              </span>
              <div>
                <h4 className="text-muted font-mono text-sm font-semibold mb-2">
                  Enter a Media URL
                </h4>
                <p className="text-dim text-xs leading-relaxed">
                  Paste any supported URL into the input field at the top of the page.
                  SignalThief works with YouTube, SoundCloud, Bandcamp, Vimeo,
                  Twitter/X, Instagram, TikTok, Spotify, and 1800+ other sites.
                </p>
                <div className="terminal-container mt-3 p-3">
                  <span className="terminal-prompt text-xs">$ </span>
                  <span className="terminal-output text-xs">
                    https://youtube.com/watch?v=dQw4w9WgXcQ
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Step 2 */}
          <div>
            <div className="flex items-start gap-4">
              <span className="text-accent font-mono text-sm mt-0.5 shrink-0">
                02.
              </span>
              <div>
                <h4 className="text-muted font-mono text-sm font-semibold mb-2">
                  Click EXTRACT
                </h4>
                <p className="text-dim text-xs leading-relaxed">
                  Press the <span className="text-accent font-semibold">EXTRACT</span> button
                  (or use the <span className="text-accent font-semibold">PASTE</span> button
                  to paste from your clipboard). The backend will analyze the URL using{' '}
                  <code className="text-accent">yt-dlp</code> and return all available formats.
                </p>
              </div>
            </div>
          </div>

          {/* Step 3 */}
          <div>
            <div className="flex items-start gap-4">
              <span className="text-accent font-mono text-sm mt-0.5 shrink-0">
                03.
              </span>
              <div>
                <h4 className="text-muted font-mono text-sm font-semibold mb-2">
                  Choose Format & Quality
                </h4>
                <p className="text-dim text-xs leading-relaxed">
                  Once extraction completes, select your desired output format (MP3, FLAC,
                  AAC, Opus, WAV, M4A for audio; MP4, WebM, MKV for video) and quality level
                  (Best, High, Medium, Low). Higher quality means larger file sizes.
                </p>
              </div>
            </div>
          </div>

          {/* Step 4 */}
          <div>
            <div className="flex items-start gap-4">
              <span className="text-accent font-mono text-sm mt-0.5 shrink-0">
                04.
              </span>
              <div>
                <h4 className="text-muted font-mono text-sm font-semibold mb-2">
                  Download
                </h4>
                <p className="text-dim text-xs leading-relaxed">
                  Click the <span className="text-accent font-semibold">GET</span> button next to
                  your preferred format. The file will be transcoded and streamed to your browser
                  as a direct download. No ads, no redirects, no bloat.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== CHROME EXTENSION ===== */}
      <section className="brutal-panel p-6">
        <h3 className="terminal-text text-lg text-accent mb-4">
          [~] CHROME EXTENSION
        </h3>

        <div className="space-y-6">
          {/* Install */}
          <div>
            <div className="flex items-start gap-4">
              <span className="text-accent font-mono text-sm mt-0.5 shrink-0">
                01.
              </span>
              <div>
                <h4 className="text-muted font-mono text-sm font-semibold mb-2">
                  Install the Extension
                </h4>
                <p className="text-dim text-xs leading-relaxed">
                  Navigate to <code className="text-accent">chrome://extensions</code> in your
                  Chrome browser. Enable <strong>Developer mode</strong> using the toggle in the
                  top-right corner. Click <strong>Load unpacked</strong> and select the{' '}
                  <code className="text-accent">extension/</code> folder from this project.
                  Pin the SignalThief icon to your toolbar for quick access.
                </p>
              </div>
            </div>
          </div>

          {/* Auto-detect */}
          <div>
            <div className="flex items-start gap-4">
              <span className="text-accent font-mono text-sm mt-0.5 shrink-0">
                02.
              </span>
              <div>
                <h4 className="text-muted font-mono text-sm font-semibold mb-2">
                  Auto-Detect Media (Detected Media Tab)
                </h4>
                <p className="text-dim text-xs leading-relaxed">
                  Browse to any page with audio or video content. Open the SignalThief popup
                  by clicking its icon. The extension automatically scans for{' '}
                  <code className="text-accent">&lt;audio&gt;</code> and{' '}
                  <code className="text-accent">&lt;video&gt;</code> elements and intercepts
                  network requests for media streams. Detected sources appear in the list —
                  click any item to download it directly.
                </p>
              </div>
            </div>
          </div>

          {/* Manual URL */}
          <div>
            <div className="flex items-start gap-4">
              <span className="text-accent font-mono text-sm mt-0.5 shrink-0">
                03.
              </span>
              <div>
                <h4 className="text-muted font-mono text-sm font-semibold mb-2">
                  Manual URL Entry (Paste URL Tab)
                </h4>
                <p className="text-dim text-xs leading-relaxed">
                  Switch to the <strong>Paste URL</strong> tab to manually enter any supported
                  URL. The extension will extract media info from the backend API, letting you
                  choose audio/video format and quality before downloading — same as the web app
                  but right from your browser toolbar.
                </p>
              </div>
            </div>
          </div>

          {/* Refresh */}
          <div>
            <div className="flex items-start gap-4">
              <span className="text-accent font-mono text-sm mt-0.5 shrink-0">
                04.
              </span>
              <div>
                <h4 className="text-muted font-mono text-sm font-semibold mb-2">
                  Refresh & Re-scan
                </h4>
                <p className="text-dim text-xs leading-relaxed">
                  If media loads after the page (e.g., lazy-loaded content or single-page apps),
                  click the refresh button in the popup header to re-scan the current page for
                  newly loaded media elements.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== SUPPORTED FORMATS ===== */}
      <section className="brutal-panel p-6">
        <h3 className="terminal-text text-lg text-accent mb-4">
          [~] SUPPORTED FORMATS
        </h3>

        <div className="overflow-x-auto">
          <table className="table-brutal">
            <thead>
              <tr>
                <th>Category</th>
                <th>Format</th>
                <th>Quality</th>
                <th>Notes</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><span className="badge badge-green">Audio</span></td>
                <td className="text-accent">MP3</td>
                <td>Up to 320 kbps</td>
                <td className="text-dim">Recommended — universal compatibility</td>
              </tr>
              <tr>
                <td><span className="badge badge-green">Audio</span></td>
                <td className="text-accent">FLAC</td>
                <td>Lossless</td>
                <td className="text-dim">Perfect quality, larger files</td>
              </tr>
              <tr>
                <td><span className="badge badge-green">Audio</span></td>
                <td className="text-accent">AAC</td>
                <td>Up to 256 kbps</td>
                <td className="text-dim">Efficient, Apple-friendly</td>
              </tr>
              <tr>
                <td><span className="badge badge-green">Audio</span></td>
                <td className="text-accent">Opus</td>
                <td>Up to 160 kbps</td>
                <td className="text-dim">Excellent at low bitrates</td>
              </tr>
              <tr>
                <td><span className="badge badge-green">Audio</span></td>
                <td className="text-accent">OGG Vorbis</td>
                <td>Variable</td>
                <td className="text-dim">Open-source codec</td>
              </tr>
              <tr>
                <td><span className="badge badge-green">Audio</span></td>
                <td className="text-accent">WAV</td>
                <td>Uncompressed</td>
                <td className="text-dim">Raw audio, large files</td>
              </tr>
              <tr>
                <td><span className="badge badge-green">Audio</span></td>
                <td className="text-accent">M4A</td>
                <td>Variable</td>
                <td className="text-dim">AAC in MP4 container</td>
              </tr>
              <tr>
                <td><span className="badge badge-amber">Video</span></td>
                <td className="text-accent">MP4</td>
                <td>H.264 + AAC</td>
                <td className="text-dim">Best compatibility</td>
              </tr>
              <tr>
                <td><span className="badge badge-amber">Video</span></td>
                <td className="text-accent">WebM</td>
                <td>VP9 + Opus</td>
                <td className="text-dim">Open-source, web-optimized</td>
              </tr>
              <tr>
                <td><span className="badge badge-amber">Video</span></td>
                <td className="text-accent">MKV</td>
                <td>Original</td>
                <td className="text-dim">Container — preserves original streams</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* ===== TIPS ===== */}
      <section className="brutal-panel p-6">
        <h3 className="terminal-text text-lg text-accent mb-4">
          [~] TIPS & TROUBLESHOOTING
        </h3>

        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <span className="text-success font-mono text-sm mt-0.5 shrink-0">[TIP]</span>
            <div>
              <h4 className="text-muted font-mono text-sm font-semibold mb-1">
                Which URLs Work?
              </h4>
              <p className="text-dim text-xs leading-relaxed">
                Paste the full page URL — SignalThief handles the rest. Works with YouTube,
                SoundCloud, Bandcamp, Vimeo, Twitter/X, Instagram, TikTok, and 1800+ sites.
                You can also paste direct links to audio/video files (.mp3, .mp4, .webm, etc.).
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <span className="text-success font-mono text-sm mt-0.5 shrink-0">[TIP]</span>
            <div>
              <h4 className="text-muted font-mono text-sm font-semibold mb-1">
                Choosing the Right Format
              </h4>
              <p className="text-dim text-xs leading-relaxed">
                <strong>MP3</strong> is the safest choice — it plays on every device. Use{' '}
                <strong>FLAC</strong> or <strong>WAV</strong> for archiving (lossless quality,
                larger files). <strong>Best (original)</strong> skips conversion entirely —
                fastest download but the file type depends on the source.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <span className="text-success font-mono text-sm mt-0.5 shrink-0">[TIP]</span>
            <div>
              <h4 className="text-muted font-mono text-sm font-semibold mb-1">
                Extraction Not Working?
              </h4>
              <p className="text-dim text-xs leading-relaxed">
                Some sites periodically change how they serve media. If extraction fails for a
                specific URL, the underlying{' '}
                <code className="text-accent">yt-dlp</code> tool may need an update. If you
                deployed your own backend, update it with{' '}
                <code className="text-accent">pip install -U yt-dlp</code>. If you're using a
                hosted instance, wait a day — the server auto-updates its tools.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <span className="text-success font-mono text-sm mt-0.5 shrink-0">[TIP]</span>
            <div>
              <h4 className="text-muted font-mono text-sm font-semibold mb-1">
                Slow Downloads
              </h4>
              <p className="text-dim text-xs leading-relaxed">
                Large files need time to transcode. FLAC and WAV conversions are fastest (no
                lossy encoding needed). Video transcoding depends on source resolution. For the
                fastest experience, use <strong>Best (original)</strong> to skip transcoding
                entirely.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <span className="text-success font-mono text-sm mt-0.5 shrink-0">[TIP]</span>
            <div>
              <h4 className="text-muted font-mono text-sm font-semibold mb-1">
                Extension Not Detecting Media
              </h4>
              <p className="text-dim text-xs leading-relaxed">
                Some sites load media dynamically. Try clicking the refresh button in the popup
                header or reloading the page. The extension scans every 3 seconds for new
                elements. For sites that heavily obfuscate their streams, switch to the{' '}
                <strong>Paste URL</strong> tab instead.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <span className="text-success font-mono text-sm mt-0.5 shrink-0">[TIP]</span>
            <div>
              <h4 className="text-muted font-mono text-sm font-semibold mb-1">
                Clipboard Paste Not Working?
              </h4>
              <p className="text-dim text-xs leading-relaxed">
                Some browsers block clipboard access. If the PASTE button doesn't work, just
                right-click the input field and select Paste, or use Ctrl+V / Cmd+V.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <span className="text-success font-mono text-sm mt-0.5 shrink-0">[TIP]</span>
            <div>
              <h4 className="text-muted font-mono text-sm font-semibold mb-1">
                Rate Limiting
              </h4>
              <p className="text-dim text-xs leading-relaxed">
                The API limits requests to 10 per minute to keep the service stable for
                everyone. If you hit the limit, wait 60 seconds before trying again.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer spacing */}
      <div className="h-4" />
    </div>
  );
}