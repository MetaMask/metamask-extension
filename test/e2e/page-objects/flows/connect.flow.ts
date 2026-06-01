import { WINDOW_TITLES } from '../../constants';
import { Driver } from '../../webdriver/driver';
import ConnectAccountConfirmation from '../pages/confirmations/connect-account-confirmation';
import EditConnectedAccountsModal from '../pages/dialog/edit-connected-accounts-modal';
import NetworkPermissionSelectModal from '../pages/dialog/network-permission-select-modal';

/**
 * Approve the MetaMask connect dialog after the dapp has initiated a
 * connection. Switches to the dialog, optionally adds extra accounts and
 * extra permitted networks, then confirms. The caller is responsible for
 * triggering the connect action on the dapp and for switching focus back
 * to it afterwards.
 *
 * @param driver - Selenium driver
 * @param options - Options object with totalAccounts and extraNetworks
 * @param options.totalAccounts - Total number of accounts to connect (default: 1)
 * @param options.extraNetworks - Additional network display names to permit (e.g. ['Polygon'])
 */
export async function approveConnect(
  driver: Driver,
  {
    totalAccounts = 1,
    extraNetworks = [],
  }: { totalAccounts?: number; extraNetworks?: string[] } = {},
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

  if (extraNetworks.length > 0) {
    await confirmation.goToPermissionsTab();
    await confirmation.openEditNetworksModal();
    const networkModal = new NetworkPermissionSelectModal(driver);
    await networkModal.checkPageIsLoaded();
    for (const networkName of extraNetworks) {
      await networkModal.selectNetwork({ networkName, shouldBeSelected: true });
    }
    await networkModal.clickConfirmEditButton();
    await confirmation.checkPageIsLoaded();
  }

  await confirmation.confirmConnect();
}
