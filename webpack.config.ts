import { join, resolve } from 'node:path';
import webpack, {
  DefinePlugin,
  ProgressPlugin,
  type Configuration,
} from 'webpack';
import sass from 'sass';
import CopyPlugin from 'copy-webpack-plugin';
import HtmlBundlerPlugin from 'html-bundler-webpack-plugin';
import postcssRTLCSS from 'postcss-rtlcss';
import autoprefixer from 'autoprefixer';
import {
  Browser,
  Manifest,
  generateManifest,
  mergeEnv,
  getEntries,
  getLastCommitDatetimeUtc,
  loadBuildTypesConfig
} from './webpack/helpers';
import type { SemVerVersion } from '@metamask/utils';
import { terminalWidth } from 'yargs';
import yargs from 'yargs/yargs';
import { hideBin } from 'yargs/helpers';
import { CodeFenceLoaderOptions } from './webpack/loaders/codeFenceLoader';
import { readFileSync } from 'node:fs';

const builtTypesConfig = loadBuildTypesConfig();
const modeOptions = {
  alias: "m",
  description: "Mode",
  default: "development" as const,
  choices: ["development", "production"] as const,
}
const argv = hideBin(process.argv);
function getMode(){
  const { mode } = yargs(argv)
    .help(false)
    .showHelpOnFail(false)
    .option("mode", modeOptions).parseSync();
    return mode;
}
const allFeatures = Object.keys(builtTypesConfig.features)

const args = yargs(argv)
  .strict()
  .version(false)
  .alias("help", "?")
  .wrap(Math.min(120, terminalWidth()))
  .option("mode", modeOptions)
  .option("watch", {
    alias: "w",
    description: "Run build and watch for files changes.",
    type: "boolean",
    default: false,
  }).option("cache", {
    alias: "c",
    description: "Cache changes for faster rebuilds",
    type: "boolean",
    default: true,
  }).option("progress", {
    alias: "p",
    description: "Show progress",
    type: "boolean",
    default: false,
  }).option("zip", {
    alias: "z",
    description: "Zip",
    type: "boolean",
    default: false,
  }).option("minify", {
    alias: "mi",
    description: "Minify the output",
    type: "boolean",
    default: false,
  }).option("target", {
    alias: "t",
    description: "Target",
    type: "string",
    default: "chrome" as const,
    array: true,
    choices: ["chrome", "firefox"] as const,
  }).option("manifest_version", {
    alias: "mv",
    description: "Manifest Version",
    type: "number",
    default: 2 as const,
    choices: [2, 3] as const,
  }).option("type", {
    alias: "y",
    description: "Build type",
    type: "string",
    default: "main" as const,
    choices: ["none", ...Object.keys(builtTypesConfig.buildTypes)],
  }).option("feature", {
    alias: "f",
    description: "Features you want enabled that are not automatically included in the selected build type",
    array: true,
    type: "string",
    defaultDescription: "all",
    choices: allFeatures,
  }).option("devtool", {
    alias: "d",
    description: "Devtool",
    defaultDescription: 'When mode is `production`, `hidden-source-map`, otherwise `source-map`.',
    default: () => {
      const mode = getMode();
      return mode === "production" ? "hidden-source-map" : "source-map";
    },
    choices: ["source-map", "hidden-source-map"] as const,
    coerce: (arg) => {
      return arg;
    }
  }).option("lavamoat", {
    alias: "l",
    description: "Apply lavamoat to the build assets",
    defaultDescription: 'When mode is `production`, `true`, otherwise `false`.',
    type: "boolean",
    default: () => {
      const mode = getMode();
      return mode === "production";
    },
  }).option("snow", {
    alias: "s",
    description: "Apply Snow to the build assets",
    defaultDescription: 'When mode is `production`, `true`, otherwise `false`.',
    type: "boolean",
    default: () => {
      const mode = getMode();
      return mode === "production";
    },
  })
  .parseSync();

if (args.snow || args.lavamoat) {
  throw new Error("not ready yet");
}

const entry = getEntries(join(__dirname, 'app'));

const { features } = builtTypesConfig.buildTypes[args.type];

// removes fenced code blocks from the source
const codeFenceLoader: webpack.RuleSetRule & { options: CodeFenceLoaderOptions } = {
  loader: require.resolve('./webpack/loaders/codeFenceLoader'),
  options: {
    features: {
      active: new Set(features),
      all: new Set(allFeatures),
    }
  }
};

/**
 * Speedy Web Compiler (swc)
 */
const swcLoader = {
  loader: "swc-loader",
  options: {
    env: {
      targets: readFileSync("./.browserslistrc", "utf-8")
    },
    sourceMaps: true,
    jsc: {
      parser: {
        jsx: true,
      }
    }
  },
};

// TODO: build once, then copy to each browser's folder then update the
// manifests
const BROWSER = Browser.Chrome;

// TODO: make these dynamic. yargs, maybe?
const NAME = 'MetaMask';
const DESCRIPTION = 'MetaMask Chrome Extension';
const MANIFEST_VERSION: Manifest['manifest_version'] = 2;
// TODO: figure out what build.yml's env vars are doing and them do the merge
// stuff.
const ENV = mergeEnv({});

const plugins = [
  new HtmlBundlerPlugin({
    // Disable the HTML preprocessor as we currently use Squirrley in an
    // html-loader instead.
    preprocessor: false
  }),
  new webpack.ProvidePlugin({
    // Make a global `process` variable that points to the `process` package.
    process: 'process/browser',
    // Make a global `Buffer` variable that points to the `buffer` package.
    Buffer: ['buffer', 'Buffer'],
  }),
  new CopyPlugin({
    patterns: [
      { from: 'app/_locales', to: '_locales' },
      { from: 'app/images', to: 'images' },
      { from: "app/vendor/trezor/content-script.js", to: 'vendor/trezor/content-script.js' },
      {
        from: `app/manifest/v${MANIFEST_VERSION}/_base.json`,
        to: 'manifest.json',
        transform: (manifestBytes: Buffer, _path: string) => {
          const baseManifest: Manifest = JSON.parse(
            manifestBytes.toString('utf-8'),
          );
          const browserManifest = generateManifest(baseManifest, {
            mode: args.mode,
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
    Object.entries(ENV).reduce((acc: any, [key, val]) => {
      acc[`process.env.${key}`] = JSON.stringify(val);
      return acc;
    }, {}),
  ),
  new ProgressPlugin()
];

if (args.zip) {
  const { ZipPlugin } = require('./webpack/plugins/ZipPlugin');
  plugins.push(new ZipPlugin({
    outFilePath: '../../../builds/metamask.zip',
    mtime: getLastCommitDatetimeUtc(),
    excludeExtensions: [".map"],
    // `level: 9` is the highest; it may increase build time by ~5% over
    // `level: 0`
    level: 9
  }));
}

const config: Configuration = {
  context: __dirname,
  entry,
  name: `MetaMask Webpack—${args.mode}`,
  watch: args.watch,
  mode: args.mode,

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
      buffer: require.resolve('buffer/'),
      fs: false,

      // #region micro-ftch
      // micro-ftch can't be webpacked without these aliases, as webpack will
      // attempt to load them but micro-ftch doesn't define `browser` compatible
      // fields.
      http: require.resolve('stream-http'),
      https: require.resolve('https-browserify'),
      zlib: false,
      // #endregion micro-ftch
    },
  },

  cache: {
    type: 'filesystem',
    // `cache.name` can be used create separate caches for different build types
    name: 'MetaMask',
    // TODO: instead of `compilerSettings` we should use all of the
    version: JSON.stringify(args),
    buildDependencies: {
      // Invalidates the build cache when the listed files change
      // `__filename` makes all dependencies of *this* file - build dependencies
      config: [__filename],
    },
  },

  output: {
    crossOriginLoading: 'anonymous',
    // chunkFilename is required because in some cases webpack may generate a
    // filename that starts with "_", which chrome does not allow at the root of
    // the extension directory (subdirs are fine). If we switch to
    // `output.module = true` this function be updated to use return an `.mjs`
    //  extension. Alternatively, we could output all js files to a subdir and
    // not worry about it
    chunkFilename: ({ chunk }) => {
      if (chunk!.id?.toString().startsWith('_')) return '-[id].js';
      return '[id].js';
    },
    filename: ({ runtime: name }) => {
      if (name === "contentscript" || name === "inpage") return `[name].js`;
      return '[name].[contenthash].js';
    },
    path: resolve(__dirname, `dist/webpack/${BROWSER}`),
    // Clean the output directory before emit, so that only the latest build
    // files remain. Nearly 0 performance penalty for this clean up step.
    clean: true,
    // relative to HTML page. Thios value is essentially prepended to asset URLs
    // in the output HTML, i.e., `<script src="<publicPath><resourcePath>">`.
    publicPath: '',
  },

  module: {
    // an important note: loaders in a `use` array are applied in *reverse*
    // order, i.e., bottom to top, (or right to left depending on the current
    // formatting of the file)
    rules: [
      // html: use the squirrelly templating engine for html files
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
        use: [
          {
            loader: swcLoader.loader,
            options: {
              sourceMaps: swcLoader.options.sourceMaps,
              env: swcLoader.options.env
            },
          },
          codeFenceLoader,
        ],
      },
      // own javascript, and own javascript with jsx
      {
        test: /\.(js|mjs|jsx)$/u,
        exclude: /node_modules/u,
        use: [
          swcLoader,
          codeFenceLoader,
        ],
      },
      // vendor javascript, and vendor javascript with jsx
      {
        test: /\.(js|mjs|jsx)$/u,
        include: /node_modules/u,
        resolve: {
          // ESM is the worst thing to happen to JavaScript since JavaScript.
          fullySpecified: false,
        },
        use: [
          swcLoader
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
                plugins: [autoprefixer(), postcssRTLCSS()],
              },
            },
          },
          // Compiles Sass to CSS
          {
            loader: 'sass-loader',
            options: {
              sassOptions: {
                // We don't need to specify the charset because the HTML already
                // does and browser's use the HTML's charset for CSS.
                // Additionally, webpack+sass can cause problems with the
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
                implementation: sass,

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
        test: /\.(png|jpe?g|ico|webp|svg|gif|ttf|eot|woff|woff2|wasm)$/u,
        type: 'asset/resource',
        generator: {
          filename: 'assets/[name].[hash:8][ext]',
        },
      },
    ],
  },

  stats: {
    colors: false,
  },

  optimization: {
    // TODO: create one runtime bundle for all chunks, but not for contentscript
    // or inpage.js
    // runtimeChunk: 'single',
    splitChunks: {
      // Impose a 4MB JS file size limit due to Firefox limitations
      // https://github.com/mozilla/addons-linter/issues/4942
      maxSize: 4 * 1024 * 1024,
      minSize: 1,
      // Optimize duplication and caching by splitting chunks by shared modules
      // and cache group.
      cacheGroups: {
        vendor: {
          // js files in node modules or subdirs of node_modules
          test: /[\\/]node_modules[\\/].*?\.[jt]sx?$/,
          name: 'vendors',
          chunks({ name }) {
            return name !== 'inpage' && name !== 'contentscript';
          },
        },
        scripts: {
          test: /(?!.*\/node_modules\/).+\.[jt]sx?$/u,
          name: 'scripts',
          chunks({ name }) {
            return name !== 'inpage' && name !== 'contentscript';
          },
        },
      },
    },
    // 'deterministic'` results in faster recompilations in cases
    // where a child chunk changes, but the parent chunk does not.
    moduleIds: 'deterministic',
    minimize: args.minify,
  },

  devtool: args.devtool,

  plugins
};

// webpack(config, (err, stats) => {
//   if (err || stats!.hasErrors()) {
//     console.log(err);
//     console.log(stats);
//   }
//   console.log("done");
// })

export default config;