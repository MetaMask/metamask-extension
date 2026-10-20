const { execFileSync } = require('child_process');
const path = require('path');

// Browser versions every benchmark path runs: the Selenium benchmarks, the
// runner calibration, and the Playwright dapp page-load benchmark. Change them
// here only, and treat a change as a new measurement regime.
const PINNED_CHROME_VERSION = '126';
const PINNED_FIREFOX_VERSION = '157.0';

function seleniumManagerPath() {
  const platform =
    // eslint-disable-next-line no-nested-ternary
    process.platform === 'darwin'
      ? 'macos'
      : process.platform === 'win32'
        ? 'windows'
        : 'linux';
  const binName =
    process.platform === 'win32' ? 'selenium-manager.exe' : 'selenium-manager';
  return path.join(
    path.dirname(require.resolve('selenium-webdriver')),
    'bin',
    platform,
    binName,
  );
}

/**
 * Resolve the pinned Chrome binary, downloading and caching it if needed.
 *
 * @returns {string} Absolute path to the Chrome executable.
 */
function resolvePinnedChromePath() {
  const output = execFileSync(
    seleniumManagerPath(),
    [
      '--browser',
      'chrome',
      '--browser-version',
      PINNED_CHROME_VERSION,
      '--output',
      'json',
      '--avoid-stats',
    ],
    { encoding: 'utf8', timeout: 120_000 },
  );
  const browserPath = JSON.parse(output).result?.browser_path;
  if (!browserPath) {
    throw new Error(`Unable to resolve Chrome ${PINNED_CHROME_VERSION}`);
  }
  return browserPath;
}

module.exports = {
  PINNED_CHROME_VERSION,
  PINNED_FIREFOX_VERSION,
  resolvePinnedChromePath,
};
