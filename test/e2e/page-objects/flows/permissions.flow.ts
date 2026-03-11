import { Driver } from '../../webdriver/driver';
import HeaderNavbar from '../pages/header-navbar';
import GatorPermissionsPage from '../pages/permission/gator-permissions-page';

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
