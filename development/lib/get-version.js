const { version: manifestVersion } = require('../../package.json');
const { loadBuildTypesConfig } = require('./build-type');

/**
 * Get the current version of the MetaMask extension. The base manifest version
 * is modified according to the build type and version.
 *
 * The build version is needed because certain build types (such as beta) may
 * be released multiple times during the release process.
 *
 * @param {string} buildType - The build type.
 * @param {number} buildVersion - The build version.
 * @returns {string} The MetaMask extension version.
 */
function getVersion(buildType, buildVersion) {
  return loadBuildTypesConfig().buildTypes[buildType].isPrerelease === true
    ? `${manifestVersion}-${buildType}.${buildVersion}`
    : manifestVersion;
}

module.exports = { getVersion };
