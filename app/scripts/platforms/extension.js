import browser from 'webextension-polyfill';

import { getBlockExplorerLink } from '@metamask/etherscan-link';
import { startCase, toLower } from 'lodash';
import { TransactionStatus } from '@metamask/transaction-controller';
import { getEnvironmentType } from '../lib/util';
import { ENVIRONMENT_TYPE_BACKGROUND } from '../../../shared/constants/app';
// TODO: Remove restricted import
// eslint-disable-next-line import/no-restricted-paths
import { getURLHostName } from '../../../ui/helpers/utils/util';
import { t } from '../translate';

export default class ExtensionPlatform {
  //
  // Public
  //
  reload() {
    browser.runtime.reload();
  }

  async openTab(options) {
    const newTab = await browser.tabs.create(options);
    return newTab;
  }

  async openWindow(options) {
    const newWindow = await browser.windows.create(options);
    return newWindow;
  }

  async focusWindow(windowId) {
    await browser.windows.update(windowId, { focused: true });
  }

  async updateWindowPosition(windowId, left, top) {
    await browser.windows.update(windowId, { left, top });
  }

  async getLastFocusedWindow() {
    const windowObject = await browser.windows.getLastFocused();
    return windowObject;
  }

  async closeCurrentWindow() {
    const windowDetails = await browser.windows.getCurrent();
    browser.windows.remove(windowDetails.id);
  }

  /**
   * Returns the version of the extension by reading the manifest.
   */
  getVersion() {
    // return the "live" version of the extension, as the bundle of code running
    // might be from a different version of the application than the manifest.
    // This isn't supposed to happen, but we've seen it before in Sentry.
    // This should *not* be updated to the static `process.env.METAMASK_VERSION`
    return browser.runtime.getManifest().version;
  }

  getExtensionURL(route = null, queryString = null) {
    let extensionURL = browser.runtime.getURL('home.html');

    if (route) {
      extensionURL += `#${route}`;
    }

    if (queryString) {
      extensionURL += `?${queryString}`;
    }

    return extensionURL;
  }

  openExtensionInBrowser(
    route = null,
    queryString = null,
    keepWindowOpen = false,
  ) {
    const extensionURL = this.getExtensionURL(
      route,
      queryString,
      keepWindowOpen,
    );

    this.openTab({ url: extensionURL });

    if (
      getEnvironmentType() !== ENVIRONMENT_TYPE_BACKGROUND &&
      !keepWindowOpen
    ) {
      window.close();
    }
  }

  getPlatformInfo(cb) {
    try {
      const platformInfo = browser.runtime.getPlatformInfo();
      cb(platformInfo);
      // eslint-disable-next-line no-useless-return
      return;
    } catch (e) {
      cb(e);
      // eslint-disable-next-line no-useless-return
      return;
    }
  }

  async showTransactionNotification(txMeta, rpcPrefs) {
    const { status, txReceipt: { status: receiptStatus } = {} } = txMeta;

    if (status === TransactionStatus.confirmed) {
      // There was an on-chain failure
      receiptStatus === '0x0'
        ? await this._showFailedTransaction(
            txMeta,
            'Transaction encountered an error.',
          )
        : await this._showConfirmedTransaction(txMeta, rpcPrefs);
    } else if (status === TransactionStatus.failed) {
      await this._showFailedTransaction(txMeta);
    }
  }

  addOnRemovedListener(listener) {
    browser.windows.onRemoved.addListener(listener);
  }

  async getAllWindows() {
    const windows = await browser.windows.getAll();
    return windows;
  }

  async getActiveTabs() {
    const tabs = await browser.tabs.query({ active: true });
    return tabs;
  }

  async currentTab() {
    const tab = await browser.tabs.getCurrent();
    return tab;
  }

  async switchToTab(tabId) {
    const tab = await browser.tabs.update(tabId, { highlighted: true });
    return tab;
  }

  async switchToAnotherURL(tabId, url) {
    await browser.tabs.update(tabId, { url });
  }

  async closeTab(tabId) {
    await browser.tabs.remove(tabId);
  }

  async _showConfirmedTransaction(txMeta, rpcPrefs) {
    this._subscribeToNotificationClicked();

    const url = getBlockExplorerLink(txMeta, rpcPrefs);
    const nonce = parseInt(txMeta.txParams.nonce, 16);
    const view = startCase(
      toLower(getURLHostName(url).replace(/([.]\w+)$/u, '')),
    );

    const title = t('notificationTransactionSuccessTitle');
    let message = t('notificationTransactionSuccessMessage', nonce);

    if (url.length) {
      message += ` ${t('notificationTransactionSuccessView', view)}`;
    }

    await this._showNotification(title, message, url);
  }

  async _showFailedTransaction(txMeta, errorMessage) {
    const nonce = parseInt(txMeta.txParams.nonce, 16);
    const title = t('notificationTransactionFailedTitle');
    let message = t(
      'notificationTransactionFailedMessage',
      nonce,
      errorMessage || txMeta.error.message,
    );
    ///: BEGIN:ONLY_INCLUDE_IF(build-mmi)
    if (isNaN(nonce)) {
      message = t(
        'notificationTransactionFailedMessageMMI',
        errorMessage || txMeta.error.message,
      );
    }
    ///: END:ONLY_INCLUDE_IF
    await this._showNotification(title, message);
  }

  async _showNotification(title, message, url) {
    const iconUrl = await browser.runtime.getURL('../../images/icon-64.png');

    await browser.notifications.create(url, {
      type: 'basic',
      title,
      iconUrl,
      message,
    });
  }

  _subscribeToNotificationClicked() {
    if (!browser.notifications.onClicked.hasListener(this._viewOnEtherscan)) {
      browser.notifications.onClicked.addListener(this._viewOnEtherscan);
    }
  }

  _viewOnEtherscan(url) {
    if (url.startsWith('https://')) {
      browser.tabs.create({ url });
    }
  }
}
