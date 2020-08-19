const path = require('path')

const CopyWebpackPlugin = require('copy-webpack-plugin')

module.exports = {
  module: {
    strictExportPresence: true,
    rules: [
      {
        test: /\.scss$/,
        loaders: [
          'style-loader',
          {
            loader: 'css-loader',
            options: {
              import: false,
              url: false,
            },
          },
          'resolve-url-loader',
          {
            loader: 'sass-loader',
            options: {
              sourceMap: true,
            },
          },
        ],
      },
    ],
  },
  plugins: [
    new CopyWebpackPlugin({
      patterns: [
        {
          from: path.join('node_modules', '@fortawesome', 'fontawesome-free', 'webfonts'),
          to: path.join('fonts', 'fontawesome'),
        },
      ],
    }),
  ],
}
