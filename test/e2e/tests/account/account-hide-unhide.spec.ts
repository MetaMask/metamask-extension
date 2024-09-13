import { Suite } from 'mocha';
import { Driver } from '../../webdriver/driver';
import { withFixtures, defaultGanacheOptions } from '../../helpers';
import FixtureBuilder from '../../fixture-builder';
import { loginWithBalanceValidation } from '../../page-objects/flows/login.flow';
import HomePage from '../../page-objects/pages/homepage';
import AccountListPage from '../../page-objects/pages/account-list-page';

describe('Account list - hide/unhide functionality', function (this: Suite) {
  it('hide account by clicking hide button', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder().build(),
        ganacheOptions: defaultGanacheOptions,
        title: this.test?.fullTitle(),
      },
      async ({ driver }: { driver: Driver }) => {
        await loginWithBalanceValidation(driver);
        const homePage = new HomePage(driver);
        const accountListPage = new AccountListPage(driver);

        await homePage.openAccountMenu();
        await accountListPage.openAccountOptions();
        await accountListPage.hideAccount();

        await accountListPage.assertHiddenAccountsListExists();
      },
    );
  });

  it('unhide account by clicking show account button', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder().build(),
        ganacheOptions: defaultGanacheOptions,
        title: this.test?.fullTitle(),
      },
      async ({ driver }: { driver: Driver }) => {
        await loginWithBalanceValidation(driver);
        const homePage = new HomePage(driver);
        const accountListPage = new AccountListPage(driver);

        await homePage.openAccountMenu();
        await accountListPage.openAccountOptions();
        await accountListPage.hideAccount();

        await accountListPage.openHiddenAccountsList();
        await accountListPage.openHiddenAccountOptions();
        await accountListPage.unhideAccount();

        await accountListPage.assertAccountExists();
      },
    );
  });
});
