/* eslint-disable @typescript-eslint/no-var-requires, @typescript-eslint/no-require-imports */
import { withFixtures, WINDOW_TITLES } from '../helpers';
import { Driver } from '../webdriver/driver';
import { accountSnapFixtures, installSnapSimpleKeyring } from './common';

const {
  buildQuote,
  reviewQuote,
  waitForTransactionToComplete,
  checkActivityTransaction,
} = require('../tests/swaps/shared');

describe('Snap account swap', function () {
  it('exchanges native token (ETH) for DAI with snap account', async function () {
    await withFixtures(
      accountSnapFixtures(this.test?.fullTitle()),
      async ({ driver }: { driver: Driver }) => {
        await installSnapSimpleKeyring(driver, false);
        await driver.switchToWindowWithTitle(
          WINDOW_TITLES.ExtensionInFullScreenView,
        );
        await buildQuote(driver, {
          amount: 0.001,
          swapTo: 'DAI',
        });
        await reviewQuote(driver, {
          amount: 0.001,
          swapFrom: 'TESTETH',
          swapTo: 'DAI',
        });
        await driver.clickElement({ text: 'Swap', tag: 'button' });
        await waitForTransactionToComplete(driver, { tokenName: 'DAI' });
        await checkActivityTransaction(driver, {
          index: 0,
          amount: '0.001',
          swapFrom: 'TESTETH',
          swapTo: 'DAI',
        });
      },
    );
  });
});
