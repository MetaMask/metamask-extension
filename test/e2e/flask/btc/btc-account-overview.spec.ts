import { strict as assert } from 'assert';
import { Suite } from 'mocha';
import { withBtcAccountSnap } from './common-btc';

describe('BTC Account - Overview', function (this: Suite) {
  it('has portfolio button enabled for BTC accounts', async function () {
    await withBtcAccountSnap(
      { title: this.test?.fullTitle() },
      async (driver) => {
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
        // Ramps now support buyable chains dynamically (https://github.com/MetaMask/metamask-extension/pull/24041) and has now been
        // enabled to fully support the v12.2.0 release
        assert.equal(await buySellButton.isEnabled(), true);

        const portfolioButton = await driver.waitForSelector(
          '[data-testid="coin-overview-receive"]',
        );
        assert.equal(await portfolioButton.isEnabled(), true);
      },
    );
  });
});
