import FixtureBuilder from '../../fixture-builder';
import { unlockWallet, withFixtures } from '../../helpers';
import {
  buildQuote,
  reviewQuote,
  waitForTransactionToComplete,
  checkActivityTransaction,
  changeExchangeRate,
  mockEthDaiTrade,
} from './shared';

// TODO: (MM-PENDING) These tests are planned for deprecation as part of swaps testing revamp
describe('Swap Eth for another Token', function () {
  // eslint-disable-next-line mocha/no-skipped-tests
  it.skip('Completes a Swap between ETH and DAI after changing initial rate', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder().build(),
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
});
