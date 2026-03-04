import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  getThreadLoader,
  resolveThreadLoaderPreset,
} from '../utils/loaders/threadLoader';

describe('resolveThreadLoaderPreset', () => {
  it('"light" returns 1 worker with 10 parallel jobs', () => {
    const result = resolveThreadLoaderPreset('light');
    assert.ok(result);
    assert.strictEqual(result.workers, 1);
    assert.strictEqual(result.workerParallelJobs, 10);
  });

  it('"full" returns multiple workers with 15 parallel jobs', () => {
    const result = resolveThreadLoaderPreset('full');
    assert.ok(result);
    assert.ok(result.workers >= 1);
    assert.strictEqual(result.workerParallelJobs, 15);
  });

  it('"auto" returns a valid config', () => {
    const result = resolveThreadLoaderPreset('auto');
    assert.ok(result);
    assert.ok(result.workers >= 1);
    assert.ok(result.workerParallelJobs >= 1);
  });

  it('"off" returns null', () => {
    assert.strictEqual(resolveThreadLoaderPreset('off'), null);
  });
});

describe('getThreadLoader', () => {
  it('returns a thread-loader RuleSetUseItem when preset is not "off"', () => {
    const result = getThreadLoader({
      preset: 'light',
      watch: false,
    });

    assert.ok(result);
    assert.strictEqual((result as { loader: string }).loader, 'thread-loader');
  });

  it('returns null when preset is "off"', () => {
    assert.strictEqual(
      getThreadLoader({ preset: 'off', watch: false }),
      null,
    );
  });

  it('sets poolTimeout to Infinity when watch is true', () => {
    const result = getThreadLoader({ preset: 'light', watch: true });
    assert.ok(result);
    const opts = (result as { options: { poolTimeout: number } }).options;
    assert.strictEqual(opts.poolTimeout, Infinity);
  });

  it('sets poolTimeout to 2000 when watch is false', () => {
    const result = getThreadLoader({ preset: 'light', watch: false });
    assert.ok(result);
    const opts = (result as { options: { poolTimeout: number } }).options;
    assert.strictEqual(opts.poolTimeout, 2000);
  });

  it('applies workers override', () => {
    const result = getThreadLoader({
      preset: 'light',
      workers: 4,
      watch: false,
    });
    assert.ok(result);
    const opts = (result as { options: { workers: number } }).options;
    assert.strictEqual(opts.workers, 4);
  });

  it('applies jobs override', () => {
    const result = getThreadLoader({
      preset: 'light',
      jobs: 20,
      watch: false,
    });
    assert.ok(result);
    const opts = (
      result as { options: { workerParallelJobs: number } }
    ).options;
    assert.strictEqual(opts.workerParallelJobs, 20);
  });

  it('uses preset defaults when no overrides given', () => {
    const result = getThreadLoader({ preset: 'light', watch: false });
    assert.ok(result);
    const opts = (
      result as {
        options: { workers: number; workerParallelJobs: number };
      }
    ).options;
    assert.strictEqual(opts.workers, 1);
    assert.strictEqual(opts.workerParallelJobs, 10);
  });
});
