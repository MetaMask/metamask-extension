const { Builder } = require('selenium-webdriver')
const chrome = require('selenium-webdriver/chrome')

/**
 * A wrapper around a {@code WebDriver} instance exposing Chrome-specific functionality
 */
class ChromeDriver {
  static async build ({ extensionPath, responsive, port }) {
    const args = [`load-extension=${extensionPath}`, '--remote-debugging-port=9222']
    if (responsive) {
      args.push('--auto-open-devtools-for-tabs')
    }
    if (process.env.BUILDKITE === 'true') {
      // fix the DevToolsActivePort file doesn't exist error
      // https://stackoverflow.com/a/50642913/5671288
      // https://github.com/puppeteer/puppeteer/issues/1834
      args.push('--disable-dev-shm-usage')
    }
    const options = new chrome.Options().addArguments(args)
    if (responsive) {
      options.windowSize({ width: 1000, height: 1000 })
    }
    const builder = new Builder().forBrowser('chrome').setChromeOptions(options)
    if (port) {
      const service = new chrome.ServiceBuilder().setPort(port)
      builder.setChromeService(service)
    }
    const driver = builder.build()
    const chromeDriver = new ChromeDriver(driver)
    const extensionId = await chromeDriver.getExtensionIdByName('ConfluxPortal')

    return {
      driver,
      extensionUrl: `chrome-extension://${extensionId}`,
    }
  }

  /**
   * @constructor
   * @param {!ThenableWebDriver} driver - a {@code WebDriver} instance
   */
  constructor (driver) {
    this._driver = driver
  }

  /**
   * Returns the extension ID for the given extension name
   * @param {string} extensionName - the extension name
   * @returns {Promise<string|undefined>} - the extension ID
   */
  async getExtensionIdByName (extensionName) {
    await this._driver.get('chrome://extensions')
    return await this._driver.executeScript(`
      const extensions = document.querySelector("extensions-manager").shadowRoot
        .querySelector("extensions-item-list").shadowRoot
        .querySelectorAll("extensions-item")

      for (let i = 0; i < extensions.length; i++) {
        const extension = extensions[i].shadowRoot
        const name = extension.querySelector('#name').textContent
        if (name === "${extensionName}") {
          return extensions[i].getAttribute("id")
        }
      }

      return undefined
    `)
  }
}

module.exports = ChromeDriver
