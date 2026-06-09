import { Driver } from '../../webdriver/driver';
import { TestDappSolana } from '../pages/test-dapp-solana';
import { WINDOW_TITLES } from '../../constants';
import { SOLANA_DEVNET_URL } from '../../tests/solana/common-solana';
import ConnectAccountConfirmation from '../pages/confirmations/connect-account-confirmation';
import NetworkPermissionSelectModal from '../pages/dialog/network-permission-select-modal';

/**
 * Selects the Devnet checkbox in the permissions tab during connection.
 *
 * @param driver
 */
const selectDevnet = async (driver: Driver): Promise<void> => {
  console.log('select devnet on permissions tab');

  const connectAccountConfirmation = new ConnectAccountConfirmation(driver);
  await connectAccountConfirmation.checkPageIsLoaded();
  await connectAccountConfirmation.goToPermissionsTab();
  await connectAccountConfirmation.openEditNetworksModal();

  const networkPermissionSelectModal = new NetworkPermissionSelectModal(driver);
  await networkPermissionSelectModal.checkPageIsLoaded();
  await networkPermissionSelectModal.selectNetwork({
    networkName: 'Solana Devnet',
  });
  await networkPermissionSelectModal.clickConfirmEditButton();
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

  if (options?.includeDevnet) {
    await selectDevnet(driver);
  }

  const connectAccountConfirmation = new ConnectAccountConfirmation(driver);
  await connectAccountConfirmation.checkPageIsLoaded();
  await connectAccountConfirmation.confirmConnect();

  await testDapp.switchTo();
  console.log('solana test dapp connected');
};
