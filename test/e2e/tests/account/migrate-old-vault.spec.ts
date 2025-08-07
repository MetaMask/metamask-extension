import { Suite } from 'mocha';
import { Mockttp } from 'mockttp';
import { USER_STORAGE_FEATURE_NAMES } from '@metamask/profile-sync-controller/sdk';
import { mockIdentityServices } from '../identity/mocks';
import { withFixtures } from '../../helpers';
import { UserStorageMockttpController } from '../../helpers/identity/user-storage/userStorageMockttpController';
import FixtureBuilder from '../../fixture-builder';
import { Driver } from '../../webdriver/driver';
import HeaderNavbar from '../../page-objects/pages/header-navbar';
import LoginPage from '../../page-objects/pages/login-page';
import { loginWithBalanceValidation } from '../../page-objects/flows/login.flow';

describe('Migrate vault with old encryption', function (this: Suite) {
  const userStorageMockttpController = new UserStorageMockttpController();
  it('successfully unlocks an old vault, locks it, and unlocks again', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder().withKeyringControllerOldVault().build(),
        testSpecificMock: (server: Mockttp) => {
          userStorageMockttpController.setupPath(
            USER_STORAGE_FEATURE_NAMES.accounts,
            server,
          );

          return mockIdentityServices(server, userStorageMockttpController);
        },
        title: this.test?.fullTitle(),
      },
      async ({ driver }: { driver: Driver }) => {
        await loginWithBalanceValidation(driver);

        const headerNavbar = new HeaderNavbar(driver);
        await headerNavbar.check_pageIsLoaded();
        await headerNavbar.lockMetaMask();
        const loginPage = new LoginPage(driver);
        await loginPage.check_pageIsLoaded();
        await loginWithBalanceValidation(driver);
      },
    );
  });
});
