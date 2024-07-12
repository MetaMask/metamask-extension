import { Suite } from 'mocha';

import FixtureBuilder from '../../fixture-builder';
import {
  defaultGanacheOptions,
  unlockWallet,
  withFixtures,
} from '../../helpers';
import { Driver } from '../../webdriver/driver';

describe('BTC Experimental Settings', function (this: Suite) {
  it('will show `Add a new Bitcoin account (Beta)` option when setting is enabled', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder().build(),
        ganacheOptions: defaultGanacheOptions,
        title: this.test?.fullTitle(),
      },
      async ({ driver }: { driver: Driver }) => {
        await unlockWallet(driver);
        await driver.clickElement(
          '[data-testid="account-options-menu-button"]',
        );
        await driver.clickElement({ text: 'Settings', tag: 'div' });
        await driver.clickElement({ text: 'Experimental', tag: 'div' });

        await driver.waitForSelector({
          text: 'Enable "Add a new Bitcoin account (Beta)"',
          tag: 'span',
        });

        await driver.clickElement('[data-testid="bitcoin-support-toggle-div"]');

        await driver.clickElement('button[aria-label="Close"]');

        await driver.clickElement('[data-testid="account-menu-icon"]');
        await driver.clickElement(
          '[data-testid="multichain-account-menu-popover-action-button"]',
        );
        await driver.waitForSelector({
          text: 'Add a new Bitcoin account (Beta)',
          tag: 'button',
        });
      },
    );
  });
});
