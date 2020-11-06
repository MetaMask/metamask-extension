const fs = require('fs')
const os = require('os')
const path = require('path')
const { Builder, By, until } = require('selenium-webdriver')
const firefox = require('selenium-webdriver/firefox')
const { Command } = require('selenium-webdriver/lib/command')

/**
 * The prefix for temporary Firefox profiles. All Firefox profiles used for e2e tests
 * will be created as random directories inside this.
 * @type {string}
 */
const TEMP_PROFILE_PATH_PREFIX = path.join(os.tmpdir(), 'MetaMask-Fx-Profile')

const GeckoDriverCommand = {
  INSTALL_ADDON: 'install addon',
}

/**
 * A wrapper around a {@code WebDriver} instance exposing Firefox-specific functionality
 */
class FirefoxDriver {
  /**
   * Builds a {@link FirefoxDriver} instance
   * @param {{extensionPath: string}} options - the options for the build
   * @returns {Promise<{driver: !ThenableWebDriver, extensionUrl: string, extensionId: string}>}
   */
  static async build({ extensionPath, responsive, port }) {
    const templateProfile = fs.mkdtempSync(TEMP_PROFILE_PATH_PREFIX)
    const options = new firefox.Options().setProfile(templateProfile)
    const builder = new Builder()
      .forBrowser('firefox')
      .setFirefoxOptions(options)
    if (port) {
      const service = new firefox.ServiceBuilder().setPort(port)
      builder.setFirefoxService(service)
    }
    const driver = builder.build()
    const fxDriver = new FirefoxDriver(driver)

    await fxDriver.init()

    const extensionId = await fxDriver.installExtension(extensionPath)
    const internalExtensionId = await fxDriver.getInternalId()

    if (responsive) {
      await driver.manage().window().setRect({ width: 320, height: 600 })
    }

    return {
      driver,
      extensionId,
      extensionUrl: `moz-extension://${internalExtensionId}`,
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
   * Initializes the driver
   * @returns {Promise<void>}
   */
  async init() {
    await this._driver
      .getExecutor()
      .defineCommand(
        GeckoDriverCommand.INSTALL_ADDON,
        'POST',
        '/session/:sessionId/moz/addon/install',
      )
  }

  /**
   * Installs the extension at the given path
   * @param {string} addonPath - the path to the unpacked extension or XPI
   * @returns {Promise<string>} - the extension ID
   */
  async installExtension(addonPath) {
    const cmd = new Command(GeckoDriverCommand.INSTALL_ADDON)
      .setParameter('path', path.resolve(addonPath))
      .setParameter('temporary', true)

    return await this._driver.execute(cmd)
  }

  /**
   * Returns the Internal UUID for the given extension
   * @returns {Promise<string>} - the Internal UUID for the given extension
   */
  async getInternalId() {
    await this._driver.get('about:debugging#addons')
    return await this._driver
      .wait(
        until.elementLocated(
          By.xpath("//dl/div[contains(., 'Internal UUID')]/dd"),
        ),
        1000,
      )
      .getText()
  }
}

module.exports = FirefoxDriver
