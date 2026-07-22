/**
 * @file The main webpack configuration file for the browser extension.
 */

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { argv, exit } from 'node:process';
import {
  HotModuleReplacementPlugin,
  ProvidePlugin,
  type Chunk,
  type Configuration,
  type WebpackPluginInstance,
  type MemoryCacheOptions,
  type FileCacheOptions,
} from 'webpack';
import CopyPlugin from 'copy-webpack-plugin';
import HtmlBundlerPlugin from 'html-bundler-webpack-plugin';
import rtlCss from 'postcss-rtlcss';
import autoprefixer from 'autoprefixer';
import tailwindcss from 'tailwindcss';
import { discardFontFace } from '../postcss-plugins/discard-font-face';
import { loadBuildTypesConfig } from '../lib/build-type';
import {
  getMinimizers,
  JAVASCRIPT_FILE_RE,
  NODE_MODULES_RE,
  TYPESCRIPT_FILE_RE,
  UI_COMPONENT_RE,
  SNOW_MODULE_RE,
  TREZOR_MODULE_RE,
  UI_DIR_RE,
} from './utils/helpers';
import { transformManifest } from './utils/plugins/ManifestPlugin/helpers';
import { parseArgv, getDryRunMessage } from './utils/cli';
import { getSwcLoader } from './utils/loaders/getSwcLoader';
import { getVariables } from './utils/config';
import { getReactCompilerLoader } from './utils/loaders/reactCompilerLoader';
import { getThreadLoader } from './utils/loaders/threadLoader';
import { ManifestPlugin } from './utils/plugins/ManifestPlugin';
import { getLatestCommit } from './utils/git';
import { MODES } from './utils/constants';
import { getDevServerOptions, injectEntryScripts } from './utils/dev-server';
import { BACKGROUND_CLIENT_ENTRY_NAME } from './utils/dev-server/protocol';
import { BUNDLE_SIZE_SUMMARY_FILE } from './utils/plugins/ManifestPlugin/stats';
import { getDefaultZipMtime } from './utils/plugins/ManifestPlugin/zip-mtime';

const buildTypes = loadBuildTypesConfig();
const { args, cacheKey, features } = parseArgv(argv.slice(2), buildTypes);
if (args.dryRun) {
  console.error(getDryRunMessage(args, features));
  exit(0);
}

const context = join(__dirname, '../../app');
const nodeModules = join(__dirname, '../../node_modules');
const root = join(context, '..');
const isDevelopment = args.mode === MODES.DEVELOPMENT;
const isDevelopmentWatchMode = isDevelopment && args.watch;
const MANIFEST_VERSION = args.manifestVersion;
const browsersListPath = join(root, '.browserslistrc');
// read .browserslist now to stop it from searching for the file over and over
const browsersListQuery = readFileSync(browsersListPath, 'utf8');
const { variables, safeVariables, version, buildEnvVarDeclarations } =
  getVariables(args, buildTypes);
const webAccessibleResources =
  args.devtool === 'source-map'
    ? ['scripts/inpage.js.map', 'scripts/contentscript.js.map']
    : [];

// #region cache
const cache = args.cache
  ? ({
      type: 'filesystem',
      name: `MetaMask—${args.mode}`,
      version: cacheKey,
      idleTimeout: 0,
      idleTimeoutForInitialStore: 0,
      idleTimeoutAfterLargeChanges: 0,
      // small performance gain by increase memory generations
      maxMemoryGenerations: Infinity,
      // Disable allowCollectingMemory because it can slow the build by 10%!
      allowCollectingMemory: false,
      buildDependencies: {
        defaultConfig: [__filename],
        // Invalidates the build cache when the listed files change.
        // `__filename` makes all `require`d dependencies of *this* file
        // `buildDependencies`
        config: [
          __filename,
          ...[join(root, '.metamaskprodrc'), join(root, '.metamaskrc')].filter(
            existsSync,
          ),
          join(root, 'builds.yml'),
          browsersListPath,
        ],
      },
    } as const satisfies FileCacheOptions)
  : ({ type: 'memory' } as const satisfies MemoryCacheOptions);
// #endregion cache

// #region plugins
const commitHash = isDevelopment ? getLatestCommit().hash() : null;

const manifestPlugin = new ManifestPlugin({
  html: [
    { directory: join('html', 'ui'), category: 'ui' },
    { directory: join('html', 'background'), category: 'background' },
    { directory: join('html', 'other'), category: 'other' },
  ],
  web_accessible_resources: webAccessibleResources,
  manifest_version: MANIFEST_VERSION,
  description: commitHash
    ? `${args.type} build for ${args.mode} from git id: ${commitHash.substring(0, 8)}`
    : null,
  version: version.version,
  versionName: version.versionName,
  browsers: args.browser,
  transform: transformManifest(
    args,
    isDevelopment,
    variables.get('MANIFEST_OVERRIDES') as string | undefined,
  ),
  zip: args.zip,
  ...(args.zip
    ? {
        zipOptions: {
          outFilePath: `../builds/metamask-[browser]-${version.versionName}.zip`, // relative to output.path
          mtime: getDefaultZipMtime(),
          excludeExtensions: ['.map'],
          // `level: 9` is the highest; it may increase build time by ~5% over level 1
          level: 9,
        },
      }
    : {}),
  buildType: args.type,
  // We want to set a build ID for test builds to make it easier for tooling to
  // know if the build contents have changed. Can be useful during testing or
  // development.
  setBuildId: args.test,
  stats: args.stats
    ? {
        outFile: BUNDLE_SIZE_SUMMARY_FILE,
        debug: true,
      }
    : false,
});

const plugins: WebpackPluginInstance[] = [
  manifestPlugin,
  // HtmlBundlerPlugin treats HTML files as entry points
  new HtmlBundlerPlugin({
    preprocessorOptions: { useWith: false },
    minify: args.minify,
    test: /\.html$/u, // default is eta/html, we only want html
    data: { isTest: args.test },
    // In watch mode, inject the dev-only background client into the relevant HTML page.
    beforeEmit: (content, entry, compilation) => {
      if (!args.watch) {
        return content;
      }
      // The MV2 (Firefox) background page gets the background client,
      // which triggers `chrome.runtime.reload()` only when a background or
      // content-script bundle changes. (On MV3 the client is bundled into the
      // service worker instead, since it loads a single JS file.)
      if (MANIFEST_VERSION === 2 && entry.name === 'background') {
        return injectEntryScripts(
          content,
          compilation,
          BACKGROUND_CLIENT_ENTRY_NAME,
        );
      }
      return content;
    },
    preload: [
      {
        attributes: { as: 'font', crossorigin: true },
        // preload our own fonts, as other fonts use fallback formats we don't
        // want to preload
        test: /fonts\/\.(?:woff2)$/u,
      },
    ],
  }),
  // use ProvidePlugin to polyfill *global* node variables
  new ProvidePlugin({
    // Make a global `Buffer` variable that points to the `buffer` package.
    Buffer: ['buffer', 'Buffer'],
    // Make a global `process` variable that points to the `process` package.
    process: 'process/browser.js',
    // polyfill usages of `setImmediate`, ideally this would be automatically
    // handled by `swcLoader`'s `env.usage = 'entry'` option, but that setting
    // results in a compilation error: `Module parse failed: 'import' and
    // 'export' may appear only with 'sourceType: module' (2:0)`. I spent a few
    // hours trying to figure it out but couldn't. So, this is the workaround.
    // Note: we should probably remove usages of `setImmediate` from our
    // codebase so we don't have to polyfill it.
    setImmediate: 'core-js-pure/actual/set-immediate.js',
  }),
  new CopyPlugin({
    patterns: [
      { from: join(context, '_locales'), to: '_locales' }, // translations
      // misc images
      // TODO: fix overlap between this folder and automatically bundled assets
      { from: join(context, 'images'), to: 'images' },
      // TODO: automatically bundle build-type specific images
      ...(args.type === 'flask'
        ? [
            {
              from: join(context, 'build-types', 'flask', 'images'),
              to: 'images',
              force: true,
            },
          ]
        : []),
      ...(args.type === 'beta'
        ? [
            {
              from: join(context, 'build-types', 'beta', 'images'),
              to: 'images',
              force: true,
            },
          ]
        : []),
      // snaps MV3 needs the offscreen document
      ...(MANIFEST_VERSION === 3
        ? [
            {
              from: join(
                nodeModules,
                '@metamask/snaps-execution-environments',
                'dist/webpack/iframe/index.html',
              ),
              to: 'snaps/index.html',
            },
            {
              from: join(
                nodeModules,
                '@metamask/snaps-execution-environments',
                'dist/webpack/iframe/bundle.js',
              ),
              to: 'snaps/bundle.js',
            },
          ]
        : []),
    ],
  }),
];
// MV2 requires self-injection
if (MANIFEST_VERSION === 2) {
  const { SelfInjectPlugin } = require('./utils/plugins/SelfInjectPlugin');
  plugins.push(new SelfInjectPlugin({ test: /^scripts\/inpage\.js$/u }));
}
if (args.lavamoat) {
  const {
    lavamoatPlugin,
    lavamoatUnsafeLayerPlugin,
  } = require('./utils/plugins/LavamoatPlugin');
  plugins.push(lavamoatPlugin(args), lavamoatUnsafeLayerPlugin);
}
if (args.progress) {
  const { ProgressPlugin } = require('webpack');
  plugins.push(new ProgressPlugin());
}
if (args.reactCompilerVerbose) {
  const {
    ReactCompilerPlugin,
  } = require('./utils/plugins/ReactCompilerPlugin');
  plugins.push(new ReactCompilerPlugin());
}

if (isDevelopmentWatchMode) {
  const ReactRefreshWebpackPlugin = require('@pmmmwh/react-refresh-webpack-plugin');
  plugins.push(
    new HotModuleReplacementPlugin(),
    new ReactRefreshWebpackPlugin({
      include: UI_DIR_RE,
      overlay: false,
      runtimeEntry: false,
    }),
  );
}

if (args.bundleAnalyzer) {
  const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
  plugins.push(
    new BundleAnalyzerPlugin({ analyzerMode: 'static', openAnalyzer: false }),
  );
}

// #endregion plugins

const swcConfig = { browsersListQuery, isDevelopment, refresh: false };
const tsxLoader = getSwcLoader('typescript', true, safeVariables, swcConfig);
const jsxLoader = getSwcLoader('ecmascript', true, safeVariables, swcConfig);

const swcReactRefreshConfig = { ...swcConfig, refresh: true };
const reactRefreshTsxLoader = getSwcLoader(
  'typescript',
  true,
  safeVariables,
  swcReactRefreshConfig,
);
const reactRefreshJsxLoader = getSwcLoader(
  'ecmascript',
  true,
  safeVariables,
  swcReactRefreshConfig,
);

const npmLoader = getSwcLoader('ecmascript', false, {}, swcConfig);
const cjsLoader = getSwcLoader('ecmascript', false, {}, swcConfig, 'commonjs');

const isChunkableInitial = (chunk: Chunk) =>
  manifestPlugin.canBeChunked(chunk) && chunk.canBeInitial();
const isChunkableAsync = (chunk: Chunk) =>
  manifestPlugin.canBeChunked(chunk) && !chunk.canBeInitial();

const threadLoader = getThreadLoader(args);
const reactCompiler = getReactCompilerLoader({
  target: '18',
  verbose: args.reactCompilerVerbose,
  debug: args.reactCompilerDebug,
  threadLoaderEnabled: threadLoader !== null,
});

const config = {
  // All entries are added dynamically by ManifestPlugin
  // an empty entry object prevents webpack's default entry.
  entry: {},
  cache,
  plugins,
  context,
  mode: args.mode,
  stats: 'none',
  name: `MetaMask – ${args.mode}`,
  // use the `.browserlistrc` file directly to avoid browserslist searching
  target: `browserslist:${browsersListPath}:defaults`,
  // TODO: look into using SourceMapDevToolPlugin and its exclude option to speed up the build
  // TODO: put source maps in an upper level directory (like the gulp build does now)
  // see: https://webpack.js.org/plugins/source-map-dev-tool-plugin/#host-source-maps-externally
  devtool: args.devtool === 'none' ? false : args.devtool,
  output: {
    wasmLoading: 'fetch',
    // At some point we added the contenthash to filenames. People do this for cache
    // busting in production, but as an extension, that is not relevant for us.
    // Primarily, we are concerned here with making builds go faster, and it's not
    // clear how including the contenthash furthers that goal.
    // Eventually, we discovered that including the contenthash in the filenames
    // breaks watched builds, because the filenames used by the background service
    // worker for importScripts() somehow become out of sync with the files on
    // disk on rebuilds.
    // Although we aren't certain why we enabled content hashes in the first place,
    // for now we only disable them in watched builds, and leave resolution of what
    // to do for production builds to the future.
    filename: args.watch ? '[name].js' : '[name].[contenthash].js',
    path: join(context, '..', 'dist'),
    // Clean the output directory before emit, so that only the latest build
    // files remain. Nearly 0 performance penalty for this clean up step.
    clean: true,
    // relative to HTML page. This value is essentially prepended to asset URLs
    // in the output HTML, i.e., `<script src="<publicPath><resourcePath>">`.
    publicPath: '',
    // disabling pathinfo makes reading the bundle harder, but reduces build
    // time by 500ms+
    pathinfo: false,
  },
  resolve: {
    // Disable symlinks for performance; saves about .5 seconds off full build
    symlinks: false,
    // Extensions added to the request when trying to find the file. The most
    // common extensions should be first to improve resolution performance.
    extensions: ['.ts', '.tsx', '.js', '.jsx', '.json'],
    // use `fallback` to redirect module requests when normal resolving fails,
    // good for polyfill-ing built-in node modules that aren't available in
    // the browser. The browser will first attempt to load these modules, if
    // it fails it will load the fallback.
    fallback: {
      // #region conditionally remove developer tooling
      // remove react-devtools-core unless METAMASK_REACT_REDUX_DEVTOOLS is enabled
      'react-devtools-core': variables.get('METAMASK_REACT_REDUX_DEVTOOLS')
        ? require.resolve('react-devtools-core')
        : false,
      // remove remote-redux-devtools unless METAMASK_REACT_REDUX_DEVTOOLS is enabled
      'remote-redux-devtools': variables.get('METAMASK_REACT_REDUX_DEVTOOLS')
        ? require.resolve('remote-redux-devtools')
        : false,
      // #endregion conditionally remove developer tooling
      // #region node polyfills
      crypto: require.resolve('crypto-browserify'),
      fs: false,
      http: require.resolve('stream-http'),
      https: require.resolve('https-browserify'),
      path: require.resolve('path-browserify'),
      stream: require.resolve('stream-browserify'),
      vm: false,
      zlib: false,
      // #endregion node polyfills
    },
  },
  // note: loaders in a `use` array are applied in *reverse* order, i.e., bottom
  // to top, (or right to left depending on the current formatting of the file)
  module: {
    noParse: [
      // don't parse lodash, as it's large, already minified, and doesn't need
      // to be transformed
      /^lodash$/u,
    ],
    rules: [
      // json
      { test: /\.json$/u, type: 'json' },
      // treats JSON and compressed JSON files loaded via `new URL('./file.json(?:\.gz)', import.meta.url)` as assets.
      {
        test: /\.json(?:\.gz)?$/u,
        dependency: 'url',
        type: 'asset/resource',
      },
      // Source preprocessing (enforce: 'pre' ensures these run before normal
      // loaders; options must be JSON-serializable for thread-loader compatibility)
      args.validateEnv && {
        test: /\.(?:[jt]s|m[jt]s|[jt]sx)$/u,
        exclude: NODE_MODULES_RE,
        enforce: 'pre' as const,
        use: {
          loader: require.resolve('./utils/loaders/envValidationLoader'),
          options: { declarations: [...buildEnvVarDeclarations] },
        },
      },
      // thread-loader pool for UI component files (must appear before SWC rules)
      threadLoader && {
        test: UI_COMPONENT_RE,
        include: UI_DIR_RE,
        use: threadLoader,
      },
      // own typescript, and own typescript with jsx
      ...(isDevelopmentWatchMode
        ? [
            {
              test: TYPESCRIPT_FILE_RE,
              include: UI_DIR_RE,
              use: reactRefreshTsxLoader,
            },
            {
              test: TYPESCRIPT_FILE_RE,
              exclude: [NODE_MODULES_RE, UI_DIR_RE],
              use: tsxLoader,
            },
          ]
        : [
            {
              test: TYPESCRIPT_FILE_RE,
              exclude: NODE_MODULES_RE,
              use: tsxLoader,
            },
          ]),
      // own javascript, and own javascript with jsx
      ...(isDevelopmentWatchMode
        ? [
            {
              test: JAVASCRIPT_FILE_RE,
              include: UI_DIR_RE,
              use: reactRefreshJsxLoader,
            },
            {
              test: JAVASCRIPT_FILE_RE,
              exclude: [NODE_MODULES_RE, UI_DIR_RE],
              use: jsxLoader,
            },
          ]
        : [
            {
              test: JAVASCRIPT_FILE_RE,
              exclude: NODE_MODULES_RE,
              use: jsxLoader,
            },
          ]),
      // React Compiler for UI component files (must appear after SWC rules)
      { test: UI_COMPONENT_RE, include: UI_DIR_RE, use: reactCompiler },
      // vendor javascript. We must transform all npm modules to ensure browser
      // compatibility.
      {
        oneOf: [
          {
            test: /\.m?js$/u,
            include: NODE_MODULES_RE,
            exclude: [
              // security team requires that we never process `@lavamoat/snow/**.*`
              SNOW_MODULE_RE,

              // these trezor libraries are .js files with CJS exports, they
              // must be processed with the CJS loader
              TREZOR_MODULE_RE,
            ],
            use: npmLoader,
          },
          {
            test: /\.c?js$/u,
            include: NODE_MODULES_RE,
            exclude: [
              // security team requires that we never process `@lavamoat/snow/**.*`
              SNOW_MODULE_RE,
            ],
            use: cjsLoader,
          },
        ],
      },
      // css, sass/scss
      {
        test: /\.(css|sass|scss)$/u,
        use: [
          // Resolves CSS `@import` and `url()` paths and loads the files.
          'css-loader',
          {
            loader: 'postcss-loader',
            options: {
              postcssOptions: {
                config: false,
                plugins: [
                  tailwindcss(),
                  autoprefixer({ overrideBrowserslist: browsersListQuery }),
                  rtlCss({ processEnv: false }),
                  discardFontFace(['woff2']), // keep woff2 fonts
                ],
              },
            },
          },
          // Compiles Sass to CSS
          {
            loader: 'sass-loader',
            options: {
              // Use 'sass-embedded', as it is usually faster than 'sass'
              implementation: 'sass-embedded',
              api: 'modern',
              // Disable the webpackImporter, as we:
              //  a) don't want to rely on it in case we want to switch away
              //     from webpack in the future
              //  b) the sass importer is faster
              //  c) the "modern" sass api doesn't work with the
              //     webpackImporter yet.
              webpackImporter: false,
              sassOptions: {
                // We don't need to specify the charset because the HTML
                // already does and browsers use the HTML's charset for CSS.
                // Additionally, webpack + sass can cause problems with the
                // charset placement, as described here:
                // https://github.com/webpack-contrib/css-loader/issues/1212
                charset: false,
                quietDeps: true,
                // TODO: Remove after https://github.com/MetaMask/metamask-extension/issues/44725
                silenceDeprecations: ['import'],
                // The order of loadPaths is important; prefer our own
                // folders over `node_modules`
                loadPaths: [
                  // enables aliases to `@use design - system`,
                  // `@use utilities`, etc.
                  join(context, '../ui/css'),
                  join(context, '../node_modules'),
                ],
              },
            },
          },
        ],
      },
      // images, fonts, wasm, riv etc.
      {
        test: /\.(?:png|jpe?g|ico|webp|svg|gif|woff2|wasm|riv)$/u,
        type: 'asset/resource',
        generator: { filename: 'assets/[name].[contenthash][ext]' },
      },
    ],
  },
  node: {
    // eventually we should avoid any code that uses node globals `__dirname`
    // and `__filename``. But for now, just warn about their use.
    __dirname: 'warn-mock',
    __filename: 'warn-mock',
    // Hopefully in the the future we won't need to polyfill node `global`, as
    // a browser version, `globalThis`, already exists and we should use it
    // instead.
    global: true,
  },
  optimization: {
    // only enable sideEffects, providedExports, removeAvailableModules, and
    // usedExports for production, as these options slow down the build
    sideEffects: !isDevelopment,
    providedExports: !isDevelopment,
    removeAvailableModules: !isDevelopment,
    usedExports: !isDevelopment,
    // 'deterministic' results in faster recompilations in cases where a child
    // chunk changes, but the parent chunk does not.
    moduleIds: 'deterministic',
    chunkIds: 'deterministic',
    ...(args.minify ? { minimize: true, minimizer: getMinimizers() } : {}),
    // Make most chunks share a single runtime file, which contains the
    // webpack "runtime". The exception is @lavamoat/snow and all scripts
    // found in the extension manifest; these scripts must be self-contained
    // and cannot share code with other scripts - as the browser extension
    // platform is responsible for loading them and splitting these files
    // would require updating the manifest to include the other chunks.
    runtimeChunk: {
      // casting to string as webpack's types are wrong, `false` is allowed, and
      // is actually the default value.
      name: (chunk) =>
        (manifestPlugin.canBeChunked(chunk) ? 'runtime' : false) as string,
    },
    splitChunks: {
      // Impose a 4MB JS file size limit due to Firefox limitations
      // https://github.com/mozilla/addons-linter/issues/4942
      maxSize: 1 << 22,
      minSize: 1,
      // Optimize duplication and caching by splitting chunks by shared
      // modules and cache group.
      cacheGroups: {
        js: {
          // only our own ts/mts/tsx/js/mjs/jsx files (NOT in node_modules)
          test: /^(?!.*[\\/]node_modules[\\/]).+\.(?:m?[tj]s|[tj]sx?)?$/u,
          name: 'js',
          chunks: isChunkableInitial,
        },
        vendor: {
          // js/mjs files in node_modules or subdirectories of node_modules
          test: /[\\/]node_modules[\\/].*?\.m?js$/u,
          name: 'vendor',
          chunks: isChunkableInitial,
        },
        asyncJs: {
          // only our own ts/mts/tsx/js/mjs/jsx files (NOT in node_modules)
          test: /^(?!.*[\\/]node_modules[\\/]).+\.(?:m?[tj]s|[tj]sx?)?$/u,
          chunks: isChunkableAsync,
          // Avoid minChunks: 1: it creates extra single-use async chunks
          // without reducing the initial entrypoint payload.
          minChunks: 2,
        },
      },
    },
  },
  // don't warn about large JS assets, unless they are going to be too big for Firefox
  performance: { maxAssetSize: 1 << 22 },
  watch: args.watch,
  devServer: getDevServerOptions({
    uiClientRule: {
      include: join(context, 'scripts/load/ui.ts'),
    },
  }),
  watchOptions: {
    aggregateTimeout: 5, // ms
    ignored: NODE_MODULES_RE, // avoid `fs.inotify.max_user_watches` issues
  },
  ignoreWarnings: [
    /the following module ids can't be controlled by policy and must be ignored at runtime/u,
  ],
} as const satisfies Configuration;

export default config;
