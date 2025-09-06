import fs from 'node:fs';
import { describe, it, afterEach, beforeEach, mock } from 'node:test';
import assert from 'node:assert';
import { join } from 'node:path';
import {
  version,
  type Chunk,
  type Stats,
  type Compilation,
  type StatsOptions,
  type StatsCompilation,
} from 'webpack';
import * as helpers from '../utils/helpers';
import { type Combination, generateCases } from './helpers';

describe('./utils/helpers.ts', () => {
  afterEach(() => mock.restoreAll());

  it('should return undefined when noop it called', () => {
    const nothing = helpers.noop();
    assert.strictEqual(nothing, undefined);
  });

  it('should return all entries listed in the manifest and file system for manifest_version 2', () => {
    const originalReaddirSync = fs.readdirSync;
    const otherHtmlEntries = ['one.html', 'two.html'];
    const appRoot = '<app-root>';
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31973
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mock.method(fs, 'readdirSync', function (path: string, options: any) {
      if (path === appRoot) {
        return [...otherHtmlEntries, 'three.not-html'];
      }
      return originalReaddirSync.call(fs, path, options);
    });

    const manifest = {
      // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
      // eslint-disable-next-line @typescript-eslint/naming-convention
      manifest_version: 2,
      background: {
        scripts: ['background.js'],
        page: 'background.html',
      },
      // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
      // eslint-disable-next-line @typescript-eslint/naming-convention
      browser_action: {
        // use one from `otherHtmlEntries`, to ensure we don't duplicate things
        // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
        // eslint-disable-next-line @typescript-eslint/naming-convention
        default_popup: otherHtmlEntries[0],
      },
      // images/test.ing.png will be omitted from entry points
      // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
      // eslint-disable-next-line @typescript-eslint/naming-convention
      web_accessible_resources: ['images/test.ing.png', 'testing.js'],
      // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
      // eslint-disable-next-line @typescript-eslint/naming-convention
      content_scripts: [
        {
          matches: ['file://*/*', 'http://*/*', 'https://*/*'],
          js: [
            // browserify backwards compatibility
            'scripts/disable-console.js',
            'scripts/lockdown-install.js',
            'scripts/lockdown-run.js',
            'scripts/lockdown-more.js',
            //
            'scripts/contentscript.js',
            'scripts/inpage.js',
          ],
          // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
          // eslint-disable-next-line @typescript-eslint/naming-convention
          run_at: 'document_start',
          // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
          // eslint-disable-next-line @typescript-eslint/naming-convention
          all_frames: true,
        },
        {
          matches: ['*://connect.trezor.io/*/popup.html'],
          js: ['vendor/trezor/content-script.js'],
        },
      ],
    } as helpers.ManifestV2;
    const { entry, canBeChunked } = helpers.collectEntries(manifest, appRoot);
    const expectedScripts = {
      'background.js': {
        chunkLoading: false,
        filename: 'background.js',
        import: join(appRoot, `background.js`),
      },
      'scripts/contentscript.js': {
        chunkLoading: false,
        filename: 'scripts/contentscript.js',
        import: join(appRoot, `scripts/contentscript.js`),
      },
      'scripts/inpage.js': {
        chunkLoading: false,
        filename: 'scripts/inpage.js',
        import: join(appRoot, `/scripts/inpage.js`),
      },
      'vendor/trezor/content-script.js': {
        chunkLoading: false,
        filename: 'vendor/trezor/content-script.js',
        import: join(appRoot, `vendor/trezor/content-script.js`),
      },
      'testing.js': {
        chunkLoading: false,
        filename: 'testing.js',
        import: join(appRoot, `testing.js`),
      },
    };
    const expectedHtml = {
      background: join(appRoot, `background.html`),
      one: join(appRoot, `one.html`),
      two: join(appRoot, `two.html`),
      // notice: three.not-html is NOT included, since it doesn't have an `.html` extension
    };
    const expectedEntries = { ...expectedScripts, ...expectedHtml };
    assert.deepStrictEqual(entry, expectedEntries);

    const jsFiles = Object.keys(entry).filter((key) => key.endsWith('.js'));
    assert(jsFiles.length > 0, "JS files weren't found in the manifest");
    jsFiles.forEach((name) => {
      assert.strictEqual(canBeChunked({ name } as Chunk), false);
    });

    // scripts that are *not* in our manifest *can* be chunked
    assert.strictEqual(canBeChunked({ name: 'anything.js' } as Chunk), true);
  });

  it('should return all entries listed in the manifest and file system for manifest_version 3', () => {
    const originalReaddirSync = fs.readdirSync;
    const otherHtmlEntries = ['one.html', 'two.html'];
    const appRoot = '<app-root>';
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31973
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mock.method(fs, 'readdirSync', (path: string, options: any) => {
      if (path === appRoot) {
        return [...otherHtmlEntries, 'three.not-html'];
      }
      return originalReaddirSync.call(fs, path, options);
    });

    const manifest = {
      name: 'MetaMask',
      version: '1.0.0',
      // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
      // eslint-disable-next-line @typescript-eslint/naming-convention
      manifest_version: 3,
      background: {
        // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
        // eslint-disable-next-line @typescript-eslint/naming-convention
        service_worker: 'background.js',
      },
      // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
      // eslint-disable-next-line @typescript-eslint/naming-convention
      web_accessible_resources: [
        {
          matches: ['<all_urls>'],
          // images/test.ing.png will be omitted from entry points
          resources: ['images/test.ing.png', 'testing.js'],
        },
      ],
      // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
      // eslint-disable-next-line @typescript-eslint/naming-convention
      browser_action: {
        // use one from `otherHtmlEntries`, to ensure we don't duplicate things
        // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
        // eslint-disable-next-line @typescript-eslint/naming-convention
        default_popup: otherHtmlEntries[0],
      },
      // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
      // eslint-disable-next-line @typescript-eslint/naming-convention
      content_scripts: [
        {
          matches: ['file://*/*', 'http://*/*', 'https://*/*'],
          js: [
            // browserify backwards compatibility
            'scripts/disable-console.js',
            'scripts/lockdown-install.js',
            'scripts/lockdown-run.js',
            'scripts/lockdown-more.js',
            //
            'scripts/contentscript.js',
          ],
          // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
          // eslint-disable-next-line @typescript-eslint/naming-convention
          run_at: 'document_start',
          // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
          // eslint-disable-next-line @typescript-eslint/naming-convention
          all_frames: true,
        },
        {
          matches: ['*://connect.trezor.io/*/popup.html'],
          js: ['vendor/trezor/content-script.js'],
        },
      ],
    } as helpers.ManifestV3;
    const { entry, canBeChunked } = helpers.collectEntries(manifest, appRoot);
    const expectedScripts = {
      'scripts/contentscript.js': {
        chunkLoading: false,
        filename: 'scripts/contentscript.js',
        import: join(appRoot, `scripts/contentscript.js`),
      },
      'vendor/trezor/content-script.js': {
        chunkLoading: false,
        filename: 'vendor/trezor/content-script.js',
        import: join(appRoot, `vendor/trezor/content-script.js`),
      },
      'background.js': {
        chunkLoading: false,
        filename: 'background.js',
        import: join(appRoot, `background.js`),
      },
      'testing.js': {
        chunkLoading: false,
        filename: 'testing.js',
        import: join(appRoot, `testing.js`),
      },
    };
    const expectedHtml = {
      one: join(appRoot, `one.html`),
      two: join(appRoot, `two.html`),
      // notice: three.not-html is NOT included, since it doesn't have an `.html` extension
    };
    const expectedEntries = {
      ...expectedScripts,
      ...expectedHtml,
    };
    assert.deepStrictEqual(entry, expectedEntries);

    const jsFiles = Object.keys(entry).filter((key) => key.endsWith('.js'));
    assert(jsFiles.length > 0, "JS files weren't found in the manifest");
    jsFiles.forEach((name) => {
      assert.strictEqual(canBeChunked({ name } as Chunk), false);
    });

    // scripts that are *not* in our manifest *can* be chunked
    assert.strictEqual(canBeChunked({ name: 'anything.js' } as Chunk), true);
  });

  it('should handle manifest.json files with empty sections', () => {
    const originalReaddirSync = fs.readdirSync;
    const appRoot = '<app-root>';

    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31973
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mock.method(fs, 'readdirSync', (path: string, options: any) => {
      if (path === appRoot) {
        return [];
      }
      return originalReaddirSync.call(fs, path, options);
    });

    const manifestv2 = {
      // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
      // eslint-disable-next-line @typescript-eslint/naming-convention
      manifest_version: 2,
      background: {},
    } as helpers.ManifestV2;
    const { entry: entryv2 } = helpers.collectEntries(manifestv2, appRoot);
    assert.deepStrictEqual(entryv2, {});

    const manifestv3 = {
      name: 'MetaMask',
      version: '1.0.0',
      // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
      // eslint-disable-next-line @typescript-eslint/naming-convention
      manifest_version: 3,
      background: {},
    } as helpers.ManifestV3;
    const { entry: entryv3 } = helpers.collectEntries(manifestv3, appRoot);
    assert.deepStrictEqual(entryv3, {});
  });

  it('should throw if an entry file starts with an underscore', () => {
    const manifest = {
      // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
      // eslint-disable-next-line @typescript-eslint/naming-convention
      manifest_version: 2,
      background: {
        page: '_badfile.html',
      },
    } as helpers.ManifestV2;
    assert.throws(
      () => helpers.collectEntries(manifest, ''),
      /Error: Invalid Entrypoint Filename Detected/u,
    );
  });

  describe('logStats', () => {
    const getStatsMock = (
      stats: 'normal' | 'none',
      mode: 'development' | 'production',
      hasError: boolean,
      hasWarning: boolean,
    ) => {
      return {
        hash: 'test-hash',
        toJson: null as unknown as () => StatsCompilation,
        endTime: 1000,
        startTime: 0,
        hasErrors: mock.fn(() => hasError),
        hasWarnings: mock.fn(() => hasWarning),
        compilation: {
          options: {
            mode,
            stats,
          },
          compiler: {
            name: 'test-compiler-name',
          },
        } as Compilation,
        toString: mock.fn((_?: unknown) => 'test-stats'),
      } as const satisfies Stats;
    };

    it('should log nothing if err and stats are both not defined', () => {
      const { mock: error } = mock.method(console, 'error', helpers.noop);
      helpers.logStats(undefined, undefined);
      assert.strictEqual(error.callCount(), 0, 'error should not be called');
    });

    it('should log only the error when error and stats are provided', () => {
      const stats = getStatsMock('normal', 'production', false, false);
      const { mock: error } = mock.method(console, 'error', helpers.noop);
      const errorToLog = new Error('test error');

      // should only log the error, and nothing else
      helpers.logStats(errorToLog, stats);

      assert.strictEqual(error.callCount(), 1, 'error should be called');
      assert.deepStrictEqual(
        error.calls[0].arguments,
        [errorToLog],
        'error should be logged',
      );
      assert.strictEqual(
        stats.toString.mock.callCount(),
        0,
        'stats.toString should not be called',
      );
    });

    const matrix = {
      colorDepth: [undefined, 1, 4, 8, 24] as const,
      level: ['normal', 'none'] as const,
      env: ['development', 'production'] as const,
      hasErrors: [true, false] as const,
      hasWarnings: [true, false] as const,
    };

    generateCases(matrix).forEach(runTest);

    function runTest(settings: Combination<typeof matrix>) {
      const { colorDepth, level, env, hasErrors, hasWarnings } = settings;

      let testHelpers: typeof import('../utils/helpers');
      const originalGetColorDepth = process.stderr.getColorDepth;
      beforeEach(() => {
        // getColorDepth is undefined sometimes, so we need to mock it like this
        process.stderr.getColorDepth = (
          colorDepth ? mock.fn(() => colorDepth) : colorDepth
        ) as (env?: object | undefined) => number;

        // helpers caches `getColorDepth` on initialization, so we need to a new
        // one after we mock `getColorDepth`.
        delete require.cache[require.resolve('../utils/helpers')];
        testHelpers = require('../utils/helpers');
      });

      afterEach(() => {
        process.stderr.getColorDepth = originalGetColorDepth;
      });

      it(`should log message when stats is "${level}" and env is "${env}", with errors: \`${hasErrors}\` and warnings: \`${hasWarnings}\``, () => {
        const stats = getStatsMock(level, env, hasErrors, hasWarnings);
        const { mock: error } = mock.method(console, 'error', testHelpers.noop);

        testHelpers.logStats(null, stats); // <- this is what we are testing

        assert.strictEqual(error.callCount(), 1, 'error should be called once');

        let toStringOptions: StatsOptions | undefined;
        if (level === 'normal') {
          toStringOptions = { colors: testHelpers.colors };
        } else if (hasErrors || hasWarnings) {
          toStringOptions = {
            colors: testHelpers.colors,
            preset: 'errors-warnings',
          };
        }
        if (toStringOptions) {
          assert.strictEqual(
            stats.toString.mock.callCount(),
            1,
            'stats.toString should be called once',
          );
          assert.deepStrictEqual(
            stats.toString.mock.calls[0].arguments,
            [toStringOptions],
            'stats should be called with the colors option',
          );
          assert.deepStrictEqual(
            error.calls[0].arguments,
            [stats.toString(toStringOptions)],
            'stats should be logged',
          );
        } else {
          assert.strictEqual(
            stats.toString.mock.callCount(),
            0,
            'stats.toString should not be called',
          );
          const colorFn =
            env === 'production' ? testHelpers.toOrange : testHelpers.toPurple;
          const name = colorFn(`🦊 ${stats.compilation.compiler.name}`);
          const status = testHelpers.toGreen('successfully');
          const time = stats.endTime - stats.startTime;
          const expectedMessage = `${name} (webpack ${version}) compiled ${status} in ${time} ms`;
          assert.deepStrictEqual(error.calls[0].arguments, [expectedMessage]);
        }
      });
    }
  });
});
