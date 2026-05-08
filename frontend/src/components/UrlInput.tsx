import { useRef, useCallback } from 'react';

interface UrlInputProps {
  onExtract: (url: string) => void;
  loading: boolean;
  initialUrl: string;
}

export default function UrlInput({ onExtract, loading, initialUrl }: UrlInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    const url = inputRef.current?.value.trim();
    if (url) onExtract(url);
  }, [onExtract]);

  const handlePaste = useCallback(async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text && inputRef.current) {
        inputRef.current.value = text;
      }
    } catch {
      // Clipboard access denied
    }
  }, []);

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
            defaultValue={initialUrl}
            placeholder="https://youtube.com/watch?v=... or any media URL"
            className="input-brutal pl-16"
            disabled={loading}
            autoFocus
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
          onClick={handlePaste}
          disabled={loading}
          className="btn-brutal btn-brutal-sm"
          title="Paste from clipboard"
        >
          PASTE
        </button>
      </div>
      <p className="text-dim text-xs mt-3 font-mono">
        <span className="text-muted">Supports:</span> YouTube · SoundCloud · Bandcamp · Vimeo · Twitter/X · Instagram · TikTok · 1800+ sites
      </p>
    </form>
  );
}