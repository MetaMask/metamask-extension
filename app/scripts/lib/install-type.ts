import browser from 'webextension-polyfill';
import { INSTALL_TYPE, type InstallType } from '../../../shared/constants/app';

/**
 * Cached install type value.
 *
 * @see {@link INSTALL_TYPE} for possible values and their meanings.
 */
let cachedInstallType: InstallType = INSTALL_TYPE.UNKNOWN;

/**
 * Initializes the install type by fetching it from the browser API.
 * This should be called early in the extension lifecycle.
 * The result is cached and can be retrieved synchronously via getInstallType().
 *
 * @returns A promise that resolves to the install type
 */
export const initInstallType = async (): Promise<InstallType> => {
  try {
    const extensionInfo = await browser.management.getSelf();
    if (extensionInfo.installType) {
      cachedInstallType = extensionInfo.installType as InstallType;
    }
  } catch (error) {
    // Silently fail - install type will remain 'unknown'
    console.error('Error getting extension installType', error);
  }
  return cachedInstallType;
};

/**
 * Returns the cached install type.
 * Call initInstallType() first to populate the cache.
 *
 * @returns The install type
 */
export const getInstallType = (): InstallType => {
  return cachedInstallType;
};
