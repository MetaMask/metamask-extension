import { withFixtures, defaultGanacheOptions, WINDOW_TITLES } from '../helpers';
import { Driver } from '../webdriver/driver';
import FixtureBuilder from '../fixture-builder';
import {
  buildQuote,
  reviewQuote,
  waitForTransactionToComplete,
  checkActivityTransaction,
} from '../tests/swaps/shared';
import { TRADES_API_MOCK_RESULT } from '../../data/mock-data';
import { Mockttp } from '../mock-e2e';
import { installSnapSimpleKeyring } from './common';

const DAI = 'DAI';
const TEST_ETH = 'TESTETH';

async function mockSwapsTransactionQuote(mockServer: Mockttp) {
  return [
    await mockServer
      .forGet('https://swap.api.cx.metamask.io/networks/1/trades')
      .thenCallback(() => ({
        statusCode: 200,
        json: TRADES_API_MOCK_RESULT,
      })),
  ];
}

describe('Snap Account - Swap', function () {
  it('swaps ETH for DAI using a snap account', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder().build(),
        ganacheOptions: defaultGanacheOptions,
        title: this.test?.fullTitle(),
        testSpecificMock: mockSwapsTransactionQuote,
      },
      async ({ driver }: { driver: Driver }) => {
        await installSnapSimpleKeyring(driver, false);
        await driver.switchToWindowWithTitle(
          WINDOW_TITLES.ExtensionInFullScreenView,
        );
        await buildQuote(driver, {
          amount: 2,
          swapTo: DAI,
        });
        await reviewQuote(driver, {
          amount: 2,
          swapFrom: TEST_ETH,
          swapTo: DAI,
        });
        await driver.clickElement({ text: 'Swap', tag: 'button' });
        await waitForTransactionToComplete(driver, { tokenName: 'DAI' });
        await checkActivityTransaction(driver, {
          index: 0,
          amount: '2',
          swapFrom: TEST_ETH,
          swapTo: DAI,
        });
      },
    );
  });
});
