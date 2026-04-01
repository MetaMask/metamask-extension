const nodeCrypto = require('crypto');
const { finished } = require('stream/promises');
const fs = require('fs');
const os = require('os');
const path = require('path');
const zlib = require('zlib');
const {
  Builder,
  By,
  until,
  ThenableWebDriver, // eslint-disable-line no-unused-vars -- this is imported for JSDoc
} = require('selenium-webdriver');
const firefox = require('selenium-webdriver/firefox');
const yazl = require('yazl');
const { retry } = require('../../../development/lib/retry');
const { isHeadless } = require('../../helpers/env');

const MANIFEST_FILE_NAME = 'manifest.json';
const XPI_TEMPLATE_VERSION = 2;
const MANIFEST_SLOT_SIZE = 64 * 1024;
const EOCD_SIZE = 22;
const CD_OFFSET_IN_EOCD = 16;
const DATA_OFFSET = 30 + MANIFEST_FILE_NAME.length;
const CD_CRC32_OFFSET = 16;
const LFH_CRC32_OFFSET = 14;

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

    // Pre-build an XPI and cache it across test runs.
    // Without this, installAddon() zips the 348MB unpacked dir on every call,
    // adding ~10s of overhead per test.
    const xpiPath = await FirefoxDriver._getOrBuildXpi('dist/firefox');
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
   * Returns the path to a cached XPI for the given unpacked extension directory.
   * Builds the XPI on first call; reuses it as long as no file in the directory
   * is newer than the cached XPI. The cache filename is derived from the
   * directory path so different addon dirs get independent caches.
   *
   * @param {string} addonDir - Path to the unpacked extension directory
   * @returns {Promise<string>} Path to the XPI file
   */
  static async _getOrBuildXpi(addonDir) {
    const absDir = path.resolve(addonDir);
    const dirHash = nodeCrypto
      .createHash('sha256')
      .update(absDir)
      .digest('hex')
      .slice(0, 12);
    const manifest = fs.readFileSync(path.join(absDir, MANIFEST_FILE_NAME));
    const tmpName = `metamask-e2e-${dirHash}-v${XPI_TEMPLATE_VERSION}.xpi`;
    const xpiPath = path.join(os.tmpdir(), tmpName);

    try {
      const xpiMtime = fs.statSync(xpiPath).mtimeMs;
      if (!FirefoxDriver._hasNewerFile(absDir, xpiMtime, MANIFEST_FILE_NAME)) {
        await FirefoxDriver._patchManifest(xpiPath, manifest);
        return xpiPath;
      }
    } catch {
      console.log('[Firefox E2E] Cache cold, building XPI');
    }

    return FirefoxDriver._buildXpiTemplate(absDir, xpiPath, manifest);
  }

  static async _buildXpiTemplate(addonDir, xpiPath, manifest) {
    const manifestPath = path.join(addonDir, MANIFEST_FILE_NAME);
    const manifestStats = fs.statSync(manifestPath);
    const paddedManifest = FirefoxDriver._pad(manifest, MANIFEST_SLOT_SIZE);
    const tempXpiPath = `${xpiPath}.${process.pid}-${Date.now()}.tmp`;

    try {
      await FirefoxDriver._buildXpi(addonDir, tempXpiPath, {
        buffer: paddedManifest,
        mode: manifestStats.mode,
        mtime: manifestStats.mtime,
      });
      fs.renameSync(tempXpiPath, xpiPath);
    } catch (error) {
      fs.rmSync(tempXpiPath, { force: true });
      throw error;
    }

    return xpiPath;
  }

  static async _patchManifest(xpiPath, manifest) {
    const paddedManifest = FirefoxDriver._pad(manifest, MANIFEST_SLOT_SIZE);
    const crc32 = Buffer.allocUnsafe(4);
    crc32.writeUInt32LE(zlib.crc32(paddedManifest), 0);
    await using fileHandle = await fs.promises.open(xpiPath, 'r+');
    const { size } = await fileHandle.stat();
    const eocd = Buffer.allocUnsafe(EOCD_SIZE);
    await fileHandle.read(eocd, 0, eocd.length, size - eocd.length);
    const cdOffset = eocd.readUInt32LE(CD_OFFSET_IN_EOCD);
    for (const [buffer, position] of [
      [paddedManifest, DATA_OFFSET],
      [crc32, LFH_CRC32_OFFSET],
      [crc32, cdOffset + CD_CRC32_OFFSET],
    ]) {
      await fileHandle.write(buffer, 0, buffer.length, position);
    }
  }

  static _pad(manifest, capacity) {
    return Buffer.concat([
      manifest,
      Buffer.alloc(capacity - manifest.length, 0x20),
    ]);
  }

  static async _buildXpi(addonDir, xpiPath, manifest = {}) {
    const zipFile = new yazl.ZipFile();
    await using outputStream = fs.createWriteStream(xpiPath);
    zipFile.outputStream.once('error', (error) => outputStream.destroy(error));
    zipFile.outputStream.pipe(outputStream);
    if (manifest.buffer) {
      zipFile.addBuffer(manifest.buffer, MANIFEST_FILE_NAME, {
        compress: false,
        mode: manifest.mode,
        mtime: manifest.mtime,
      });
    }
    FirefoxDriver._addDirectoryToZip(zipFile, addonDir, addonDir, manifest);
    zipFile.end();
    await finished(outputStream);
  }

  static _addDirectoryToZip(zipFile, rootDir, currentDir, manifest = {}) {
    const entries = fs.readdirSync(currentDir, { withFileTypes: true });

    for (const entry of entries) {
      const absoluteEntryPath = path.join(currentDir, entry.name);
      const relativeEntryPath = path.relative(rootDir, absoluteEntryPath);

      if (entry.isDirectory()) {
        FirefoxDriver._addDirectoryToZip(
          zipFile,
          rootDir,
          absoluteEntryPath,
          manifest,
        );
      } else if (entry.isFile()) {
        if (manifest.buffer && relativeEntryPath === MANIFEST_FILE_NAME) {
          continue;
        }
        zipFile.addFile(absoluteEntryPath, relativeEntryPath, {
          compress: false,
        });
      }
    }
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
