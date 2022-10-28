const { strict: assert } = require('assert');

const { withFixtures } = require('../helpers');
const FixtureBuilder = require('../fixture-builder');
const { ganacheOptions, loadSwaps, buildQuote } = require('./shared');

describe('Swap Eth for another Token', function () {
  it('Completes a Swap between Eth and Matic', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder().build(),
        ganacheOptions,
        failOnConsoleError: false,
        title: this.test.title,
      },
      async ({ driver }) => {
        await loadSwaps(driver);
        await buildQuote(driver, {
          amount: 2,
          swapTo: 'DAI',
        });
        await driver.clickElement({ text: 'Review swap', tag: 'button' });
        await driver.waitForSelector('[class*="box--align-items-center"]');
        const estimatedEth = await driver.waitForSelector({
          css: '[class*="box--align-items-center"]',
          text: 'Estimated gas fee',
        });
        assert.equal(await estimatedEth.getText(), 'Estimated gas fee');
        await driver.waitForSelector(
          '[class="exchange-rate-display main-quote-summary__exchange-rate-display"]',
        );
        await driver.waitForSelector(
          '[class="fee-card__info-tooltip-container"]',
        );
        await driver.waitForSelector({
          css: '[class="countdown-timer__time"]',
          text: '0:24',
        });
        await driver.clickElement({ text: 'Swap', tag: 'button' });
        const sucessfulTransactionMessage = await driver.waitForSelector({
          css: '[class="awaiting-swap__header"]',
          text: 'Transaction complete',
        });
        assert.equal(
          await sucessfulTransactionMessage.getText(),
          'Transaction complete',
        );
        const sucessfulTransactionToken = await driver.waitForSelector({
          css: '[class="awaiting-swap__amount-and-symbol"]',
          text: 'DAI',
        });
        assert.equal(await sucessfulTransactionToken.getText(), 'DAI');
        await driver.clickElement({ text: 'Close', tag: 'button' });
        await driver.clickElement('[data-testid="home__activity-tab"]');
        const swaptotal = await driver.waitForSelector({
          css: '[class="transaction-list-item__primary-currency"]',
          text: '-2 TESTETH',
        });
        assert.equal(await swaptotal.getText(), '-2 TESTETH');
        const swaptotaltext = await driver.waitForSelector({
          css: '[class="list-item__title"]',
          text: 'Swap TESTETH to DAI',
        });
        assert.equal(await swaptotaltext.getText(), 'Swap TESTETH to DAI');
      },
    );
  });
});
