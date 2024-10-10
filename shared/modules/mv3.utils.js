/* eslint-disable import/unambiguous -- Not an external module and not of concern */
const { getManifestVersion } = require('../../test/e2e/set-manifest-flags');

const runtimeManifest =
  global.chrome?.runtime.getManifest() || global.browser?.runtime.getManifest();

/**
 * A boolean indicating whether the manifest of the current extension is set to manifest version 3.
 *
 * If this function is running in the Extension, it will use the runtime manifest.
 * If this function is running in Node, it will `fs.readFileSync` the manifest.json file.
 */
const isManifestV3 = runtimeManifest
  ? runtimeManifest.manifest_version === 3
  : getManifestVersion() === 3;

/**
 * A boolean indicating whether the browser supports the offscreen document api.
 * This is only available in when the manifest is version 3, and only in chromium
 * versions 109 and higher. As of June 7, 2024, it is not available in firefox.
 */
const isOffscreenAvailable = Boolean(global.chrome?.offscreen);

/**
 * A boolean indicating whether the current extension's manifest is version 3
 * while the current browser does not support the offscreen document. This can
 * happen to users on MetaMask versions 11.16.7 and higher, who are using a
 * chromium browser with a version below 109.
 */
const isMv3ButOffscreenDocIsMissing = isManifestV3 && !isOffscreenAvailable;

module.exports = {
  isManifestV3,
  isOffscreenAvailable,
  isMv3ButOffscreenDocIsMissing,
};
