import { Driver } from '../../webdriver/driver';
import AccountListPage from '../pages/accounts/list-page';
import HeaderNavbar from '../pages/home/header-navbar';
import SideNavAccounts from '../pages/home/side-nav-accounts';

// How long a single attempt waits for the account list after clicking in ms
const ACCOUNT_LIST_ATTEMPT_TIMEOUT = 3000;

/**
 * Opens the account list from the home screen in whichever layout is rendered.
 *
 * The entry point differs by layout: the narrow layout has a button in the app
 * header, the wide layout has one in the side nav's accounts section. Both
 * buttons share a test id, so the side nav is checked first. The layout is only
 * known once the page has rendered (it depends on the viewport and the A/B
 * variant), so this waits until one of the two entry points shows up.
 *
 * @param driver - The webdriver instance.
 */
export const openAccountMenu = async (driver: Driver): Promise<void> => {
  const headerNavbar = new HeaderNavbar(driver);
  const sideNavAccounts = new SideNavAccounts(driver);
  const accountListPage = new AccountListPage(driver);

  let lastFailure = 'no account menu entry point was visible';
  try {
    await driver.waitUntil(
      async () => {
        try {
          if (await sideNavAccounts.isPresentAndVisible(200)) {
            await sideNavAccounts.clickManageAccounts();
          } else if (
            await headerNavbar.isAccountMenuButtonPresentAndVisible(200)
          ) {
            await headerNavbar.clickAccountMenuButton();
          } else {
            return false;
          }
          await accountListPage.checkPageIsDisplayed(
            ACCOUNT_LIST_ATTEMPT_TIMEOUT,
          );
          return true;
        } catch (error) {
          lastFailure = String(error);
          console.log(
            `Retrying opening the account menu after: ${lastFailure}`,
          );
          return false;
        }
      },
      { timeout: driver.timeout * 2, interval: 200 },
    );
  } catch (error) {
    throw new Error(
      `Could not open the account list. Last failure: ${lastFailure}`,
      { cause: error },
    );
  }
};
