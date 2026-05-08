import { mkdirSync, existsSync, unlinkSync, rmdirSync, readdirSync, statSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { v4 as uuidv4 } from 'uuid';

const CACHE_DIR = process.env.CACHE_DIR || join(tmpdir(), 'signalthief-cache');
const MAX_AGE_MS = parseInt(process.env.CACHE_MAX_AGE || '3600000', 10); // 1 hour default

// Ensure cache directory exists
if (!existsSync(CACHE_DIR)) {
  mkdirSync(CACHE_DIR, { recursive: true });
}

export async function createTempDir(): Promise<string> {
  const dir = join(CACHE_DIR, uuidv4());
  mkdirSync(dir, { recursive: true });
  return dir;
}

export async function cleanupDir(dir: string): Promise<void> {
  try {
    if (!existsSync(dir)) return;
    const entries = readdirSync(dir);
    for (const entry of entries) {
      const fullPath = join(dir, entry);
      try {
        const stat = statSync(fullPath);
        if (stat.isDirectory()) {
          await cleanupDir(fullPath);
        } else {
          unlinkSync(fullPath);
        }
      } catch {
        // Ignore individual file errors
      }
    }
    rmdirSync(dir);
  } catch {
    // Directory may already be removed
  }
}

export async function scheduleCleanup(dir: string, delayMs: number = MAX_AGE_MS): Promise<void> {
  setTimeout(() => {
    cleanupDir(dir).catch(() => {
      // Silently fail during scheduled cleanup
    });
  }, delayMs);
}

// Run a periodic cleanup of old cache entries
export function startPeriodicCleanup(intervalMs: number = 300000): NodeJS.Timeout {
  // 5 minutes default
  return setInterval(() => {
    try {
      const entries = readdirSync(CACHE_DIR);
      const now = Date.now();
      for (const entry of entries) {
        const fullPath = join(CACHE_DIR, entry);
        try {
          const stat = statSync(fullPath);
          if (now - stat.mtimeMs > MAX_AGE_MS) {
            cleanupDir(fullPath).catch(() => {});
          }
        } catch {
          // Skip files that can't be read
        }
      }
    } catch {
      // Cache dir might not exist
    }
  }, intervalMs);
}

export function getCacheDir(): string {
  return CACHE_DIR;
}