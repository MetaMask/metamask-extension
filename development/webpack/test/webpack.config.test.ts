import fs from 'node:fs';
import { tmpdir } from 'node:os';
import { describe, it, afterEach, before, after, mock } from 'node:test';
import assert from 'node:assert';
import process from 'node:process';
import { join, resolve } from 'node:path';
import {
  type Configuration,
  type Stats,
  webpack,
  Compiler,
  WebpackPluginInstance,
} from 'webpack';
import { noop, type Manifest } from '../utils/helpers';
import { ManifestPlugin } from '../utils/plugins/ManifestPlugin';
import { getLatestCommit } from '../utils/git';
import { ManifestPluginOptions } from '../utils/plugins/ManifestPlugin/types';
import { version as packageVersion } from '../../../package.json';
import { CHROME_MANIFEST_KEY_NON_PRODUCTION } from '../utils/constants';

function getWebpackInstance(config: Configuration) {
  // webpack logs a warning if we pass config.watch to it without a callback
  // we don't want a callback because that will cause the build to run
  // so we just delete the watch property.
  delete config.watch;
  return webpack(config);
}

async function runWebpack(config: Configuration): Promise<Stats> {
  const compiler = webpack(config);

  try {
    const stats = await new Promise<Stats>((resolveStats, rejectStats) => {
      compiler.run((error, result) => {
        if (error) {
          rejectStats(error);
          return;
        }

        if (!result) {
          rejectStats(
            new Error('Webpack finished without returning compilation stats.'),
          );
          return;
        }

        if (result.hasErrors()) {
          rejectStats(
            new Error(
              result.toString({ all: false, errors: true, errorDetails: true }),
            ),
          );
          return;
        }

        resolveStats(result);
      });
    });

    return stats;
  } finally {
    await new Promise<void>((resolveClose, rejectClose) => {
      compiler.close((error) => {
        if (error) {
          rejectClose(error);
          return;
        }

        resolveClose();
      });
    });
  }
}

async function withWatching<T>(
  config: Configuration,
  callback: (watch: (trigger?: () => void) => Promise<void>) => Promise<T>,
) {
  const compiler = webpack(config);
  // @ts-expect-error - Node types need to be updated.
  let build = Promise.withResolvers<void>();
  const watchHandle = compiler.watch({}, (error, stats) => {
    if (error) {
      build.reject(error);
      return;
    }
    if (!stats) {
      build.reject(
        new Error('Webpack finished watch build without returning stats.'),
      );
      return;
    }
    if (stats.hasErrors()) {
      build.reject(new Error('Webpack watch build failed.'));
      return;
    }
    build.resolve();
  });
  assert(watchHandle, 'Webpack did not return a watch handle.');
  const watching = watchHandle;

  const watch = (trigger: () => void = () => watching.invalidate()) => {
    // @ts-expect-error - Node types need to be updated.
    build = Promise.withResolvers<void>();
    trigger();
    return build.promise;
  };

  try {
    await build.promise;
    return await callback(watch);
  } finally {
    await new Promise<void>((resolveClose, rejectClose) =>
      watching.close((error) => (error ? rejectClose(error) : resolveClose())),
    );
  }
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
    mock.method(fs, 'readFileSync', (path: string, options?: null) => {
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

  function getSplitChunksConfig() {
    const config: Configuration = getWebpackConfig();
    assert(config.optimization?.splitChunks, 'splitChunks should be configured');

    return config.optimization.splitChunks;
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
    const stats = options.stats as { preset: string };
    assert.strictEqual(stats.preset, 'none');
    const fallback = options.resolve.fallback as Record<string, false>;
    assert.strictEqual(typeof fallback['react-devtools-core'], 'boolean');
    assert.strictEqual(typeof fallback['remote-redux-devtools'], 'boolean');
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
      (plugin) => plugin && plugin.constructor.name === 'ManifestPlugin',
    ) as ManifestPlugin<boolean>;
    assert(manifestPlugin, 'Manifest plugin should be present');
    assert.deepStrictEqual(manifestPlugin.options.web_accessible_resources, [
      'scripts/inpage.js.map',
      'scripts/contentscript.js.map',
    ]);
    assert.deepStrictEqual(
      manifestPlugin.options.description,
      `main build for development from git id: ${getLatestCommit().hash()}`,
    );
    assert(manifestPlugin.options.transform);
    const transformedManifest = manifestPlugin.options.transform(
      {
        manifest_version: 3,
        name: 'name',
        version: '1.2.3',
        content_scripts: [
          { js: ['scripts/contentscript.js', 'scripts/inpage.js'] },
        ],
      },
      'chrome',
    );
    console.log('transformedManifest', transformedManifest);
    assert.deepStrictEqual(transformedManifest, {
      manifest_version: 3,
      name: 'name',
      version: '1.2.3',
      content_scripts: [
        {
          js: ['scripts/contentscript.js', 'scripts/inpage.js'],
        },
      ],
      key: CHROME_MANIFEST_KEY_NON_PRODUCTION,
    });
    assert.strictEqual(manifestPlugin.options.setBuildId, false);
    assert.strictEqual(manifestPlugin.options.zip, false);
    const manifestOpts = manifestPlugin.options as ManifestPluginOptions<true>;
    assert.strictEqual(manifestOpts.zipOptions, undefined);

    const progressPlugin = options.plugins.find(
      (plugin) => plugin && plugin.constructor.name === 'ProgressPlugin',
    );
    assert(progressPlugin, 'Progress plugin should present');
  });

  it('should apply non-default options', () => {
    const removeUnsupportedFeatures = ['--no-lavamoat'];
    const config: Configuration = getWebpackConfig(
      [
        '--mode',
        'production',
        '--env',
        'production',
        '--no-validateEnv',
        '--watch',
        '--stats',
        '--no-progress',
        '--no-cache',
        '--zip',
        ...removeUnsupportedFeatures,
      ],
      {
        INFURA_PROD_PROJECT_ID: '00000000000000000000000000000000',
        SEGMENT_WRITE_KEY: '-',
        SEGMENT_PROD_WRITE_KEY: '-',
        GOOGLE_PROD_CLIENT_ID: '00000000000',
        APPLE_PROD_CLIENT_ID: '00000000000',
        METAMASK_REACT_REDUX_DEVTOOLS: 'true',
      },
    );
    // webpack logs a warning if we specify `watch: true`, `getWebpackInstance`
    // removes the property, so we test it here instead
    assert.strictEqual(config.watch, true);

    // check that options are valid
    const instance: Compiler = getWebpackInstance(config);
    assert.strictEqual(instance.options.name, 'MetaMask – production');
    assert.strictEqual(instance.options.mode, 'production');
    assert.ok(instance.options.cache);
    assert.strictEqual(instance.options.cache.type, 'memory');
    assert.strictEqual(instance.options.devtool, 'hidden-source-map');
    const stats = instance.options.stats as { preset: string };
    assert.strictEqual(stats.preset, 'normal');
    const fallback = instance.options.resolve.fallback as Record<string, false>;
    assert.strictEqual(typeof fallback['react-devtools-core'], 'string');
    assert.strictEqual(typeof fallback['remote-redux-devtools'], 'string');
    assert.strictEqual(instance.options.optimization.minimize, true);
    assert.strictEqual(instance.options.optimization.sideEffects, true);
    assert.strictEqual(instance.options.optimization.providedExports, true);
    assert.strictEqual(
      instance.options.optimization.removeAvailableModules,
      true,
    );
    assert.strictEqual(instance.options.optimization.usedExports, true);

    const manifestPlugin = instance.options.plugins.find(
      (plugin) => plugin && plugin.constructor.name === 'ManifestPlugin',
    ) as WebpackPluginInstance;
    assert.deepStrictEqual(manifestPlugin.options.web_accessible_resources, []);
    assert.deepStrictEqual(manifestPlugin.options.description, null);
    assert.deepStrictEqual(manifestPlugin.options.zip, true);
    assert(manifestPlugin.options.zipOptions, 'Zip options should be present');
    assert.strictEqual(
      manifestPlugin.options.zipOptions.outFilePath,
      `../builds/metamask-[browser]-${packageVersion}.zip`,
    );
    assert.deepStrictEqual(manifestPlugin.options.transform, undefined);

    const progressPlugin = instance.options.plugins.find(
      (plugin) => plugin && plugin.constructor.name === 'ProgressPlugin',
    );
    assert.strictEqual(
      progressPlugin,
      undefined,
      'Progress plugin should be absent',
    );

    const bundleAnalyzerPlugin = instance.options.plugins.find(
      (plugin) => plugin && plugin.constructor.name === 'BundleAnalyzerPlugin',
    );
    assert.strictEqual(
      bundleAnalyzerPlugin,
      undefined,
      'BundleAnalyzerPlugin should be absent without --bundleAnalyzer',
    );
  });

  it('should include BundleAnalyzerPlugin when --bundleAnalyzer is passed', () => {
    const config: Configuration = getWebpackConfig(['--bundleAnalyzer']);
    const instance = getWebpackInstance(config);
    const bundleAnalyzerPlugin = instance.options.plugins.find(
      (plugin) => plugin && plugin.constructor.name === 'BundleAnalyzerPlugin',
    );
    assert.ok(bundleAnalyzerPlugin, 'BundleAnalyzerPlugin should be present');
  });

  it('should split lazy import modules out of the initial entrypoint', async () => {
    using tempDirectory = fs.mkdtempDisposableSync(
      join(tmpdir(), 'webpack-lazy-split-test-'),
    );
    const outputPath = join(tempDirectory.path, 'dist');
    const entryPath = join(tempDirectory.path, 'index.js');
    const eagerPath = join(tempDirectory.path, 'eager.js');
    const lazyOnePath = join(tempDirectory.path, 'lazy-one.js');
    const lazyTwoPath = join(tempDirectory.path, 'lazy-two.js');
    const sharedAsyncPath = join(tempDirectory.path, 'shared-async.js');

    fs.writeFileSync(
      entryPath,
      `
        import { eagerMarker } from './eager';

        console.log(eagerMarker);
        void import('./lazy-one').then(({ lazyOneMarker }) => lazyOneMarker);
        void import('./lazy-two').then(({ lazyTwoMarker }) => lazyTwoMarker);
      `,
    );
    fs.writeFileSync(eagerPath, "export const eagerMarker = 'EAGER_MARKER';\n");
    fs.writeFileSync(
      lazyOnePath,
      `
        import { sharedAsyncMarker } from './shared-async';

        export const lazyOneMarker = 'LAZY_ONE_MARKER:' + sharedAsyncMarker;
      `,
    );
    fs.writeFileSync(
      lazyTwoPath,
      `
        import { sharedAsyncMarker } from './shared-async';

        export const lazyTwoMarker = 'LAZY_TWO_MARKER:' + sharedAsyncMarker;
      `,
    );
    fs.writeFileSync(
      sharedAsyncPath,
      "export const sharedAsyncMarker = 'SHARED_ASYNC_MARKER';\n",
    );

    const baseConfig: Configuration = getWebpackConfig();
    const stats = await runWebpack({
      mode: 'development',
      context: tempDirectory.path,
      entry: { main: entryPath },
      output: {
        path: outputPath,
        filename: '[name].js',
        chunkFilename: '[name].js',
        clean: true,
      },
      optimization: {
        runtimeChunk: baseConfig.optimization?.runtimeChunk,
        splitChunks: getSplitChunksConfig(),
      },
    });
    const statsJson = stats.toJson({
      all: false,
      assets: true,
      entrypoints: true,
    });
    const entrypoint = statsJson.entrypoints?.main;
    assert(entrypoint, 'expected main entrypoint stats');
    const entrypointAssets = (entrypoint.assets ?? [])
      .map((asset) => (typeof asset === 'string' ? asset : asset.name))
      .filter((assetName): assetName is string => Boolean(assetName))
      .filter((assetName) => assetName.endsWith('.js'));
    const entrypointAssetSet = new Set(entrypointAssets);
    const allJsAssets = (statsJson.assets ?? [])
      .map((asset) => asset.name)
      .filter((assetName): assetName is string => Boolean(assetName))
      .filter((assetName) => assetName.endsWith('.js'));
    const asyncAssets = allJsAssets.filter(
      (assetName) => !entrypointAssetSet.has(assetName),
    );

    assert(
      asyncAssets.length > 0,
      'expected dynamic imports to emit async JS assets',
    );

    const readAssets = (assetNames: string[]) =>
      assetNames
        .map((assetName) => fs.readFileSync(join(outputPath, assetName), 'utf8'))
        .join('\n');
    const entrypointSource = readAssets(entrypointAssets);
    const asyncSource = readAssets(asyncAssets);

    assert.match(entrypointSource, /EAGER_MARKER/u);
    assert.doesNotMatch(entrypointSource, /LAZY_ONE_MARKER/u);
    assert.doesNotMatch(entrypointSource, /LAZY_TWO_MARKER/u);
    assert.doesNotMatch(entrypointSource, /SHARED_ASYNC_MARKER/u);
    assert.match(asyncSource, /LAZY_ONE_MARKER/u);
    assert.match(asyncSource, /LAZY_TWO_MARKER/u);
    assert.match(asyncSource, /SHARED_ASYNC_MARKER/u);
  });

  it('should classify only initial app and vendor modules into named chunks', () => {
    const splitChunks = getSplitChunksConfig();
    const cacheGroups = splitChunks.cacheGroups as Record<
      string,
      {
        test?: RegExp;
        chunks?: (chunk: { name?: string; canBeInitial: () => boolean }) => boolean;
        minChunks?: number;
      }
    >;
    const { js, vendor, asyncJs } = cacheGroups;
    const initialChunk = {
      name: 'home.html',
      canBeInitial: () => true,
    };
    const preloadRoutesChunk = {
      name: 'preload-routes',
      canBeInitial: () => true,
    };
    const asyncChunk = {
      name: undefined,
      canBeInitial: () => false,
    };

    assert(js.test, 'expected js cache group to have a test');
    assert(vendor.test, 'expected vendor cache group to have a test');
    assert(asyncJs.test, 'expected asyncJs cache group to have a test');
    assert(js.chunks, 'expected js cache group to have a chunks function');
    assert(vendor.chunks, 'expected vendor cache group to have a chunks function');
    assert(
      asyncJs.chunks,
      'expected asyncJs cache group to have a chunks function',
    );

    assert.strictEqual(js.test.test('/project/ui/pages/home/index.js'), true);
    assert.strictEqual(
      js.test.test('/project/node_modules/react/index.js'),
      false,
    );
    assert.strictEqual(
      vendor.test.test('/project/node_modules/react/index.js'),
      true,
    );
    assert.strictEqual(vendor.test.test('/project/ui/pages/home/index.js'), false);
    assert.strictEqual(js.chunks(initialChunk), true);
    assert.strictEqual(js.chunks(preloadRoutesChunk), false);
    assert.strictEqual(js.chunks(asyncChunk), false);
    assert.strictEqual(vendor.chunks(initialChunk), true);
    assert.strictEqual(vendor.chunks(preloadRoutesChunk), false);
    assert.strictEqual(vendor.chunks(asyncChunk), false);
    assert.strictEqual(asyncJs.chunks(initialChunk), false);
    assert.strictEqual(asyncJs.chunks(asyncChunk), true);
    assert.strictEqual(asyncJs.minChunks, 2);
  });

  it('should allow disabling source maps', () => {
    const config: Configuration = getWebpackConfig(['--devtool', 'none']);
    // check that options are valid
    const instance = getWebpackInstance(config);
    assert.strictEqual(instance.options.devtool, false);
  });

  it('enables manifest build IDs for test builds', () => {
    const config: Configuration = getWebpackConfig(['--test']);
    const instance = getWebpackInstance(config);
    const manifestPlugin = instance.options.plugins.find(
      (plugin) => plugin && plugin.constructor.name === 'ManifestPlugin',
    ) as ManifestPlugin<boolean>;

    assert(manifestPlugin, 'Manifest plugin should be present');
    assert.strictEqual(manifestPlugin.options.setBuildId, true);
  });

  it('keeps build_id stable for same-content file saves and changes it for real edits', async () => {
    using tempDirectory = fs.mkdtempDisposableSync(
      join(tmpdir(), 'manifest-plugin-watch-test-'),
    );
    const manifestDirectory = join(tempDirectory.path, 'manifest', 'v3');
    const sourceFilePath = join(tempDirectory.path, 'index.js');
    const outputPath = join(tempDirectory.path, 'dist');
    const manifestPath = join(outputPath, 'chrome', 'manifest.json');

    const readBuildId = () =>
      (
        JSON.parse(fs.readFileSync(manifestPath, 'utf8')) as Manifest & {
          build_id?: string;
        }
      ).build_id;

    const manifest = { manifest_version: 3, name: 'test', version: '1.0.0' };
    const baseManifestPath = join(manifestDirectory, '_base.json');
    const writeSource = (source: string | NodeJS.ArrayBufferView) =>
      fs.writeFileSync(sourceFilePath, source);
    fs.mkdirSync(manifestDirectory, { recursive: true });
    fs.writeFileSync(baseManifestPath, JSON.stringify(manifest));
    writeSource('console.log("v1");\n');

    await withWatching(
      {
        mode: 'development',
        context: tempDirectory.path,
        entry: { app: sourceFilePath },
        output: { path: outputPath },
        plugins: [
          new ManifestPlugin({
            browsers: ['chrome'],
            manifest_version: 3,
            version: '1.0.0.0',
            versionName: '1.0.0',
            description: null,
            buildType: 'main',
            zip: false,
            setBuildId: true,
          }),
        ],
      },
      async (rebuild) => {
        const firstBuildId = readBuildId();
        assert.ok(firstBuildId, 'expected initial build_id');

        await rebuild(() =>
          // Resave the watched source without changing its contents.
          writeSource(fs.readFileSync(sourceFilePath)),
        );
        const secondBuildId = readBuildId();

        await rebuild(() =>
          // Change the watched source contents to trigger a real edit rebuild.
          writeSource('console.log("v2");\n'),
        );
        const thirdBuildId = readBuildId();

        assert.strictEqual(
          secondBuildId,
          firstBuildId,
          'expected no-op watch rebuild to keep the same build_id',
        );
        assert.notStrictEqual(
          thirdBuildId,
          secondBuildId,
          'expected real file changes to produce a new build_id',
        );
      },
    );
  });

  it('should write the `dry-run` message then call exit(0)', () => {
    const exit = mock.method(process, 'exit', noop, { times: 1 });
    const error = mock.method(console, 'error', noop, { times: 1 });

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

  it('should write the `dryRun` message then call exit(0)', () => {
    const exit = mock.method(process, 'exit', noop, { times: 1 });
    const error = mock.method(console, 'error', noop, { times: 1 });

    // we don't care about the return value, just that it logs and calls `exit`
    getWebpackConfig(['--dryRun']);
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
      (plugin) => plugin && plugin.constructor.name === 'ReactRefreshPlugin',
    );
    assert(reactRefreshPlugin, 'ReactRefreshPlugin should be present');
  });
});
