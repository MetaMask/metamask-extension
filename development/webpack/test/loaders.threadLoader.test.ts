import { describe, it, mock } from 'node:test';
import assert from 'node:assert';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { promisify } from 'node:util';
import { pathToFileURL } from 'node:url';
import { webpack, NormalModule } from 'webpack';
import {
  getThreadLoader,
  getWorkerNodeArgs,
  resolveAutoThreads,
  resolveAutoJobs,
} from '../utils/loaders/threadLoader';
import { getSwcLoader } from '../utils/loaders/getSwcLoader';
import { getReactCompilerLoader } from '../utils/loaders/reactCompilerLoader';

describe('resolveAutoThreads', () => {
  it('returns numCores - 2 (min 1) for low core counts', () => {
    mock.method(require('node:os'), 'availableParallelism', () => 4);
    mock.method(require('node:os'), 'freemem', () => 16 * 1024 * 1024 * 1024);
    const result = resolveAutoThreads();
    assert.strictEqual(result, 2);
    mock.restoreAll();
  });

  it('returns 1 worker when core count is <= 3', () => {
    mock.method(require('node:os'), 'availableParallelism', () => 3);
    mock.method(require('node:os'), 'freemem', () => 16 * 1024 * 1024 * 1024);
    const result = resolveAutoThreads();
    assert.strictEqual(result, 1);
    mock.restoreAll();
  });

  it('returns numCores - 2 when core count is > 4 and memory is plentiful', () => {
    mock.method(require('node:os'), 'availableParallelism', () => 16);
    mock.method(require('node:os'), 'freemem', () => 32 * 1024 * 1024 * 1024);
    const result = resolveAutoThreads();
    assert.strictEqual(result, 14);
    mock.restoreAll();
  });

  it('caps workers based on available memory', () => {
    mock.method(require('node:os'), 'availableParallelism', () => 16);
    // 1 GB free -> floor(1024 * 0.5 / 250) = floor(2.048) = 2 workers
    mock.method(require('node:os'), 'freemem', () => 1 * 1024 * 1024 * 1024);
    mock.method(require('node:os'), 'arch', () => 'arm64');
    const result = resolveAutoThreads();
    assert.strictEqual(result, 2);
    mock.restoreAll();
  });

  it('returns at least 1 worker even under extreme memory pressure', () => {
    mock.method(require('node:os'), 'availableParallelism', () => 16);
    // Very low memory: floor(100 * 0.5 / 250) = 0 -> clamped to 1
    mock.method(require('node:os'), 'freemem', () => 100 * 1024 * 1024);
    const result = resolveAutoThreads();
    assert.strictEqual(result, 1);
    mock.restoreAll();
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

describe('getWorkerNodeArgs', () => {
  it('preloads TSX for source TypeScript loaders', () => {
    assert.deepStrictEqual(getWorkerNodeArgs('threadLoader.ts'), [
      '--import',
      pathToFileURL(require.resolve('tsx')).href,
    ]);
  });

  it('uses plain Node for compiled CommonJS loaders', () => {
    assert.deepStrictEqual(getWorkerNodeArgs('threadLoader.js'), []);
  });
});

describe('getThreadLoader', () => {
  it('compiles TypeScript loaders and their imports in a worker', async () => {
    const directory = mkdtempSync(join(tmpdir(), 'webpack-worker-imports-'));
    const resourcePath = join(directory, 'component.tsx');
    writeFileSync(
      resourcePath,
      `import React from 'react';
export function Component({ name }: { name: string }) {
  return <div>{name}</div>;
}`,
    );
    // An inherited tsx preload would hide missing worker runtime configuration.
    const nodeOptions = process.env.NODE_OPTIONS;
    process.env.NODE_OPTIONS = '';
    const threadLoader = getThreadLoader({
      threads: 1,
      jobsPerThread: 1,
      watch: false,
    });
    assert(threadLoader);
    const compiler = webpack({
      mode: 'production',
      context: directory,
      entry: resourcePath,
      devtool: 'source-map',
      cache: false,
      resolveLoader: {
        alias: { 'thread-loader': require.resolve('thread-loader') },
      },
      output: { path: join(directory, 'dist') },
      externals: [/^react/u],
      optimization: { minimize: false, concatenateModules: false },
      module: {
        rules: [
          {
            test: /\.tsx$/u,
            use: [
              threadLoader,
              getSwcLoader(
                'typescript',
                true,
                {},
                {
                  browsersListQuery: 'Chrome >= 109',
                  isDevelopment: false,
                  refresh: false,
                },
              ),
              getReactCompilerLoader({
                target: '18',
                verbose: false,
                debug: 'all',
              }),
            ],
          },
        ],
      },
    });
    try {
      const stats = await promisify(compiler.run.bind(compiler))();
      assert(stats);
      assert.strictEqual(
        stats.hasErrors(),
        false,
        stats.toString({ all: false, errors: true }),
      );
      const module = [...stats.compilation.modules].find(
        (item) =>
          item instanceof NormalModule && item.resource === resourcePath,
      );
      assert(module instanceof NormalModule);
      assert.deepStrictEqual(module.originalSource()?.map()?.sources, [
        'webpack://./component.tsx',
      ]);
    } finally {
      await promisify(compiler.close.bind(compiler))();
      rmSync(directory, { recursive: true, force: true });
      if (nodeOptions === undefined) {
        delete process.env.NODE_OPTIONS;
      } else {
        process.env.NODE_OPTIONS = nodeOptions;
      }
    }
  });

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
