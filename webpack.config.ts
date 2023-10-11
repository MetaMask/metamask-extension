import path from 'path';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import { CleanWebpackPlugin } from 'clean-webpack-plugin';
import CopyWebpackPlugin from 'copy-webpack-plugin';
import { EnvironmentPlugin, ProgressPlugin } from 'webpack';
import TerserPlugin from 'terser-webpack-plugin';
import MiniCssExtractPlugin from 'mini-css-extract-plugin';
import { getEnvironmentVariables } from './development/webpack/utils/environment-variables';
import { BuildTarget } from './development/webpack/utils/constants';
import { BuildType } from './shared/constants/app';

const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'svg'];

const fontExtensions = ['ttf', 'woff', 'woff2', 'eot', 'otf'];

const removeBuildTypes = ['flask', 'beta', 'desktop'];

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
        test: /\.(js|tsx|ts)$/,
        exclude: /node_modules/,
        use: [
          {
            loader: 'babel-loader',
          },
          {
            loader: 'webpack-remove-code-blocks',
            options: {
              blocks: [
                ...removeBuildTypes.map((buildType) => ({
                  start: `BEGIN:ONLY_INCLUDE_IN\\(${buildType}\\)`,
                  end: 'END:ONLY_INCLUDE_IN',
                  prefix: '///:',
                })),
                ...removeBuildTypes.flatMap((buildType, i) =>
                  removeBuildTypes.slice(i + 1).map((buildTypeTwo) => ({
                    start: `BEGIN:ONLY_INCLUDE_IN\\(${buildType},${buildTypeTwo}\\)`,
                    end: 'END:ONLY_INCLUDE_IN',
                    prefix: '///:',
                  })),
                ),
              ],
            },
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
    new EnvironmentPlugin(
      await getEnvironmentVariables({
        buildTarget: BuildTarget.test,
        buildType: BuildType.main,
        version: '0.0.x',
      }),
    ),
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
      template: path.join(__dirname, 'app', 'background.html'),
      filename: 'background.html',
      chunks: ['background'],
      cache: false,
    }),
    new HtmlWebpackPlugin({
      template: path.join(__dirname, 'app', 'popup.html'),
      filename: 'popup.html',
      chunks: ['ui'],
      cache: false,
    }),
    new HtmlWebpackPlugin({
      template: path.join(__dirname, 'app', 'notification.html'),
      filename: 'notification.html',
      chunks: ['ui'],
      cache: false,
    }),
  ],
});
