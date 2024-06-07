import browser from 'webextension-polyfill';

export const isManifestV3 =
  browser.runtime.getManifest().manifest_version === 3;

export const isOffscreenAvailable = Boolean(browser.offscreen);

export const isMv3ButOffscreenDocIsMissing =
  isManifestV3 && !isOffscreenAvailable;
