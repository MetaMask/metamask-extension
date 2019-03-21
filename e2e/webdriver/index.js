const {Browser} = require('selenium-webdriver')
const Driver = require('./driver')
const ChromeDriver = require('./chrome')
const FirefoxDriver = require('./firefox')

const buildWebDriver = async function buildWebDriver ({appId, browser, extensionPath}) {
  switch (browser) {
    case Browser.CHROME: {
      const {driver, extensionId, extensionUrl} = await ChromeDriver.build({extensionPath})

      return {
        driver,
        extensionId,
        extensionUrl,
      }
    }
    case Browser.FIREFOX: {
      const {driver, extensionId, extensionUrl} = await FirefoxDriver.build({extensionPath})

      return {
        driver,
        extensionId,
        extensionUrl,
      }
    }
  }
}

module.exports = {
  buildWebDriver,
  Driver,
  FirefoxDriver,
}
