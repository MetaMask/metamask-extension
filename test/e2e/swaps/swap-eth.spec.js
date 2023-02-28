const { strict: assert } = require('assert');

const { withFixtures } = require('../helpers');
const {
  withFixturesOptions,
  loadExtension,
  buildQuote,
  reviewQuote,
  waitForTransactionToComplete,
  checkActivityTransaction
} = require('./shared');


describe('Swap Eth for another Token', function () {
  it('Completes second Swaps while first swap is processing', async function () {

    withFixturesOptions.ganacheOptions.blockTime = 10
    
    await withFixtures(
      {
        ...withFixturesOptions,
        failOnConsoleError: false,
        title: this.test.title,
      },
      async ({ driver }) => {
        await loadExtension(driver);

        await buildQuote(driver, {
          amount: .001,
          swapTo: 'USDC',
        });

        await reviewQuote(driver, '0.001', 'TESTETH', 'USDC')

        await driver.clickElement({ text: 'Swap', tag: 'button' });
        await driver.clickElement({ text: 'View in activity', tag: 'button' });

        await buildQuote(driver, {
          amount: .003,
          swapTo: 'DAI',
        })

        await reviewQuote(driver, '0.003', 'TESTETH', 'DAI')

        await driver.clickElement({ text: 'Swap', tag: 'button' });

        await waitForTransactionToComplete(driver, 'DAI')

        await checkActivityTransaction(driver, 0, '0.003', 'TESTETH', 'DAI')
        await checkActivityTransaction(driver, 1, '0.001', 'TESTETH', 'USDC')
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
        await loadExtension(driver);
        await buildQuote(driver, {
          amount: 2,
          swapTo: 'DAI',
        });

        await reviewQuote(driver, '2', 'TESTETH', 'DAI')

        await driver.clickElement({ text: 'Swap', tag: 'button' });

        await waitForTransactionToComplete(driver, 'DAI')

        await checkActivityTransaction(driver, 0, '2', 'TESTETH', 'DAI')
      },
    );
  });

});
