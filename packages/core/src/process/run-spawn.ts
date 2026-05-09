import { spawn, type ChildProcess } from 'child_process';

export interface RunSpawnOptions {
  timeoutMs: number;
  /** Max characters of stderr to retain for error messages (avoids unbounded memory). */
  stderrTailChars?: number;
}

/**
 * Run a subprocess with stdin and stdout discarded, while keeping stderr bounded.
 * Prevents execFile-style buffering of huge ffmpeg/yt-dlp progress logs in Node memory.
 */
export function runSpawn(command: string, args: string[], opts: RunSpawnOptions): Promise<void> {
  const stderrTailChars = opts.stderrTailChars ?? 24_000;

  return new Promise((resolve, reject) => {
    const child: ChildProcess = spawn(command, args, {
      stdio: ['ignore', 'ignore', 'pipe'],
      windowsHide: true,
    });

    let stderrTail = '';
    child.stderr?.setEncoding('utf8');
    child.stderr?.on('data', (chunk: string) => {
      stderrTail = (stderrTail + chunk).slice(-stderrTailChars);
    });

    const timer = setTimeout(() => {
      child.kill('SIGKILL');
      reject(new Error('Process timed out'));
    }, opts.timeoutMs);

    child.on('error', e => {
      clearTimeout(timer);
      reject(e);
    });

    child.on('close', (code, signal) => {
      clearTimeout(timer);
      if (code === 0) {
        resolve();
        return;
      }
      const msg =
        stderrTail.trim() ||
        (signal ? `Killed (${signal})` : '') ||
        `Exit code ${code ?? 'unknown'}`;
      reject(new Error(msg));
    });
  });
}
