import { Suite } from 'mocha';
import { withFixtures, defaultGanacheOptions } from '../helpers';
import { Driver } from '../webdriver/driver';
import { installSnapSimpleKeyring, makeNewAccountAndSwitch } from './common';

// eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires
const FixtureBuilder = require('../fixture-builder');

describe('Smart Swaps', function (this: Suite) {
  it('should be disabled for snap accounts', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder().build(),
        ganacheOptions: defaultGanacheOptions,
        title: this.test?.fullTitle(),
      },
      async ({ driver }: { driver: Driver }) => {
        await installSnapSimpleKeyring(driver, false);
        await makeNewAccountAndSwitch(driver);
        await driver.clickElement('[data-testid="token-overview-button-swap"]');
        await driver.clickElement('[title="Transaction settings"]');

        await driver.assertElementNotPresent(
          '[data-testid="transaction-settings-smart-swaps-toggle"]',
          { findElementGuard: { tag: 'h6', text: 'Slippage tolerance' } }, // wait for the modal to appear
        );
      },
    );
  });
});
