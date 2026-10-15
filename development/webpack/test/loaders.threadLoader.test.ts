import { describe, it, afterEach, mock } from 'node:test';
import assert from 'node:assert';
import os from 'node:os';
import { syncBuiltinESMExports } from 'node:module';
import {
  getThreadLoader,
  resolveAutoThreads,
  resolveAutoJobs,
} from '../utils/loaders/threadLoader.ts';

describe('resolveAutoThreads', () => {
  afterEach(() => {
    mock.restoreAll();
    syncBuiltinESMExports();
  });
  it('returns numCores - 2 (min 1) for low core counts', () => {
    mock.method(os, 'availableParallelism', () => 4);
    mock.method(os, 'freemem', () => 16 * 1024 * 1024 * 1024);
    syncBuiltinESMExports();
    const result = resolveAutoThreads();
    assert.strictEqual(result, 2);
  });

  it('returns 1 worker when core count is <= 3', () => {
    mock.method(os, 'availableParallelism', () => 3);
    mock.method(os, 'freemem', () => 16 * 1024 * 1024 * 1024);
    syncBuiltinESMExports();
    const result = resolveAutoThreads();
    assert.strictEqual(result, 1);
  });

  it('returns numCores - 2 when core count is > 4 and memory is plentiful', () => {
    mock.method(os, 'availableParallelism', () => 16);
    mock.method(os, 'freemem', () => 32 * 1024 * 1024 * 1024);
    syncBuiltinESMExports();
    const result = resolveAutoThreads();
    assert.strictEqual(result, 14);
  });

  it('caps workers based on available memory', () => {
    mock.method(os, 'availableParallelism', () => 16);
    // 1 GB free -> floor(1024 * 0.5 / 250) = floor(2.048) = 2 workers
    mock.method(os, 'freemem', () => 1 * 1024 * 1024 * 1024);
    mock.method(os, 'arch', () => 'arm64');
    syncBuiltinESMExports();
    const result = resolveAutoThreads();
    assert.strictEqual(result, 2);
  });

  it('returns at least 1 worker even under extreme memory pressure', () => {
    mock.method(os, 'availableParallelism', () => 16);
    // Very low memory: floor(100 * 0.5 / 250) = 0 -> clamped to 1
    mock.method(os, 'freemem', () => 100 * 1024 * 1024);
    syncBuiltinESMExports();
    const result = resolveAutoThreads();
    assert.strictEqual(result, 1);
  });
});

describe('resolveAutoJobs', () => {
  it('returns 10 for zero or single thread', () => {
    assert.strictEqual(resolveAutoJobs(0), 10);
    assert.strictEqual(resolveAutoJobs(1), 10);
  });

  it('returns 15 for multiple threads', () => {
    assert.strictEqual(resolveAutoJobs(2), 15);
    assert.strictEqual(resolveAutoJobs(8), 15);
  });
});

describe('getThreadLoader', () => {
  it('returns a thread-loader RuleSetUseItem with auto threads', () => {
    const result = getThreadLoader({
      threads: 'auto',
      jobsPerThread: 'auto',
      watch: false,
    });

    assert.ok(result);
    assert.strictEqual((result as { loader: string }).loader, 'thread-loader');
  });

  it('returns null when threads is 0', () => {
    assert.strictEqual(
      getThreadLoader({ threads: 0, jobsPerThread: 'auto', watch: false }),
      null,
    );
  });

  it('uses explicit thread count', () => {
    const result = getThreadLoader({
      threads: 4,
      jobsPerThread: 'auto',
      watch: false,
    });
    assert.ok(result);
    const opts = (result as { options: { workers: number } }).options;
    assert.strictEqual(opts.workers, 4);
  });

  it('uses explicit jobs-per-thread count', () => {
    const result = getThreadLoader({
      threads: 2,
      jobsPerThread: 20,
      watch: false,
    });
    assert.ok(result);
    const opts = (result as { options: { workerParallelJobs: number } })
      .options;
    assert.strictEqual(opts.workerParallelJobs, 20);
  });

  it('sets poolTimeout to Infinity when watch is true', () => {
    const result = getThreadLoader({
      threads: 1,
      jobsPerThread: 10,
      watch: true,
    });
    assert.ok(result);
    const opts = (result as { options: { poolTimeout: number } }).options;
    assert.strictEqual(opts.poolTimeout, Infinity);
  });

  it('sets poolTimeout to 2000 when watch is false', () => {
    const result = getThreadLoader({
      threads: 1,
      jobsPerThread: 10,
      watch: false,
    });
    assert.ok(result);
    const opts = (result as { options: { poolTimeout: number } }).options;
    assert.strictEqual(opts.poolTimeout, 2000);
  });

  it('auto-resolves jobs based on thread count', () => {
    const singleThread = getThreadLoader({
      threads: 1,
      jobsPerThread: 'auto',
      watch: false,
    });
    assert.ok(singleThread);
    assert.strictEqual(
      (singleThread as { options: { workerParallelJobs: number } }).options
        .workerParallelJobs,
      10,
    );

    const multiThread = getThreadLoader({
      threads: 4,
      jobsPerThread: 'auto',
      watch: false,
    });
    assert.ok(multiThread);
    assert.strictEqual(
      (multiThread as { options: { workerParallelJobs: number } }).options
        .workerParallelJobs,
      15,
    );
  });
});
