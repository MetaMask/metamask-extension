import { unlockWallet, withFixtures } from '../../helpers';
import {
  withFixturesOptions,
  buildQuote,
  reviewQuote,
  waitForTransactionToComplete,
  checkActivityTransaction,
  changeExchangeRate,
  mockEthDaiTrade,
  closeSmartTransactionsMigrationNotification,
} from './shared';

// TODO: (MM-PENDING) These tests are planned for deprecation as part of swaps testing revamp
describe('Swap Eth for another Token', function () {
  it('Completes a Swap between ETH and DAI after changing initial rate', async function () {
    await withFixtures(
      {
        ...withFixturesOptions,
        testSpecificMock: mockEthDaiTrade,
        title: this.test?.fullTitle(),
      },
      async ({ driver }) => {
        await unlockWallet(driver);

        await buildQuote(driver, {
          amount: 2,
          swapTo: 'DAI',
        });

        // Close the STX notification immediately after buildQuote
        // This ensures the UI is clear before we proceed with quote review
        await closeSmartTransactionsMigrationNotification(driver);

        await reviewQuote(driver, {
          amount: 2,
          swapFrom: 'TESTETH',
          swapTo: 'DAI',
        });

        // The changeExchangeRate function now includes scrolling logic
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

  it('Completes a Swap between ETH and DAI after changing initial rate', async function () {
    await withFixtures(
      {
        ...withFixturesOptions,
        testSpecificMock: mockEthDaiTrade,
        title: this.test?.fullTitle(),
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
