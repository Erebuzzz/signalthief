export default function Header() {
  return (
    <header className="brutal-border-bottom bg-dark/90 backdrop-blur supports-[backdrop-filter]:bg-dark/80 sticky top-0 z-40">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-accent text-lg font-mono" aria-hidden="true">
            [~]
          </span>
          <h1 className="terminal-text text-lg text-accent">
            SIGNAL<span className="text-muted">THIEF</span>
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <a
            href="https://github.com/Erebuzzz/signalthief"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-brutal btn-brutal-sm"
            title="GitHub Repository"
          >
            GIT
          </a>
          <a
            href="https://github.com/Erebuzzz/signalthief#readme"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-brutal btn-brutal-sm"
            title="Documentation"
          >
            DOCS
          </a>
        </div>
      </div>
    </header>
  );
}