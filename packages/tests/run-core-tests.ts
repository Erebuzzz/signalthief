import assert from 'node:assert/strict';
import { chooseSourceAdapter, type SourceAdapter } from '../adapters/src/source-adapter.js';
import { isRetryableJobError, isTerminalJobState } from '../shared/src/jobs.js';

const lowConfidenceAdapter: SourceAdapter = {
  id: 'low',
  displayName: 'Low Confidence',
  capabilities: ['metadata'],
  canHandle: () => ({ adapterId: 'low', confidence: 0.2, reason: 'fallback' }),
  extractMetadata: async () => {
    throw new Error('not used');
  },
  listFormats: async () => [],
};

const highConfidenceAdapter: SourceAdapter = {
  id: 'high',
  displayName: 'High Confidence',
  capabilities: ['metadata'],
  canHandle: () => ({ adapterId: 'high', confidence: 0.9, reason: 'specific host' }),
  extractMetadata: async () => {
    throw new Error('not used');
  },
  listFormats: async () => [],
};

assert.equal(isTerminalJobState('queued'), false);
assert.equal(isTerminalJobState('running'), false);
assert.equal(isTerminalJobState('completed'), true);
assert.equal(isTerminalJobState('failed'), true);
assert.equal(isTerminalJobState('canceled'), true);

assert.equal(isRetryableJobError(undefined), false);
assert.equal(isRetryableJobError({ kind: 'network', message: 'timeout', retryable: true }), true);
assert.equal(isRetryableJobError({ kind: 'validation', message: 'bad url', retryable: false }), false);

assert.equal(chooseSourceAdapter([lowConfidenceAdapter, highConfidenceAdapter], 'https://example.com/watch')?.id, 'high');
assert.equal(chooseSourceAdapter([highConfidenceAdapter], 'not a url'), null);

console.log('Core contract tests passed');
