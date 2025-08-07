import { Suite } from 'mocha';
import { Mockttp } from 'mockttp';
import { USER_STORAGE_FEATURE_NAMES } from '@metamask/profile-sync-controller/sdk';
import { mockIdentityServices } from '../identity/mocks';
import { UserStorageMockttpController } from '../../helpers/identity/user-storage/userStorageMockttpController';
import { withFixtures } from '../../helpers';
import FixtureBuilder from '../../fixture-builder';
import HomePage from '../../page-objects/pages/home/homepage';
import { Driver } from '../../webdriver/driver';
import { loginWithBalanceValidation } from '../../page-objects/flows/login.flow';

describe('Lock and unlock', function (this: Suite) {
  const userStorageMockttpController = new UserStorageMockttpController();
  it('successfully unlocks after lock', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder().build(),
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

        const homePage = new HomePage(driver);
        await homePage.headerNavbar.lockMetaMask();
        await loginWithBalanceValidation(driver);
      },
    );
  });
});
