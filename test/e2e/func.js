require('chromedriver')
require('geckodriver')
const webdriver = require('selenium-webdriver')

exports.delay = function delay (time) {
  return new Promise(resolve => setTimeout(resolve, time))
}


exports.buildChromeWebDriver = function buildChromeWebDriver (extPath) {
  return new webdriver.Builder()
    .withCapabilities({
      chromeOptions: {
        args: [`load-extension=${extPath}`],
      },
    })
    .build()
}

exports.buildFirefoxWebdriver = function buildFirefoxWebdriver (extPath) {
  return new webdriver.Builder().build()
}
