const getBaseConfig = require('./base.conf.js')

module.exports = function (config) {
  const settings = getBaseConfig(config)

  // ui and tests
  settings.files.push('dist/mascara/ui.js')
  settings.files.push('dist/mascara/tests.js')
  // service worker background
  settings.files.push({ pattern: 'dist/mascara/background.js', watched: false, included: false, served: true })
  settings.proxies['/background.js'] = '/base/dist/mascara/background.js'

  // use this to keep the browser open for debugging
  settings.browserNoActivityTimeout = 10000000

  config.set(settings)
}
