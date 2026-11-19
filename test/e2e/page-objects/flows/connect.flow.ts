import { WINDOW_TITLES } from '../../constants';
import { Driver } from '../../webdriver/driver';
import ConnectAccountConfirmation from '../pages/confirmations/connect-account-confirmation';
import EditConnectedAccountsPage from '../pages/permission/edit-connected-accounts-page';

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
    const editConnectedAccountsPage = new EditConnectedAccountsPage(driver);
    await editConnectedAccountsPage.checkPageIsLoaded();
    for (let i = 1; i < totalAccounts; i++) {
      await editConnectedAccountsPage.addNewAccount();
    }
  }

  await confirmation.confirmConnect();
}
