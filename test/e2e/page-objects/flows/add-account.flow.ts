import { Driver } from '../../webdriver/driver';
import HomePage from '../pages/home/homepage';
import AccountListPage from '../pages/account-list-page';

/**
 * Opens the account menu, adds a new multichain account, verifies it is
 * displayed, and either switches to the specified account or closes the page.
 *
 * @param options - Flow options.
 * @param options.driver - The webdriver instance.
 * @param options.createdAccountLabel - Expected label of the newly created account. Defaults to 'Account 2'.
 * @param options.switchToAccount - Account label to switch to after creation.
 */
export const addAccount = async ({
  driver,
  createdAccountLabel = 'Account 2',
  switchToAccount,
}: {
  driver: Driver;
  createdAccountLabel?: string;
  switchToAccount?: string;
}): Promise<void> => {
  const homepage = new HomePage(driver);
  await homepage.checkExpectedBalanceIsDisplayed();
  await homepage.headerNavbar.openAccountMenu();

  const accountListPage = new AccountListPage(driver);
  await accountListPage.checkPageIsLoaded();
  await accountListPage.addMultichainAccount();
  await accountListPage.checkAccountDisplayedInAccountList(createdAccountLabel);

  if (switchToAccount) {
    await accountListPage.selectAccount(switchToAccount);
  } else {
    await accountListPage.closeMultichainAccountsPage();
  }
};
