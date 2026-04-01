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
const XPI_TEMPLATE_VERSION = 1;
const XPI_COMMENT_CAPACITY = 512;

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
    const hash = nodeCrypto.createHash('sha256').update(manifest).digest('hex');
    const xpiPath = path.join(os.tmpdir(), `metamask-e2e-${dirHash}.xpi`);

    try {
      const xpiStat = fs.statSync(xpiPath);
      const meta = await FirefoxDriver._readMetadataFromXpi(
        xpiPath,
        xpiStat.size,
      );
      if (
        meta.version === XPI_TEMPLATE_VERSION &&
        meta.capacity >= manifest.length &&
        !FirefoxDriver._hasNewerFile(
          absDir,
          xpiStat.mtimeMs,
          MANIFEST_FILE_NAME,
        )
      ) {
        if (meta.hash === hash) {
          return xpiPath;
        }

        await FirefoxDriver._patchManifestInXpi(
          xpiPath,
          manifest,
          { ...meta, hash },
          xpiStat.size,
        );
        return xpiPath;
      }
    } catch {
      console.log('[Firefox E2E] Cache cold, building XPI');
    }

    return FirefoxDriver._buildXpiTemplate(absDir, xpiPath, manifest, hash);
  }

  static async _buildXpiTemplate(addonDir, xpiPath, manifest, hash) {
    const manifestPath = path.join(addonDir, MANIFEST_FILE_NAME);
    const manifestStats = fs.statSync(manifestPath);
    let capacity = 16 * 1024;
    while (capacity < manifest.length) {
      capacity *= 2;
    }
    const paddedManifestBuffer = FirefoxDriver._getPaddedBuffer(
      manifest,
      capacity,
    );
    const tempXpiPath = `${xpiPath}.${process.pid}-${Date.now()}.tmp`;

    try {
      const { entries, offsetOfStartOfCentralDirectory } =
        await FirefoxDriver._buildXpi(addonDir, tempXpiPath, {
          buffer: paddedManifestBuffer,
          comment: Buffer.alloc(XPI_COMMENT_CAPACITY, 0x20),
          mode: manifestStats.mode,
          mtime: manifestStats.mtime,
        });
      const { utf8FileName, relativeOffsetOfLocalHeader } = entries.pop();
      await using fileHandle = await fs.promises.open(tempXpiPath, 'r+');
      await FirefoxDriver._writeMetadataComment(fileHandle, {
        capacity,
        directoryOffset:
          offsetOfStartOfCentralDirectory +
          entries.reduce((size, e) => size + 55 + e.utf8FileName.length, 0) +
          16,
        dataOffset: relativeOffsetOfLocalHeader + 30 + utf8FileName.length,
        hash,
        fileOffset: relativeOffsetOfLocalHeader + 12,
        version: XPI_TEMPLATE_VERSION,
      });
      fs.renameSync(tempXpiPath, xpiPath);
    } catch (error) {
      fs.rmSync(tempXpiPath, { force: true });
      throw error;
    }

    return xpiPath;
  }

  static async _readMetadataFromXpi(xpiPath, size) {
    const metadataBuffer = Buffer.allocUnsafe(XPI_COMMENT_CAPACITY);
    await using fileHandle = await fs.promises.open(xpiPath);
    await fileHandle.read(
      metadataBuffer,
      0,
      metadataBuffer.length,
      size - metadataBuffer.length,
    );
    return JSON.parse(metadataBuffer.toString('utf8').trimEnd());
  }

  static async _writeMetadataComment(fileHandle, meta, size) {
    const metadataBuffer = FirefoxDriver._getPaddedBuffer(
      Buffer.from(JSON.stringify(meta)),
      XPI_COMMENT_CAPACITY,
    );
    await fileHandle.write(
      metadataBuffer,
      0,
      metadataBuffer.length,
      (size ?? (await fileHandle.stat()).size) - metadataBuffer.length,
    );
  }

  static async _patchManifestInXpi(xpiPath, manifest, meta, size) {
    const paddedManifestBuffer = FirefoxDriver._getPaddedBuffer(
      manifest,
      meta.capacity,
    );
    const crc32Buffer = Buffer.allocUnsafe(4);
    crc32Buffer.writeUInt32LE(zlib.crc32(paddedManifestBuffer), 0);
    await using fileHandle = await fs.promises.open(xpiPath, 'r+');
    for (const [buffer, position] of [
      [paddedManifestBuffer, meta.dataOffset],
      [crc32Buffer, meta.fileOffset],
      [crc32Buffer, meta.directoryOffset],
    ]) {
      await fileHandle.write(buffer, 0, buffer.length, position);
    }
    await FirefoxDriver._writeMetadataComment(fileHandle, meta, size);
  }

  static _getPaddedBuffer(manifest, capacity) {
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
    FirefoxDriver._addDirectoryToZip(zipFile, addonDir, addonDir, manifest);
    if (manifest.buffer) {
      zipFile.addBuffer(manifest.buffer, MANIFEST_FILE_NAME, {
        compress: false,
        mode: manifest.mode,
        mtime: manifest.mtime,
      });
    }
    zipFile.end(manifest.comment ? { comment: manifest.comment } : undefined);
    await finished(outputStream);
    return {
      entries: zipFile.entries,
      offsetOfStartOfCentralDirectory: zipFile.offsetOfStartOfCentralDirectory,
    };
  }

  static _addDirectoryToZip(zipFile, rootDir, currentDir, manifest = {}) {
    const entries = fs
      .readdirSync(currentDir, { withFileTypes: true })
      .sort((entryA, entryB) => entryA.name.localeCompare(entryB.name));

    for (const entry of entries) {
      const absoluteEntryPath = path.join(currentDir, entry.name);
      const relativeEntryPath = path
        .relative(rootDir, absoluteEntryPath)
        .split(path.sep)
        .join('/');

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
