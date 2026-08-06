import { WINDOW_TITLES } from '../../constants';
import { Driver } from '../../webdriver/driver';
import ConnectAccountConfirmation from '../pages/confirmations/connect-account-confirmation';
import EditConnectedAccountsModal from '../pages/dialog/edit-connected-accounts-modal';
import HomePage from '../pages/home/homepage';
import {
  type NetworkSelectionUpdate,
  updateConnectedSiteNetworkSelection,
  updateConnectedSiteNetworksToOnly,
} from './permissions.flow';

/**
 * Approve the MetaMask connect dialog after the dapp has initiated a
 * connection. Switches to the dialog, optionally adds extra accounts, then
 * confirms. The caller is responsible for triggering the connect action on the
 * dapp and for switching focus back to it afterwards.
 *
 * @param driver - Selenium driver
 * @param options - Options object with totalAccounts
 * @param options.totalAccounts - Total number of accounts to connect (default: 1)
 */
export async function approveConnect(
  driver: Driver,
  { totalAccounts = 1 }: { totalAccounts?: number } = {},
): Promise<void> {
  await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
  const confirmation = new ConnectAccountConfirmation(driver);
  await confirmation.checkPageIsLoaded();

  if (totalAccounts > 1) {
    await confirmation.openEditAccountsModal();
    const editAccountsModal = new EditConnectedAccountsModal(driver);
    await editAccountsModal.checkPageIsLoaded();
    for (let i = 1; i < totalAccounts; i++) {
      await editAccountsModal.addNewAccount();
    }
  }

  await confirmation.confirmConnect();
}

/**
 * Confirms the connect dialog, then narrows the connected site's network
 * permissions from the Connected sites page.
 *
 * @param driver - Selenium driver
 * @param hostname - Site hostname shown on the permissions page
 * @param networkUpdates - Network display names and desired selection state
 */
export async function confirmConnectAndUpdateSiteNetworks(
  driver: Driver,
  hostname: string,
  networkUpdates: NetworkSelectionUpdate[],
): Promise<void> {
  await approveConnect(driver);
  await driver.switchToWindowWithTitle(WINDOW_TITLES.ExtensionInFullScreenView);
  await updateConnectedSiteNetworkSelection(driver, hostname, networkUpdates);
}

/**
 * Confirms the connect dialog, then limits the connected site's network
 * permissions to the provided list from the Connected sites page.
 *
 * @param driver - Selenium driver
 * @param hostname - Site hostname shown on the permissions page
 * @param selectedNetworkNames - Network display names that should remain selected
 */
export async function confirmConnectAndUpdateSiteNetworksToOnly(
  driver: Driver,
  hostname: string,
  selectedNetworkNames: string[],
): Promise<void> {
  await approveConnect(driver);
  await driver.switchToWindowWithTitle(WINDOW_TITLES.ExtensionInFullScreenView);
  await updateConnectedSiteNetworksToOnly(
    driver,
    hostname,
    selectedNetworkNames,
  );
}
