import { Driver } from '../../webdriver/driver';
import { withFixtures } from '../../helpers';
import FixtureBuilder from '../../fixtures/fixture-builder';
import AccountListPage from '../../page-objects/pages/account-list-page';
import HeaderNavbar from '../../page-objects/pages/header-navbar';
import HomePage from '../../page-objects/pages/home/homepage';
import {
  loginWithBalanceValidation,
  loginWithoutBalanceValidation,
} from '../../page-objects/flows/login.flow';

describe('Privacy Mode', function () {
  it('should hide fiat balance and token balance when privacy mode is activated', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder().build(),
        title: this.test?.fullTitle(),
      },
      async ({ driver }: { driver: Driver }) => {
        await loginWithBalanceValidation(driver);
        const homePage = new HomePage(driver);
        await homePage.checkPageIsLoaded();
        await homePage.togglePrivacyBalance();
        await homePage.checkExpectedBalanceIsDisplayed('••••••', '••••••');

        const headerNavbar = new HeaderNavbar(driver);
        await headerNavbar.openAccountMenu();

        const accountList = new AccountListPage(driver);
        await accountList.checkPageIsLoaded();
        await accountList.checkBalanceIsPrivateEverywhere();
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
        title: this.test?.fullTitle(),
      },
      async ({ driver }: { driver: Driver }) => {
        await loginWithoutBalanceValidation(driver);

        const homePage = new HomePage(driver);
        await homePage.checkPageIsLoaded();
        await homePage.togglePrivacyBalance();
        await homePage.checkExpectedBalanceIsDisplayed('25 ETH');

        const headerNavbar = new HeaderNavbar(driver);
        await headerNavbar.openAccountMenu();

        const accountList = new AccountListPage(driver);
        await accountList.checkPageIsLoaded();
        await accountList.checkAccountBalanceDisplayed('$42,500');
      },
    );
  });
});
