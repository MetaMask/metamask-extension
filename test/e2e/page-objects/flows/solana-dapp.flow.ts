import { Driver } from '../../webdriver/driver';
import { TestDappSolana } from '../pages/test-dapp-solana';
import { DAPP_HOST_ADDRESS, WINDOW_TITLES } from '../../constants';
import { SOLANA_DEVNET_URL } from '../../tests/solana/common-solana';
import ConnectAccountConfirmation from '../pages/confirmations/connect-account-confirmation';
import { updateConnectedSiteNetworkSelection } from './permissions.flow';

/**
 * Ensures Solana Devnet is permitted for the connected site from Connected sites.
 *
 * @param driver
 */
const selectDevnet = async (driver: Driver): Promise<void> => {
  console.log('select devnet on connected sites page');
  await driver.switchToWindowWithTitle(WINDOW_TITLES.ExtensionInFullScreenView);
  await updateConnectedSiteNetworkSelection(driver, DAPP_HOST_ADDRESS, [
    {
      networkName: 'Solana Devnet',
      shouldBeSelected: true,
    },
  ]);
};

/**
 * Connects the Solana test dapp to the wallet.
 *
 * @param driver
 * @param testDapp
 * @param options
 * @param options.includeDevnet
 */
export const connectSolanaTestDapp = async (
  driver: Driver,
  testDapp: TestDappSolana,
  options: {
    includeDevnet?: boolean;
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

  await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);

  const connectAccountConfirmation = new ConnectAccountConfirmation(driver);
  await connectAccountConfirmation.checkPageIsLoaded();
  await connectAccountConfirmation.confirmConnect();

  if (options?.includeDevnet) {
    await selectDevnet(driver);
  }

  await testDapp.switchTo();
  console.log('solana test dapp connected');
};
