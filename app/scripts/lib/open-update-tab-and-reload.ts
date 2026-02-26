import browser from 'webextension-polyfill';
import type MetamaskController from '../metamask-controller';

/**
 * Opens the "Updating" page in a new tab and then triggers a safe extension reload.
 *
 * Used when an update is available to reload the extension.
 *
 * If opening the tab fails, the error is logged, and the reload proceeds anyway.
 *
 * @param requestSafeReload - A function from MetamaskController that initiates a safe reload
 * of the extension without disrupting user state.
 */
export async function openUpdateTabAndReload(
  requestSafeReload: MetamaskController['requestSafeReload'],
) {
  try {
    await browser.tabs.create({
      url: 'https://metamask.io/updating',
      active: true,
    });
  } catch (error) {
    console.error(error);
  }
  await requestSafeReload();
}
