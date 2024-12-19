import { strict as assert } from 'assert';
import { Suite } from 'mocha';
import { DEFAULT_BTC_BALANCE } from '../../constants';
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
          css: '[data-testid="coin-overview-send"]',
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

  it('has balance', async function () {
    await withBtcAccountSnap(
      { title: this.test?.fullTitle() },
      async (driver) => {
        // Wait for the balance to load up
        await driver.delay(2000);

        const balanceElement = await driver.findElement(
          '.coin-overview__balance',
        );
        const balanceText = await balanceElement.getText();

        const [balance, unit] = balanceText.split('\n');
        assert(Number(balance) === DEFAULT_BTC_BALANCE);
        assert(unit === 'BTC');
      },
    );
  });
});
