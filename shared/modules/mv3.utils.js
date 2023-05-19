import { browser } from '../../app/scripts/browser';

export const isManifestV3 =
  browser.runtime.getManifest().manifest_version === 3;
