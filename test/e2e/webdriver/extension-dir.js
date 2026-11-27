const path = require('path');

/**
 * Directory of the unpacked extension a browser session loads. The A/B pilot
 * sets BENCHMARK_EXTENSION_DIR (relative to the working directory) per session.
 *
 * @param {'chrome' | 'firefox'} browser - the browser being launched
 * @returns {string} absolute path to the extension directory
 */
function getExtensionDir(browser) {
  return path.resolve(
    process.cwd(),
    process.env.BENCHMARK_EXTENSION_DIR || path.join('dist', browser),
  );
}

module.exports = { getExtensionDir };
