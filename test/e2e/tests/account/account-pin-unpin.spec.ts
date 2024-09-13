import { Suite } from 'mocha';
import { Driver } from '../../webdriver/driver';
import { withFixtures, defaultGanacheOptions } from '../../helpers';
import FixtureBuilder from '../../fixture-builder';
import { loginWithBalanceValidation } from '../../page-objects/flows/login.flow';
import HomePage from '../../page-objects/pages/homepage';
import AccountListPage from '../../page-objects/pages/account-list-page';

describe('Account list - pin/unpin functionality', function (this: Suite) {
  it('pin and unpin account by clicking the pin/unpin button', async function () {
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
        await accountListPage.pinAccount();
        await accountListPage.assertAccountIsPinned();

        await accountListPage.openAccountOptions();
        await accountListPage.unpinAccount();
        await accountListPage.assertAccountIsUnpinned();
      },
    );
  });

  it('account once hidden should be unpinned and remain so even if revealed again', async function () {
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
        await accountListPage.pinAccount();
        await accountListPage.assertAccountIsPinned();

        await accountListPage.openAccountOptions();
        await accountListPage.hideAccount();
        await accountListPage.assertHiddenAccountsListExists();
        await accountListPage.assertAccountIsUnpinned();

        await accountListPage.openHiddenAccountsList();
        await accountListPage.openHiddenAccountOptions();
        await accountListPage.unhideAccount();
        await accountListPage.assertAccountExists();
        await accountListPage.assertAccountIsUnpinned();
      },
    );
  });
});
