import browser from 'webextension-polyfill';
import { requestSafeReload } from '../../../ui/store/actions';

export async function openUpdateTabAndReload() {
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
