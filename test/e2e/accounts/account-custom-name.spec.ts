import { Suite } from 'mocha';
import { unlockWallet, withFixtures } from '../helpers';
import FixtureBuilder from '../fixture-builder';
import { Driver } from '../webdriver/driver';

const newAccountLabel = 'Custom name';

describe('Account Custom Name Persistence', function (this: Suite) {
  it('persists custom account name through account change and wallet lock', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder().build(),
        title: this.test?.fullTitle(),
      },
      async ({ driver }: { driver: Driver }) => {
        await unlockWallet(driver);
        await driver.clickElement(
          '[data-testid="account-options-menu-button"]',
        );
        await driver.clickElement('[data-testid="account-list-menu-details"]');
        await driver.clickElement('[data-testid="editable-label-button"]');
        await driver.fill(
          'input[data-testid="account-name-editable-label"]',
          newAccountLabel,
        );
        // await driver.delay(1000);
      },
    );
  });
});
