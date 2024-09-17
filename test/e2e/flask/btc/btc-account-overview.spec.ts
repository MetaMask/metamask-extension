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

        // buy sell button
        await driver.findClickableElement('[data-testid="coin-overview-buy"]');

        // receive button
        await driver.findClickableElement(
          '[data-testid="coin-overview-receive"]',
        );
      },
    );
  });
});
