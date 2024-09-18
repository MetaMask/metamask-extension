import { Suite } from 'mocha';
import { Driver } from '../../../webdriver/driver';
import { withFixtures, defaultGanacheOptions } from '../../../helpers';
import FixtureBuilder from '../../../fixture-builder';
import { loginWithBalanceValidation } from '../../../page-objects/flows/login.flow';
import HomePage from '../../../page-objects/pages/homepage';
import AccountListPage from '../../../page-objects/pages/account-list-page';

const newAccountLabel = 'Custom name';
const anotherAccountLabel = '2nd custom name';

describe('Account Custom Name Persistence', function (this: Suite) {
  it('persists custom account label through account change and wallet lock', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder().build(),
        ganacheOptions: defaultGanacheOptions,
        title: this.test?.fullTitle(),
      },
      async ({ driver }: { driver: Driver }) => {
        const homePage = new HomePage(driver);
        const accountListPage = new AccountListPage(driver);

        await loginWithBalanceValidation(driver);

        // Change account label for existing account
        await accountListPage.openAccountOptionsMenu();
        await accountListPage.changeAccountLabel(newAccountLabel);

        // Verify account label
        await accountListPage.verifyAccountLabel(newAccountLabel);

        // Add new account with custom label
        await accountListPage.addNewAccountWithCustomLabel(anotherAccountLabel);

        // Verify initial custom account label after freshly added account was active
        await accountListPage.verifyAccountLabel(anotherAccountLabel);

        // Switch back to the first account
        await homePage.openAccountMenu();
        await accountListPage.verifyAccountLabel(newAccountLabel);

        // Lock and unlock wallet
        await homePage.headerNavbar.lockMetaMask();
        await loginWithBalanceValidation(driver);

        // Verify both account labels persist after unlock
        await accountListPage.verifyAccountLabel(newAccountLabel);
        await homePage.openAccountMenu();
        await accountListPage.verifyAccountLabel(anotherAccountLabel);
      },
    );
  });
});
