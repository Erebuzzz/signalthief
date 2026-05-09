/** Built-in allowlist; merged with `CORS_ORIGINS` (comma-separated). */
const DEFAULT_CORS_ORIGINS: readonly string[] = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'https://signalthief.erebuzzz.tech',
];

/**
 * Origins allowed for CORS. Reflects the request `Origin` when it matches (credentials-safe).
 */
export function getCorsAllowedOrigins(): Set<string> {
  const set = new Set<string>(DEFAULT_CORS_ORIGINS);
  const extra = process.env.CORS_ORIGINS;
  if (extra) {
    for (const o of extra.split(',')) {
      const t = o.trim();
      if (t) set.add(t);
    }
  }
  return set;
}
