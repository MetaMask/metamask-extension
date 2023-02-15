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

        await enterSwapQuote(driver, {
          amount: .001,
          swapTo: 'USDC',
        });

        await reviewQuote(driver)
        await driver.clickElement({ text: 'Swap', tag: 'button' });
        await driver.clickElement({ text: 'View in activity', tag: 'button' });

        await enterSwapQuote(driver, {
          amount: .003,
          swapTo: 'DAI',
        });

        await reviewQuote(driver)
        await driver.clickElement({ text: 'Swap', tag: 'button' });
        await waitForTransactionToComplete(driver, 'DAI')

        await driver.clickElement('[data-testid="home__activity-tab"]');

        await driver.wait(async () => {
          const confirmedTxes = await driver.findElements(
            '.transaction-list__completed-transactions .transaction-list-item',
          );
          return confirmedTxes.length === 2;
        }, 10000);

        const itemsText = await driver.findElements(
          '.list-item__title',
        );
        assert.equal(itemsText.length, 2);
        assert.equal(await itemsText[0].getText(), 'Swap TESTETH to DAI');
        assert.equal(await itemsText[1].getText(), 'Swap TESTETH to USDC');

        const amountValues = await driver.findElements(
          '.transaction-list-item__primary-currency',
        );
        assert.equal(amountValues.length, 2);
        assert.equal(await amountValues[0].getText(), '-0.003 TESTETH');
        assert.equal(await amountValues[1].getText(), '-0.001 TESTETH');
      }
    );
  });
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
