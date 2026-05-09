import { useRef, useCallback } from 'react';

function extractHttpUrl(raw: string): string | null {
  const line = raw.trim().split(/\s+/)[0];
  if (!line) return null;
  const candidate = /^https?:\/\//i.test(line) ? line : `https://${line}`;
  try {
    const u = new URL(candidate);
    if (u.protocol === 'http:' || u.protocol === 'https:') return candidate;
  } catch {
    return null;
  }
  return null;
}

interface UrlInputProps {
  onExtract: (url: string) => void;
  loading: boolean;
  initialUrl: string;
}

export default function UrlInput({ onExtract, loading, initialUrl }: UrlInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const tryAutoExtract = useCallback(() => {
    const raw = inputRef.current?.value ?? '';
    const url = extractHttpUrl(raw);
    if (url && !loading) onExtract(url);
  }, [loading, onExtract]);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    tryAutoExtract();
  }, [tryAutoExtract]);

  const handlePasteFromClipboard = useCallback(async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text && inputRef.current) {
        inputRef.current.value = text;
        const url = extractHttpUrl(text);
        if (url && !loading) onExtract(url);
      }
    } catch {
      // Clipboard access denied
    }
  }, [loading, onExtract]);

  /** After native paste, wait one tick so the input value is updated, then auto-extract if URL-like */
  const handleInputPaste = useCallback(() => {
    setTimeout(() => tryAutoExtract(), 50);
  }, [tryAutoExtract]);

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div className="flex gap-3">
        <div className="relative flex-1">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-dim font-mono text-sm select-none">
            URL:
          </span>
          <input
            ref={inputRef}
            type="text"
            inputMode="url"
            autoComplete="url"
            defaultValue={initialUrl}
            placeholder="Paste a link here — formats appear automatically"
            className="input-brutal pl-16"
            disabled={loading}
            autoFocus
            onPaste={handleInputPaste}
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="btn-brutal btn-brutal-primary"
        >
          {loading ? (
            <>
              <span className="status-dot-amber" />
              EXTRACTING
            </>
          ) : (
            'EXTRACT'
          )}
        </button>
        <button
          type="button"
          onClick={handlePasteFromClipboard}
          disabled={loading}
          className="btn-brutal btn-brutal-sm"
          title="Paste from clipboard and load formats"
        >
          PASTE
        </button>
      </div>
      <p className="text-dim text-xs mt-3 font-mono leading-relaxed">
        <span className="text-accent font-semibold">Paste a link</span>
        {' '}and download options load automatically — or press{' '}
        <span className="text-muted">EXTRACT</span>.
        {' '}
        <span className="text-muted">Supports YouTube, SoundCloud, Bandcamp, Vimeo, X, TikTok, and 1800+ sites.</span>
      </p>
    </form>
  );
}