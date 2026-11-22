// `chrome` exists on ordinary web pages, including Storybook, without
// `chrome.runtime`. Optional calls avoid throwing while this module evaluates
// and fall through to `browser.runtime`, then to ENABLE_MV3 below. Extension
// pages still read the runtime manifest, so MV2 and MV3 builds are unchanged.
const runtimeManifest =
  global.chrome?.runtime?.getManifest?.() ||
  global.browser?.runtime?.getManifest?.();

/**
 * A boolean indicating whether the manifest of the current extension is set to manifest version 3.
 *
 * Extension pages use the runtime manifest. When `getManifest` is unavailable,
 * this reads `process.env.ENABLE_MV3`. The build system inlines that as a
 * boolean; in Node it can be a string. An unset value is treated as Manifest V3.
 */
const isManifestV3: boolean = runtimeManifest
  ? runtimeManifest.manifest_version === 3
  : // Our build system sets this as a boolean, but in a Node.js context (e.g. unit tests) it can be a string
    (process.env.ENABLE_MV3 as boolean | string | undefined) === true ||
    process.env.ENABLE_MV3 === 'true' ||
    process.env.ENABLE_MV3 === undefined;

/**
 * A boolean indicating whether the browser supports the offscreen document api.
 * This is only available in when the manifest is version 3, and only in chromium
 * versions 109 and higher. As of June 7, 2024, it is not available in firefox.
 */
const isOffscreenAvailable: boolean = Boolean(global.chrome?.offscreen);

/**
 * A boolean indicating whether the current extension's manifest is version 3
 * while the current browser does not support the offscreen document. This can
 * happen to users on MetaMask versions 11.16.7 and higher, who are using a
 * chromium browser with a version below 109.
 */
const isMv3ButOffscreenDocIsMissing: boolean =
  isManifestV3 && !isOffscreenAvailable;

export { isManifestV3, isOffscreenAvailable, isMv3ButOffscreenDocIsMissing };
