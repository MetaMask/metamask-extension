import { Driver } from '../../webdriver/driver';
import { TestDappStellar } from '../pages/test-dapp-stellar';
import { WINDOW_TITLES } from '../../constants';
import ConnectAccountConfirmation from '../pages/confirmations/connect-account-confirmation';
import SnapSignMessageConfirmation from '../pages/confirmations/snap-sign-message-confirmation';
import SnapSignTransactionConfirmation from '../pages/confirmations/snap-sign-transaction-confirmation';
import { enableStellarTestnetOnConnect } from '../../flask/stellar-connect/testHelpers';
import { largeDelayMs } from '../../helpers';

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
        `Retrying clicking on stellar dapp wallet modal (attempt ${attempt + 1}/${retries})`,
      );

      if (attempt === retries - 1) {
        throw error;
      }

      await driver.delay(largeDelayMs);
    }
  }
};

export const connectStellarTestDapp = async (
  driver: Driver,
  testDapp: TestDappStellar,
  options: { includeTestnet?: boolean } = {},
): Promise<void> => {
  await testDapp.checkPageIsLoaded();
  // The test dapp defaults to testnet; MetaMask connect uses pubnet.
  await testDapp.selectNetwork('pubnet');
  await tryConnectWithRetry(driver, testDapp, 3);

  await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);

  if (options.includeTestnet) {
    await enableStellarTestnetOnConnect(driver);
  }

  const connectAccountConfirmation = new ConnectAccountConfirmation(driver);
  await connectAccountConfirmation.checkPageIsLoaded();
  await connectAccountConfirmation.confirmConnect();

  await testDapp.switchTo();
};

/**
 * The Stellar dapp may request a session update (wallet_createSession) before
 * the first sign call if method permissions were not included in getSession.
 * @param driver
 */
const confirmSessionUpdateIfNeeded = async (
  driver: Driver,
): Promise<void> => {
  const connectAccountConfirmation = new ConnectAccountConfirmation(driver);

  try {
    await driver.waitForSelector(
      {
        text: 'Connect this website with MetaMask',
        tag: 'p',
      },
      { timeout: 3000 },
    );
    await connectAccountConfirmation.confirmConnect();
    await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
  } catch {
    // Sign confirmation is already showing.
  }
};

export const confirmStellarSnapSignMessage = async (
  driver: Driver,
): Promise<void> => {
  await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
  await confirmSessionUpdateIfNeeded(driver);

  const signMessageConfirmation = new SnapSignMessageConfirmation(driver);
  await signMessageConfirmation.checkPageIsLoaded();
  await signMessageConfirmation.clickFooterConfirmButton();
};

export const confirmStellarSnapSignTransaction = async (
  driver: Driver,
): Promise<void> => {
  await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
  await confirmSessionUpdateIfNeeded(driver);

  const signTransactionConfirmation = new SnapSignTransactionConfirmation(
    driver,
  );
  await signTransactionConfirmation.checkPageIsLoaded();
  await signTransactionConfirmation.clickFooterConfirmButton();
};
