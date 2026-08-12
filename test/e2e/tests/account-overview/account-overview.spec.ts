import { Driver } from '../../webdriver/driver';
import { withFixtures } from '../../helpers';
import FixtureBuilderV2 from '../../fixtures/fixture-builder-v2';
import { login } from '../../page-objects/flows/login.flow';

async function clickAccountMenuHelper(driver: Driver): Promise<void> {
  await driver.clickElement('[data-testid="account-menu-icon"]');
}

describe('Account overview', function () {
  it('opens the account menu from the global menu', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilderV2().build(),
        title: this.test?.fullTitle(),
      },
      async ({ driver }: { driver: Driver }) => {
        await login(driver);

        await driver.clickElement(
          '[data-testid="account-options-menu-button"]',
        );

        await clickAccountMenuHelper(driver);

        await driver.delay(1500);

        await new Promise((resolve) => setTimeout(resolve, 500));
      },
    );
  });
});
