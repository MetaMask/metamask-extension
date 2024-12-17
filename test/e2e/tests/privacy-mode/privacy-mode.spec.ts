import { Driver } from '../../webdriver/driver';
import {
  withFixtures,
  unlockWallet,
  defaultGanacheOptions,
} from '../../helpers';
import FixtureBuilder from '../../fixture-builder';
import HomePage from '../../page-objects/pages/home/homepage';
import { loginWithBalanceValidation } from '../../page-objects/flows/login.flow';
import { Ganache } from '../../seeder/ganache';
import HeaderNavbar from '../../page-objects/pages/header-navbar';

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
        await headerNavbar.check_balanceIsPrivateEverywhere();
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
        await unlockWallet(driver);

        const homePage = new HomePage(driver);
        await homePage.check_pageIsLoaded();
        await homePage.togglePrivacyBalance();
        await homePage.check_expectedBalanceIsDisplayed('25 ETH');

        const headerNavbar = new HeaderNavbar(driver);
        await headerNavbar.openAccountMenu();
        await headerNavbar.check_accountBalance({
          balance: '25',
          currency: 'ETH',
        });
      },
    );
  });
});
