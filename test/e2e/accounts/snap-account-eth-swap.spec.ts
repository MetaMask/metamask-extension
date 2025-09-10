import { withFixtures, WINDOW_TITLES } from '../helpers';
import { Driver } from '../webdriver/driver';
import FixtureBuilder from '../fixture-builder';
import {
  buildQuote,
  reviewQuote,
  waitForTransactionToComplete,
  checkActivityTransaction,
} from '../tests/swaps/shared';
import { TRADES_API_MOCK_RESULT } from '../../data/mock-data';
import { installSnapSimpleKeyring } from '../page-objects/flows/snap-simple-keyring.flow';
import { loginWithBalanceValidation } from '../page-objects/flows/login.flow';
import { Mockttp } from '../mock-e2e';
import { mockSimpleKeyringSnap } from '../mock-response-data/snaps/snap-binary-mocks';

const DAI = 'DAI';
const TEST_ETH = 'TESTETH';

async function mockSwapsTransactionQuote(mockServer: Mockttp) {
  return [
    await mockServer
      .forGet('https://bridge.api.cx.metamask.io/networks/1/trades')
      .thenCallback(() => ({
        statusCode: 200,
        json: TRADES_API_MOCK_RESULT,
      })),
  ];
}

async function mockSwapsAndSimpleKeyringSnap(mockServer: Mockttp) {
  return [
    await mockSimpleKeyringSnap(mockServer),
    await mockSwapsTransactionQuote(mockServer),
  ];
}

describe('Snap Account - Swap', function () {
  // eslint-disable-next-line mocha/no-skipped-tests
  it.skip('swaps ETH for DAI using a snap account', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder().build(),
        title: this.test?.fullTitle(),
        testSpecificMock: mockSwapsAndSimpleKeyringSnap,
      },
      async ({ driver }: { driver: Driver }) => {
        await loginWithBalanceValidation(driver);
        await installSnapSimpleKeyring(driver);
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
