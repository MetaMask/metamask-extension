import { Driver } from '../../webdriver/driver';
import { TestDappStellar } from '../pages/test-dapp-stellar';
import { WINDOW_TITLES } from '../../constants';
import ConnectAccountConfirmation from '../pages/confirmations/connect-account-confirmation';
import SnapSignMessageConfirmation from '../pages/confirmations/snap-sign-message-confirmation';
import SnapSignTransactionConfirmation from '../pages/confirmations/snap-sign-transaction-confirmation';
import { largeDelayMs } from '../../helpers';

/**
 * Tries opening the wallet selection modal and selecting the MetaMask option.
 *
 * @param driver - The driver instance.
 * @param testDapp - The Stellar test dapp page object.
 * @param retries - The number of retries.
 */
const tryConnectWithRetry = async (
  driver: Driver,
  testDapp: TestDappStellar,
  retries: number,
) => {
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      await testDapp.connect();

      const modal = await testDapp.getWalletModal();
      await modal.connectToMetaMaskWallet();

      await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);

      return;
    } catch (error) {
      console.warn(
        `Retrying Stellar dapp wallet modal (attempt ${attempt + 1}/${retries})`,
      );

      if (attempt === retries - 1) {
        throw error;
      }

      await driver.delay(largeDelayMs);
    }
  }
};

/**
 * Connects the Stellar test dapp to the wallet.
 *
 * @param driver
 * @param testDapp
 */
export const connectStellarTestDapp = async (
  driver: Driver,
  testDapp: TestDappStellar,
): Promise<void> => {
  await testDapp.checkPageIsLoaded();
  await testDapp.selectNetwork('pubnet');
  await tryConnectWithRetry(driver, testDapp, 3);

  const connectAccountConfirmation = new ConnectAccountConfirmation(driver);
  await connectAccountConfirmation.checkPageIsLoaded();
  await connectAccountConfirmation.confirmConnect();

  await testDapp.switchTo();
  console.log('Stellar test dapp connected');
};

/**
 * Confirms a Stellar snap signing dialog. The first sign/send after connect may
 * open an extra Connect dialog to grant stellar signing methods in the session.
 *
 * @param driver
 * @param confirmation
 */
export const confirmStellarSnapSigning = async (
  driver: Driver,
  confirmation: SnapSignMessageConfirmation | SnapSignTransactionConfirmation,
): Promise<void> => {
  await driver.waitUntilXWindowHandles(3);
  await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);

  const connectAccountConfirmation = new ConnectAccountConfirmation(driver);
  if (await connectAccountConfirmation.tryConfirmConnect()) {
    await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
  }

  await confirmation.checkPageIsLoaded();
  await confirmation.clickFooterConfirmButton();
};
