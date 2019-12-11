const { Browser } = require('selenium-webdriver')
const ChromeDriver = require('./chrome')
const FirefoxDriver = require('./firefox')

const buildWebDriver = async function buildWebDriver ({ browser, extensionPath, responsive }) {
  switch (browser) {
    case Browser.CHROME: {
      const { driver, extensionId, extensionUrl } = await ChromeDriver.build({ extensionPath, responsive })

      return {
        driver,
        extensionId,
        extensionUrl,
      }
    }
    case Browser.FIREFOX: {
      const { driver, extensionId, extensionUrl } = await FirefoxDriver.build({ extensionPath, responsive })

      return {
        driver,
        extensionId,
        extensionUrl,
      }
    }
    default: {
      throw new Error(`Unrecognized browser: ${browser}`)
    }
  }
}

module.exports = {
  buildWebDriver,
}
