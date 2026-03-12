import { Driver } from '../../webdriver/driver';
import Homepage from '../pages/home/homepage';
import PermissionListPage from '../pages/permission/permission-list-page';
import SitePermissionPage from '../pages/permission/site-permission-page';

/**
 * Navigate to the permissions page for a specific host origin and return a
 * SitePermissionPage PO ready for assertions.
 *
 * Assumes the extension is the active window before this function is called.
 *
 * @param driver - The webdriver instance.
 * @param hostname - The hostname whose permissions page should be opened,
 *   e.g. '127.0.0.1:8080'.
 * @returns A SitePermissionPage already verified to be loaded.
 */
export async function getPermissionsPageForHost(
  driver: Driver,
  hostname: string,
): Promise<SitePermissionPage> {
  const homepage = new Homepage(driver);
  await homepage.headerNavbar.openPermissionsPage();
  const permissionListPage = new PermissionListPage(driver);
  await permissionListPage.checkPageIsLoaded();
  await permissionListPage.openPermissionPageForSite(hostname);
  const sitePermissionPage = new SitePermissionPage(driver);
  await sitePermissionPage.checkPageIsLoaded(hostname);
  return sitePermissionPage;
}
