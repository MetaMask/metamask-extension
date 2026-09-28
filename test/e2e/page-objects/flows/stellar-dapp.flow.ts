import { Driver } from '../../webdriver/driver';
import { TestDappStellar } from '../pages/test-dapp-stellar';
import { WINDOW_TITLES } from '../../constants';
import ConnectAccountConfirmation from '../pages/confirmations/connect-account-confirmation';
import SnapSignAuthEntryConfirmation from '../pages/confirmations/snap-sign-auth-entry-confirmation';
import SnapSignMessageConfirmation from '../pages/confirmations/snap-sign-message-confirmation';
import SnapSignTransactionConfirmation from '../pages/confirmations/snap-sign-transaction-confirmation';
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

/**
 * Confirms a Stellar snap signing dialog. The first sign/send after connect may
 * open an extra Connect dialog to grant stellar signing methods in the session.
 *
 * @param driver
 * @param confirmation
 */
export const confirmStellarSnapSigning = async (
  driver: Driver,
  confirmation:
    | SnapSignMessageConfirmation
    | SnapSignTransactionConfirmation
    | SnapSignAuthEntryConfirmation,
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
