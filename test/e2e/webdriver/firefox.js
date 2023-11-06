const fs = require('fs');
const os = require('os');
const path = require('path');
const {
  Builder,
  By,
  until,
  ThenableWebDriver, // eslint-disable-line no-unused-vars -- this is imported for JSDoc
} = require('selenium-webdriver');
const firefox = require('selenium-webdriver/firefox');
const proxy = require('selenium-webdriver/proxy');
<<<<<<< HEAD
const { getVersion } = require('../../../development/lib/get-version');
const { BuildType } = require('../../../development/lib/build-type');
=======
const { retry } = require('../../../development/lib/retry');
>>>>>>> upstream/multichain-swaps-controller

/**
 * The prefix for temporary Firefox profiles. All Firefox profiles used for e2e tests
 * will be created as random directories inside this.
 *
 * @type {string}
 */
const TEMP_PROFILE_PATH_PREFIX = path.join(os.tmpdir(), 'MetaMask-Fx-Profile');

/**
 * Proxy host to use for HTTP and HTTPS requests
 *
 * @type {string}
 */
const PROXY_HOST = '127.0.0.1:8000';

/**
 * A wrapper around a {@code WebDriver} instance exposing Firefox-specific functionality
 */
class FirefoxDriver {
  /**
   * Builds a {@link FirefoxDriver} instance
   *
   * @param {Object} options - the options for the build
   * @param options.responsive
   * @param options.port
   * @param options.type
   * @returns {Promise<{driver: !ThenableWebDriver, extensionUrl: string, extensionId: string}>}
   */
  static async build({ responsive, port, type }) {
    const templateProfile = fs.mkdtempSync(TEMP_PROFILE_PATH_PREFIX);
    const options = new firefox.Options().setProfile(templateProfile);
    options.setProxy(proxy.manual({ http: PROXY_HOST, https: PROXY_HOST }));
    options.setAcceptInsecureCerts(true);
    // Proxy localhost on Firefox
    options.setPreference('network.proxy.allow_hijacking_localhost', true);
    const builder = new Builder()
      .forBrowser('firefox')
      .setFirefoxOptions(options);
    if (port) {
      const service = new firefox.ServiceBuilder().setPort(port);
      builder.setFirefoxService(service);
    }
    const driver = builder.build();
    const fxDriver = new FirefoxDriver(driver);

    const version = getVersion(type || BuildType.main, 0);
    let extensionString = `builds/metamask-firefox-${version}.zip`;

    if (type) {
      extensionString = `builds/metamask-${type}-firefox-${version}.zip`;
    }

    const extensionId = await fxDriver.installExtension(extensionString);
    const internalExtensionId = await fxDriver.getInternalId();

    if (responsive) {
      await driver.manage().window().setRect({ width: 320, height: 600 });
    }

    return {
      driver,
      extensionId,
      extensionUrl: `moz-extension://${internalExtensionId}`,
    };
  }

  /**
   * @param {!ThenableWebDriver} driver - a {@code WebDriver} instance
   */
  constructor(driver) {
    this._driver = driver;
  }

  /**
   * Installs the extension at the given path
   *
   * @param {string} addonPath - the path to the unpacked extension or XPI
   * @returns {Promise<string>} the extension ID
   */
  async installExtension(addonPath) {
    return await this._driver.installAddon(addonPath, true);
  }

  /**
   * Returns the Internal UUID for the given extension, with retries
   *
   * @returns {Promise<string>} the Internal UUID for the given extension
   */
  async getInternalId() {
    await this._driver.get('about:debugging#addons');

    // This method with 2 retries to find the UUID seems more stable on local e2e tests
    let uuid;
    await retry({ retries: 2 }, () => (uuid = this._waitOnceForUUID()));

    return uuid;
  }

  /**
   * Waits once to locate the temporary Firefox UUID, can be put in a retry loop
   *
   * @returns {Promise<string>} the UUID for the given extension, or null if not found
   * @private
   */
  async _waitOnceForUUID() {
    const uuidElement = await this._driver.wait(
      until.elementLocated(By.xpath("//dl/div[contains(., 'UUID')]/dd")),
      1000,
    );

    if (uuidElement.getText) {
      return uuidElement.getText();
    }

    return null;
  }
}

module.exports = FirefoxDriver;
