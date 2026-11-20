import { Driver } from '../../webdriver/driver';
import AccountListPage from '../pages/accounts/list-page';
import HeaderNavbar from '../pages/home/header-navbar';
import SideNavAccounts from '../pages/home/side-nav-accounts';

/**
 * Opens the account list from the home screen in whichever layout is rendered.
 *
 * The entry point differs by layout: the narrow layout has a button in the app
 * header, the wide layout has one in the side nav's accounts section. Both
 * buttons share a test id, so the side nav is checked first. The layout is only
 * known once the page has rendered (it depends on the viewport and the A/B
 * variant), so this waits until one of the two entry points shows up.
 *
 * Temporary indirection: once the wide layout is the only layout, tests can
 * call `SideNavAccounts.clickManageAccounts` directly and this flow can go.
 * Tests that exercise the side nav on purpose should do exactly that already.
 *
 * @param driver - The webdriver instance.
 */
export const openAccountMenu = async (driver: Driver): Promise<void> => {
  const headerNavbar = new HeaderNavbar(driver);
  const sideNavAccounts = new SideNavAccounts(driver);

  let isSideNavLayout = false;
  await driver.waitUntil(
    async () => {
      isSideNavLayout = await sideNavAccounts.isPresentAndVisible(200);
      return (
        isSideNavLayout ||
        (await headerNavbar.isAccountMenuButtonPresentAndVisible(200))
      );
    },
    { timeout: driver.timeout, interval: 200 },
  );

  if (isSideNavLayout) {
    await sideNavAccounts.clickManageAccounts();
  } else {
    await headerNavbar.clickAccountMenuButton();
  }
  await new AccountListPage(driver).checkPageIsDisplayed();
};
