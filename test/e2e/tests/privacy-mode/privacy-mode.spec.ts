import { Driver } from '../../webdriver/driver';
import { defaultGanacheOptions, withFixtures } from '../../helpers';
import FixtureBuilder from '../../fixture-builder';
import AccountListPage from '../../page-objects/pages/account-list-page';
import HeaderNavbar from '../../page-objects/pages/header-navbar';
import HomePage from '../../page-objects/pages/home/homepage';
import {
  loginWithBalanceValidation,
  loginWithoutBalanceValidation,
} from '../../page-objects/flows/login.flow';
import { Ganache } from '../../seeder/ganache';

describe('Privacy Mode', function () {
  it('should hide fiat balance and token balance when privacy mode is activated', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder().build(),
        ganacheOptions: defaultGanacheOptions,
        title: this.test?.fullTitle(),
      },
      async ({
        driver,
        ganacheServer,
      }: {
        driver: Driver;
        ganacheServer: Ganache;
      }) => {
        await loginWithBalanceValidation(driver, ganacheServer);
        const homePage = new HomePage(driver);
        await homePage.check_pageIsLoaded();
        await homePage.togglePrivacyBalance();
        await homePage.check_expectedBalanceIsDisplayed('••••••', '••••••');

        const headerNavbar = new HeaderNavbar(driver);
        await headerNavbar.openAccountMenu();

        const accountList = new AccountListPage(driver);
        await accountList.check_pageIsLoaded();
        await accountList.check_balanceIsPrivateEverywhere();
      },
    );
  });

  it('should show fiat balance and token balance when privacy mode is deactivated', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder()
          .withPreferencesController({
            preferences: {
              privacyMode: true,
            },
          })
          .build(),
        ganacheOptions: defaultGanacheOptions,
        title: this.test?.fullTitle(),
      },
      async ({ driver }: { driver: Driver }) => {
        await loginWithoutBalanceValidation(driver);

        const homePage = new HomePage(driver);
        await homePage.check_pageIsLoaded();
        await homePage.togglePrivacyBalance();
        await homePage.check_expectedBalanceIsDisplayed('25 ETH');

        const headerNavbar = new HeaderNavbar(driver);
        await headerNavbar.openAccountMenu();

        const accountList = new AccountListPage(driver);
        await accountList.check_pageIsLoaded();
        await accountList.check_accountBalanceDisplayed('25');
      },
    );
  });
});
