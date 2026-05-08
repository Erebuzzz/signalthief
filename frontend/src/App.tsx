import { useState, useCallback } from 'react';
import type { MediaInfo, MediaFormat, ExtractResponse, DownloadResponse } from '../../shared/types';
import Header from './components/Header';
import UrlInput from './components/UrlInput';
import MediaCard from './components/MediaCard';
import Footer from './components/Footer';
import Terminal from './components/Terminal';
import HowToUse from './components/HowToUse';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';

type Toast = {
  id: number;
  type: 'success' | 'error' | 'info';
  message: string;
};

export default function App() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [downloadId, setDownloadId] = useState<string | null>(null);
  const [mediaInfo, setMediaInfo] = useState<MediaInfo | null>(null);
  const [selectedFormat, setSelectedFormat] = useState<MediaFormat | null>(null);
  const [targetFormat, setTargetFormat] = useState('mp3');
  const [quality, setQuality] = useState('high');
  const [error, setError] = useState<string | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [statusText, setStatusText] = useState('IDLE');
  const [currentPage, setCurrentPage] = useState<'app' | 'help'>('app');

  const addToast = useCallback((type: Toast['type'], message: string) => {
    const id = Date.now();
    setToasts(prev => [...prev.slice(-2), { id, type, message }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  }, []);

  const handleExtract = useCallback(async (inputUrl: string) => {
    setUrl(inputUrl);
    setLoading(true);
    setError(null);
    setMediaInfo(null);
    setSelectedFormat(null);
    setStatusText('EXTRACTING...');

    try {
      const res = await fetch(`${API_BASE}/api/extract`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: inputUrl }),
      });

      const data: ExtractResponse = await res.json();

      if (!data.success || !data.data) {
        setError(data.error || 'Failed to extract media info');
        setStatusText('ERROR');
        addToast('error', data.error || 'Extraction failed');
        return;
      }

      setMediaInfo(data.data);
      setStatusText('READY');

      const formatCount = data.data.formats?.length || 0;
      addToast('success', `Found ${formatCount} formats for "${data.data.title?.slice(0, 40)}..."`);
    } catch (err: any) {
      const msg = err.message || 'Network error';
      setError(msg);
      setStatusText('NETWORK ERROR');
      addToast('error', msg);
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  const handleDownload = useCallback(async (format: MediaFormat) => {
    setSelectedFormat(format);
    setStatusText('DOWNLOADING...');

    try {
      const res = await fetch(`${API_BASE}/api/download`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url,
        formatId: format.formatId,
          targetFormat,
          quality,
        }),
      });

      if (!res.ok) {
        const errData: DownloadResponse = await res.json().catch(() => null);
        const msg = errData?.error || `Download failed (${res.status})`;
        setError(msg);
        setStatusText('DOWNLOAD FAILED');
        addToast('error', msg);
        return;
      }

      // Stream download as file
      const blob = await res.blob();
      const contentDisposition = res.headers.get('Content-Disposition') || '';
      const filenameMatch = contentDisposition.match(/filename="?(.+?)"?$/);
      const filename = filenameMatch?.[1] || `signalthief_${Date.now()}.${targetFormat}`;

      const downloadUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(downloadUrl);

      setDownloadId(format.formatId);
      setStatusText('COMPLETE');
      addToast('success', `Downloaded: ${filename}`);
    } catch (err: any) {
      const msg = err.message || 'Download failed';
      setError(msg);
      setStatusText('ERROR');
      addToast('error', msg);
    }
  }, [url, targetFormat, quality, addToast]);

  const handleCancel = useCallback(() => {
    setMediaInfo(null);
    setSelectedFormat(null);
    setError(null);
    setStatusText('IDLE');
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      {/* Toasts */}
      <div className="fixed bottom-4 right-4 z-[10000] flex flex-col gap-2">
        {toasts.map(t => (
          <div
            key={t.id}
            className={
              t.type === 'success' ? 'toast toast-success' :
              t.type === 'error' ? 'toast toast-error' :
              'toast'
            }
          >
            [{new Date().toLocaleTimeString('en-US', { hour12: false })}] {t.message}
          </div>
        ))}
      </div>

      <Header
        currentPage={currentPage}
        onNavigate={(page: 'app' | 'help') => setCurrentPage(page)}
      />

      {currentPage === 'help' ? (
        <main className="flex-1 px-4 py-8 max-w-4xl mx-auto w-full">
          <HowToUse onBack={() => setCurrentPage('app')} />
        </main>
      ) : (
      <main className="flex-1 px-4 py-8 max-w-4xl mx-auto w-full">
        {/* URL Input Section */}
        <section className="brutal-panel p-6 mb-8">
          <UrlInput
            onExtract={handleExtract}
            loading={loading}
            initialUrl={url}
          />
        </section>

        {/* Error Display */}
        {error && !mediaInfo && (
          <section className="brutal-panel p-6 mb-8 border-red-500" style={{ borderColor: '#ff3333' }}>
            <div className="flex items-start gap-3">
              <span className="text-danger font-mono text-sm mt-0.5">[ERR]</span>
              <div>
                <p className="text-danger font-mono text-sm whitespace-pre-wrap break-all">{error}</p>
                <button
                  onClick={() => { setError(null); setStatusText('IDLE'); }}
                  className="btn-brutal btn-brutal-sm mt-4"
                >
                  DISMISS
                </button>
              </div>
            </div>
          </section>
        )}

        {/* Loading State */}
        {loading && (
          <section className="brutal-panel p-6 mb-8 animate-flicker">
            <div className="flex items-center gap-3 mb-6">
              <span className="status-dot-amber" />
              <span className="terminal-text text-accent text-sm">EXTRACTING AUDIO STREAMS...</span>
            </div>
            <div className="space-y-3">
              <div className="skeleton skeleton-text" />
              <div className="skeleton skeleton-text skeleton-text-short" />
              <div className="skeleton skeleton-block mt-4" />
              <div className="skeleton skeleton-block" />
              <div className="skeleton skeleton-block" />
            </div>
            <p className="text-dim text-xs mt-4 font-mono">
              $ yt-dlp --print formats "{url.slice(0, 50)}{url.length > 50 ? '...' : ''}"
            </p>
          </section>
        )}

        {/* Media Info / Format Selection */}
        {mediaInfo && !loading && (
          <section className="brutal-panel p-6 mb-8">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <span className="status-dot" />
                <span className="terminal-text text-success text-sm">EXTRACTION COMPLETE</span>
              </div>
              <button onClick={handleCancel} className="btn-brutal btn-brutal-sm btn-brutal-danger">
                CLEAR
              </button>
            </div>

            {/* Format & Quality Selectors */}
            <div className="flex flex-wrap gap-4 mb-6 brutal-border-bottom pb-4">
              <div className="flex flex-col gap-2">
                <label className="text-dim text-xs font-mono uppercase tracking-wider">
                  Output Format
                </label>
                <select
                  value={targetFormat}
                  onChange={e => setTargetFormat(e.target.value)}
                  className="select-brutal"
                >
                  <optgroup label="Audio">
                    <option value="mp3">MP3 (recommended)</option>
                    <option value="aac">AAC</option>
                    <option value="flac">FLAC (lossless)</option>
                    <option value="opus">Opus</option>
                    <option value="ogg">OGG Vorbis</option>
                    <option value="wav">WAV (uncompressed)</option>
                    <option value="m4a">M4A</option>
                    <option value="best">Best (original)</option>
                  </optgroup>
                  <optgroup label="Video">
                    <option value="mp4">MP4</option>
                    <option value="webm">WebM</option>
                    <option value="mkv">MKV</option>
                  </optgroup>
                </select>
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-dim text-xs font-mono uppercase tracking-wider">
                  Quality
                </label>
                <select
                  value={quality}
                  onChange={e => setQuality(e.target.value)}
                  className="select-brutal"
                >
                  <option value="best">Best</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>
            </div>

            {/* Media Info Header */}
            <div className="mb-4">
              <h2 className="terminal-text text-lg text-accent truncate" title={mediaInfo.title}>
                {mediaInfo.title || 'Unknown Title'}
              </h2>
              {mediaInfo.uploader && (
                <p className="text-dim text-xs mt-1 font-mono">
                  by {mediaInfo.uploader}
                  {mediaInfo.duration && <> &middot; {Math.floor(mediaInfo.duration / 60)}:{String(mediaInfo.duration % 60).padStart(2, '0')}</>}
                </p>
              )}
            </div>

            {/* Format List */}
            {mediaInfo.formats && mediaInfo.formats.length > 0 ? (
              <MediaCard
                formats={mediaInfo.formats}
                selectedId={selectedFormat?.formatId || null}
                downloadingId={downloadId}
                onDownload={handleDownload}
                targetFormat={targetFormat}
              />
            ) : (
              <div className="brutal-panel-darker p-8 text-center">
                <p className="text-muted font-mono text-sm">
                  No downloadable formats found.
                </p>
                <p className="text-dim text-xs mt-2 font-mono">
                  The URL may not contain extractable media.
                </p>
              </div>
            )}
          </section>
        )}

        {/* Idle State with Terminal */}
        {!loading && !mediaInfo && !error && (
          <section className="mb-8">
            <Terminal />
          </section>
        )}
      </main>
      )}

      <Footer statusText={statusText} />
    </div>
  );
}