import fs from 'node:fs';
import { tmpdir } from 'node:os';
import { describe, it, afterEach, before, after, mock } from 'node:test';
import assert from 'node:assert';
import process from 'node:process';
import { join, resolve } from 'node:path';
import { runInNewContext } from 'node:vm';
import { transform } from '@swc/core';
import {
  type Configuration,
  type FileCacheOptions,
  webpack,
  Compiler,
  WebpackPluginInstance,
  RuleSetRule,
} from 'webpack';
import { noop, type Manifest, NODE_MODULES_RE } from '../utils/helpers';
import { ManifestPlugin } from '../utils/plugins/ManifestPlugin';
import { getLatestCommit } from '../utils/git';
import { version as packageVersion } from '../../../package.json';
import { CHROME_MANIFEST_KEY_NON_PRODUCTION } from '../utils/constants';
import { BUNDLE_SIZE_SUMMARY_FILE } from '../utils/plugins/ManifestPlugin/stats';
import {
  DEFAULT_ZIP_MTIME,
  isValidZipMtime,
} from '../utils/plugins/ManifestPlugin/zip-mtime';
import type { SwcLoaderOptions } from '../utils/loaders/swcLoader';

// `buildDependencies` entries are either a path or `{ dependency, optional }`.
// The config only ever writes paths, but the type allows both.
function buildDependencyPath(
  item: NonNullable<FileCacheOptions['buildDependencies']>[string][number],
) {
  return typeof item === 'string' ? item : item.dependency;
}

function getWebpackInstance(config: Configuration) {
  // webpack logs a warning if we pass config.watch to it without a callback
  // we don't want a callback because that will cause the build to run
  // so we just delete the watch property.
  delete config.watch;
  return webpack(config);
}

function getExpectedDefaultZipMtime() {
  const latestCommitTimestamp = getLatestCommit().timestamp();
  if (isValidZipMtime(latestCommitTimestamp)) {
    return latestCommitTimestamp;
  }
  return DEFAULT_ZIP_MTIME;
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
  let originalExistsSync: typeof fs.existsSync;
  const optionalRcPaths = {
    metamaskrc: resolve(__dirname, '../../../.metamaskrc'),
    metamaskprodrc: resolve(__dirname, '../../../.metamaskprodrc'),
  };
  before(() => {
    // cache originals before we start messing with them
    originalArgv = process.argv;
    originalEnv = process.env;
    originalExistsSync = fs.existsSync;
  });
  after(() => {
    // restore originals for other tests
    process.argv = originalArgv;
    process.env = originalEnv;
  });
  afterEach(() => {
    // reset argv to avoid affecting other tests
    process.argv = [process.argv0, process.argv[1]];
    process.env = originalEnv;
    // The config reads argv and env when loaded, so reload it for each case.
    delete require.cache[require.resolve('../webpack.config.ts')];
    mock.restoreAll();
  });

  async function getWebpackConfig(
    args: string[] = [],
    env: NodeJS.ProcessEnv = {},
  ) {
    // The config reads argv when its module is loaded.
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
    return require('../webpack.config.ts').default();
  }

  function getPluginNames(config: Configuration): string[] {
    return (config.plugins ?? [])
      .map((plugin) => plugin?.constructor.name)
      .filter((name): name is string => typeof name === 'string');
  }

  type SwcReactRule = RuleSetRule & {
    use: {
      options: {
        jsc: {
          transform: {
            react: {
              development: boolean;
              refresh: boolean;
            };
          };
        };
      };
    };
  };

  function isSwcReactRule(rule: unknown): rule is SwcReactRule {
    if (!rule || typeof rule !== 'object' || Array.isArray(rule)) {
      return false;
    }
    const maybeRule = rule as Partial<SwcReactRule>;
    return (
      typeof maybeRule.use?.options?.jsc?.transform?.react?.refresh ===
        'boolean' &&
      typeof maybeRule.use.options.jsc.transform.react.development === 'boolean'
    );
  }

  function getSwcReactRules(config: Configuration): SwcReactRule[] {
    return (config.module?.rules ?? []).filter(isSwcReactRule);
  }

  function mockOptionalRcFiles({
    metamaskrc = false,
    metamaskprodrc = false,
  } = {}) {
    mock.method(
      fs,
      'existsSync',
      (path: Parameters<typeof fs.existsSync>[0]) => {
        if (path === optionalRcPaths.metamaskrc) {
          return metamaskrc;
        }
        if (path === optionalRcPaths.metamaskprodrc) {
          return metamaskprodrc;
        }
        return originalExistsSync(path);
      },
    );
  }

  it('should have the correct defaults', async () => {
    mockOptionalRcFiles();

    const config: Configuration = await getWebpackConfig();
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
    const cache = config.cache as FileCacheOptions;
    const configBuildDependencies = cache.buildDependencies?.config ?? [];
    assert.ok(
      configBuildDependencies
        .map(buildDependencyPath)
        .every(
          (path) =>
            !path.endsWith('.metamaskrc') && !path.endsWith('.metamaskprodrc'),
        ),
      'optional rc files should not be cache dependencies when they do not exist',
    );

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
    assert.strictEqual(manifestPlugin.options.stats, false);
    assert.strictEqual('zipOptions' in manifestPlugin.options, false);

    const progressPlugin = options.plugins.find(
      (plugin) => plugin && plugin.constructor.name === 'ProgressPlugin',
    );
    assert(progressPlugin, 'Progress plugin should present');
  });

  it('includes existing optional rc files in cache dependencies', async () => {
    mockOptionalRcFiles({ metamaskrc: true });

    const config: Configuration = await getWebpackConfig();
    const cache = config.cache as FileCacheOptions;
    const configBuildDependencies = (cache.buildDependencies?.config ?? []).map(
      buildDependencyPath,
    );

    assert.ok(
      configBuildDependencies.some((path) => path.endsWith('.metamaskrc')),
      'existing .metamaskrc should be a cache dependency',
    );
    assert.ok(
      configBuildDependencies.every(
        (path) => !path.endsWith('.metamaskprodrc'),
      ),
      'missing .metamaskprodrc should not be a cache dependency',
    );
  });

  for (const mode of ['development', 'production']) {
    for (const test of [false, true]) {
      it(`inlines public flags only for the npm loader in ${mode} with test=${test}`, async () => {
        mockOptionalRcFiles();
        const config: Configuration = await getWebpackConfig(
          [
            '--mode',
            mode,
            '--env',
            'testing',
            '--no-validateEnv',
            ...(test ? ['--test'] : []),
          ],
          { INFURA_PROJECT_ID: 'sentinel-build-value' },
        );
        const source =
          'const flags = [process.env.IN_TEST, process.env.NODE_ENV, process.env.INFURA_PROJECT_ID];';
        const firstPartyUse = getSwcReactRules(config)[0].use as {
          options: SwcLoaderOptions;
        };
        // Warm SWC's environment cache with first-party values before vendors.
        await transform(source, {
          ...firstPartyUse.options,
          filename: '/test/file.ts',
          swcrc: false,
        });
        const vendorRule = config.module?.rules?.find(
          (rule): rule is RuleSetRule =>
            typeof rule === 'object' && Array.isArray(rule?.oneOf),
        );
        assert(vendorRule?.oneOf);
        assert.strictEqual(vendorRule.oneOf.length, 2, 'npm and cjs loaders');

        for (const rule of vendorRule.oneOf) {
          assert(rule && typeof rule === 'object');
          assert.strictEqual(String(rule.include), String(NODE_MODULES_RE));
          const use = rule.use as { options: SwcLoaderOptions };
          assert(use.options.module);
          const isCjs = use.options.module.type === 'commonjs';
          const { code } = await transform(source, {
            ...use.options,
            filename: `/test/node_modules/vendor/file.${isCjs ? 'cjs' : 'js'}`,
            swcrc: false,
          });
          const flags: unknown = runInNewContext(`${code}\nflags;`, {
            process: {
              env: {
                IN_TEST: 'runtime-test',
                NODE_ENV: 'runtime-mode',
                INFURA_PROJECT_ID: 'runtime-value',
              },
            },
          });

          assert(Array.isArray(flags));
          assert.deepStrictEqual(
            [...flags],
            isCjs
              ? ['runtime-test', 'runtime-mode', 'runtime-value']
              : [test, mode, 'runtime-value'],
          );
        }
      });
    }
  }

  for (const watch of [false, true]) {
    it(`compiles TypeScript files with configured loaders and watch=${watch}`, async () => {
      const config = await getWebpackConfig(watch ? ['--watch'] : []);
      for (const extension of ['ts', 'mts', 'tsx']) {
        const filename = resolve(__dirname, `../../../ui/test.${extension}`);
        const rule = getSwcReactRules(config).find(
          ({ test }) => test instanceof RegExp && test.test(filename),
        );
        assert(rule, `Missing loader for .${extension}`);
        const { options } = rule.use as { options: SwcLoaderOptions };

        await transform(
          extension === 'tsx'
            ? 'export const Component = (text: string) => <div>{text}</div>;'
            : 'export const identity = <T>(value: T): T => value;',
          { ...options, filename, swcrc: false },
        );
      }
    });
  }

  it('loads the self-injection plugin for Firefox MV2', async () => {
    mockOptionalRcFiles();
    const config = await getWebpackConfig([
      '--browser',
      'firefox',
      '--manifestVersion',
      '2',
    ]);
    assert(getPluginNames(config).includes('SelfInjectPlugin'));
  });

  it('loads the React Compiler reporting plugin when verbose output is enabled', async () => {
    mockOptionalRcFiles();
    const config = await getWebpackConfig(['--reactCompilerVerbose']);
    assert(getPluginNames(config).includes('ReactCompilerPlugin'));
  });

  it('enables React Refresh for development watch builds', async () => {
    mockOptionalRcFiles();

    const config: Configuration = await getWebpackConfig(['--watch']);

    assert.strictEqual(config.watch, true);
    assert.deepStrictEqual(
      getPluginNames(config).filter((name) =>
        ['HotModuleReplacementPlugin', 'ReactRefreshPlugin'].includes(name),
      ),
      ['HotModuleReplacementPlugin', 'ReactRefreshPlugin'],
    );

    const reactRefreshRules = getSwcReactRules(config).filter(
      (rule) => rule.use.options.jsc.transform.react.refresh,
    );
    assert.deepStrictEqual(
      reactRefreshRules.map((rule) => rule.test?.toString()),
      [/\.(?:ts|mts|tsx)$/u.toString(), /\.(?:js|mjs|jsx)$/u.toString()],
    );
    assert.deepStrictEqual(
      reactRefreshRules.map((rule) => rule.exclude),
      [undefined, undefined],
    );
    assert.ok(
      reactRefreshRules.every(
        (rule) =>
          rule.include instanceof RegExp &&
          rule.use.options.jsc.transform.react.development,
      ),
      'React Refresh rules should be scoped to UI source with development React transforms',
    );
  });

  it('does not enable React Refresh for production watch builds', async () => {
    const config: Configuration = await getWebpackConfig(
      [
        '--mode',
        'production',
        '--env',
        'production',
        '--no-validateEnv',
        '--watch',
        '--no-lavamoat',
      ],
      {
        INFURA_PROD_PROJECT_ID: '00000000000000000000000000000000',
        SEGMENT_WRITE_KEY: '-',
        SEGMENT_PROD_WRITE_KEY: '-',
      },
    );

    assert.strictEqual(config.watch, true);
    assert.deepStrictEqual(
      getPluginNames(config).filter((name) =>
        ['HotModuleReplacementPlugin', 'ReactRefreshPlugin'].includes(name),
      ),
      [],
    );
    assert.strictEqual(
      getSwcReactRules(config).filter(
        (rule) => rule.use.options.jsc.transform.react.refresh,
      ).length,
      0,
    );
  });

  it('should apply non-default options', async () => {
    const removeUnsupportedFeatures = ['--no-lavamoat'];
    const config: Configuration = await getWebpackConfig(
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
    assert.strictEqual(stats.preset, 'none');
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
    ) as WebpackPluginInstance & ManifestPlugin<true>;
    assert.deepStrictEqual(manifestPlugin.options.web_accessible_resources, []);
    assert.deepStrictEqual(manifestPlugin.options.description, null);
    assert.deepStrictEqual(manifestPlugin.options.zip, true);
    assert(manifestPlugin.options.zipOptions, 'Zip options should be present');
    assert.strictEqual(
      manifestPlugin.options.zipOptions.outFilePath,
      `../builds/metamask-[browser]-${packageVersion}.zip`,
    );
    assert.strictEqual(
      manifestPlugin.options.zipOptions.mtime,
      getExpectedDefaultZipMtime(),
    );
    assert.deepStrictEqual(manifestPlugin.options.transform, undefined);
    assert(manifestPlugin.options.stats, 'Stats options should be present');
    assert.strictEqual(
      manifestPlugin.options.stats.outFile,
      BUNDLE_SIZE_SUMMARY_FILE,
    );
    assert.strictEqual(manifestPlugin.options.stats.debug, true);
    assert.deepStrictEqual(manifestPlugin.options.html, [
      { directory: join('html', 'ui'), category: 'ui' },
      { directory: join('html', 'background'), category: 'background' },
      { directory: join('html', 'other'), category: 'other' },
    ]);

    const htmlBundlerPlugin = instance.options.plugins.find(
      (plugin) => plugin && plugin.constructor.name === 'HtmlBundlerPlugin',
    );
    assert(htmlBundlerPlugin, 'HtmlBundlerPlugin should be present');

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

  it('uses SOURCE_DATE_EPOCH as the default zip mtime when set', async () => {
    const config: Configuration = await getWebpackConfig(['--zip'], {
      SOURCE_DATE_EPOCH: '1711141205',
    });
    const instance = getWebpackInstance(config);
    const manifestPlugin = instance.options.plugins.find(
      (plugin) => plugin && plugin.constructor.name === 'ManifestPlugin',
    ) as ManifestPlugin<true>;

    assert(manifestPlugin, 'Manifest plugin should be present');
    assert.strictEqual(manifestPlugin.options.zip, true);
    assert.strictEqual(manifestPlugin.options.zipOptions.mtime, 1711141205000);
  });

  it('should include BundleAnalyzerPlugin when --bundleAnalyzer is passed', async () => {
    const config: Configuration = await getWebpackConfig(['--bundleAnalyzer']);
    const instance = getWebpackInstance(config);
    const stats = instance.options.stats as { preset: string };
    assert.strictEqual(stats.preset, 'none');
    const bundleAnalyzerPlugin = instance.options.plugins.find(
      (plugin) => plugin && plugin.constructor.name === 'BundleAnalyzerPlugin',
    );
    assert.ok(bundleAnalyzerPlugin, 'BundleAnalyzerPlugin should be present');
  });

  it('should allow disabling source maps', async () => {
    const config: Configuration = await getWebpackConfig(['--devtool', 'none']);
    // check that options are valid
    const instance = getWebpackInstance(config);
    assert.strictEqual(instance.options.devtool, false);
  });

  it('enables manifest build IDs for test builds', async () => {
    const config: Configuration = await getWebpackConfig(['--test']);
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

  it('should write the `dry-run` message then call exit(0)', async () => {
    const exit = mock.method(process, 'exit', noop, { times: 1 });
    const error = mock.method(console, 'error', noop, { times: 1 });

    // we don't care about the return value, just that it logs and calls `exit`
    await getWebpackConfig(['--dry-run']);
    assert.strictEqual(error.mock.calls.length, 1);
    assert.strictEqual(error.mock.calls[0].arguments.length, 1);
    // we don't care about the message, just that it is logged
    assert.strictEqual(typeof error.mock.calls[0].arguments[0], 'string');

    assert.strictEqual(exit.mock.calls.length, 1);
    assert.strictEqual(exit.mock.calls[0].arguments.length, 1);
    assert.strictEqual(exit.mock.calls[0].arguments[0], 0);
  });

  it('should write the `dryRun` message then call exit(0)', async () => {
    const exit = mock.method(process, 'exit', noop, { times: 1 });
    const error = mock.method(console, 'error', noop, { times: 1 });

    // we don't care about the return value, just that it logs and calls `exit`
    await getWebpackConfig(['--dryRun']);
    assert.strictEqual(error.mock.calls.length, 1);
    assert.strictEqual(error.mock.calls[0].arguments.length, 1);
    // we don't care about the message, just that it is logged
    assert.strictEqual(typeof error.mock.calls[0].arguments[0], 'string');

    assert.strictEqual(exit.mock.calls.length, 1);
    assert.strictEqual(exit.mock.calls[0].arguments.length, 1);
    assert.strictEqual(exit.mock.calls[0].arguments[0], 0);
  });

  it('includes the resolved zip mtime in the dry-run message when zipping', async () => {
    const exit = mock.method(process, 'exit', noop, { times: 1 });
    const error = mock.method(console, 'error', noop, { times: 1 });

    await getWebpackConfig(['--zip', '--dry-run'], {
      SOURCE_DATE_EPOCH: '1711141205',
    });

    assert.strictEqual(error.mock.calls.length, 1);
    assert.match(
      error.mock.calls[0].arguments[0] as string,
      /Zip mtime: 1711141205000 \(2024-03-22T21:00:05\.000Z\)/u,
    );

    assert.strictEqual(exit.mock.calls.length, 1);
    assert.strictEqual(exit.mock.calls[0].arguments[0], 0);
  });

  it('validates SOURCE_DATE_EPOCH during zip dry-run', async () => {
    await assert.rejects(
      () =>
        getWebpackConfig(['--zip', '--dry-run'], {
          SOURCE_DATE_EPOCH: '0',
        }),
      {
        message:
          /Invalid SOURCE_DATE_EPOCH value "0": expected a Unix timestamp in seconds greater than or equal to 315532800 and less than 4102444800/u,
      },
    );
  });
});
