/* eslint-disable import/unambiguous -- Not an external module and not of concern */

const runtimeManifest =
  (global.chrome?.runtime.getManifest &&
    global.chrome?.runtime.getManifest()) ??
  (global.browser?.runtime.getManifest &&
    global.browser?.runtime.getManifest());

/**
 * A boolean indicating whether the manifest of the current extension is set to manifest version 3.
 *
 * If this function is running in the Extension, it will use the runtime manifest.
 * If this function is running in Node doing a build job, it will read process.env.ENABLE_MV3.
 * If this function is running in Node doing an E2E test, it will `fs.readFileSync` the manifest.json file.
 */
const isManifestV3 = runtimeManifest
  ? runtimeManifest.manifest_version === 3
  : // Our build system sets this as a boolean, but in a Node.js context (e.g. unit tests) it can be a string
    process.env.ENABLE_MV3 === true ||
    process.env.ENABLE_MV3 === 'true' ||
    process.env.ENABLE_MV3 === undefined;

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
