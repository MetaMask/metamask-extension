const { Builder } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');

/**
 * A wrapper around a {@code WebDriver} instance exposing Chrome-specific functionality
 */
class ChromeDriver {
  static async build({ responsive, port }) {
    const args = ['load-extension=dist/chrome', '--no-sandbox'];
    if (responsive) {
      args.push('--auto-open-devtools-for-tabs');
    }
    const options = new chrome.Options().addArguments(args);
    const builder = new Builder()
      .forBrowser('chrome')
      .setChromeOptions(options);
    const service = new chrome.ServiceBuilder();

    // Enables Chrome logging.
    // Especially useful for discovering why Chrome has crashed, but can also
    // be useful for revealing console errors (from the page or background).
    if (
      process.env.ENABLE_CHROME_LOGGING &&
      process.env.ENABLE_CHROME_LOGGING !== 'false'
    ) {
      service.setStdio('inherit').enableChromeLogging();
    }
    if (port) {
      service.setPort(port);
    }
    builder.setChromeService(service);
    const driver = builder.build();
    const chromeDriver = new ChromeDriver(driver);
    const extensionId = await chromeDriver.getExtensionIdByName('MetaMask');

    return {
      driver,
      extensionUrl: `chrome-extension://${extensionId}`,
    };
  }

  /**
   * @constructor
   * @param {!ThenableWebDriver} driver - a {@code WebDriver} instance
   */
  constructor(driver) {
    this._driver = driver;
  }

  /**
   * Returns the extension ID for the given extension name
   * @param {string} extensionName - the extension name
   * @returns {Promise<string|undefined>} the extension ID
   */
  async getExtensionIdByName(extensionName) {
    await this._driver.get('chrome://extensions');
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
    `);
  }
}

module.exports = ChromeDriver;
