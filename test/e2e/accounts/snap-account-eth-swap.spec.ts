import { withFixtures, defaultGanacheOptions, WINDOW_TITLES } from '../helpers';
import { Driver } from '../webdriver/driver';
import FixtureBuilder from '../fixture-builder';
import {
  buildQuote,
  reviewQuote,
  waitForTransactionToComplete,
  checkActivityTransaction,
} from '../tests/swaps/shared';
import { installSnapSimpleKeyring } from './common';

const DAI = 'DAI';
const TEST_ETH = 'TESTETH';

describe('Snap Account - Swap', function () {
  it('swaps ETH for DAI using a snap account', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder().build(),
        ganacheOptions: defaultGanacheOptions,
        title: this.test?.fullTitle(),
      },
      async ({ driver }: { driver: Driver }) => {
        await installSnapSimpleKeyring(driver, false);
        await driver.switchToWindowWithTitle(
          WINDOW_TITLES.ExtensionInFullScreenView,
        );
        await buildQuote(driver, {
          amount: 0.001,
          swapTo: DAI,
        });
        await reviewQuote(driver, {
          amount: 0.001,
          swapFrom: TEST_ETH,
          swapTo: DAI,
        });
        await driver.clickElement({ text: 'Swap', tag: 'button' });
        await waitForTransactionToComplete(driver, { tokenName: 'DAI' });
        await checkActivityTransaction(driver, {
          index: 0,
          amount: '0.001',
          swapFrom: TEST_ETH,
          swapTo: DAI,
        });
      },
    );
  });
});
