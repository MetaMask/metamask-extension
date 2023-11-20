const { Builder } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
const { ThenableWebDriver } = require('selenium-webdriver'); // eslint-disable-line no-unused-vars -- this is imported for JSDoc

/**
 * Proxy host to use for HTTPS requests
 *
 * @type {string}
 */
const HTTPS_PROXY_HOST = '127.0.0.1:8000';

/**
 * A wrapper around a {@code WebDriver} instance exposing Chrome-specific functionality
 */
class ChromeDriver {
  static async build({ openDevToolsForTabs, port }) {
    const args = [
      `load-extension=${process.cwd()}/dist/chrome`,
      `--proxy-server=${HTTPS_PROXY_HOST}`, // Set proxy in the way that doesn't interfere with Selenium Manager
    ];
    if (openDevToolsForTabs) {
      args.push('--auto-open-devtools-for-tabs');
    }

    if (process.env.ENABLE_MV3) {
      args.push('--log-level=0');
      args.push('--enable-logging');
      args.push(`--user-data-dir=${process.cwd()}/test-artifacts/chrome`);
    } else {
      args.push('--log-level=3');
    }
    const options = new chrome.Options().addArguments(args);
    options.setAcceptInsecureCerts(true);
    options.setUserPreferences({
      'download.default_directory': `${process.cwd()}/test-artifacts/downloads`,
    });
    const builder = new Builder()
      .forBrowser('chrome')
      .setChromeOptions(options);
    const service = new chrome.ServiceBuilder();

    // Enables Chrome logging. Default: enabled
    // Especially useful for discovering why Chrome has crashed, but can also
    // be useful for revealing console errors (from the page or background).
    if (process.env.ENABLE_CHROME_LOGGING !== 'false') {
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
   * @param {!ThenableWebDriver} driver - a {@code WebDriver} instance
   */
  constructor(driver) {
    this._driver = driver;
  }

  /**
   * Returns the extension ID for the given extension name
   *
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
        if (name.startsWith("${extensionName}")) {
          return extensions[i].getAttribute("id")
        }
      }

      return undefined
    `);
  }
}

module.exports = ChromeDriver;
