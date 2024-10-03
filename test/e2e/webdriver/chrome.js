const { Builder } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
const { ThenableWebDriver } = require('selenium-webdriver'); // eslint-disable-line no-unused-vars -- this is imported for JSDoc
const { isHeadless } = require('../../helpers/env');

/**
 * Determine the appropriate proxy server value to use
 *
 * @param {string|number} [proxyPort] - The proxy port to use
 * @returns {string} The proxy server address
 */
function getProxyServer(proxyPort) {
  const DEFAULT_PROXY_HOST = '127.0.0.1:8000';
  const { SELENIUM_HTTPS_PROXY } = process.env;
  if (proxyPort) {
    return `127.0.0.1:${proxyPort}`;
  }
  return SELENIUM_HTTPS_PROXY || DEFAULT_PROXY_HOST;
}

/**
 * A wrapper around a {@code WebDriver} instance exposing Chrome-specific functionality
 */
class ChromeDriver {
  static async build({
    openDevToolsForTabs,
    responsive,
    constrainWindowSize,
    port,
    proxyPort,
  }) {
    const args = [
      `--proxy-server=${getProxyServer(proxyPort)}`, // Set proxy in the way that doesn't interfere with Selenium Manager
      '--disable-features=OptimizationGuideModelDownloading,OptimizationHintsFetching,OptimizationTargetPrediction,OptimizationHints,NetworkTimeServiceQuerying', // Stop chrome from calling home so much (auto-downloads of AI models; time sync)
      '--disable-component-update', // Stop chrome from calling home so much (auto-update)
      '--disable-dev-shm-usage',
    ];

    if (process.env.MULTIPROVIDER) {
      args.push(
        `load-extension=${process.cwd()}/dist/chrome,${process.cwd()}/dist/chrome2`,
      );
    } else {
      args.push(`load-extension=${process.cwd()}/dist/chrome`);
    }

    // When "responsive" is enabled, open dev tools to force a smaller viewport
    // The minimum window width on Chrome is too large, this is how we're forcing the viewport to be smaller
    if (openDevToolsForTabs || responsive) {
      args.push('--auto-open-devtools-for-tabs');
    }

    if (constrainWindowSize) {
      args.push('--window-size=320,600');
    }

    args.push('--log-level=3');
    args.push('--enable-logging');

    if (process.env.CI || process.env.CODESPACES) {
      args.push('--disable-gpu');
    }

    if (isHeadless('SELENIUM')) {
      // TODO: Remove notice and consider non-experimental when results are consistent
      console.warn(
        '*** Running e2e tests in headless mode is experimental and some tests are known to fail for unknown reasons',
      );
      args.push('--headless=new');
    }

    const options = new chrome.Options().addArguments(args);
    options.setAcceptInsecureCerts(true);
    options.setUserPreferences({
      'download.default_directory': `${process.cwd()}/test-artifacts/downloads`,
    });

    // Temporarily lock to version 126
    options.setBrowserVersion('126');

    // Allow disabling DoT local testing
    if (process.env.SELENIUM_USE_SYSTEM_DN) {
      options.setLocalState({
        'dns_over_https.mode': 'off',
        'dns_over_https.templates': '',
      });
    }

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
