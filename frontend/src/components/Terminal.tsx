import { useState, useEffect, useRef } from 'react';

const BOOT_LINES = [
  { text: '$ signalthief --init', delay: 400, prompt: true },
  { text: 'INITIALIZING SIGNALTHIEF ENGINE v1.0.0...', delay: 300 },
  { text: '[ OK ] yt-dlp runtime detected', delay: 200 },
  { text: '[ OK ] FFmpeg transcoding pipeline online', delay: 200 },
  { text: '[ OK ] Rate limiter engaged', delay: 200 },
  { text: '[ OK ] LRU cache allocated (1000 entries)', delay: 200 },
  { text: '[ OK ] Temp file janitor running', delay: 200 },
  { text: '', delay: 150 },
  { text: 'LOADING SITE SUPPORT MANIFEST...', delay: 250 },
  { text: '', delay: 100 },
  { text: '  SITES:  1800+ supported', delay: 150 },
  { text: '  AUDIO:  MP3 | FLAC | AAC | Opus | OGG | WAV | M4A', delay: 150 },
  { text: '  VIDEO:  MP4 | WebM | MKV', delay: 150 },
  { text: '', delay: 100 },
  { text: '  PLATFORMS:', delay: 150 },
  { text: '    YouTube  ·  SoundCloud  ·  Bandcamp  ·  Vimeo', delay: 150 },
  { text: '    Twitter/X  ·  Instagram  ·  TikTok  ·  Spotify', delay: 150 },
  { text: '    ...and 1800+ more', delay: 200 },
  { text: '', delay: 150 },
  { text: 'SIGNALTHIEF READY.', delay: 300 },
  { text: '', delay: 200 },
];

export default function Terminal() {
  const [visibleLines, setVisibleLines] = useState<number>(0);
  const [currentChar, setCurrentChar] = useState<number>(0);
  const [isTypingLine, setIsTypingLine] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (visibleLines >= BOOT_LINES.length) {
      // Boot complete — show the idle prompt
      const timer = setTimeout(() => setShowPrompt(true), 400);
      return () => clearTimeout(timer);
    }

    const line = BOOT_LINES[visibleLines];

    if (line.text === '') {
      const timer = setTimeout(() => {
        setVisibleLines(prev => prev + 1);
        setCurrentChar(0);
      }, line.delay);
      return () => clearTimeout(timer);
    }

    if (!isTypingLine) {
      setIsTypingLine(true);
      setCurrentChar(0);
      return;
    }

    if (currentChar < line.text.length) {
      const charDelay = line.text.startsWith('$') ? 30 : 8;
      const timer = setTimeout(() => {
        setCurrentChar(prev => prev + 1);
      }, charDelay);
      return () => clearTimeout(timer);
    }

    const timer = setTimeout(() => {
      setVisibleLines(prev => prev + 1);
      setCurrentChar(0);
      setIsTypingLine(false);
    }, line.delay);
    return () => clearTimeout(timer);
  }, [visibleLines, currentChar, isTypingLine]);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [visibleLines, currentChar]);

  return (
    <div className="terminal-container">
      {/* Terminal chrome — window controls */}
      <div className="terminal-chrome">
        <div className="terminal-dots">
          <span className="terminal-dot terminal-dot-red" />
          <span className="terminal-dot terminal-dot-amber" />
          <span className="terminal-dot terminal-dot-green" />
        </div>
        <span className="terminal-title">signalthief@local:~</span>
      </div>

      {/* Terminal body */}
      <div ref={containerRef} className="terminal-body">
        {/* Boot lines — rendered one by one with typing effect */}
        {BOOT_LINES.slice(0, visibleLines).map((line, i) => (
          <div key={i} className="terminal-line">
            {line.prompt && <span className="terminal-prompt">$ </span>}
            <span className={getLineClass(line.text)}>{line.text}</span>
          </div>
        ))}

        {/* Currently typing line */}
        {visibleLines < BOOT_LINES.length && (
          <div className="terminal-line">
            {BOOT_LINES[visibleLines].prompt && (
              <span className="terminal-prompt">$ </span>
            )}
            <span className={getLineClass(BOOT_LINES[visibleLines].text)}>
              {BOOT_LINES[visibleLines].text.slice(0, currentChar)}
            </span>
            <span className="terminal-cursor">&#9608;</span>
          </div>
        )}

        {/* Boot complete — idle prompt */}
        {showPrompt && (
          <div className="terminal-line terminal-idle-prompt">
            <span className="terminal-prompt">{'>'}</span>
            <span className="terminal-prompt-text"> Enter a URL above to begin extraction</span>
            <span className="terminal-cursor">&#9608;</span>
          </div>
        )}
      </div>
    </div>
  );
}

function getLineClass(text: string): string {
  if (text.startsWith('[ OK ]')) return 'terminal-ok';
  if (text.startsWith('SITES:') || text.startsWith('AUDIO:') || text.startsWith('VIDEO:')) return 'terminal-info';
  if (text.startsWith('  ') && !text.startsWith('  SITES')) return 'terminal-sub';
  if (text.startsWith('SIGNALTHIEF')) return 'terminal-accent';
  if (text.startsWith('$')) return 'terminal-command';
  return 'terminal-output';
}