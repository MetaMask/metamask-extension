const { execFileSync } = require('child_process');
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
const { retry } = require('../../../development/lib/retry');
const { isHeadless } = require('../../helpers/env');
const { getOrBuildXpi } = require('../helpers/xpi');

// geckodriver 0.37.0 breaks some e2e tests as the dapp can't detect the wallet.
// We pin the version as a temporary patch until migration to Playwright (in progress)
// See: https://github.com/mozilla/geckodriver/releases/tag/v0.37.0
const PINNED_GECKODRIVER_VERSION = '0.36.0';

/**
 * Resolve the geckodriver binary to use.
 *
 * Resolution order:
 * 1. `GECKODRIVER_PATH` env var, if set. CI sets this explicitly via the
 *    "Pin geckodriver" step in `.github/workflows/run-e2e.yml` (also usable as
 *    a manual override to test a different driver version).
 * 2. The pinned {@link PINNED_GECKODRIVER_VERSION}, resolved (and downloaded +
 *    cached cross-platform) via the `selenium-manager` binary that ships with
 *    `selenium-webdriver`. This is the fallback that fixes local runs without
 *    requiring any env var.
 * 3. `undefined` on failure, so Selenium Manager falls back to its default
 *    auto-resolution rather than hard-failing.
 *
 * @returns {string|undefined} Absolute path to the geckodriver binary, or
 * `undefined` to defer to Selenium Manager's default resolution.
 */
function resolveGeckodriverPath() {
  if (process.env.GECKODRIVER_PATH) {
    return process.env.GECKODRIVER_PATH;
  }

  try {
    const platform =
      // eslint-disable-next-line no-nested-ternary
      process.platform === 'darwin'
        ? 'macos'
        : process.platform === 'win32'
          ? 'windows'
          : 'linux';
    const binName =
      process.platform === 'win32'
        ? 'selenium-manager.exe'
        : 'selenium-manager';
    const seleniumManager = path.join(
      path.dirname(require.resolve('selenium-webdriver')),
      'bin',
      platform,
      binName,
    );

    const output = execFileSync(
      seleniumManager,
      [
        '--driver',
        'geckodriver',
        '--driver-version',
        PINNED_GECKODRIVER_VERSION,
        '--output',
        'json',
      ],
      { encoding: 'utf8' },
    );

    const { result } = JSON.parse(output);
    return result?.driver_path || undefined;
  } catch (error) {
    console.warn(
      `Could not resolve pinned geckodriver ${PINNED_GECKODRIVER_VERSION}; ` +
        `falling back to Selenium Manager's default driver resolution. ${error}`,
    );
    return undefined;
  }
}

/**
 * The prefix for temporary Firefox profiles. All Firefox profiles used for e2e tests
 * will be created as random directories inside this.
 *
 * @type {string}
 */
const TEMP_PROFILE_PATH_PREFIX = path.join(os.tmpdir(), 'MetaMask-Fx-Profile');

/**
 * Determine the appropriate proxy server value to use
 *
 * @param {string|number} [proxyPort] - The proxy port to use
 * @returns {string} The proxy server URL
 */
function getProxyServerURL(proxyPort) {
  const DEFAULT_PROXY_HOST = 'http://127.0.0.1:8000';
  const { SELENIUM_HTTPS_PROXY } = process.env;

  if (proxyPort) {
    return new URL(`http://127.0.0.1:${proxyPort}`);
  }
  return new URL(SELENIUM_HTTPS_PROXY || DEFAULT_PROXY_HOST);
}

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
   * @param options.constrainWindowSize
   * @param options.proxyPort
   * @returns {Promise<{driver: !ThenableWebDriver, extensionUrl: string, extensionId: string}>}
   */
  static async build({ responsive, port, constrainWindowSize, proxyPort }) {
    const templateProfile = fs.mkdtempSync(TEMP_PROFILE_PATH_PREFIX);
    const options = new firefox.Options().setProfile(templateProfile);

    const proxyServerURL = getProxyServerURL(proxyPort);

    // Set proxy in the way that doesn't interfere with Selenium Manager
    options.setPreference('network.proxy.type', 1);
    options.setPreference('network.proxy.ssl', proxyServerURL.hostname);
    options.setPreference(
      'network.proxy.ssl_port',
      parseInt(proxyServerURL.port, 10),
    );

    options.setAcceptInsecureCerts(true);
    options.setPreference('browser.download.folderList', 2);
    options.setPreference(
      'browser.download.dir',
      path.join(process.cwd(), 'test-artifacts', 'downloads'),
    );

    if (isHeadless('SELENIUM')) {
      // TODO: Remove notice and consider non-experimental when results are consistent
      console.warn(
        '*** Running e2e tests in headless mode is experimental and some tests are known to fail for unknown reasons',
      );
      options.addArguments('-headless');
    }
    const builder = new Builder()
      .forBrowser('firefox')
      .setFirefoxOptions(options);

    // For cases where Firefox is installed as snap (Linux)
    const FF_SNAP_GECKO_PATH = '/snap/bin/geckodriver';
    const service = process.env.FIREFOX_SNAP
      ? new firefox.ServiceBuilder(FF_SNAP_GECKO_PATH)
      : new firefox.ServiceBuilder(resolveGeckodriverPath());

    if (port) {
      service.setPort(port);
    }

    builder.setFirefoxService(service);
    const driver = builder.build();

    // Ensure Firefox is cleaned up if anything below fails (XPI build,
    // extension install, etc.).  Without this, a partial failure orphans
    // the browser.
    try {
      const fxDriver = new FirefoxDriver(driver);

      // Pre-build an XPI and cache it across test runs.
      // Without this, installAddon() zips the 348MB unpacked dir on every call,
      // adding ~10s of overhead per test.
      const xpiPath = await getOrBuildXpi('dist/firefox');
      const installedExtensionId = await fxDriver.installExtension(xpiPath);
      const internalExtensionId = await fxDriver.getInternalId();

      if (responsive || constrainWindowSize) {
        await driver.manage().window().setRect({ width: 320, height: 600 });
      }

      return {
        driver,
        extensionId: installedExtensionId,
        extensionUrl: `moz-extension://${internalExtensionId}`,
      };
    } catch (error) {
      try {
        await driver.quit();
      } catch {
        // best-effort cleanup
      }
      throw error;
    }
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
