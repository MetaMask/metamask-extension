const getBaseConfig = require('./base.conf.js')

module.exports = function (config) {
  const settings = getBaseConfig(config)
  settings.files.push('development/bundle.js')
  settings.files.push('test/integration/bundle.js')
  config.set(settings)
}
