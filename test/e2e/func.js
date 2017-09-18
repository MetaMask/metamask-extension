const webdriver = require('selenium-webdriver')

exports.delay = function delay (time) {
  return new Promise(resolve => setTimeout(resolve, time))
}


exports.buildWebDriver = function buildWebDriver (extPath) {
  return new webdriver.Builder()
    .withCapabilities({
      chromeOptions: {
        args: [`load-extension=${extPath}`],
      },
    })
    .forBrowser('chrome')
    .build()
}
