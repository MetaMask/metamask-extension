import { describe, it } from 'node:test';
import assert from 'node:assert';
import { DEV_SERVER_OPTIONS } from '../utils/constants';

describe('./utils/constants.ts', () => {
  it('disables webpack-dev-server signal handling', () => {
    assert.strictEqual(DEV_SERVER_OPTIONS.setupExitSignals, false);
  });
});
