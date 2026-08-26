import { Driver } from '../../webdriver/driver';
import HeaderNavbar from '../pages/header-navbar';
import GatorPermissionsPage from '../pages/permission/gator-permissions-page';
import PermissionListPage from '../pages/permission/permission-list-page';
import EditConnectedAccountsPage from '../pages/permission/edit-connected-accounts-page';

/**
 * Opens the Permissions Page (Connections page).
 * Handles both flows:
 * - Regular: Click "Permissions" → Permissions Page
 * - Gator (Flask): Click "Permissions" → Gator Permissions Page → Click "Connections" → Permissions Page
 * (If only dapp connections exist without gator permissions, auto-redirects to Permissions Page)
 *
 * @param driver - The webdriver instance.
 */
export const openPermissionsPageFlow = async (
  driver: Driver,
): Promise<void> => {
  console.log('Open permissions page flow');
  const headerNavbar = new HeaderNavbar(driver);
  await headerNavbar.clickAllPermissionsButton();

  const gatorPermissionsPage = new GatorPermissionsPage(driver);
  const isGatorPage = await gatorPermissionsPage.isPageDisplayed();

  if (isGatorPage) {
    // Wait for loading to complete before checking for buttons
    await gatorPermissionsPage.waitForLoadingComplete();

    // If only dapp connections exist (no gator permissions), the page auto-redirects to Permissions page
    const hasConnectionsButton =
      await gatorPermissionsPage.isConnectionsButtonPresent();
    if (hasConnectionsButton) {
      console.log(
        'Detected Gator Permissions Page "Connections" section, clicking to navigate to Permissions Page',
      );
      await gatorPermissionsPage.clickConnections();
    } else {
      console.log(
        'Gator Permissions Page detected - no Connections button means auto-redirect to Permissions page is happening',
      );
    }
  }
};

/**
 * Navigate to the Edit Accounts page for a specific host origin and return an
 * EditConnectedAccountsPage PO ready for assertions.
 *
 * Assumes the extension is the active window before this function is called.
 *
 * @param driver - The webdriver instance.
 * @param hostname - The hostname whose permissions page should be opened,
 * e.g. '127.0.0.1:8080'.
 * @returns An EditConnectedAccountsPage already verified to be loaded.
 */
export async function getEditConnectedAccountsPageForHost(
  driver: Driver,
  hostname: string,
): Promise<EditConnectedAccountsPage> {
  await openPermissionsPageFlow(driver);
  const permissionListPage = new PermissionListPage(driver);
  await permissionListPage.checkPageIsLoaded();
  await permissionListPage.openPermissionPageForSite(hostname);
  const editConnectedAccountsPage = new EditConnectedAccountsPage(driver);
  await editConnectedAccountsPage.checkPageIsLoaded(hostname);
  return editConnectedAccountsPage;
}
