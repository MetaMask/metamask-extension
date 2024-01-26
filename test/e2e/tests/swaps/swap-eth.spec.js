const { withFixtures, unlockWallet } = require('../../helpers');
const {
  withFixturesOptions,
  buildQuote,
  reviewQuote,
  waitForTransactionToComplete,
  checkActivityTransaction,
  changeExchangeRate,
} = require('./shared');

describe('Swap Eth for another Token @no-mmi', function () {
  it('Completes second Swaps while first swap is processing', async function () {
    withFixturesOptions.ganacheOptions.blockTime = 10;

    await withFixtures(
      {
        ...withFixturesOptions,
        failOnConsoleError: false,
        title: this.test.fullTitle(),
      },
      async ({ driver }) => {
        await unlockWallet(driver);
        await buildQuote(driver, {
          amount: 0.001,
          swapTo: 'USDC',
        });
        await reviewQuote(driver, {
          amount: 0.001,
          swapFrom: 'TESTETH',
          swapTo: 'USDC',
        });
        await driver.clickElement({ text: 'Swap', tag: 'button' });
        await driver.clickElement({ text: 'View in activity', tag: 'button' });
        await buildQuote(driver, {
          amount: 0.003,
          swapTo: 'DAI',
        });
        await reviewQuote(driver, {
          amount: 0.003,
          swapFrom: 'TESTETH',
          swapTo: 'DAI',
        });
        await driver.clickElement({ text: 'Swap', tag: 'button' });
        await waitForTransactionToComplete(driver, { tokenName: 'DAI' });
        await checkActivityTransaction(driver, {
          index: 0,
          amount: '0.003',
          swapFrom: 'TESTETH',
          swapTo: 'DAI',
        });
        await checkActivityTransaction(driver, {
          index: 1,
          amount: '0.001',
          swapFrom: 'TESTETH',
          swapTo: 'USDC',
        });
      },
    );
  });
  it('Completes a Swap between ETH and DAI after changing initial rate', async function () {
    await withFixtures(
      {
        ...withFixturesOptions,
        title: this.test.fullTitle(),
      },
      async ({ driver }) => {
        await unlockWallet(driver);
        await buildQuote(driver, {
          amount: 2,
          swapTo: 'DAI',
        });
        await reviewQuote(driver, {
          amount: 2,
          swapFrom: 'TESTETH',
          swapTo: 'DAI',
        });
        await changeExchangeRate(driver);
        await reviewQuote(driver, {
          amount: 2,
          swapFrom: 'TESTETH',
          swapTo: 'DAI',
          skipCounter: true,
        });
        await driver.clickElement({ text: 'Swap', tag: 'button' });
        await waitForTransactionToComplete(driver, { tokenName: 'DAI' });
        await checkActivityTransaction(driver, {
          index: 0,
          amount: '2',
          swapFrom: 'TESTETH',
          swapTo: 'DAI',
        });
      },
    );
  });
});
