import { Driver } from '../webdriver/driver';
import { TestSnaps } from '../page-objects/pages/test-snaps';
import FixtureBuilder from '../fixture-builder';
import { loginWithoutBalanceValidation } from '../page-objects/flows/login.flow';
import { withFixtures, WINDOW_TITLES } from '../helpers';

describe('Test Snap Lifecycle Hooks', function () {
  it('can run lifecycle hook on connect', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder().build(),
        title: this.test?.fullTitle(),
      },
      async ({ driver }: { driver: Driver }) => {
        await loginWithoutBalanceValidation(driver);

        const testSnaps = new TestSnaps(driver);

        await testSnaps.openPage();
        await testSnaps.clickLifeCycleHooks();
        await testSnaps.completeSnapInstallConfirmation();
        await testSnaps.check_installationComplete(
          testSnaps.connectLifeCycleButton,
          'Reconnect to Lifecycle Hooks Snap',
        );
        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
        await testSnaps.check_messageLifeCycleHook();
      },
    );
  });
});
