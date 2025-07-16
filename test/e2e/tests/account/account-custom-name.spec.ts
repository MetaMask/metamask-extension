import { Suite } from 'mocha';
import { Driver } from '../../webdriver/driver';
import { withFixtures } from '../../helpers';
import FixtureBuilder from '../../fixture-builder';
import { loginWithBalanceValidation } from '../../page-objects/flows/login.flow';
import AccountListPage from '../../page-objects/pages/account-list-page';
import HeaderNavbar from '../../page-objects/pages/header-navbar';

const newAccountLabel = 'Custom name';
const anotherAccountLabel = '2nd custom name';

describe('Account Custom Name Persistence', function (this: Suite) {
  it('persists custom account label through account change and wallet lock', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder().build(),
        title: this.test?.fullTitle(),
      },
      async ({ driver }: { driver: Driver }) => {
        await loginWithBalanceValidation(driver);

        const headerNavbar = new HeaderNavbar(driver);
        await headerNavbar.openAccountMenu();

        // Change account label for existing account and verify edited account label
        const accountListPage = new AccountListPage(driver);
        await accountListPage.check_pageIsLoaded();
        await accountListPage.openAccountOptionsMenu();
        await accountListPage.changeAccountLabel(newAccountLabel);
        await headerNavbar.check_accountLabel(newAccountLabel);

        // Add new account with custom label and verify new added account label
        await headerNavbar.openAccountMenu();
        await accountListPage.check_pageIsLoaded();
        await accountListPage.addNewAccount(anotherAccountLabel);
        await headerNavbar.check_accountLabel(anotherAccountLabel);

        // Switch back to the first account and verify first custom account persists
        await headerNavbar.openAccountMenu();
        await accountListPage.check_pageIsLoaded();
        await accountListPage.check_accountDisplayedInAccountList(
          newAccountLabel,
        );
        await accountListPage.switchToAccount(newAccountLabel);

        // Lock and unlock wallet
        await headerNavbar.lockMetaMask();
        await loginWithBalanceValidation(driver);

        // Verify both account labels persist after unlock
        await headerNavbar.check_accountLabel(newAccountLabel);
        await headerNavbar.openAccountMenu();
        await accountListPage.check_pageIsLoaded();
        await accountListPage.check_accountDisplayedInAccountList(
          anotherAccountLabel,
        );
      },
    );
  });
});
