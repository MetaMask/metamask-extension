import { Driver } from '../../webdriver/driver';
import { TestDappStellar } from '../pages/test-dapp-stellar';
import { WINDOW_TITLES } from '../../constants';
import ConnectAccountConfirmation from '../pages/confirmations/connect-account-confirmation';
import StellarWalletModal from '../pages/stellar-wallet-modal';

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
  await testDapp.verifySelectedNetwork('pubnet');
  await testDapp.connect();

  const walletModal = new StellarWalletModal(driver);
  await walletModal.checkPageIsLoaded();
  await walletModal.connectToMetaMaskWallet();

  await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);

  const connectAccountConfirmation = new ConnectAccountConfirmation(driver);
  await connectAccountConfirmation.checkPageIsLoaded();
  await connectAccountConfirmation.confirmConnect();

  await testDapp.switchTo();
  console.log('Stellar test dapp connected');
};
