/* eslint-disable import/unambiguous -- Not an external module and not of concern */

const runtimeManifest =
  global.chrome?.runtime.getManifest() || global.browser?.runtime.getManifest();

/**
 * A boolean indicating whether the manifest of the current extension is set to manifest version 3.
 *
 * We have found that when this is run early in a service worker process, the runtime manifest is
 * unavailable. That's why we have a fallback using the ENABLE_MV3 constant. The fallback is also
 * used in unit tests.
 */
const isManifestV3 = runtimeManifest
  ? runtimeManifest.manifest_version === 3
  : // Our build system sets this as a boolean, but in a Node.js context (e.g. unit tests) it will
    // always be a string
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
