import { strict as assert } from 'assert';
import { Suite } from 'mocha';
import { DEFAULT_SOLANA_BALANCE } from '../../constants';
import { withSolanaAccountSnap } from './common-solana';

describe('Solana Account - Overview', function (this: Suite) {
  it('has portfolio button enabled for Solana accounts', async function () {
    await withSolanaAccountSnap(
      { title: this.test?.fullTitle() },
      async (driver) => {
        await driver.findElement({
          css: '[data-testid="account-menu-icon"]',
          text: 'Solana Account',
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
    await withSolanaAccountSnap(
      { title: this.test?.fullTitle() },
      async (driver) => {
        // Wait for the balance to load up
        await driver.delay(2000);

        const balanceElement = await driver.findElement(
          '.coin-overview__balance',
        );
        const balanceText = await balanceElement.getText();

        const [balance, unit] = balanceText.split('\n');
        assert(Number(balance) === DEFAULT_SOLANA_BALANCE);
        assert(unit === 'SOL');
      },
    );
  });
});
