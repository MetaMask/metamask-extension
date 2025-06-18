import { Suite } from 'mocha';
import { withFixtures } from '../../helpers';
import FixtureBuilder from '../../fixture-builder';
import { Driver } from '../../webdriver/driver';
import HomePage from '../../page-objects/pages/home/homepage';
import LoginPage from '../../page-objects/pages/login-page';
import { loginWithBalanceValidation } from '../../page-objects/flows/login.flow';

describe('Migrate vault with old encryption', function (this: Suite) {
  it('successfully unlocks an old vault, locks it, and unlocks again', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder().withKeyringControllerOldVault().build(),
        title: this.test?.fullTitle(),
      },
      async ({ driver }: { driver: Driver }) => {
        await loginWithBalanceValidation(driver);
        const homePage = new HomePage(driver);
        // just a test
        await driver.delay(5000);
        await homePage.headerNavbar.lockMetaMask();
        const loginPage = new LoginPage(driver);
        await loginPage.check_pageIsLoaded();
        await loginWithBalanceValidation(driver);
      },
    );
  });
});
