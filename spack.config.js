const path = require('path');
const { config } = require('@swc/core/spack')

module.exports = config({
  entry: {
    'main': __dirname + '/app/scripts/background.js',
  },
  output: {
    path: path.join(__dirname, "builds", "background"),
  },
  module: {},
});
