import { Driver } from '../../webdriver/driver';
import EditConnectedAccountsModal from '../pages/dialog/edit-connected-accounts-modal';
import NetworkPermissionSelectModal from '../pages/dialog/network-permission-select-modal';
import HeaderNavbar from '../pages/header-navbar';
import GatorPermissionsPage from '../pages/permission/gator-permissions-page';
import PermissionListPage from '../pages/permission/permission-list-page';
import SitePermissionPage from '../pages/permission/site-permission-page';

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
 * Opens the network and account permission modals from the site permission
 * page and asserts that the expected networks and accounts are displayed.
 *
 * @param driver - The webdriver instance.
 * @param sitePermissionPage - The site permission page already navigated to.
 * @param hostname - The hostname shown on the site permission page,
 * e.g. '127.0.0.1:8080'.
 * @param networks - Network display names expected to be selected.
 * @param accounts - Account labels expected to be displayed.
 */
export async function checkAccountsAndNetworksDisplayed(
  driver: Driver,
  sitePermissionPage: SitePermissionPage,
  hostname: string,
  networks: string[],
  accounts: string[],
): Promise<void> {
  await sitePermissionPage.checkPageIsLoaded(hostname);
  await sitePermissionPage.openNetworkPermissionsModal();
  const networkPermissionSelectModal = new NetworkPermissionSelectModal(driver);
  await networkPermissionSelectModal.checkPageIsLoaded();
  await networkPermissionSelectModal.checkNetworkStatus(networks);
  await networkPermissionSelectModal.clickConfirmEditButton();

  await sitePermissionPage.openAccountPermissionsModal();
  const editConnectedAccountsModal = new EditConnectedAccountsModal(driver);
  await editConnectedAccountsModal.checkPageIsLoaded();
  await editConnectedAccountsModal.checkAccountsAreDisplayed(accounts);
}

/**
 * Navigate to the permissions page for a specific host origin and return a
 * SitePermissionPage PO ready for assertions.
 *
 * Assumes the extension is the active window before this function is called.
 *
 * @param driver - The webdriver instance.
 * @param hostname - The hostname whose permissions page should be opened,
 * e.g. '127.0.0.1:8080'.
 * @returns A SitePermissionPage already verified to be loaded.
 */
export async function getPermissionsPageForHost(
  driver: Driver,
  hostname: string,
): Promise<SitePermissionPage> {
  await openPermissionsPageFlow(driver);
  const permissionListPage = new PermissionListPage(driver);
  await permissionListPage.checkPageIsLoaded();
  await permissionListPage.openPermissionPageForSite(hostname);
  const sitePermissionPage = new SitePermissionPage(driver);
  await sitePermissionPage.checkPageIsLoaded(hostname);
  return sitePermissionPage;
}

export type NetworkSelectionUpdate = {
  networkName: string;
  shouldBeSelected: boolean;
};

async function editConnectedSiteNetworks(
  driver: Driver,
  hostname: string,
  editNetworks: (modal: NetworkPermissionSelectModal) => Promise<void>,
): Promise<void> {
  const sitePermissionPage = await getPermissionsPageForHost(driver, hostname);
  await sitePermissionPage.openNetworkPermissionsModal();
  const networkPermissionSelectModal = new NetworkPermissionSelectModal(driver);
  await networkPermissionSelectModal.checkPageIsLoaded();
  await editNetworks(networkPermissionSelectModal);
  await networkPermissionSelectModal.clickConfirmEditButton();
}

/**
 * Updates the connected site's permitted networks from the Connected sites page.
 *
 * @param driver - The webdriver instance.
 * @param hostname - The hostname shown on the site permission page.
 * @param updates - Network display names and desired selection state.
 */
export async function updateConnectedSiteNetworkSelection(
  driver: Driver,
  hostname: string,
  updates: NetworkSelectionUpdate[],
): Promise<void> {
  await editConnectedSiteNetworks(driver, hostname, async (modal) => {
    for (const { networkName, shouldBeSelected } of updates) {
      await modal.selectNetwork({
        networkName,
        shouldBeSelected,
      });
    }
  });
}

/**
 * Updates the connected site's permitted networks so only the specified
 * networks remain selected.
 *
 * @param driver - The webdriver instance.
 * @param hostname - The hostname shown on the site permission page.
 * @param selectedNetworkNames - Network display names that should remain selected.
 */
export async function updateConnectedSiteNetworksToOnly(
  driver: Driver,
  hostname: string,
  selectedNetworkNames: string[],
): Promise<void> {
  await editConnectedSiteNetworks(driver, hostname, async (modal) => {
    await modal.updateNetworkStatus(selectedNetworkNames);
  });
}
