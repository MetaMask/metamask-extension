const path = require('path');
const { config } = require('@swc/core/spack')

module.exports = config({
  entry: {
    'background': __dirname + '/app/scripts/background.js',
  },
  output: {
    path: path.join(__dirname, "dist", "chrome"),
  },
  module: {},
});
