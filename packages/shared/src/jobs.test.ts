import test from 'node:test';
import assert from 'node:assert/strict';
import { isRetryableJobError, isTerminalJobState } from './jobs.js';

test('terminal job states are explicit', () => {
  assert.equal(isTerminalJobState('queued'), false);
  assert.equal(isTerminalJobState('running'), false);
  assert.equal(isTerminalJobState('completed'), true);
  assert.equal(isTerminalJobState('failed'), true);
  assert.equal(isTerminalJobState('canceled'), true);
});

test('retryable job errors depend on the retryable flag', () => {
  assert.equal(isRetryableJobError(undefined), false);
  assert.equal(isRetryableJobError({ kind: 'network', message: 'timeout', retryable: true }), true);
  assert.equal(isRetryableJobError({ kind: 'validation', message: 'bad url', retryable: false }), false);
});
