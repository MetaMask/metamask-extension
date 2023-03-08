'use strict';
const { readFileSync } = require('fs');
const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const { CleanWebpackPlugin }  = require('clean-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const Sqrl = require('squirrelly');
const { EnvironmentPlugin, ProgressPlugin } = require('webpack');
const TerserPlugin = require('terser-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const { getEnvironmentVariables } = require('./development/webpack/utils/environment-variables');
const { BuildTarget } = require('./development/webpack/utils/constants');
const app = require('./shared/constants/app');
const { createRemoveFencedCodeTransform } = require('./development/build/transforms/remove-fenced-code.js');
const createStaticAssetTasks = require('./development/build/static.js');
const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'svg'];
const fontExtensions = ['ttf', 'woff', 'woff2', 'eot', 'otf'];
const buildType = app.BuildType.main;
const staticAssetTasks = createStaticAssetTasks({
  buildType,
  browserPlatforms: ['firefox', 'chrome'],
  livereload: false,
  shouldIncludeLockdown: false,
  shouldIncludeSnow: false,
});
console.log('STATIC', staticAssetTasks.copyTargetsProds);
const renderHtmlTemplate = (fileName) => {
  const htmlTemplate = (0, readFileSync)(path.join(__dirname, 'app', fileName), { encoding: 'utf-8' });
  // TODO: inject applyLavaMoat
  return Sqrl.render(htmlTemplate, { jsBundles: [], applyLavaMoat: false });
};
module.exports = async () => ({
  entry: {
    background: './app/scripts/background.js',
    ui: './app/scripts/ui.js',
    contentscript: './app/scripts/contentscript.js',
    'disable-console': './app/scripts/disable-console.js',
  },
  mode: 'production',
  module: {
    rules: [
      {
        test: /\.(jsx|js)$/,
        exclude: /node_modules/,
        use: [
          {
              loader: 'esbuild-loader',
              options: {
                target: 'es2015',
                loader: 'jsx',
              }
          },
        ],
      },
      {
        test: /\.(ts)$/,
        exclude: /node_modules/,
        use: [
          {
            loader: 'esbuild-loader',
            options: {
              target: 'es2015',
              loader: 'ts',
            }
          },
        ],
      },
      {
        test: /\.(tsx)$/,
        exclude: /node_modules/,
        use: [
          {
            loader: 'esbuild-loader',
            options: {
              target: 'es2015',
              loader: 'tsx',
            }
          },
        ],
      },
      {
        // look for .css or .scss files
        test: /\.(css|scss)$/,
        include: /ui/,
        // in the `src` directory
        use: [
          MiniCssExtractPlugin.loader,
          'css-loader',
          'resolve-url-loader',
          {
            loader: 'sass-loader',
            options: {
              sourceMap: true,
              sassOptions: {
                includePaths: ['ui/css'],
              },
            },
          },
        ],
        sideEffects: true,
      },
      {
        test: new RegExp(`.(${fontExtensions.join('|')})$`),
        type: 'asset/resource',
        generator: {
          filename: 'fonts/[name][ext][query]',
        },
        // loader: 'file-loader',
        // options: {
        //   name: '[name].[ext]',
        // },
      },
      {
        test: new RegExp(`.(${imageExtensions.join('|')})$`),
        type: 'asset/resource',
        generator: {
          filename: 'images/[name][ext][query]',
        },
        // loader: 'file-loader',
        // options: {
        //   name: '[name].[ext]',
        // },
      },
      {
        test: /\.(jsx|js|tsx|ts)$/,
        exclude: /node_modules/,
        use: [
          {
            loader: '@mfers/transform-loader',
            options: {
              transform:
              // TODO: inject buildType, shouldLintFenceFiles
              createRemoveFencedCodeTransform(buildType, true)
            },
          },
        ],
      },
    ],
  },
  optimization: {
    minimize: true,
    minimizer: [
      new TerserPlugin({
        extractComments: false,
      }),
    ],
    splitChunks: {
      chunks: 'all',
      minSize: 20000,
      minRemainingSize: 0,
      minChunks: 1,
      maxAsyncRequests: 30,
      maxInitialRequests: 30,
      enforceSizeThreshold: 50000,
      cacheGroups: {
        defaultVendors: {
          test: /[\\/]node_modules[\\/]/,
          priority: -10,
          reuseExistingChunk: true,
        },
        default: {
          minChunks: 2,
          priority: -20,
          reuseExistingChunk: true,
        },
      },
    },
  },
  resolve: {
    extensions: ['.js', '.jsx', '.ts', '.tsx'],
    fallback: {
      crypto: require.resolve('crypto-browserify'),
      os: require.resolve('os-browserify/browser'),
      path: require.resolve('path-browserify'),
      stream: require.resolve('stream-browserify'),
      constants: require.resolve('constants-browserify'),
      _stream_transform: require.resolve('readable-stream/transform'),
      vm: require.resolve('vm-browserify'),
      fs: require.resolve('browserify-fs'),
    },
  },
  output: {
    filename: '[name].js',
    path: path.resolve(__dirname, 'distro'),
    clean: true,
    publicPath: '/static/',
    chunkFilename: '[name]-[id].js',
  },
  plugins: [
    new CleanWebpackPlugin({ verbose: false }),
    new EnvironmentPlugin(await getEnvironmentVariables({
      buildTarget: BuildTarget.test,
      buildType,
      version: '0.0.x',
    })),
    new ProgressPlugin(),
    new MiniCssExtractPlugin({
      filename: 'styles/[name].css',
    }),
    new CopyWebpackPlugin({
      patterns: [
        {
          from: 'node_modules/@metamask/contract-metadata/images',
          to: 'images/contract',
        },
        {
          from: 'app/images',
          to: 'images',
        },
        {
          from: 'app/vendor',
          to: 'vendor',
        },
        {
          from: 'app/_locales',
          to: '_locales',
        },
        {
          from: 'app/loading.html',
          to: 'loading.html',
        },
        {
          from: 'app/scripts/init-globals.js',
          to: 'init-globals.js',
        },
      ],
    }),
    new HtmlWebpackPlugin({
      templateContent: renderHtmlTemplate('background.html'),
      filename: 'background.html',
      chunks: ['background'],
      cache: false,
    }),
    new HtmlWebpackPlugin({
      templateContent: renderHtmlTemplate('home.html'),
      filename: 'home.html',
      chunks: ['ui'],
      cache: false,
    }),
    new HtmlWebpackPlugin({
      templateContent: renderHtmlTemplate('popup.html'),
      filename: 'popup.html',
      chunks: ['ui'],
      cache: false,
    }),
    new HtmlWebpackPlugin({
      templateContent: renderHtmlTemplate('notification.html'),
      filename: 'notification.html',
      chunks: ['ui'],
      cache: false,
    }),
  ],
});
