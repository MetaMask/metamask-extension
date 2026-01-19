import { Driver } from '../../webdriver/driver';
import { TestDappTron } from '../pages/test-dapp-tron';
import { WINDOW_TITLES } from '../../constants';
import ConnectAccountConfirmation from '../pages/confirmations/connect-account-confirmation';
import { largeDelayMs } from '../../helpers';

/**
 * Tries opening the wallet seleciton modal and selecting the MetaMask option
 *
 * @param driver - The driver instance.
 * @param testDapp
 * @param retries - The number of retries.
 */
const tryConnectWithRetry = async (
  driver: Driver,
  testDapp: TestDappTron,
  retries: number,
) => {
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const header = await testDapp.getHeader();
      await header.connect();

      const modal = await testDapp.getWalletModal();
      await modal.connectToMetaMaskWallet();

      await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);

      return;
    } catch (error) {
      console.warn(
        `Retrying clicking on tron dapp wallet modal (attempt ${attempt + 1}/${retries})`,
      );

      if (attempt === retries - 1) {
        throw error;
      }

      await driver.delay(largeDelayMs);
    }
  }
};

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
  await testDapp.checkPageIsLoaded();
  await tryConnectWithRetry(driver, testDapp, 3);

  const connectAccountConfirmation = new ConnectAccountConfirmation(driver);
  await connectAccountConfirmation.checkPageIsLoaded();
  await connectAccountConfirmation.confirmConnect();

  // Go back to the test dapp window
  await testDapp.switchTo();
};
