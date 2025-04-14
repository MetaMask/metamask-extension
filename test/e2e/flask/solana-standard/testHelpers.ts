import {
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
  const header = testDapp.getHeader();
  await header.connect();

  // wait to display wallet connect modal
  await driver.delay(regularDelayMs)

  const modal = await testDapp.getWalletModal();
  await modal.connectToMetaMaskWallet();

  // wait to display metamask dialog
  await driver.delay(regularDelayMs)

  // Switch to the metamask dialog window
  await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);

  // @TODO: Click on Connect in Metamask Dialog

  // Go back to the test dapp window
  testDapp.switchTo();
};