const nodeCrypto = require('crypto');
const fs = require('fs');
const { execFileSync } = require('child_process');
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
      : new firefox.ServiceBuilder();

    if (port) {
      service.setPort(port);
    }

    builder.setFirefoxService(service);
    const driver = builder.build();
    const fxDriver = new FirefoxDriver(driver);

    // Pre-build a compressed XPI and cache it across test runs.
    // Without this, installAddon() zips the 348MB unpacked dir on every call,
    // adding ~10s of overhead per test.
    const xpiPath = FirefoxDriver._getOrBuildXpi('dist/firefox');
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
  }

  /**
   * Returns the SHA-256 hash of manifest.json content for cache invalidation.
   *
   * @param {string} absDir - Absolute path to the unpacked extension directory
   * @returns {string} Hex-encoded SHA-256 hash
   */
  static _getManifestSha256(absDir) {
    const manifestContent = fs.readFileSync(path.join(absDir, 'manifest.json'));
    return nodeCrypto
      .createHash('sha256')
      .update(manifestContent)
      .digest('hex');
  }

  /**
   * Returns the path to a cached XPI for the given unpacked extension directory.
   * Builds the XPI on first call; reuses it as long as no file in the directory
   * is newer than the cached XPI. The cache filename is derived from the
   * directory path so different addon dirs get independent caches.
   *
   * @param {string} addonDir - Path to the unpacked extension directory
   * @returns {string} Path to the XPI file
   */
  static _getOrBuildXpi(addonDir) {
    const absDir = path.resolve(addonDir);
    const dirHash = nodeCrypto
      .createHash('sha256')
      .update(absDir)
      .digest('hex')
      .slice(0, 12);
    const xpiPath = path.join(os.tmpdir(), `metamask-e2e-${dirHash}.xpi`);
    const manifestHashPath = `${xpiPath}.manifest-sha256`;

    let needsRebuild = true;
    let manifestHashForStorage = null;

    try {
      const xpiMtime = fs.statSync(xpiPath).mtimeMs;

      // manifest.json is excluded from mtime checks because setManifestFlags()
      // rewrites it before every test even when content is identical. Instead
      // we compare its content hash to detect real changes.
      const manifestHash = FirefoxDriver._getManifestSha256(absDir);
      manifestHashForStorage = manifestHash;

      const cachedManifestHash = fs
        .readFileSync(manifestHashPath, 'utf8')
        .trim();

      const manifestChanged = manifestHash !== cachedManifestHash;
      const filesChanged = FirefoxDriver._hasNewerFile(
        absDir,
        xpiMtime,
        'manifest.json',
      );

      needsRebuild = manifestChanged || filesChanged;
    } catch {
      // XPI or hash file doesn't exist yet — first run or cache invalid
      console.log('[Firefox E2E] Cache cold, building XPI');
    }

    if (needsRebuild) {
      try {
        fs.unlinkSync(xpiPath);
      } catch (err) {
        console.warn(
          '[Firefox E2E] Pre-rebuild unlink of XPI failed:',
          err.message,
        );
      }
      try {
        execFileSync('zip', ['-r', '-1', '-q', xpiPath, '.'], { cwd: absDir });
      } catch {
        // `zip` failed or not installed — fall back to unpacked directory.
        // Clean up any partial/corrupted XPI and stale hash so we don't reuse
        // them on the next run (which would cause hard-to-diagnose install failures).
        try {
          fs.unlinkSync(xpiPath);
        } catch (err) {
          console.warn(
            '[Firefox E2E] Cleanup of partial XPI failed:',
            err.message,
          );
        }
        try {
          fs.unlinkSync(manifestHashPath);
        } catch (err) {
          console.warn(
            '[Firefox E2E] Cleanup of manifest hash failed:',
            err.message,
          );
        }
        // If unlink failed, overwrite with sentinel so next run won't treat
        // a corrupted XPI as valid (manifestHash will never match '').
        try {
          fs.writeFileSync(manifestHashPath, '');
        } catch (err) {
          console.warn(
            '[Firefox E2E] Failed to invalidate manifest hash:',
            err.message,
          );
        }
        console.warn(
          '[Firefox E2E] zip not installed or failed, using unpacked directory (slower)',
        );
        return addonDir;
      }
      console.log('[Firefox E2E] Built cached XPI');

      const hashToStore =
        manifestHashForStorage ?? FirefoxDriver._getManifestSha256(absDir);
      fs.writeFileSync(manifestHashPath, hashToStore);
    }

    return xpiPath;
  }

  /**
   * Checks whether any file inside `dir` has an mtime newer than `thresholdMs`.
   * Returns early on the first match for speed.
   *
   * @param {string} dir - Directory to scan
   * @param {number} thresholdMs - mtime threshold in milliseconds
   * @param {string} [skipFile] - Filename to skip (checked at top-level only)
   * @returns {boolean} true if at least one file is newer
   */
  static _hasNewerFile(dir, thresholdMs, skipFile) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (skipFile && entry.name === skipFile) {
        continue;
      }
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (FirefoxDriver._hasNewerFile(fullPath, thresholdMs)) {
          return true;
        }
      } else if (fs.statSync(fullPath).mtimeMs > thresholdMs) {
        return true;
      }
    }
    return false;
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
