import { Driver } from '../../webdriver/driver';
import { WINDOW_TITLES } from '../../constants';
import TestDapp from '../pages/test-dapp';
import ConnectAccountConfirmation from '../pages/confirmations/connect-account-confirmation';

/**
 * Connects account to test dapp with Dialog handling and optional verification.
 * This flow handles the complete connection process: clicking connect button,
 * confirming in Dialog, and optionally verifying the connection.
 *
 * @param driver - The webdriver instance.
 * @param options - Optional parameters.
 * @param [options.publicAddress] - The public address to verify after connection.
 * @param [options.chainId] - The chain id to verify, defaults to 0x539.
 */
export const connectAccountToTestDapp = async (
  driver: Driver,
  options: {
    publicAddress?: string;
    chainId?: string;
  } = {},
): Promise<void> => {
  const { publicAddress, chainId = '0x539' } = options;
  const testDapp = new TestDapp(driver);

  // Step 1: Click connect account button in TestDApp
  await testDapp.connectAccount();

  // Step 2: Handle Dialog interaction
  await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
  const connectAccountConfirmation = new ConnectAccountConfirmation(driver);
  await connectAccountConfirmation.checkPageIsLoaded();
  await connectAccountConfirmation.confirmConnect();

  // Step 3: Switch back to TestDApp and verify if needed
  await driver.switchToWindowWithTitle(WINDOW_TITLES.TestDApp);
  if (publicAddress) {
    await testDapp.verifyAccountConnection(publicAddress, chainId);
  }
};
