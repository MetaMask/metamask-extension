/**
 * @file The main webpack configuration file for the browser extension.
 */

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { argv, exit } from 'node:process';
import {
  ProvidePlugin,
  type Configuration,
  type WebpackPluginInstance,
  type Chunk,
  type MemoryCacheOptions,
  type FileCacheOptions,
} from 'webpack';
import CopyPlugin from 'copy-webpack-plugin';
import HtmlBundlerPlugin from 'html-bundler-webpack-plugin';
import rtlCss from 'postcss-rtlcss';
import autoprefixer from 'autoprefixer';
import type ReactRefreshPluginType from '@pmmmwh/react-refresh-webpack-plugin';
import { SelfInjectPlugin } from './utils/plugins/SelfInjectPlugin';
import {
  type Manifest,
  collectEntries,
  getMinimizers,
  NODE_MODULES_RE,
  __HMR_READY__,
} from './utils/helpers';
import { transformManifest } from './utils/plugins/ManifestPlugin/helpers';
import { parseArgv, getDryRunMessage } from './utils/cli';
import { getCodeFenceLoader } from './utils/loaders/codeFenceLoader';
import { getSwcLoader } from './utils/loaders/swcLoader';
import { getBuildTypes, getVariables } from './utils/config';
import { ManifestPlugin } from './utils/plugins/ManifestPlugin';
import { getLatestCommit } from './utils/git';

const buildTypes = getBuildTypes();
const { args, cacheKey, features } = parseArgv(argv.slice(2), buildTypes);
if (args.dryRun) {
  console.error(getDryRunMessage(args, features));
  exit(0);
}

// #region short circuit for unsupported build configurations
if (args.lavamoat) {
  throw new Error("The webpack build doesn't support LavaMoat yet. So sorry.");
}
if (args.manifest_version === 3) {
  throw new Error(
    "The webpack build doesn't support manifest_version version 3 yet. So sorry.",
  );
}
// #endregion short circuit for unsupported build configurations

const context = join(__dirname, '../../app');
const isDevelopment = args.env === 'development';
const MANIFEST_VERSION = args.manifest_version;
const manifestPath = join(context, `manifest/v${MANIFEST_VERSION}/_base.json`);
const manifest: Manifest = require(manifestPath);
const { entry, canBeChunked } = collectEntries(manifest, context);
const codeFenceLoader = getCodeFenceLoader(features);
const browsersListPath = join(context, '../.browserslistrc');
// read .browserslist now to stop it from searching for the file over and over
const browsersListQuery = readFileSync(browsersListPath, 'utf8');
const { variables, safeVariables, version } = getVariables(args, buildTypes);
const webAccessibleResources =
  args.devtool === 'source-map'
    ? ['scripts/inpage.js.map', 'scripts/contentscript.js.map']
    : [];

// #region cache
const cache = args.cache
  ? ({
      type: 'filesystem',
      name: `MetaMask—${args.env}`,
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
          join(context, '../.metamaskrc'),
          join(context, '../builds.yml'),
          browsersListPath,
        ],
      },
    } as const satisfies FileCacheOptions)
  : ({ type: 'memory' } as const satisfies MemoryCacheOptions);
// #endregion cache

// #region plugins
const commitHash = isDevelopment ? getLatestCommit().hash() : null;
const plugins: WebpackPluginInstance[] = [
  new SelfInjectPlugin({ test: /^scripts\/inpage\.js$/u }),
  // HtmlBundlerPlugin treats HTML files as entry points
  new HtmlBundlerPlugin({
    preprocessorOptions: { useWith: false },
    minify: args.minify,
    integrity: 'auto',
    test: /\.html$/u, // default is eta/html, we only want html
    data: {
      isMMI: args.type === 'mmi',
      isTest: args.test,
      shouldIncludeSnow: args.snow,
    },
  }),
  new ManifestPlugin({
    web_accessible_resources: webAccessibleResources,
    manifest_version: MANIFEST_VERSION,
    description: commitHash
      ? `${args.env} build from git id: ${commitHash.substring(0, 8)}`
      : null,
    version: version.version,
    versionName: version.versionName,
    browsers: args.browser,
    transform: transformManifest(args),
    zip: args.zip,
    ...(args.zip
      ? {
          zipOptions: {
            outFilePath: `../../builds/metamask-[browser]-${version.versionName}.zip`, // relative to output.path
            mtime: getLatestCommit().timestamp(),
            excludeExtensions: ['.map'],
            // `level: 9` is the highest; it may increase build time by ~5% over level 1
            level: 9,
          },
        }
      : {}),
  }),
  // use ProvidePlugin to polyfill *global* node variables
  new ProvidePlugin({
    // Make a global `Buffer` variable that points to the `buffer` package.
    Buffer: ['buffer', 'Buffer'],
    // Make a global `process` variable that points to the `process` package.
    process: 'process/browser',
    // polyfill usages of `setImmediate`, ideally this would be automatically
    // handled by `swcLoader`'s `env.usage = 'entry'` option, but that setting
    // results in a compilation error: `Module parse failed: 'import' and
    // 'export' may appear only with 'sourceType: module' (2:0)`. I spent a few
    // hours trying to figure it out but couldn't. So, this is the workaround.
    // Note: we should probably remove usages of `setImmediate` from our
    // codebase so we don't have to polyfill it.
    setImmediate: 'core-js-pure/actual/set-immediate',
  }),
  new CopyPlugin({
    patterns: [
      { from: join(context, '_locales'), to: '_locales' }, // translations
      // misc images
      // TODO: fix overlap between this folder and automatically bundled assets
      { from: join(context, 'images'), to: 'images' },
    ],
  }),
];
// enable React Refresh in 'development' mode when `watch` is enabled
if (__HMR_READY__ && isDevelopment && args.watch) {
  const ReactRefreshWebpackPlugin: typeof ReactRefreshPluginType = require('@pmmmwh/react-refresh-webpack-plugin');
  plugins.push(new ReactRefreshWebpackPlugin());
}
if (args.progress) {
  const { ProgressPlugin } = require('webpack');
  plugins.push(new ProgressPlugin());
}
// #endregion plugins

const swcConfig = { args, safeVariables, browsersListQuery, isDevelopment };
const tsxLoader = getSwcLoader('typescript', true, swcConfig);
const jsxLoader = getSwcLoader('ecmascript', true, swcConfig);
const ecmaLoader = getSwcLoader('ecmascript', false, swcConfig);

const config = {
  entry,
  cache,
  plugins,
  context,
  mode: args.env,
  stats: args.stats ? 'normal' : 'none',
  name: `MetaMask – ${args.env}`,
  // use the `.browserlistrc` file directly to avoid browserslist searching
  target: `browserslist:${browsersListPath}:defaults`,
  // TODO: look into using SourceMapDevToolPlugin and its exclude option to speed up the build
  // TODO: put source maps in an upper level directory (like the gulp build does now)
  // see: https://webpack.js.org/plugins/source-map-dev-tool-plugin/#host-source-maps-externally
  devtool: args.devtool === 'none' ? false : args.devtool,
  output: {
    wasmLoading: 'fetch',
    // required for `integrity` to work in the browser
    crossOriginLoading: 'anonymous',
    // filenames for *initial* files (essentially JS entry points)
    filename: '[name].[contenthash].js',
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
      'react-devtools': isDevelopment
        ? require.resolve('react-devtools')
        : false,
      // remove remote-redux-devtools unless METAMASK_DEBUG is enabled
      'remote-redux-devtools': variables.get('METAMASK_DEBUG')
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
    // don't parse lodash, as it's large and already minified
    noParse: /^lodash$/u,
    rules: [
      // json
      { test: /\.json$/u, type: 'json' },
      // own typescript, and own typescript with jsx
      {
        test: /\.(?:ts|mts|tsx)$/u,
        exclude: NODE_MODULES_RE,
        use: [tsxLoader, codeFenceLoader],
      },
      // own javascript, and own javascript with jsx
      {
        test: /\.(?:js|mjs|jsx)$/u,
        exclude: NODE_MODULES_RE,
        use: [jsxLoader, codeFenceLoader],
      },
      // vendor javascript
      {
        test: /\.(?:js|mjs)$/u,
        include: NODE_MODULES_RE,
        // never process `@lavamoat/snow/**.*`
        exclude: /^.*\/node_modules\/@lavamoat\/snow\/.*$/u,
        // can be removed once https://github.com/MetaMask/key-tree/issues/152 is resolved
        resolve: { fullySpecified: false },
        use: ecmaLoader,
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
                plugins: [
                  autoprefixer({ overrideBrowserslist: browsersListQuery }),
                  rtlCss({ processEnv: false }),
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
              sassOptions: {
                api: 'modern',
                // We don't need to specify the charset because the HTML
                // already does and browsers use the HTML's charset for CSS.
                // Additionally, webpack + sass can cause problems with the
                // charset placement, as described here:
                // https://github.com/webpack-contrib/css-loader/issues/1212
                charset: false,
                // The order of includePaths is important; prefer our own
                // folders over `node_modules`
                includePaths: [
                  // enables aliases to `@use design - system`,
                  // `@use utilities`, etc.
                  join(context, '../ui/css'),
                  join(context, '../node_modules'),
                ],
                // Disable the webpackImporter, as we:
                //  a) don't want to rely on it in case we want to switch away
                //     from webpack in the future
                //  b) the sass importer is faster
                //  c) the "modern" sass api doesn't work with the
                //     webpackImporter yet.
                webpackImporter: false,
              },
            },
          },
          codeFenceLoader,
        ],
      },
      // images, fonts, wasm, etc.
      {
        test: /\.(?:png|jpe?g|ico|webp|svg|gif|ttf|eot|woff2?|wasm)$/u,
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
      name: (chunk: Chunk) => (canBeChunked(chunk) ? 'runtime' : false),
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
          test: /(?!.*\/node_modules\/).+\.(?:m?[tj]s|[tj]sx?)?$/u,
          name: 'js',
          chunks: canBeChunked,
        },
        vendor: {
          // js/mjs files in node_modules or subdirectories of node_modules
          test: /[\\/]node_modules[\\/].*?\.m?js$/u,
          name: 'vendor',
          chunks: canBeChunked,
        },
      },
    },
  },
  // don't warn about large JS assets, unless they are going to be too big for Firefox
  performance: { maxAssetSize: 1 << 22 },
  watch: args.watch,
  watchOptions: {
    aggregateTimeout: 5, // ms
    ignored: NODE_MODULES_RE, // avoid `fs.inotify.max_user_watches` issues
  },
} as const satisfies Configuration;

export default config;
