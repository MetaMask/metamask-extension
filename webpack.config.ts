import { readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import webpack, {
  type Configuration,
  type WebpackPluginInstance,
  DefinePlugin,
  ProvidePlugin,
} from 'webpack';
import CopyPlugin from 'copy-webpack-plugin';
import HtmlBundlerPlugin from 'html-bundler-webpack-plugin';
import postcssRtlCss from 'postcss-rtlcss';
import autoprefixer from 'autoprefixer';
import type WebpackDevServerType from 'webpack-dev-server';
import type ReactRefreshPluginType from '@pmmmwh/react-refresh-webpack-plugin';
import { type SemVerVersion } from '@metamask/utils';
import {
  type Browser,
  type Manifest,
  generateManifest,
  mergeEnv,
  combineEntriesFromManifestAndDir,
  getLastCommitDateTimeUtc,
  getMinimizers,
} from './webpack/helpers';
import { parseArgv } from './webpack/cli';
import { type CodeFenceLoaderOptions } from './webpack/loaders/codeFenceLoader';
import { type SwcLoaderOptions } from './webpack/loaders/swcLoader';

// HMR can't be used until all circular dependencies in the codebase are removed
// see:  https://github.com/MetaMask/metamask-extension/issues/22450
// TODO: remove this variable when HMR is ready
const HMR_READY = false;

const { config, features } = parseArgv(process.argv.slice(2));

if (config.snow || config.lavamoat) {
  throw new Error(
    "The webpack build doesn't support LavaMoat or Snow yet. So sorry.",
  );
}

if (config.browser.length > 1) {
  throw new Error(
    `The webpack build doesn't support multiple browsers yet. So sorry.`,
  );
}

if (config.manifest_version === 3) {
  throw new Error(
    "The webpack build doesn't support manifest_version 3 yet. So sorry.",
  );
}

const dir = join(__dirname, 'app');

const MANIFEST_VERSION = config.manifest_version;
const baseManifest: Manifest = JSON.parse(
  readFileSync(join(dir, `manifest/v${MANIFEST_VERSION}/_base.json`)).toString("utf-8"),
);
const { entry, scripts } = combineEntriesFromManifestAndDir(baseManifest, dir);

// removes fenced code blocks from the source
const codeFenceLoader: webpack.RuleSetRule & {
  options: CodeFenceLoaderOptions;
} = {
  loader: require.resolve('./webpack/loaders/codeFenceLoader'),
  options: {
    features,
  },
};

/**
 * Gets the Speedy Web Compiler (SWC) loader for the given syntax.
 *
 * @param syntax
 * @param enableJsx
 * @param config
 * @returns
 */
function getSwcLoader(
  syntax: 'typescript' | 'ecmascript',
  enableJsx: boolean,
  config: ReturnType<typeof parseArgv>['config'],
) {
  return {
    loader: require.resolve('webpack/loaders/swcLoader'),
    options: {
      env: {
        targets: readFileSync('./.browserslistrc', 'utf-8'),
      },
      jsc: {
        transform: {
          react: {
            development: config.env === 'development',
            refresh: HMR_READY && config.env === 'development' && config.watch,
          },
        },
        parser:
          syntax === 'typescript'
            ? {
              syntax,
              tsx: enableJsx,
            }
            : {
              syntax,
              jsx: enableJsx,
            },
      },
    } as const satisfies SwcLoaderOptions,
  };
}

// TODO: build once, then copy to each browser's folder then update the
// manifests
const BROWSER = config.browser[0] as Browser;

// TODO: make these dynamic. yargs, maybe?
const NAME = 'MetaMask';
const DESCRIPTION = `MetaMask ${BROWSER} Extension`;
// TODO: figure out what build.yml's env vars are doing and them do the merge
// stuff.
const ENV = mergeEnv({});

const plugins: WebpackPluginInstance[] = [
  new HtmlBundlerPlugin({
    // Disable the HTML preprocessor as we currently use Squirrley in an
    // html-loader instead.
    preprocessor: false,
  }),
  new ProvidePlugin({
    // Make a global `process` variable that points to the `process` package.
    process: 'process/browser',
    // Make a global `Buffer` variable that points to the `buffer` package.
    Buffer: ['buffer', 'Buffer'],
  }),
  new CopyPlugin({
    patterns: [
      { from: 'app/_locales', to: '_locales' },
      { from: 'app/images', to: 'images' },
      {
        from: `app/manifest/v${MANIFEST_VERSION}/_base.json`,
        to: 'manifest.json',
        transform: (manifestBytes: Buffer, _path: string) => {
          const baseManifest: Manifest = JSON.parse(
            manifestBytes.toString('utf-8'),
          );
          const browserManifest = generateManifest(baseManifest, {
            env: config.env,
            browser: BROWSER,
            description: DESCRIPTION,
            name: NAME,
            version: ENV.METAMASK_VERSION as SemVerVersion,
          });
          return JSON.stringify(browserManifest, null, 2);
        },
      },
    ],
  }),
  new DefinePlugin(
    // replace `process.env.*` with the values from `ENV`
    Object.entries(ENV).reduce((acc: Record<string, string>, [key, val]) => {
      acc[`process.env.${key}`] = JSON.stringify(val);
      return acc;
    }, {}),
  ),
];

// enable React Refresh in 'development' mode when `watch` is enabled
if (HMR_READY && config.env === 'development' && config.watch) {
  const ReactRefreshWebpackPlugin: typeof ReactRefreshPluginType = require('@pmmmwh/react-refresh-webpack-plugin');
  plugins.push(new ReactRefreshWebpackPlugin());
}

// enable the Progress plugin
if (config.progress) {
  const { ProgressPlugin } = require('webpack');
  plugins.push(new ProgressPlugin());
}

if (config.zip) {
  const { ZipPlugin } = require('./webpack/plugins/ZipPlugin');
  plugins.push(
    new ZipPlugin({
      outFilePath: '../../../builds/metamask.zip',
      mtime: getLastCommitDateTimeUtc(),
      excludeExtensions: ['.map'],
      // `level: 9` is the highest; it may increase build time by ~5% over
      // `level: 0`
      level: 9,
    }),
  );
}

const webpackOptions = {
  context: __dirname,
  entry,
  name: `MetaMask Webpack—${config.env}`,
  mode: config.env,
  watch: config.watch,

  // eventually we should avoid any code that uses node globals.
  node: {
    __dirname: 'warn-mock',
    __filename: 'warn-mock',
    // in the future we don't want to polyfill a node globals, when a browser
    // version `globalThis` already exists.
    global: true,
  },

  // use the `.browserlistrc` file to determine target support for webpack's
  // "runtime" code
  target: 'browserslist',

  resolve: {
    // Disable symlinks for performance (saves about 0.5 seconds form full
    // build)
    symlinks: false,

    // Extensions added to the request when trying to find the file. Most common
    // extensions should be list first to increase resolution performance.
    extensions: ['.ts', '.tsx', '.js', '.jsx'],

    // use `fallback` to redirect module requests when normal resolving fails,
    // good for polyfilling built-in node modules that aren't available in the
    // browser. The browser will first attempt to load these modules, if it
    // fails it will load the fallback.
    fallback: {
      // #region node polyfills
      stream: require.resolve('stream-browserify'),
      path: require.resolve('path-browserify'),
      vm: require.resolve('vm-browserify'),
      os: require.resolve('os-browserify/browser'),
      crypto: require.resolve('./webpack/polyfills/browser-crypto'),
      // #endregion node polyfills
    },

    // use `alias` when we want to replace a module with something different,
    // or when we just don't want to have to use the actual path to the module.
    // (please don't abuse alias, just use relative paths as God intended)
    alias: {
      buffer$: require.resolve('buffer/'),
      fs$: false,

      // #region micro-ftch
      // micro-ftch can't be webpacked without these aliases, as webpack will
      // attempt to load them but micro-ftch doesn't define `browser` compatible
      // fields.
      http$: require.resolve('stream-http'),
      https$: require.resolve('https-browserify'),
      zlib$: false,
      // #endregion micro-ftch
      // remove react-devtools in production builds
      'react-devtools$':
        config.env === 'production' ? false : 'react-devtools',
      // remove remote-redux-devtools unless METAMASK_DEBUG is enabled
      'remote-redux-devtools$': !ENV.METAMASK_DEBUG
        ? false
        : 'remote-redux-devtools',
      // #region remove developer tooling in production builds
    },
  },

  cache: {
    // TODO: cache.name (and version, actually) could be used create separate
    // caches for different build types. Should we use these?
    // name: ???,
    version: process.argv.join(' '),

    allowCollectingMemory: true,
    type: 'filesystem',
    name: 'MetaMask',
    buildDependencies: {
      // Invalidates the build cache when the listed files change
      // `__filename` makes all dependencies of *this* file - build dependencies
      config: [__filename],
    },
  },

  output: {
    crossOriginLoading: 'anonymous',
    // filenames for *initial* files (essentially JS entry points)
    filename: '[name].[contenthash].js',
    // chunkFilename is used because in some cases webpack may generate a
    // filename that starts with "_", which chrome does not allow at the root of
    // the extension directory (subdirectories are fine). If we switch to
    // `output.module = true` this function must be updated to use return an
    // `.mjs` extension. Alternatively, we could output all js files to a
    // subdirectory and not have to worry about it.
    chunkFilename: ({ chunk }) => {
      if (chunk!.id?.toString().startsWith('_')) {
        return '-[id].[contenthash].js';
      }
      return '[id].[contenthash].js';
    },

    path: resolve(__dirname, `dist/webpack/${BROWSER}`),
    // Clean the output directory before emit, so that only the latest build
    // files remain. Nearly 0 performance penalty for this clean up step.
    clean: true,
    // relative to HTML page. This value is essentially prepended to asset URLs
    // in the output HTML, i.e., `<script src="<publicPath><resourcePath>">`.
    publicPath: '',
  },

  module: {
    // an important note: loaders in a `use` array are applied in *reverse*
    // order, i.e., bottom to top, (or right to left depending on the current
    // formatting of the file)
    rules: [
      // html: use the squirrelly template engine for html files
      {
        test: /\.html?$/u,
        loader: require.resolve('./webpack/loaders/squirrellyHtmlLoader'),
        options: {
          isMMI: false,
        },
      },
      // json
      { test: /\.json$/u, type: 'json' },
      // own typescript, and own typescript with jsx
      {
        test: /\.(ts|mts|tsx)$/u,
        exclude: /node_modules/u,
        use: [getSwcLoader('typescript', true, config), codeFenceLoader],
      },
      // own javascript, and own javascript with jsx
      {
        test: /\.(js|mjs|jsx)$/u,
        exclude: /node_modules/u,
        use: [getSwcLoader('ecmascript', true, config), codeFenceLoader],
      },
      // vendor javascript
      {
        test: /\.(js|mjs)$/u,
        include: /node_modules/u,
        resolve: {
          // ESM is the worst thing to happen to JavaScript since JavaScript.
          fullySpecified: false,
        },
        use: [getSwcLoader('ecmascript', false, config)],
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
                plugins: [autoprefixer(), postcssRtlCss()],
              },
            },
          },
          // Compiles Sass to CSS
          {
            loader: 'sass-loader',
            options: {
              sassOptions: {
                // We don't need to specify the charset because the HTML already
                // does and browsers use the HTML's charset for CSS.
                // Additionally, webpack + sass can cause problems with the
                // charset placement, as described here:
                // https://github.com/webpack-contrib/css-loader/issues/1212
                charset: false,

                // Use the "legacy" api, as the "modern" one doesn't work in
                // sass-loader
                // see: https://github.com/webpack-contrib/sass-loader/issues/774#issuecomment-1847869983
                api: 'legacy',

                // Disable the webpackImporter, as we:
                //  a) don't want to rely on it in case we want to switch in the future
                //  b) the sass importer is faster
                //  c) the "modern" sass api doesn't work with the
                //     webpackImporter, but we switch to "modern" before it is
                //     supported it'd be nice to not have to finagle things.
                webpackImporter: false,

                // Explicitly set the implementation to `sass` to prevent
                // accidentally using the `node-sass` package (it's outdated),
                // which is possible if `sass` is uninstalled, as `sass-loader`
                // will use `node-sass` if `sass` isn't found.
                // Once https://github.com/sass/sass/issues/3296 is implemented
                // we should see an improvement by switching to sass-embedded.
                implementation: 'sass',

                // The order of includePaths is important; prefer our own
                // folders over `node_modules`
                includePaths: [
                  // enables aliases to `@use design-system`, `@use utilities`,
                  // etc.
                  './ui/css',
                  './node_modules',
                ],
              },
            },
          },
          codeFenceLoader,
        ],
      },
      // images, fonts, wasm, etc.
      {
        test: /\.(png|jpe?g|ico|webp|svg|gif|ttf|eot|woff|woff2)$/u,
        type: 'asset/resource',
        generator: {
          filename: 'assets/[name].[hash:8][ext]',
        },
      },
      {
        test: /\.wasm$/,
        type: 'asset/resource',
      },
    ],
  },

  experiments: {
    layers: true
  },

  stats: {
    colors: false,
  },

  optimization: {
    // only enable sideEffects, providedExports, and removeAvailableModules for
    // production, as these options slow down the build
    sideEffects: config.env === 'production',
    providedExports: config.env === 'production',
    removeAvailableModules: config.env === 'production',
    usedExports: config.env === 'production',

    // 'deterministic' results in faster recompilations in cases where a child
    // chunk changes, but the parent chunk does not.
    moduleIds: 'deterministic',
    minimize: config.minify,
    minimizer: config.minify ? getMinimizers() : [],

    // TODO: create one runtime bundle for all chunks, but not for
    // scripts/contentscript.js, scripts/inpage.js, etc.
    // runtimeChunk: 'single',
    splitChunks: {
      // Impose a 4MB JS file size limit due to Firefox limitations
      // https://github.com/mozilla/addons-linter/issues/4942
      maxSize: 4 * 1024 * 1024,
      minSize: 1,
      // Optimize duplication and caching by splitting chunks by shared modules
      // and cache group.
      cacheGroups: {
        js: {
          // only our own ts/js files
          test: /(?!.*\/node_modules\/).+\.[jt]sx?$/u,
          name: 'js',
          // ignore scripts that were found in the manifest, as these
          // are always loaded by the browser extension platform
          chunks: ({ name }) => !name || !scripts.includes(name),
        },
        vendor: {
          // ts/js files in node modules or subdirectories of node_modules
          test: /[\\/]node_modules[\\/].*?\.[jt]sx?$/,
          name: 'vendor',
          // ignore scripts that were found in the manifest, as these
          // are always loaded by the browser extension platform
          chunks: ({ name }) => !name || !scripts.includes(name),
        },
      },
    },
  },

  devtool: config.devtool === 'none' ? false : config.devtool,

  plugins,
} as const satisfies Configuration;

if (HMR_READY && config.watch) {
  // Use `webpack-dev-server` to enable HMR
  const WebpackDevServer: typeof WebpackDevServerType = require('webpack-dev-server');
  const options = {
    hot: config.env === 'development',
    liveReload: config.env === 'development',
    server: {
      // TODO: is there any benefit to using https?
      type: 'https',
    },
    // always use loopback, as 0.0.0.0 tends to fail on some machines
    host: 'localhost',
    devMiddleware: {
      // the extension cannot be served from memory, so we need to write files
      // to disk
      writeToDisk: true,
    },
    // we don't need/have a "static" directory, so disable it
    static: false,
    allowedHosts: 'all',
  } as const satisfies WebpackDevServerType.Configuration;

  const server = new WebpackDevServer(options, webpack(webpackOptions));
  server.start();
} else {
  console.log('🦊 Running build…');
  webpack(webpackOptions, (err, stats) => {
    err && console.error(err);
    stats && console.log(stats.toString({ colors: true }));
    if (config.watch) {
      console.log('🦊 Watching for changes…');
    }
  });
}
