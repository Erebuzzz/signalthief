import test from 'node:test';
import assert from 'node:assert/strict';
import { chooseSourceAdapter, type SourceAdapter } from './source-adapter.js';

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

test('chooseSourceAdapter returns the highest confidence adapter', () => {
  const adapter = chooseSourceAdapter([lowConfidenceAdapter, highConfidenceAdapter], 'https://example.com/watch');
  assert.equal(adapter?.id, 'high');
});

test('chooseSourceAdapter returns null for invalid URLs', () => {
  assert.equal(chooseSourceAdapter([highConfidenceAdapter], 'not a url'), null);
});
