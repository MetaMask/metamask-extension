import { Driver } from '../../webdriver/driver';
import { TestDappSolana } from '../pages/test-dapp-solana';
import { WINDOW_TITLES } from '../../constants';
import { SOLANA_DEVNET_URL } from '../../tests/solana/common-solana';
import ConnectAccountConfirmation from '../pages/confirmations/connect-account-confirmation';

/**
 * Connects the Solana test dapp to the wallet.
 *
 * @param driver
 * @param testDapp
 * @param options
 * @param options.expectExistingSession - When true, the wallet is expected to
 * already hold a CAIP-25 session for the dapp (seeded via fixtures, e.g. with
 * `buildSolanaFixtureScopes`), so the Wallet Standard connect
 * restores it silently and no MetaMask approval dialog appears. This is the
 * only way to connect with the Devnet scope: a live connect grants non-test
 * networks only.
 */
export const connectSolanaTestDapp = async (
  driver: Driver,
  testDapp: TestDappSolana,
  options: {
    expectExistingSession?: boolean;
  } = {},
): Promise<void> => {
  console.log('connect solana test dapp');
  await testDapp.checkPageIsLoaded();
  const header = await testDapp.getHeader();
  await header.setEndpoint(SOLANA_DEVNET_URL);
  await testDapp.clickUpdateEndpointButton();

  await header.connect();

  const modal = await testDapp.getWalletModal();
  await modal.connectToMetaMaskWallet();

  if (options?.expectExistingSession) {
    await header.verifyConnectionStatus('Connected');
  } else {
    await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);

    const connectAccountConfirmation = new ConnectAccountConfirmation(driver);
    await connectAccountConfirmation.checkPageIsLoaded();
    await connectAccountConfirmation.confirmConnect();

    await testDapp.switchTo();
  }
  console.log('solana test dapp connected');
};
