import browser from 'webextension-polyfill';

export async function getNotificationImage() {
  // TODO: Fix in follow-up ticket https://github.com/MetaMask/metamask-extension/issues/31881
  // eslint-disable-next-line @typescript-eslint/await-thenable
  const iconUrl = await browser.runtime.getURL('../../images/icon-64.png');
  return iconUrl;
}
