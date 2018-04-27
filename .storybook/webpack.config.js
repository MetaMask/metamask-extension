const path = require("path");

module.exports = {
  module: {
    rules: [
      {
        test: /\.(woff(2)?|ttf|eot|svg|otf)(\?v=\d+\.\d+\.\d+)?$/,
        loaders: [{
          loader: 'file-loader',
          options: {
            name: '[name].[ext]',
            outputPath: 'fonts/'
          }
        }]
      },
      {
        test: /\.scss$/,
        loaders: [
          'style-loader',
          'css-loader',
          'resolve-url-loader',
          {
            loader:'sass-loader',
            options: {
              sourceMap: true,
            },
          },
        ],
      },
    ]
  },
  resolve: {
    alias: {
      './fonts/Font_Awesome': path.resolve(__dirname, '../fonts/Font_Awesome'),
    }
  }
};
