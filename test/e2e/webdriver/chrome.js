const { Builder } = require('selenium-webdriver')
const chrome = require('selenium-webdriver/chrome')

/**
 * A wrapper around a {@code WebDriver} instance exposing Chrome-specific functionality
 */
class ChromeDriver {
  static async build({ extensionPath, responsive, port }) {
    const args = [`load-extension=${extensionPath}`]
    if (responsive) {
      args.push('--auto-open-devtools-for-tabs')
    }
    const options = new chrome.Options().addArguments(args)
    const builder = new Builder().forBrowser('chrome').setChromeOptions(options)
    if (port) {
      const service = new chrome.ServiceBuilder().setPort(port)
      builder.setChromeService(service)
    }
    const driver = builder.build()
    const chromeDriver = new ChromeDriver(driver)
    const extensionId = await chromeDriver.getExtensionIdByName('MetaMask')

    return {
      driver,
      extensionUrl: `chrome-extension://${extensionId}`,
    }
  }

  /**
   * @constructor
   * @param {!ThenableWebDriver} driver - a {@code WebDriver} instance
   */
  constructor(driver) {
    this._driver = driver
  }

  /**
   * Returns the extension ID for the given extension name
   * @param {string} extensionName - the extension name
   * @returns {Promise<string|undefined>} - the extension ID
   */
  async getExtensionIdByName(extensionName) {
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
