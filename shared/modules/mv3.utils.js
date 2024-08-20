/* eslint-disable import/unambiguous -- Not an external module and not of concern */

const runtimeManifest =
  global.chrome?.runtime.getManifest() || global.browser?.runtime.getManifest();

/**
 * A boolean indicating whether the manifest of the current extension
 * is set to manifest version 3.
 */
const isManifestV3 = runtimeManifest
  ? console.log('branch A') && runtimeManifest.manifest_version === 3
  : (console.log('branch B') && process.env.ENABLE_MV3 === 'true') || // Tests on Node.js processes
    process.env.ENABLE_MV3 === undefined;

console.log(`Runtime manifest? ${Boolean(runtimeManifest)}`);
console.log(`Runtime manifest version? ${runtimeManifest?.manifest_version}`);
console.log(
  `Runtime manifest version is 3: ${runtimeManifest?.manifest_version === 3}`,
);
console.log(`process.env.ENABLE_MV3: ${process.env.ENABLE_MV3}`);
console.log(`process.env.ENABLE_MV3 type: ${typeof process.env.ENABLE_MV3}`);
console.log(
  `process.env.ENABLE_MV3 is true: ${process.env.ENABLE_MV3 === 'true'}`,
);
console.log(
  `process.env.ENABLE_MV3 is undefined: ${
    process.env.ENABLE_MV3 === undefined
  }`,
);
console.log(
  `process.env suggests that this is MV3: ${
    process.env.ENABLE_MV3 === 'true' || // Tests on Node.js processes
    process.env.ENABLE_MV3 === undefined
  }`,
);
console.log(`isManifestV3 is ${isManifestV3}`);

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
