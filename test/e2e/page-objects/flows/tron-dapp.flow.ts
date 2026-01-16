import { Driver } from '../../webdriver/driver';
import { TestDappTron } from '../pages/test-dapp-tron';
import { WINDOW_TITLES } from '../../constants';
import ConnectAccountConfirmation from '../pages/confirmations/connect-account-confirmation';
import { regularDelayMs } from '../../helpers';

/**
 * Connects the Tron test dapp to the wallet.
 *
 * @param driver
 * @param testDapp
 */
export const connectTronTestDapp = async (
  driver: Driver,
  testDapp: TestDappTron,
): Promise<void> => {
  await testDapp.switchTo();
  await testDapp.checkPageIsLoaded();
  await driver.delay(regularDelayMs);
  const header = await testDapp.getHeader();
  await header.connect();

  const modal = await testDapp.getWalletModal();

  await modal.connectToMetaMaskWallet();

  // Get to extension modal, and click on the "Connect" button
  await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);

  const connectAccountConfirmation = new ConnectAccountConfirmation(driver);
  await connectAccountConfirmation.checkPageIsLoaded();
  await connectAccountConfirmation.confirmConnect();

  // Go back to the test dapp window
  await testDapp.switchTo();
};
