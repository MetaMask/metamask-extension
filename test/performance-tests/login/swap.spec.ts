import { Mockttp } from 'mockttp';
import { withFixtures } from '../../e2e/helpers';
import { loginWithBalanceValidation } from '../../e2e/page-objects/flows/login.flow';
import HomePage from '../../e2e/page-objects/pages/home/homepage';
import { Driver } from '../../e2e/webdriver/driver';
import {
  setupPerformanceReporting,
  performanceTracker,
  TimerHelper,
} from '../utils/testSetup';
import BridgeQuotePage from '../../e2e/page-objects/pages/bridge/quote-page';
import {
  getBridgeFixtures,
  mockSseEventSource,
} from '../../e2e/tests/bridge/bridge-test-utils';
import {
  BRIDGE_FEATURE_FLAGS_WITH_SSE_ENABLED,
  SSE_RESPONSE_HEADER,
} from '../../e2e/tests/bridge/constants';

// Mock swap quote for ETH to DAI (based on working swap-quotes-eth-musd.json)
const MOCK_SWAP_QUOTE_ETH_DAI = [
  {
    quote: {
      requestId: '0xperf-test-eth-dai-quote-1',
      bridgeId: 'lifi',
      srcChainId: 1,
      destChainId: 1,
      aggregator: 'lifi',
      aggregatorType: 'AGG',
      srcAsset: {
        address: '0x0000000000000000000000000000000000000000',
        chainId: 1,
        assetId: 'eip155:1/slip44:60',
        symbol: 'ETH',
        decimals: 18,
        name: 'Ethereum',
        coingeckoId: 'ethereum',
        aggregators: [],
        occurrences: 100,
        iconUrl:
          'https://static.cx.metamask.io/api/v2/tokenIcons/assets/eip155/1/slip44/60.png',
        metadata: {},
      },
      srcTokenAmount: '991250000000000000',
      destAsset: {
        address: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
        chainId: 1,
        assetId: 'eip155:1/erc20:0x6b175474e89094c44da98b954eedeac495271d0f',
        symbol: 'DAI',
        decimals: 18,
        name: 'Dai Stablecoin',
        coingeckoId: 'dai',
        aggregators: ['metamask', 'liFi', 'socket', 'rubic', 'rango'],
        occurrences: 5,
        iconUrl:
          'https://static.cx.metamask.io/api/v2/tokenIcons/assets/eip155/1/erc20/0x6b175474e89094c44da98b954eedeac495271d0f.png',
        metadata: { storage: {} },
      },
      destTokenAmount: '3800000000000000000000',
      minDestTokenAmount: '3724000000000000000000',
      walletAddress: '0x5CfE73b6021E818B776b421B1c4Db2474086a7e1',
      destWalletAddress: '0x5CfE73b6021E818B776b421B1c4Db2474086a7e1',
      feeData: {
        metabridge: {
          amount: '8750000000000000',
          asset: {
            address: '0x0000000000000000000000000000000000000000',
            chainId: 1,
            assetId: 'eip155:1/slip44:60',
            symbol: 'ETH',
            decimals: 18,
            name: 'Ethereum',
            coingeckoId: 'ethereum',
            aggregators: [],
            occurrences: 100,
            iconUrl:
              'https://static.cx.metamask.io/api/v2/tokenIcons/assets/eip155/1/slip44/60.png',
            metadata: {},
          },
          quoteBpsFee: 87.5,
          baseBpsFee: 87.5,
        },
      },
      bridges: ['lifi'],
      protocols: ['lifi'],
      steps: [],
      slippage: 2,
      priceData: {
        totalFromAmountUsd: '3865.21',
        totalToAmountUsd: '3800.00',
        priceImpact: '0.008508932760864812',
        totalFeeAmountUsd: '33.8205875',
      },
    },
    trade: {
      chainId: 1,
      to: '0x881D40237659C251811CEC9c364ef91dC08D300C',
      from: '0x5CfE73b6021E818B776b421B1c4Db2474086a7e1',
      value: '0xde0b6b3a7640000',
      data: '0x5f575529000000000000000000000000000000000000000000000000000000000000008000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000de0b6b3a764000000000000000000000000000000000000000000000000000000000000000000c0',
      gasLimit: 448721,
    },
    estimatedProcessingTimeInSeconds: 0,
  },
];

// Mock ETH to DAI swap via SSE
async function mockSwapETHtoDAI(mockServer: Mockttp) {
  // Multiple handlers for potential re-fetches, each with fresh stream
  const handlers = [];
  for (let i = 0; i < 3; i++) {
    handlers.push(
      await mockServer
        .forGet(/getQuoteStream/u)
        .once()
        .withQuery({
          srcTokenAddress: '0x0000000000000000000000000000000000000000',
          destTokenAddress: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
        })
        .thenStream(
          200,
          mockSseEventSource(MOCK_SWAP_QUOTE_ETH_DAI),
          SSE_RESPONSE_HEADER,
        ),
    );
  }
  return handlers;
}

describe('Unified Bridge & Swap Performance', function () {
  setupPerformanceReporting();

  it('measures swap page load and quote fetching time', async function () {
    // Get base bridge fixtures
    const baseFixtures = getBridgeFixtures(
      this.test?.fullTitle(),
      BRIDGE_FEATURE_FLAGS_WITH_SSE_ENABLED,
      false, // withErc20
      false, // withMockedSegment
    );

    // Extend with custom ETH→DAI mock
    const fixtures = {
      ...baseFixtures,
      testSpecificMock: async (mockServer: Mockttp) => {
        await mockSwapETHtoDAI(mockServer);
        if (baseFixtures.testSpecificMock) {
          return await baseFixtures.testSpecificMock(mockServer);
        }
        return [];
      },
    };

    await withFixtures(fixtures, async ({ driver }: { driver: Driver }) => {
      const timerLogin = new TimerHelper('Time to login', 10000);
      const timerOpenSwapPage = new TimerHelper(
        'Time to open swap page from home',
        5000,
      );
      const timerQuoteFetching = new TimerHelper(
        'Time to fetch and display swap quotes',
        15000,
      );

      // Login flow with balance validation (same as working tests)
      await timerLogin.measure(async () => {
        await loginWithBalanceValidation(driver, undefined, undefined, '$0');
      });
      performanceTracker.addTimer(timerLogin);

      const homePage = new HomePage(driver);
      await homePage.checkPageIsLoaded();
      await homePage.goToTokensTab();

      // Measure: Open swap page
      await homePage.startSwapFlow();
      const bridgePage = new BridgeQuotePage(driver);
      await timerOpenSwapPage.measure(async () => {
        // Wait for swap page to be loaded (source asset picker button appears)
        await driver.waitForSelector(bridgePage.sourceAssetPickerButton);
      });
      performanceTracker.addTimer(timerOpenSwapPage);

      // Measure: Quote fetching (ETH to DAI swap - uses tokens from MOCK_TOKENS_ETHEREUM)
      await timerQuoteFetching.measure(async () => {
        await bridgePage.enterBridgeQuote({
          amount: '1',
          tokenFrom: 'ETH',
          tokenTo: 'DAI',
        });
        await bridgePage.waitForQuote();
      });
      performanceTracker.addTimer(timerQuoteFetching);
    });
  });
});
