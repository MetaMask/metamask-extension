/**
 * @returns {Object} An object with browser as key and next version of beta
 * as the value.  E.g. { firefox: '9.6.0.beta0', chrome: '9.6.0.1' }
 */
function getNextBetaVersionMap(currentVersion, betaVersion, platforms) {
  const [major, minor] = currentVersion.split('.');

  return platforms.reduce((platformMap, platform) => {
    platformMap[platform] = [
      // Keeps the current major
      major,
      // Bump the minor version
      Number(minor) + 1,
      // This isn't typically used
      0,
      // The beta number
      `${platform === 'firefox' ? 'beta' : ''}${betaVersion}`,
    ].join('.');
    return platformMap;
  }, {});
}

module.exports = {
  getNextBetaVersionMap,
};
