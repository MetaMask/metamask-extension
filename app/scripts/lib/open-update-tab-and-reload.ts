import browser from 'webextension-polyfill';
import type MetamaskController from '../metamask-controller';

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
