import { Driver } from '../../webdriver/driver';
import HeaderNavbar from '../pages/header-navbar';
import GatorPermissionsPage from '../pages/permission/gator-permissions-page';
import PermissionListPage from '../pages/permission/permission-list-page';
import SitePermissionPage from '../pages/permission/site-permission-page';

export type OpenPermissionsPageOptions = {
  /**
   * If true, stops at Gator Permissions Page without clicking "Sites".
   * Only relevant for Flask builds with Gator flow.
   */
  skipSitesNavigation?: boolean;
};

/**
 * Opens the Permissions Page (Sites/Connections page).
 * Handles both flows:
 * - Regular: Click "All Permissions" → Permissions Page
 * - Gator (Flask): Click "All Permissions" → Gator Permissions Page → Click "Sites" → Permissions Page
 *
 * @param driver - The webdriver instance.
 * @param options - Optional configuration.
 */
export const openPermissionsPageFlow = async (
  driver: Driver,
  options?: OpenPermissionsPageOptions,
): Promise<void> => {
  console.log('Open permissions page flow');
  const headerNavbar = new HeaderNavbar(driver);
  await headerNavbar.clickAllPermissionsButton();

  const gatorPermissionsPage = new GatorPermissionsPage(driver);
  const isGatorPage = await gatorPermissionsPage.isPageDisplayed();

  if (isGatorPage && !options?.skipSitesNavigation) {
    console.log(
      'Detected Gator Permissions Page, clicking "Sites" to navigate to Permissions Page',
    );
    await gatorPermissionsPage.clickSites();
  }
};

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
