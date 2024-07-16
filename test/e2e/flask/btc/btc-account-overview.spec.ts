import { strict as assert } from 'assert';
import { Suite } from 'mocha';
import {
  withFixtures,
  defaultGanacheOptions,
  unlockWallet,
} from '../../helpers';
import { Driver } from '../../webdriver/driver';
import FixtureBuilder from '../../fixture-builder';
import { createBtcAccount } from '../../accounts/common';

describe('BTC Account - Overview', function (this: Suite) {
  it('has portfolio button enabled for BTC accounts', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder()
          .withPreferencesControllerAndFeatureFlag({
            bitcoinSupportEnabled: true,
          })
          .build(),
        ganacheOptions: defaultGanacheOptions,
        title: this.test?.fullTitle(),
      },
      async ({ driver }: { driver: Driver }) => {
        await unlockWallet(driver);
        await createBtcAccount(driver);
        await driver.assertElementNotPresent({ text: 'Create', tag: 'button' });
        await driver.findElement({
          css: '[data-testid="account-menu-icon"]',
          text: 'Bitcoin Account',
        });

        await driver.waitForSelector({
          text: 'Send',
          tag: 'button',
          css: '[disabled]',
        });

        await driver.waitForSelector({
          text: 'Swap',
          tag: 'button',
          css: '[disabled]',
        });

        await driver.waitForSelector({
          text: 'Bridge',
          tag: 'button',
          css: '[disabled]',
        });

        const buySellButton = await driver.waitForSelector(
          '[data-testid="coin-overview-buy"]',
        );
        // Ramps now support buyable chains dynamically (https://github.com/MetaMask/metamask-extension/pull/24041), for now it's
        // disabled for Bitcoin
        assert.equal(await buySellButton.isEnabled(), false);

        const portfolioButton = await driver.waitForSelector(
          '[data-testid="coin-overview-portfolio"]',
        );
        assert.equal(await portfolioButton.isEnabled(), true);
      },
    );
  });
});
