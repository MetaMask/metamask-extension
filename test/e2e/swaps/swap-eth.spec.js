const { strict: assert } = require('assert');

const { withFixtures } = require('../helpers');
const { withFixturesOptions, loginExtension, enterSwapQuote, reviewQuote, waitForTransactionToComplete } = require('./shared');

describe('Swap Eth for another Token', function () {
  it('Completes second Swaps while first swap is processign', async function () {
    await withFixtures(
      {
        ...withFixturesOptions,
        title: this.test.title,
      },
      async ({ driver }) => {
        await loginExtension(driver);

        console.log('Waiting')
        await driver.delay(1200000) 
        await enterSwapQuote(driver, {
          amount: .001,
          swapTo: 'USDC',
        });

        await reviewQuote(driver)
        await driver.clickElement({ text: 'Swap', tag: 'button' });
        await driver.clickElement({ text: 'View in activity', tag: 'button' });

        await enterSwapQuote(driver, {
          amount: .003,
          swapTo: 'BUSD',
        });

        await reviewQuote(driver)
        await driver.clickElement({ text: 'Swap', tag: 'button' });
        await waitForTransactionToComplete(driver, 'BUSD')

        await driver.clickElement({ text: 'Review swap', tag: 'button' });
        await driver.waitForSelector('[class*="box--align-items-center"]');
        await driver.waitForSelector({
          css: '[class*="box--align-items-center"]',
          text: 'Estimated gas fee',
        });

        await driver.waitForSelector(
          '[class="exchange-rate-display main-quote-summary__exchange-rate-display"]',
        );
        await driver.waitForSelector(
          '[class="fee-card__info-tooltip-container"]',
        );
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
  },1200000);

  it('Completes a Swap between Eth and Dai', async function () {
    await withFixtures(
      {
        ...withFixturesOptions,
        title: this.test.title,
      },
      async ({ driver }) => {
        await loginExtension(driver);
        await enterSwapQuote(driver, {
          amount: 2,
          swapTo: 'DAI',
        });

        await reviewQuote(driver)

        await driver.waitForSelector({
          css: '[class="countdown-timer__time"]',
          text: '0:24',
        });

        await driver.clickElement({ text: 'Swap', tag: 'button' });


        await waitForTransactionToComplete(driver, 'DAI')

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
