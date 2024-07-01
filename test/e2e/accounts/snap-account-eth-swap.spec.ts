/* eslint-disable @typescript-eslint/no-var-requires, @typescript-eslint/no-require-imports */
import { withFixtures, defaultGanacheOptions, WINDOW_TITLES } from '../helpers';
import { Driver } from '../webdriver/driver';
import { installSnapSimpleKeyring } from './common';

const FixtureBuilder = require('../fixture-builder');
const {
  buildQuote,
  reviewQuote,
  waitForTransactionToComplete,
  checkActivityTransaction,
} = require('../tests/swaps/shared');

describe('Snap account swap', function () {
  it('exchanges native token (ETH) for DAI', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder().build(),
        ganacheOptions: defaultGanacheOptions,
        title: this.test.fullTitle(),
      },
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
