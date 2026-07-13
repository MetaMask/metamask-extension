import browser from 'webextension-polyfill';

import { getBlockExplorerLink } from '@metamask/etherscan-link';
import { startCase, toLower } from 'lodash';
import {
  TransactionStatus,
  type TransactionMeta,
} from '@metamask/transaction-controller';
import { getEnvironmentType } from '../lib/util';
import { ENVIRONMENT_TYPE_BACKGROUND } from '../../../shared/constants/app';
// TODO: Remove restricted import
// eslint-disable-next-line import-x/no-restricted-paths
import { getURLHostName } from '../../../ui/helpers/utils/util';
import { t } from '../../../shared/lib/translate';

type RpcPrefs = Parameters<typeof getBlockExplorerLink>[1];
type BlockExplorerTransaction = Parameters<typeof getBlockExplorerLink>[0];

type TransactionMetaForNotification = Pick<
  TransactionMeta,
  'error' | 'status' | 'txParams' | 'txReceipt'
> &
  Partial<BlockExplorerTransaction>;

type WindowRemovedListener = Parameters<
  typeof browser.windows.onRemoved.addListener
>[0];

type TabRemovedListener = Parameters<
  typeof browser.tabs.onRemoved.addListener
>[0];

type TabUpdatedListener = Parameters<
  typeof browser.tabs.onUpdated.addListener
>[0];

export default class ExtensionPlatform {
  reload(): void {
    // TODO: should this be a safe reload via the `WriteManager`?
    browser.runtime.reload();
  }

  async openTab(
    options: browser.Tabs.CreateCreatePropertiesType,
  ): Promise<browser.Tabs.Tab> {
    return await browser.tabs.create(options);
  }

  async openWindow(
    options: browser.Windows.CreateCreateDataType,
  ): Promise<browser.Windows.Window> {
    return await browser.windows.create(options);
  }

  async focusWindow(windowId: number): Promise<void> {
    await browser.windows.update(windowId, { focused: true });
  }

  async updateWindowPosition(
    windowId: number,
    left: number,
    top: number,
  ): Promise<void> {
    await browser.windows.update(windowId, { left, top });
  }

  async getLastFocusedWindow(): Promise<browser.Windows.Window> {
    return await browser.windows.getLastFocused();
  }

  async closeCurrentWindow(): Promise<void> {
    const windowDetails = await browser.windows.getCurrent();

    if (typeof windowDetails.id === 'number') {
      await browser.windows.remove(windowDetails.id);
    }
  }

  /**
   * Returns the version of the extension by reading the manifest.
   */
  getVersion(): string {
    // return the "live" version of the extension, as the bundle of code running
    // might be from a different version of the application than the manifest.
    // This isn't supposed to happen, but we've seen it before in Sentry.
    // This should *not* be updated to the static `process.env.METAMASK_VERSION`
    return browser.runtime.getManifest().version;
  }

  /**
   * Returns the absolute URL of the extension's home.html page, optionally with
   * a route and query string.
   *
   * @param route
   * @param queryString
   * @returns The full extension URL.
   */
  getExtensionURL(
    route: string | null = null,
    queryString: string | null = null,
  ): string {
    let extensionURL = browser.runtime.getURL('home.html');

    if (route) {
      extensionURL += `#${route}`;
    }

    if (queryString) {
      extensionURL += `?${queryString}`;
    }

    return extensionURL;
  }

  /**
   * @param route
   * @param queryString
   * @param keepWindowOpen - Defaults to false.
   */
  openExtensionInBrowser(
    route: string | null = null,
    queryString: string | null = null,
    keepWindowOpen = false,
  ): void {
    const extensionURL = this.getExtensionURL(route, queryString);

    void this.openTab({ url: extensionURL });

    if (
      getEnvironmentType() !== ENVIRONMENT_TYPE_BACKGROUND &&
      !keepWindowOpen
    ) {
      window.close();
    }
  }

  getPlatformInfo(cb: (platformInfo: unknown) => void): void {
    try {
      const platformInfo = browser.runtime.getPlatformInfo();
      cb(platformInfo);
      // eslint-disable-next-line no-useless-return
      return;
    } catch (error) {
      cb(error);
      // eslint-disable-next-line no-useless-return
      return;
    }
  }

  async showTransactionNotification(
    txMeta: TransactionMetaForNotification,
    rpcPrefs?: RpcPrefs,
  ): Promise<void> {
    const receiptStatus = txMeta.txReceipt?.status;

    if (txMeta.status === TransactionStatus.confirmed) {
      if (receiptStatus === '0x0') {
        await this._showFailedTransaction(
          txMeta,
          'Transaction encountered an error.',
        );
      } else {
        await this._showConfirmedTransaction(txMeta, rpcPrefs);
      }
    } else if (txMeta.status === TransactionStatus.failed) {
      if (txMeta.error?.message?.includes('EthAppNftNotSupported')) {
        await this._showFailedTransaction(
          txMeta,
          t('ledgerEthAppNftNotSupportedNotification') ?? undefined,
        );
      } else {
        await this._showFailedTransaction(txMeta);
      }
    }
  }

  addOnRemovedListener(listener: WindowRemovedListener): void {
    browser.windows.onRemoved.addListener(listener);
  }

  addTabRemovedListener(listener: TabRemovedListener): void {
    browser.tabs.onRemoved.addListener(listener);
  }

  removeTabRemovedListener(listener: TabRemovedListener): void {
    browser.tabs.onRemoved.removeListener(listener);
  }

  addTabUpdatedListener(listener: TabUpdatedListener): void {
    browser.tabs.onUpdated.addListener(listener);
  }

  removeTabUpdatedListener(listener: TabUpdatedListener): void {
    browser.tabs.onUpdated.removeListener(listener);
  }

  async getAllWindows(): Promise<browser.Windows.Window[]> {
    return await browser.windows.getAll();
  }

  async getActiveTabs(): Promise<browser.Tabs.Tab[]> {
    return await browser.tabs.query({ active: true });
  }

  async currentTab(): Promise<browser.Tabs.Tab> {
    return await browser.tabs.getCurrent();
  }

  async switchToTab(tabId: number): Promise<browser.Tabs.Tab> {
    return await browser.tabs.update(tabId, { highlighted: true });
  }

  async switchToAnotherURL(tabId: number, url: string): Promise<void> {
    await browser.tabs.update(tabId, { url });
  }

  async closeTab(tabId: number): Promise<void> {
    await browser.tabs.remove(tabId);
  }

  async _showConfirmedTransaction(
    txMeta: TransactionMetaForNotification,
    rpcPrefs?: RpcPrefs,
  ): Promise<void> {
    this._subscribeToNotificationClicked();

    const url = getBlockExplorerLink(
      txMeta as BlockExplorerTransaction,
      rpcPrefs,
    );
    const nonce = parseInt(txMeta.txParams?.nonce ?? '', 16);
    const view = startCase(
      toLower(getURLHostName(url).replace(/([.]\w+)$/u, '')),
    );

    const title = t('notificationTransactionSuccessTitle');
    let message = Number.isNaN(nonce)
      ? t('notificationTransactionWithoutNonceSuccessMessage')
      : t('notificationTransactionSuccessMessage', String(nonce));

    if (url.length) {
      message += ` ${t('notificationTransactionSuccessView', view)}`;
    }

    await this._showNotification(title ?? '', message ?? '', url ?? undefined);
  }

  async _showFailedTransaction(
    txMeta: TransactionMetaForNotification,
    errorMessage?: string,
  ): Promise<void> {
    const nonce = parseInt(txMeta.txParams?.nonce ?? '', 16);
    const title = t('notificationTransactionFailedTitle');
    const errorMessageText = errorMessage ?? txMeta.error?.message ?? '';
    const message = Number.isNaN(nonce)
      ? t('notificationTransactionWithoutNonceFailedMessage', errorMessageText)
      : t('notificationTransactionFailedMessage', String(nonce), errorMessageText);
    await this._showNotification(title ?? '', message ?? '');
  }

  async _showNotification(
    title: string,
    message: string,
    url?: string,
  ): Promise<void> {
    const iconUrl = browser.runtime.getURL('../../images/icon-64.png');

    if (url) {
      await browser.notifications.create(url, {
        type: 'basic',
        title,
        iconUrl,
        message,
      });
      return;
    }

    await browser.notifications.create({
      type: 'basic',
      title,
      iconUrl,
      message,
    });
  }

  _subscribeToNotificationClicked(): void {
    if (!browser.notifications.onClicked.hasListener(this._viewOnEtherscan)) {
      browser.notifications.onClicked.addListener(this._viewOnEtherscan);
    }
  }

  _viewOnEtherscan(url: string): void {
    if (url.startsWith('https://')) {
      void browser.tabs.create({ url });
    }
  }
}
