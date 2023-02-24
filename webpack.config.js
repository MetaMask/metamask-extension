const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const webpack = require('webpack');
const TerserPlugin = require('terser-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'svg'];

const fontExtensions = ['ttf', 'woff', 'woff2', 'eot', 'otf'];

module.exports = {
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
        use: {
          loader: 'babel-loader',
        },
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
  },
  plugins: [
    new CleanWebpackPlugin({ verbose: false }),
    new webpack.ProgressPlugin(),
    new MiniCssExtractPlugin({
      filename: 'styles/[name].css',
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
};
