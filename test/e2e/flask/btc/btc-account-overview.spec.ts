import { strict as assert } from 'assert';
import { Suite } from 'mocha';
import { DEFAULT_BTC_BALANCE } from '../../constants';
import BitcoinHomepage from '../../page-objects/pages/home/bitcoin-homepage';
import { withBtcAccountSnap } from './common-btc';

describe('BTC Account - Overview', function (this: Suite) {
  it('has balance displayed and has portfolio button enabled for BTC accounts', async function () {
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

        // portfolio button
        await driver.findClickableElement('[data-testid="portfolio-link"]');
      },
    );
  });

  it('has balance', async function () {
    await withBtcAccountSnap(
      { title: this.test?.fullTitle() },
      async (driver) => {
        await driver.waitForSelector({
          testId: 'account-value-and-suffix',
          text: `${DEFAULT_BTC_BALANCE}`,
        });
        await driver.waitForSelector({
          css: '.currency-display-component__suffix',
          text: 'BTC',
        });

        await driver.waitForSelector({
          tag: 'p',
          text: `${DEFAULT_BTC_BALANCE} BTC`,
        });
        const homePage = new BitcoinHomepage(driver);
        await homePage.check_pageIsLoaded();
        await homePage.headerNavbar.check_accountLabel('Bitcoin Account');
        await homePage.check_isExpectedBitcoinBalanceDisplayed(
          DEFAULT_BTC_BALANCE,
        );
        assert.equal(await homePage.check_isBridgeButtonEnabled(), false);
        assert.equal(await homePage.check_isSwapButtonEnabled(), false);
        assert.equal(await homePage.check_isBuySellButtonEnabled(), true);
        assert.equal(await homePage.check_isReceiveButtonEnabled(), true);
      },
    );
  });
});
