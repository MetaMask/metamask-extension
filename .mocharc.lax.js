const baseConfig = require('./.mocharc');

module.exports = Object.assign({}, baseConfig, {
  ignore: [...baseConfig.ignore, './app/scripts/controllers/permissions/*.test.js']
});
