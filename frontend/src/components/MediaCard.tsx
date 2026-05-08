import type { MediaFormat } from '../../../shared/types';

interface MediaCardProps {
  formats: MediaFormat[];
  selectedId: string | null;
  downloadingId: string | null;
  onDownload: (format: MediaFormat) => void;
  targetFormat: string;
}

function formatBitrate(bps: number | null): string {
  if (!bps) return '--';
  if (bps >= 1000) return `${(bps / 1000).toFixed(0)}k`;
  return `${bps}`;
}

function formatSize(bytes: number | null): string {
  if (!bytes) return '--';
  if (bytes >= 1_048_576) return `${(bytes / 1_048_576).toFixed(1)} MB`;
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${bytes} B`;
}

function formatNote(note: string): string {
  if (!note) return '--';
  // Keep it short
  return note.length > 25 ? note.slice(0, 22) + '...' : note;
}

export default function MediaCard({
  formats,
  selectedId,
  downloadingId,
  onDownload,
  targetFormat,
}: MediaCardProps) {
  // Deduplicate by formatId
  const seen = new Set<string>();
  const uniqueFormats = formats.filter(f => {
    if (seen.has(f.formatId)) return false;
    seen.add(f.formatId);
    return true;
  });

  // Sort: audio-only first, then by bitrate desc
  const sorted = [...uniqueFormats].sort((a, b) => {
    const aAudio = a.resolution === 'audio only' || (!a.vcodec || a.vcodec === 'none');
    const bAudio = b.resolution === 'audio only' || (!b.vcodec || b.vcodec === 'none');
    if (aAudio && !bAudio) return -1;
    if (!aAudio && bAudio) return 1;
    return (b.audioBitrate || 0) - (a.audioBitrate || 0);
  });

  return (
    <div className="overflow-x-auto">
      <table className="table-brutal">
        <thead>
          <tr>
            <th className="w-8">#</th>
            <th>Format ID</th>
            <th>Extension</th>
            <th>Note</th>
            <th>Bitrate</th>
            <th>Size</th>
            <th>Resolution</th>
            <th className="w-24 text-right">Action</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((fmt, idx) => {
            const isSelected = selectedId === fmt.formatId;
            const isDownloading = downloadingId === fmt.formatId;

            return (
              <tr key={fmt.formatId} className={isSelected ? 'bg-amber-900/10' : ''}>
                <td className="text-dim">{idx + 1}</td>
                <td className="font-mono text-xs text-accent" title={fmt.formatId}>
                  {fmt.formatId}
                </td>
                <td className="text-xs uppercase tracking-wider text-muted">
                  {fmt.ext || '--'}
                </td>
                <td className="text-xs text-dim max-w-[180px] truncate" title={fmt.formatNote}>
                  {formatNote(fmt.formatNote)}
                </td>
                <td className="text-xs font-mono">
                  {formatBitrate(fmt.audioBitrate)}
                </td>
                <td className="text-xs font-mono text-dim">
                  {formatSize(fmt.filesize)}
                </td>
                <td className="text-xs font-mono text-muted">
                  {fmt.resolution || '--'}
                </td>
                <td className="text-right">
                  <button
                    onClick={() => onDownload(fmt)}
                    disabled={isDownloading}
                    className={`btn-brutal btn-brutal-sm w-full justify-center ${
                      isDownloading ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                    title={`Download as ${targetFormat.toUpperCase()}`}
                  >
                    {isDownloading ? (
                      <>
                        <span className="status-dot-amber" />
                        DL
                      </>
                    ) : (
                      'GET'
                    )}
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {sorted.length === 0 && (
        <div className="brutal-panel-darker p-8 text-center">
          <p className="text-muted font-mono text-sm">No formats available.</p>
        </div>
      )}

      <div className="flex items-center justify-between mt-4 pt-4 brutal-border-top">
        <p className="text-dim text-xs font-mono">
          {sorted.length} format{sorted.length !== 1 ? 's' : ''} found
        </p>
        <p className="text-dim text-xs font-mono">
          Output: <span className="text-accent">{targetFormat.toUpperCase()}</span>
        </p>
      </div>
    </div>
  );
}