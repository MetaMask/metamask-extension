import {
  largeDelayMs,
  regularDelayMs,
  WINDOW_TITLES,
} from '../../helpers';
import { Driver } from '../../webdriver/driver';
import { TestDappSolana } from '../../page-objects/pages/test-dapp-solana';

export type FixtureCallbackArgs = { driver: Driver; extensionId: string };

/**
 * Connects the Solana test dapp to the wallet.
 */
export const connectSolanaTestDapp = async (
  driver: Driver,
  testDapp: TestDappSolana
): Promise<void> => {
  const header = await testDapp.getHeader();
  await header.connect();

  // wait to display wallet connect modal
  await driver.delay(regularDelayMs)

  const modal = await testDapp.getWalletModal();
  await modal.connectToMetaMaskWallet();

  // wait to display metamask dialog
  await driver.delay(regularDelayMs)

  // Get to extension modal, and click on the "Connect" button
  await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
  await driver.delay(regularDelayMs);
  await driver.clickElementAndWaitForWindowToClose({
    text: 'Connect',
    tag: 'button',
  });

  // Go back to the test dapp window
  await testDapp.switchTo();
};