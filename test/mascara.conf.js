const getBaseConfig = require('./base.conf.js')

module.exports = function(config) {
  const settings = getBaseConfig(config)
  settings.files.push('mascara/test/ui-bundle.js')
  settings.files.push('mascara/test/test-bundle.js')
  // settings.files.push('test/integration/bundle.js')
  settings.files.push({ pattern: 'mascara/test/background.js', watched: false, included: false, served: true }),
  // /background.js

  settings.proxies['/background.js'] = '/base/mascara/test/background.js'

  config.set(settings)
}
