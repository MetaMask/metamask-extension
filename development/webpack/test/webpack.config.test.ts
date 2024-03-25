import fs from 'node:fs';
import { describe, it, afterEach, before, after, mock } from 'node:test';
import assert from 'node:assert';
import process from 'node:process';
import { resolve } from 'node:path';
import { type Configuration, webpack } from 'webpack';
import { noop } from '../utils/helpers';
import { ManifestPlugin } from '../utils/plugins/ManifestPlugin';

function getWebpackInstance(config: Configuration) {
  // webpack logs a warning if we pass config.watch to it without a callback
  // we don't want a callback because that will cause the build to run
  // so we just delete the watch property.
  delete config.watch;
  return webpack(config);
}

/**
 * These tests are aimed at testing conditional branches in webpack.config.ts.
 * These tests do *not* test the actual webpack build process itself, or that
 * the parsed command line args are even valid. Instead, these tests ensure the
 * branches of configuration options are reached and applied correctly.
 */

describe('webpack.config.test.ts', () => {
  let originalArgv: string[];
  let originalEnv: NodeJS.ProcessEnv;
  const originalReadFileSync = fs.readFileSync;
  before(() => {
    // cache originals before we start messing with them
    originalArgv = process.argv;
    originalEnv = process.env;
  });
  after(() => {
    // restore originals for other tests
    process.argv = originalArgv;
    process.env = originalEnv;
  });
  afterEach(() => {
    // reset argv to avoid affecting other tests
    process.argv = [process.argv0, process.argv[1]];
    // each test needs to load a fresh config, so we need to clear webpack's cache
    // TODO: can we use `await import` instead to get a fresh copy each time?
    const cliPath = require.resolve('../utils/cli.ts');
    const helpersPath = require.resolve('../utils/helpers.ts');
    const webpackConfigPath = require.resolve('../webpack.config.ts');
    delete require.cache[cliPath];
    delete require.cache[helpersPath];
    delete require.cache[webpackConfigPath];
    mock.restoreAll();
  });

  function getWebpackConfig(args: string[] = [], env: NodeJS.ProcessEnv = {}) {
    // argv is automatically read when webpack.config is required/imported.
    // first two args are always ignored.
    process.argv = [...process.argv.slice(0, 2), ...args];
    process.env = { ...env };
    mock.method(fs, 'readFileSync', (path: any, options: any) => {
      if (path === resolve(__dirname, '../../../.metamaskrc')) {
        // mock `.metamaskrc`, as users might have customized it which may
        // break our tests
        return `
${Object.entries(env)
  .map(([key, value]) => `${key}=${value}`)
  .join('\n')}
`;
      }
      return originalReadFileSync.call(fs, path, options);
    });
    return require('../webpack.config.ts').default;
  }

  it('should have the correct defaults', () => {
    const config: Configuration = getWebpackConfig();
    // check that options are valid
    const { options } = webpack(config);
    assert.strictEqual(options.name, 'MetaMask – development');
    assert.strictEqual(options.mode, 'development');
    assert(options.cache);
    assert.strictEqual(options.cache.type, 'filesystem');
    assert.strictEqual(options.devtool, 'source-map');
    assert.strictEqual((options.stats as any).preset, 'none');
    assert(options.resolve.fallback);
    assert.strictEqual(
      typeof (options.resolve.fallback as any)['react-devtools'],
      'string',
    );
    assert.strictEqual(
      typeof (options.resolve.fallback as any)['remote-redux-devtools'],
      'string',
    );
    assert.strictEqual(options.optimization.minimize, false);
    assert.strictEqual(options.optimization.sideEffects, false);
    assert.strictEqual(options.optimization.providedExports, false);
    assert.strictEqual(options.optimization.removeAvailableModules, false);
    assert.strictEqual(options.optimization.usedExports, false);
    assert.strictEqual(options.watch, false);

    const runtimeChunk = options.optimization.runtimeChunk as
      | {
          name?: (chunk: { name?: string }) => string | false;
        }
      | undefined;
    assert(runtimeChunk);
    assert(runtimeChunk.name);
    assert(typeof runtimeChunk.name, 'function');
    assert.strictEqual(
      runtimeChunk.name({ name: 'snow.prod' }),
      false,
      'snow.prod should not be chunked',
    );
    assert.strictEqual(
      runtimeChunk.name({ name: 'use-snow' }),
      false,
      'use-snow should not be chunked',
    );
    assert.strictEqual(
      runtimeChunk.name({ name: '< random >' }),
      'runtime',
      'other names should be chunked',
    );
    assert.strictEqual(
      runtimeChunk.name({}),
      'runtime',
      'chunks without a name name should be chunked',
    );

    const manifestPlugin = options.plugins.find(
      (plugin: any) => plugin.constructor.name === 'ManifestPlugin',
    ) as ManifestPlugin<boolean> | undefined | null;
    assert(manifestPlugin, 'Manifest plugin should be present');
    assert.deepStrictEqual(manifestPlugin.options.web_accessible_resources, [
      'scripts/inpage.js.map',
      'scripts/contentscript.js.map',
    ]);
    assert.deepStrictEqual(
      manifestPlugin.options.description,
      `development build from git id: ${getLastCommitHash().substring(0, 8)}`,
    );
    assert(manifestPlugin.options.transform);
    assert.deepStrictEqual(
      manifestPlugin.options.transform(
        {
          manifest_version: 3,
          name: 'name',
          version: '1.2.3',
          content_scripts: [
            {
              js: [
                'ignored',
                'scripts/contentscript.js',
                'scripts/inpage.js',
                'ignored',
              ],
            },
          ],
        },
        'brave',
      ),
      {
        manifest_version: 3,
        name: 'name',
        version: '1.2.3',
        content_scripts: [
          {
            js: ['scripts/contentscript.js', 'scripts/inpage.js'],
          },
        ],
      },
    );
    assert.strictEqual(manifestPlugin.options.zip, false);
    assert.strictEqual((manifestPlugin.options as any).zipOptions, undefined);

    const progressPlugin = options.plugins.find(
      (plugin: any) => plugin.constructor.name === 'ProgressPlugin',
    );
    assert(progressPlugin, 'Progress plugin should present');
  });

  it('should apply non-default options', () => {
    const removeUnsupportedFeatures = ['--no-lavamoat'];
    const config: Configuration = getWebpackConfig(
      [
        '--env',
        'production',
        '--watch',
        '--stats',
        '--no-progress',
        '--no-cache',
        '--zip',
        ...removeUnsupportedFeatures,
      ],
      {
        SEGMENT_WRITE_KEY: '-',
        SEGMENT_PROD_WRITE_KEY: '-',
      },
    );
    // webpack logs a warning if we specify `watch: true`, `getWebpackInstance`
    // removes the property, so we test it here instead
    assert.strictEqual(config.watch, true);

    // check that options are valid
    const instance: any = getWebpackInstance(config);
    assert.strictEqual(instance.options.name, 'MetaMask – production');
    assert.strictEqual(instance.options.mode, 'production');
    assert.strictEqual(instance.options.cache.type, 'memory');
    assert.strictEqual(instance.options.devtool, 'hidden-source-map');
    assert.strictEqual(instance.options.stats.preset, 'normal');
    assert.strictEqual(
      instance.options.resolve.fallback['react-devtools'],
      false,
    );
    assert.strictEqual(
      instance.options.resolve.fallback['remote-redux-devtools'],
      false,
    );
    assert.strictEqual(instance.options.optimization.minimize, true);
    assert.strictEqual(instance.options.optimization.sideEffects, true);
    assert.strictEqual(instance.options.optimization.providedExports, true);
    assert.strictEqual(
      instance.options.optimization.removeAvailableModules,
      true,
    );
    assert.strictEqual(instance.options.optimization.usedExports, true);

    const manifestPlugin = instance.options.plugins.find(
      (plugin: any) => plugin.constructor.name === 'ManifestPlugin',
    );
    assert.deepStrictEqual(manifestPlugin.options.web_accessible_resources, []);
    assert.deepStrictEqual(manifestPlugin.options.description, null);
    assert.deepStrictEqual(manifestPlugin.options.zip, true);
    assert(manifestPlugin.options.zipOptions, 'Zip options should be present');
    assert.strictEqual(manifestPlugin.options.transform, undefined);

    const progressPlugin = instance.options.plugins.find(
      (plugin: any) => plugin.constructor.name === 'ProgressPlugin',
    );
    assert.strictEqual(
      progressPlugin,
      undefined,
      'Progress plugin should be absent',
    );
  });

  it('should allow disabling source maps', () => {
    const config: Configuration = getWebpackConfig(['--devtool', 'none']);
    // check that options are valid
    const instance: any = getWebpackInstance(config);
    assert.strictEqual(instance.options.devtool, false);
  });

  it('should write the dry-run message then call exit(0)', () => {
    const exit: any = mock.method(process, 'exit', noop, { times: 1 });
    const error: any = mock.method(console, 'error', noop, { times: 1 });

    // we don't care about the return value, just that it logs and calls `exit`
    getWebpackConfig(['--dry-run']);
    assert.strictEqual(error.mock.calls.length, 1);
    assert.strictEqual(error.mock.calls[0].arguments.length, 1);
    // we don't care about the message, just that it is logged
    assert.strictEqual(typeof error.mock.calls[0].arguments[0], 'string');

    assert.strictEqual(exit.mock.calls.length, 1);
    assert.strictEqual(exit.mock.calls[0].arguments.length, 1);
    assert.strictEqual(exit.mock.calls[0].arguments[0], 0);
  });

  it('should enable ReactRefreshPlugin in a development env when `--watch` is specified', () => {
    const config: Configuration = getWebpackConfig(['--watch'], {
      __HMR_READY__: 'true',
    });
    delete config.watch;
    const instance = webpack(config);
    const reactRefreshPlugin = instance.options.plugins.find(
      (plugin: any) => plugin.constructor.name === 'ReactRefreshPlugin',
    );
    assert(reactRefreshPlugin, 'ReactRefreshPlugin should be present');
  });

  // these tests should be temporary until the below options are supported
  const unsupportedOptions = [['--lavamoat'], ['--manifest_version', '3']];
  for (const args of unsupportedOptions) {
    it(`should throw on unsupported option \`${args.join('=')}\``, () => {
      assert.throws(
        () => getWebpackConfig(args),
        `Unsupported option: ${args.join(' ')}`,
      );
    });
  }
});
