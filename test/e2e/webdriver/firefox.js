const fs = require('fs');
const os = require('os');
const path = require('path');
const { Builder, By, until } = require('selenium-webdriver');
const firefox = require('selenium-webdriver/firefox');
const proxy = require('selenium-webdriver/proxy');
const { getVersion } = require('../../../development/lib/get-version');
const { BuildType } = require('../../../development/lib/build-type');

/**
 * The prefix for temporary Firefox profiles. All Firefox profiles used for e2e tests
 * will be created as random directories inside this.
 *
 * @type {string}
 */
const TEMP_PROFILE_PATH_PREFIX = path.join(os.tmpdir(), 'MetaMask-Fx-Profile');

/**
 * Proxy host to use for HTTPS requests
 *
 * @type {string}
 */
const HTTPS_PROXY_HOST = '127.0.0.1:8000';

/**
 * A wrapper around a {@code WebDriver} instance exposing Firefox-specific functionality
 */
class FirefoxDriver {
  /**
   * Builds a {@link FirefoxDriver} instance
   *
   * @param {object} options - the options for the build
   * @param options.responsive
   * @param options.port
   * @param options.type
   * @returns {Promise<{driver: !ThenableWebDriver, extensionUrl: string, extensionId: string}>}
   */
  static async build({ responsive, port, type }) {
    const templateProfile = fs.mkdtempSync(TEMP_PROFILE_PATH_PREFIX);
    const options = new firefox.Options().setProfile(templateProfile);
    options.setProxy(proxy.manual({ https: HTTPS_PROXY_HOST }));
    options.setAcceptInsecureCerts(true);
    options.setPreference('browser.download.folderList', 2);
    options.setPreference(
      'browser.download.dir',
      `${process.cwd()}/test-artifacts/downloads`,
    );
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
   * Returns the Internal UUID for the given extension
   *
   * @returns {Promise<string>} the Internal UUID for the given extension
   */
  async getInternalId() {
    await this._driver.get('about:debugging#addons');
    return await this._driver
      .wait(
        until.elementLocated(By.xpath("//dl/div[contains(., 'UUID')]/dd")),
        1000,
      )
      .getText();
  }
}

module.exports = FirefoxDriver;
