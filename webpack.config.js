const path = require('path');

module.exports = (async () => {
  const { default: EndoArchivePlugin } = await import('@lavamoat/webpack-plugin-endo-archive');
  return {
    entry: {
      background: './app/scripts/background.js',
      ui: './app/scripts/ui.js',
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
      ],
    },
    plugins: [
      new EndoArchivePlugin(),
    ],
    optimization: {
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
      extensions: ['.tsx', '.ts', '.js'],
      fallback: {
        crypto: require.resolve('crypto-browserify'),
        os: require.resolve('os-browserify/browser'),
        path: require.resolve('path-browserify'),
        stream: require.resolve('stream-browserify'),
        constants: require.resolve('constants-browserify'),
        _stream_transform: require.resolve('readable-stream/transform'),
        vm: require.resolve('vm-browserify'),
      },
    },
    output: {
      filename: '[name].js',
      path: path.resolve(__dirname, 'distro'),
    },
  }
})();
