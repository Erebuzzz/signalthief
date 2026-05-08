interface FooterProps {
  statusText: string;
}

export default function Footer({ statusText }: FooterProps) {
  return (
    <footer className="brutal-border-top mt-auto">
      <div className="max-w-6xl mx-auto px-4 py-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <span className="terminal-text text-accent text-sm">{'>'}_</span>
            <span className="text-dim text-xs font-mono">
              STATUS: <span className="text-muted">{statusText}</span>
            </span>
          </div>
          <div className="flex items-center gap-4 text-xs font-mono text-dim">
            <a
              href="https://github.com/Erebuzzz/signalthief"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-accent transition-colors"
            >
              GITHUB
            </a>
            <span className="text-muted">|</span>
            <a
              href="https://github.com/Erebuzzz/signalthief/blob/main/LICENSE"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-accent transition-colors"
            >
              MIT
            </a>
            <span className="text-muted">|</span>
            <span>yt-dlp + FFmpeg</span>
          </div>
        </div>
      </div>
    </footer>
  );
}