import { Driver } from '../../webdriver/driver';
import { WINDOW_TITLES } from '../../constants';
import ConnectAccountConfirmation from '../pages/confirmations/connect-account-confirmation';

type SnapTestDapp = {
  checkPageIsLoaded: () => Promise<void>;
  switchTo: () => Promise<void>;
};

/**
 * Connects a snap (non-EVM) test dapp to the wallet: waits for the dapp to
 * report the MetaMask wallet as ready, runs the dapp-side connect, approves the
 * MetaMask connection dialog, and switches back to the dapp.
 *
 * @param driver - The driver instance.
 * @param testDapp - The dapp page object.
 * @param connectToWallet - The dapp-side connect steps, up to the point the
 * MetaMask connection dialog appears.
 */
export const connectSnapTestDapp = async (
  driver: Driver,
  testDapp: SnapTestDapp,
  connectToWallet: () => Promise<void>,
): Promise<void> => {
  await testDapp.checkPageIsLoaded();
  await connectToWallet();
  await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);

  const connectAccountConfirmation = new ConnectAccountConfirmation(driver);
  await connectAccountConfirmation.checkPageIsLoaded();
  await connectAccountConfirmation.confirmConnect();

  await testDapp.switchTo();
};
