import browser from 'webextension-polyfill';

export async function getNotificationImage() {
  const iconUrl = await browser.runtime.getURL('../../images/icon-64.png');
  return iconUrl;
}
