const fs = require('fs')
const os = require('os')
const path = require('path')
const {Builder, By} = require('selenium-webdriver')
const firefox = require('selenium-webdriver/firefox')
const {Command} = require('selenium-webdriver/lib/command')

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
   * @param {{extensionPath: string}} options the options for the build
   * @return {Promise<{driver: !ThenableWebDriver, extensionUrl: string, extensionId: string}>}
   */
  static async build ({extensionPath}) {
    const templateProfile = fs.mkdtempSync(TEMP_PROFILE_PATH_PREFIX)
    const profile = new firefox.Profile(templateProfile)
    const options = new firefox.Options()
      .setProfile(profile)
    const driver = new Builder()
      .forBrowser('firefox')
      .setFirefoxOptions(options)
      .build()
    const fxDriver = new FirefoxDriver(driver)

    await fxDriver.init()

    const extensionId = await fxDriver.installExtension(extensionPath)
    const internalExtensionId = await fxDriver.getInternalId(extensionId)

    return {
      driver,
      extensionId,
      extensionUrl: `moz-extension://${internalExtensionId}/home.html`,
    }
  }

  /**
   * @constructor
   * @param {!ThenableWebDriver} driver a {@code WebDriver} instance
   */
  constructor (driver) {
    this._driver = driver
  }

  /**
   * Initializes the driver
   * @return {Promise<void>}
   */
  async init () {
    await this._driver.getExecutor()
      .defineCommand(
        GeckoDriverCommand.INSTALL_ADDON,
        'POST',
        '/session/:sessionId/moz/addon/install',
      )
  }

  /**
   * Installs the extension at the given path
   * @param {string} addonPath the path to the unpacked extension or XPI
   * @return {Promise<string>} the extension ID
   */
  async installExtension (addonPath) {
    const cmd = new Command(GeckoDriverCommand.INSTALL_ADDON)
      .setParameter('path', path.resolve(addonPath))
      .setParameter('temporary', true)

    return await this._driver.schedule(cmd)
  }

  /**
   * Returns the Internal UUID for the given extension
   * @param {string} addonId the Extension ID
   * @return {Promise<string>} the Internal UUID for the given extension
   */
  async getInternalId (addonId) {
    await this._driver.get('about:debugging')
    const selector = `#temporary-extensions li[data-addon-id="${addonId}"] dd.internal-uuid span:first-of-type`
    return await this._driver.findElement(By.css(selector)).getText()
  }
}

module.exports = FirefoxDriver
