import { describe, it } from 'node:test';
import assert from 'node:assert';
import { DEV_SERVER_OPTIONS } from '../utils/constants';

describe('./utils/constants.ts', () => {
  it('uses webpack-dev-server default signal handling', () => {
    assert.strictEqual(DEV_SERVER_OPTIONS.setupExitSignals, undefined);
  });
});
