import { Suite } from 'mocha';
import FixtureBuilderV2 from '../../fixtures/fixture-builder-v2';
import { withFixtures } from '../../helpers';
import { Driver } from '../../webdriver/driver';
import HeaderNavbar from '../../page-objects/pages/header-navbar';
import {
  lockAndWaitForLoginPage,
  login,
} from '../../page-objects/flows/login.flow';

describe('Migrate vault with old encryption', function (this: Suite) {
  it('successfully unlocks an old vault, locks it, and unlocks again', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilderV2()
          .withKeyringControllerOldVault()
          .build(),
        // to avoid a race condition where some authentication requests are triggered once the wallet is locked
        ignoredConsoleErrors: ['unable to proceed, wallet is locked'],
        title: this.test?.fullTitle(),
      },
      async ({ driver }: { driver: Driver }) => {
        await login(driver);

        const headerNavbar = new HeaderNavbar(driver);
        await headerNavbar.checkPageIsLoaded();
        await lockAndWaitForLoginPage(driver);
        await login(driver);
      },
    );
  });
});
