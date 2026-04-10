import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  WEBPACK_BUNDLE_STATS_FILE,
  type WebpackBundleStats,
} from '../../lib/bundle-size';
import { BundleSizeStatsPlugin } from '../utils/plugins/BundleSizeStatsPlugin';
import { mockWebpack } from './helpers';

describe('BundleSizeStatsPlugin', () => {
  it('emits a minimal webpack bundle stats file with normalized asset names', async () => {
    const { compiler, compilation, promise } = mockWebpack(
      [
        'chrome/runtime.js',
        'chrome/home.js',
        'chrome/home-async.js',
        'chrome/home.html',
        'chrome/home.css',
        'chrome/service-worker.js',
        'chrome/background.js',
        'chrome/scripts/contentscript.js',
      ],
      [
        Buffer.alloc(100),
        Buffer.alloc(200),
        Buffer.alloc(250),
        '<html></html>',
        Buffer.alloc(50),
        Buffer.alloc(300),
        Buffer.alloc(350),
        Buffer.alloc(400),
      ],
      [null, null, null, null, null, null, null, null],
      false,
    );

    compilation.entrypoints = new Map([
      [
        'home',
        {
          getFiles: () => [
            'chrome/runtime.js',
            'chrome/home.js',
            'chrome/home.html',
            'chrome/home.css',
          ],
          getEntrypointChunk: () => ({
            getAllAsyncChunks: () =>
              new Set([
                {
                  files: new Set(['chrome/home-async.js', 'chrome/home.css']),
                },
              ]),
          }),
        },
      ],
      [
        'service-worker.ts',
        {
          getFiles: () => ['chrome/service-worker.js'],
          getEntrypointChunk: () => ({
            getAllAsyncChunks: () =>
              new Set([
                {
                  files: new Set([
                    'chrome/background.js',
                    'chrome/background.css',
                  ]),
                },
              ]),
          }),
        },
      ],
      [
        'scripts/contentscript.js',
        {
          getFiles: () => ['chrome/scripts/contentscript.js'],
          getEntrypointChunk: () => ({
            getAllAsyncChunks: () => new Set(),
          }),
        },
      ],
    ]) as typeof compilation.entrypoints;

    const plugin = new BundleSizeStatsPlugin({ browsers: ['chrome'] });
    plugin.apply(compiler);
    await promise;

    const statsAsset = compilation.getAsset(WEBPACK_BUNDLE_STATS_FILE);
    assert.ok(statsAsset, 'stats file should be emitted');

    const stats = JSON.parse(
      statsAsset.source.source().toString(),
    ) as WebpackBundleStats;

    assert.deepStrictEqual(stats, {
      schemaVersion: 2,
      entrypoints: {
        home: {
          initialFiles: [
            { name: 'home.js', size: 200 },
            { name: 'runtime.js', size: 100 },
          ],
          asyncFiles: [{ name: 'home-async.js', size: 250 }],
        },
        'scripts/contentscript.js': {
          initialFiles: [{ name: 'scripts/contentscript.js', size: 400 }],
          asyncFiles: [],
        },
        'service-worker.ts': {
          initialFiles: [{ name: 'service-worker.js', size: 300 }],
          asyncFiles: [{ name: 'background.js', size: 350 }],
        },
      },
    });
  });
});
