import { strict as assert } from 'assert';
import { Suite } from 'mocha';
import { withFixtures } from '../../helpers';
import { login } from '../../page-objects/flows/login.flow';
import HomePage from '../../page-objects/pages/home/homepage';
import BridgeQuotePage from '../../page-objects/pages/bridge/quote-page';
import ActivityTab from '../../page-objects/pages/home/activity-tab';
import {
  enterBridgeQuote,
  getBridgeNegativeCasesFixtures,
  getBridgeQuoteStatusManagerFixtures,
  getInsufficientFundsFixtures,
  getQuoteNegativeCasesFixtures,
} from './bridge-test-utils';
import {
  GET_QUOTE_INVALID_RESPONSE,
  FAILED_SOURCE_TRANSACTION,
  FAILED_DEST_TRANSACTION,
  BRIDGE_FEATURE_FLAGS_WITH_SSE_ENABLED,
} from './constants';

const DEFAULT_LOCAL_NODE_USD_BALANCE = '24.998';

/**
 * Finds a mocked endpoint whose regex-path matcher includes the given
 * substring (e.g. `getQuoteStatus` or `getTxStatus`).
 *
 * @param mockedEndpoints - The mocked endpoints returned by `withFixtures`.
 * @param pathSubstring - The substring to match against the mock's regex path.
 */
function findMockedEndpointByPath(
  mockedEndpoints: {
    rule: { matchers: { type: string; regexSource: string }[] };
    getSeenRequests: () => Promise<unknown[]>;
  }[],
  pathSubstring: string,
) {
  const endpoint = mockedEndpoints.find(({ rule: { matchers } }) =>
    matchers.some(
      (matcher) =>
        matcher.type === 'regex-path' &&
        matcher.regexSource.includes(pathSubstring),
    ),
  );
  assert.ok(endpoint, `No mocked endpoint found for path "${pathSubstring}"`);
  return endpoint;
}

describe('Bridge functionality', function (this: Suite) {
  it('should show that more funds are needed to execute the Bridge', async function () {
    await withFixtures(
      {
        ...getInsufficientFundsFixtures(
          BRIDGE_FEATURE_FLAGS_WITH_SSE_ENABLED,
          this.test?.fullTitle(),
        ),
      },
      async ({ driver, localNodes }) => {
        await login(driver, { localNode: localNodes[0] });
        const homePage = new HomePage(driver);
        await homePage.checkPageIsLoaded();
        await homePage.checkExpectedBalanceIsDisplayed(
          DEFAULT_LOCAL_NODE_USD_BALANCE,
          'ETH',
        );
        await homePage.startSwapFlow();

        const bridgePage = new BridgeQuotePage(driver);
        await bridgePage.enterBridgeQuote({
          amount: '24.9950',
          tokenFrom: 'ETH',
          tokenTo: 'WETH',
          fromChain: 'Ethereum',
          toChain: 'Linea',
        });
        await bridgePage.checkInsufficientFundsButtonIsDisplayed();
        await bridgePage.checkMoreETHneededIsDisplayed();
      },
    );
  });

  it('should show message that no trade route is available if getQuote returns error 500', async function () {
    await withFixtures(
      {
        ...getQuoteNegativeCasesFixtures(
          {
            statusCode: 500,
            json: 'Internal server error',
          },
          BRIDGE_FEATURE_FLAGS_WITH_SSE_ENABLED,
          this.test?.fullTitle(),
        ),
      },
      async ({ driver, localNodes }) => {
        await login(driver, { localNode: localNodes[0] });
        const homePage = new HomePage(driver);
        await homePage.checkPageIsLoaded();
        await homePage.checkExpectedBalanceIsDisplayed(
          DEFAULT_LOCAL_NODE_USD_BALANCE,
          'ETH',
        );
        await homePage.startSwapFlow();

        const bridgePage = await enterBridgeQuote(driver);
        await bridgePage.checkNoTradeRouteMessageIsDisplayed();
      },
    );
  });

  it('should show message that no trade route is available if getQuote returns empty array', async function () {
    await withFixtures(
      {
        ...getQuoteNegativeCasesFixtures(
          {
            statusCode: 200,
            json: [],
          },
          BRIDGE_FEATURE_FLAGS_WITH_SSE_ENABLED,
          this.test?.fullTitle(),
        ),
      },
      async ({ driver, localNodes }) => {
        await login(driver, { localNode: localNodes[0] });
        const homePage = new HomePage(driver);
        await homePage.checkExpectedBalanceIsDisplayed(
          DEFAULT_LOCAL_NODE_USD_BALANCE,
          'ETH',
        );
        await homePage.startSwapFlow();

        const bridgePage = await enterBridgeQuote(driver);
        await bridgePage.checkNoTradeRouteMessageIsDisplayed();
      },
    );
  });

  it('should show message that no trade route is available if getQuote returns invalid response', async function () {
    await withFixtures(
      {
        ...getQuoteNegativeCasesFixtures(
          {
            statusCode: 200,
            json: GET_QUOTE_INVALID_RESPONSE,
          },
          BRIDGE_FEATURE_FLAGS_WITH_SSE_ENABLED,
          this.test?.fullTitle(),
        ),
      },
      async ({ driver, localNodes }) => {
        await login(driver, { localNode: localNodes[0] });
        const homePage = new HomePage(driver);
        await homePage.checkPageIsLoaded();
        await homePage.checkExpectedBalanceIsDisplayed(
          DEFAULT_LOCAL_NODE_USD_BALANCE,
          'ETH',
        );

        await homePage.startSwapFlow();

        const bridgePage = await enterBridgeQuote(driver);
        await bridgePage.checkNoTradeRouteMessageIsDisplayed();
      },
    );
  });

  it('should show that bridge transaction is pending if getTxStatus returns error 500', async function () {
    await withFixtures(
      {
        ...getBridgeNegativeCasesFixtures(
          {
            statusCode: 500,
            json: 'Internal server error',
          },
          BRIDGE_FEATURE_FLAGS_WITH_SSE_ENABLED,
          this.test?.fullTitle(),
          { minedTx: 'reverted', isSettled: false },
        ),
      },
      async ({ driver, localNodes }) => {
        await login(driver, { localNode: localNodes[0] });

        const homePage = new HomePage(driver);
        await homePage.checkPageIsLoaded();
        await homePage.checkExpectedBalanceIsDisplayed(
          DEFAULT_LOCAL_NODE_USD_BALANCE,
          'USD',
        );
        await homePage.startSwapFlow();

        const bridgePage = await enterBridgeQuote(driver);

        await bridgePage.submitQuote();
        await bridgePage.approveModalIfPresent();
        await driver.clickElementSafe({ text: 'View activity' });
        await homePage.goToActivityList();

        const activityTab = new ActivityTab(driver);
        await activityTab.checkPendingBridgeTransactionActivity();
        await activityTab.checkBridgeTransactionDetails(
          'Bridging ETH',
          true,
          'pending',
          '1',
          'ETH',
        );
      },
    );
  });

  it('should show failed bridge activity if getTxStatus returns failed source transaction', async function () {
    await withFixtures(
      {
        ...getBridgeNegativeCasesFixtures(
          {
            statusCode: 200,
            json: FAILED_SOURCE_TRANSACTION,
          },
          BRIDGE_FEATURE_FLAGS_WITH_SSE_ENABLED,
          this.test?.fullTitle(),
          { minedTx: 'reverted' },
        ),
      },
      async ({ driver, localNodes }) => {
        await login(driver, { localNode: localNodes[0] });

        const homePage = new HomePage(driver);
        await homePage.checkPageIsLoaded();
        await homePage.checkExpectedBalanceIsDisplayed(
          DEFAULT_LOCAL_NODE_USD_BALANCE,
          'ETH',
        );
        await homePage.startSwapFlow();

        const bridgePage = await enterBridgeQuote(driver);
        await bridgePage.submitQuoteAndDismiss();
        await homePage.goToActivityList();

        const activityTab = new ActivityTab(driver);
        await activityTab.checkFailedTxNumberDisplayedInActivity();
        await activityTab.checkBridgeTransactionDetails(
          'Bridge failed',
          true,
          'failed',
          '1',
          'ETH',
        );
      },
    );
  });

  it('should show failed bridge activity if getTxStatus returns failed destination transaction', async function () {
    await withFixtures(
      {
        ...getBridgeNegativeCasesFixtures(
          {
            statusCode: 200,
            json: FAILED_DEST_TRANSACTION,
          },
          BRIDGE_FEATURE_FLAGS_WITH_SSE_ENABLED,
          this.test?.fullTitle(),
          { minedTx: 'reverted' },
        ),
      },
      async ({ driver, localNodes }) => {
        await login(driver, { localNode: localNodes[0] });

        const homePage = new HomePage(driver);
        await homePage.checkPageIsLoaded();
        await homePage.checkExpectedBalanceIsDisplayed(
          DEFAULT_LOCAL_NODE_USD_BALANCE,
          'ETH',
        );
        await homePage.startSwapFlow();

        const bridgePage = await enterBridgeQuote(driver);
        await bridgePage.submitQuoteAndDismiss();
        await homePage.goToActivityList();

        const activityTab = new ActivityTab(driver);
        await activityTab.checkFailedTxNumberDisplayedInActivity();
        await activityTab.checkBridgeTransactionDetails(
          'Bridge failed',
          true,
          'failed',
          '1',
          'ETH',
        );
      },
    );
  });

  describe('bridgeQuoteStatusManager', function () {
    it('fetches bridge status via getQuoteStatus instead of getTxStatus when the flag is enabled and the quote has a quoteId', async function () {
      await withFixtures(
        {
          ...getBridgeQuoteStatusManagerFixtures(
            {
              statusCode: 200,
              json: {
                submittedTx: {
                  status: 'COMPLETE',
                  isExpectedToken: true,
                  bridge: 'across',
                  srcChain: {
                    chainId: 1,
                    txHash:
                      '0xec9d6214684d6dc191133ae4a7ec97db3e521fff9cfe5c4f48a84cb6c93a5fa5',
                  },
                  destChain: {
                    chainId: 59144,
                    txHash:
                      '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
                  },
                },
              },
            },
            BRIDGE_FEATURE_FLAGS_WITH_SSE_ENABLED,
            this.test?.fullTitle(),
          ),
        },
        async ({ driver, localNodes, mockedEndpoint }) => {
          await login(driver, { localNode: localNodes[0] });

          const homePage = new HomePage(driver);
          await homePage.checkPageIsLoaded();
          await homePage.startSwapFlow();

          const bridgePage = await enterBridgeQuote(driver);
          await bridgePage.submitQuoteAndDismiss();
          await homePage.goToActivityList();

          const activityTab = new ActivityTab(driver);
          await activityTab.checkCompletedBridgeTransactionActivity();
          await activityTab.checkBridgeTransactionDetails(
            'Bridged ETH',
            true,
            'success',
            '1',
            'ETH',
          );

          const getQuoteStatusMock = findMockedEndpointByPath(
            mockedEndpoint,
            'getQuoteStatus',
          );
          const getTxStatusMock = findMockedEndpointByPath(
            mockedEndpoint,
            'getTxStatus',
          );
          assert.equal(
            (await getQuoteStatusMock.getSeenRequests()).length > 0,
            true,
            'getQuoteStatus should have been called',
          );
          assert.equal(
            (await getTxStatusMock.getSeenRequests()).length,
            0,
            'getTxStatus should not have been called when getQuoteStatus resolves the status',
          );
        },
      );
    });

    it('falls back to getTxStatus when getQuoteStatus has no submitted status yet', async function () {
      await withFixtures(
        {
          ...getBridgeQuoteStatusManagerFixtures(
            {
              statusCode: 200,
              json: {},
            },
            BRIDGE_FEATURE_FLAGS_WITH_SSE_ENABLED,
            this.test?.fullTitle(),
          ),
        },
        async ({ driver, localNodes, mockedEndpoint }) => {
          await login(driver, { localNode: localNodes[0] });

          const homePage = new HomePage(driver);
          await homePage.checkPageIsLoaded();
          await homePage.startSwapFlow();

          const bridgePage = await enterBridgeQuote(driver);
          await bridgePage.submitQuoteAndDismiss();
          await homePage.goToActivityList();

          const activityTab = new ActivityTab(driver);
          await activityTab.checkCompletedBridgeTransactionActivity();
          await activityTab.checkBridgeTransactionDetails(
            'Bridged ETH',
            true,
            'success',
            '1',
            'ETH',
          );

          const getQuoteStatusMock = findMockedEndpointByPath(
            mockedEndpoint,
            'getQuoteStatus',
          );
          const getTxStatusMock = findMockedEndpointByPath(
            mockedEndpoint,
            'getTxStatus',
          );
          assert.equal(
            (await getQuoteStatusMock.getSeenRequests()).length > 0,
            true,
            'getQuoteStatus should have been attempted',
          );
          assert.equal(
            (await getTxStatusMock.getSeenRequests()).length > 0,
            true,
            'getTxStatus should have been used as a fallback',
          );
        },
      );
    });
  });
});
