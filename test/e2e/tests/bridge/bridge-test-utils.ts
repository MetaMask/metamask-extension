import { Mockttp } from 'mockttp';
import { type FeatureFlagResponse } from '@metamask/bridge-controller';

import { emptyHtmlPage } from '../../mock-e2e';
import FixtureBuilder from '../../fixture-builder';
import { SMART_CONTRACTS } from '../../seeder/smart-contracts';
import { CHAIN_IDS } from '../../../../shared/constants/network';
import { Driver } from '../../webdriver/driver';
import BridgeQuotePage, {
  BridgeQuote,
} from '../../page-objects/pages/bridge/quote-page';
import ActivityListPage from '../../page-objects/pages/home/activity-list';
import AccountListPage from '../../page-objects/pages/account-list-page';
import HomePage from '../../page-objects/pages/home/homepage';
import { MOCK_META_METRICS_ID } from '../../constants';
import { mockSegment } from '../metrics/mocks/segment';
import {
  ETH_CONVERSION_RATE_USD,
  MOCK_CURRENCY_RATES,
  MOCK_TOKENS_ARBITRUM,
  MOCK_TOKENS_ETHEREUM,
  MOCK_TOKENS_LINEA,
  MOCK_GET_TOKEN_ARBITRUM,
  MOCK_BRIDGE_ETH_TO_ETH_LINEA,
  MOCK_BRIDGE_ETH_TO_USDC_ARBITRUM,
  MOCK_BRIDGE_DAI_TO_ETH_LINEA,
  MOCK_BRIDGE_USDC_TO_DAI_LINEA,
  MOCK_BRIDGE_NATIVE_L2_TO_MAINNET,
  MOCK_BRIDGE_NATIVE_L2_TO_L2,
  MOCK_BRIDGE_DAI_L2_TO_L2,
  MOCK_BRIDGE_DAI_L2_TO_MAINNET,
  TOP_ASSETS_API_LINEA_MOCK_RESULT,
  TOP_ASSETS_API_ARBITRUM_MOCK_RESULT,
  MOCK_BRIDGE_ETH_TO_WETH_LINEA,
  MOCK_SWAP_API_AGGREGATOR_LINEA,
} from './constants';

export class BridgePage {
  driver: Driver;

  constructor(driver: Driver) {
    this.driver = driver;
  }

  reloadHome = async () => {
    await this.driver.navigate();
  };

  navigateToBridgePage = async (
    location:
      | 'wallet-overview'
      | 'coin-overview'
      | 'token-overview' = 'wallet-overview',
  ) => {
    // Mitigates flakiness by waiting for the feature flags to be fetched
    await this.driver.delay(3000);
    let bridgeButtonTestIdPrefix;
    switch (location) {
      case 'wallet-overview':
        bridgeButtonTestIdPrefix = 'eth';
        break;
      case 'coin-overview': // native asset page
        bridgeButtonTestIdPrefix = 'coin';
        break;
      case 'token-overview':
      default:
        bridgeButtonTestIdPrefix = 'token';
    }
    await this.driver.clickElement(
      `[data-testid="${bridgeButtonTestIdPrefix}-overview-bridge"]`,
    );
  };

  navigateToAssetPage = async (symbol: string) => {
    await this.driver.clickElement({
      css: '[data-testid="multichain-token-list-button"]',
      text: symbol,
    });
    await this.driver.waitForUrlContaining({
      url: 'asset',
    });
  };
}

export async function bridgeTransaction(
  driver: Driver,
  quote: BridgeQuote,
  transactionsCount: number,
  expectedWalletBalance?: string,
  repeatedTransactionsCount?: number,
) {
  // Navigate to Bridge page
  const homePage = new HomePage(driver);
  await homePage.startBridgeFlow();

  const bridgePage = new BridgeQuotePage(driver);
  await bridgePage.enterBridgeQuote(quote);
  await bridgePage.waitForQuote();
  await bridgePage.checkExpectedNetworkFeeIsDisplayed();
  await bridgePage.submitQuote();

  await homePage.goToActivityList();

  const activityList = new ActivityListPage(driver);
  await activityList.checkCompletedBridgeTransactionActivity(transactionsCount);

  if (quote.unapproved) {
    await activityList.checkTxAction({
      action: `Bridged to ${quote.toChain}`,
      txIndex: repeatedTransactionsCount,
    });
    await activityList.checkTxAction({
      action: `Approve ${quote.tokenFrom} for bridge`,
      txIndex: 1,
    });
  } else {
    await activityList.checkTxAction({
      action: `Bridged to ${quote.toChain}`,
      txIndex: repeatedTransactionsCount,
    });
  }
  // Check the amount of ETH deducted in the activity is correct
  await activityList.checkTxAmountInActivity(
    `-${quote.amount} ${quote.tokenFrom}`,
  );

  // Check the wallet ETH balance is correct
  const accountListPage = new AccountListPage(driver);
  if (expectedWalletBalance) {
    await accountListPage.checkAccountValueAndSuffixDisplayed(
      expectedWalletBalance,
    );
  }
}

async function mockPortfolioPage(mockServer: Mockttp) {
  return await mockServer
    .forGet(`https://app.metamask.io/bridge`)
    .thenCallback(() => {
      return {
        statusCode: 200,
        body: emptyHtmlPage(),
      };
    });
}

async function mockGetTxStatus(mockServer: Mockttp) {
  return await mockServer.forGet(/getTxStatus/u).thenCallback(async (req) => {
    const urlObj = new URL(req.url);
    const txHash = urlObj.searchParams.get('srcTxHash');
    const srcChainId = urlObj.searchParams.get('srcChainId');
    const destChainId = urlObj.searchParams.get('destChainId');
    return {
      statusCode: 200,
      json: {
        status: 'COMPLETE',
        isExpectedToken: true,
        bridge: 'across',
        srcChain: {
          chainId: Number(srcChainId),
          txHash,
        },
        destChain: {
          chainId: Number(destChainId),
          txHash,
        },
      },
    };
  });
}

async function mockTopAssetsLinea(mockServer: Mockttp) {
  return await mockServer.forGet(/59144\/topAssets/u).thenCallback(() => {
    return {
      statusCode: 200,
      json: TOP_ASSETS_API_LINEA_MOCK_RESULT,
    };
  });
}

export async function mockTopAssetsArbitrum(mockServer: Mockttp) {
  return await mockServer.forGet(/42161\/topAssets/u).thenCallback(() => {
    return {
      statusCode: 200,
      json: TOP_ASSETS_API_ARBITRUM_MOCK_RESULT,
    };
  });
}

async function mockTokensEthereum(mockServer: Mockttp) {
  return await mockServer
    .forGet(`https://token.api.cx.metamask.io/tokens/1`)
    .thenCallback(() => {
      return {
        statusCode: 200,
        json: MOCK_TOKENS_ETHEREUM,
      };
    });
}

async function mockTokensLinea(mockServer: Mockttp) {
  return await mockServer
    .forGet(`https://token.api.cx.metamask.io/tokens/59144`)
    .thenCallback(() => {
      return {
        statusCode: 200,
        json: MOCK_TOKENS_LINEA,
      };
    });
}

async function mockTokensArbitrum(mockServer: Mockttp) {
  return await mockServer
    .forGet(`https://token.api.cx.metamask.io/tokens/42161`)
    .thenCallback(() => {
      return {
        statusCode: 200,
        json: MOCK_TOKENS_ARBITRUM,
      };
    });
}

async function mockGetTokenArbitrum(mockServer: Mockttp) {
  return await mockServer
    .forGet(/getTokens/u)
    .withQuery({ chainId: 42161 })
    .thenCallback(() => {
      return {
        statusCode: 200,
        json: MOCK_GET_TOKEN_ARBITRUM,
      };
    });
}

async function mockETHtoETH(mockServer: Mockttp) {
  return await mockServer
    .forGet(/getQuote/u)
    .withQuery({
      srcTokenAddress: '0x0000000000000000000000000000000000000000',
      destTokenAddress: '0x0000000000000000000000000000000000000000',
    })
    .thenCallback(() => {
      return {
        statusCode: 200,
        json: MOCK_BRIDGE_ETH_TO_ETH_LINEA,
      };
    });
}

async function mockETHtoWETH(mockServer: Mockttp) {
  return await mockServer
    .forGet(/getQuote/u)
    .withQuery({
      srcTokenAddress: '0x0000000000000000000000000000000000000000',
      destTokenAddress: '0xe5D7C2a44FfDDf6b295A15c148167daaAf5Cf34f',
    })
    .thenCallback(() => {
      return {
        statusCode: 200,
        json: MOCK_BRIDGE_ETH_TO_WETH_LINEA,
      };
    });
}

async function mockETHtoUSDC(mockServer: Mockttp) {
  return await mockServer
    .forGet(/getQuote/u)
    .withQuery({
      srcTokenAddress: '0x0000000000000000000000000000000000000000',
      destTokenAddress: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831',
    })
    .thenCallback(() => {
      return {
        statusCode: 200,
        json: MOCK_BRIDGE_ETH_TO_USDC_ARBITRUM,
      };
    });
}

async function mockDAItoETH(mockServer: Mockttp) {
  return await mockServer
    .forGet(/getQuote/u)
    .withQuery({
      srcTokenAddress: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
      destTokenAddress: '0x0000000000000000000000000000000000000000',
    })
    .always()
    .thenCallback(() => {
      return {
        statusCode: 200,
        json: MOCK_BRIDGE_DAI_TO_ETH_LINEA,
      };
    });
}

async function mockUSDCtoDAI(mockServer: Mockttp) {
  return await mockServer
    .forGet(/getQuote/u)
    .withQuery({
      srcTokenAddress: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
      destTokenAddress: '0x4AF15ec2A0BD43Db75dd04E62FAA3B8EF36b00d5',
    })
    .thenCallback(() => {
      return {
        statusCode: 200,
        json: MOCK_BRIDGE_USDC_TO_DAI_LINEA,
      };
    });
}

async function mockGetQuoteInvalid(
  mockServer: Mockttp,
  options: { statusCode: number; json: unknown },
) {
  return await mockServer.forGet(/getQuote/u).thenCallback(() => {
    return {
      statusCode: options.statusCode,
      json: options.json,
    };
  });
}

async function mockGetTxStatusInvalid(
  mockServer: Mockttp,
  options: { statusCode: number; json: unknown },
) {
  return await mockServer.forGet(/getTxStatus/u).thenCallback(() => {
    return {
      statusCode: options.statusCode,
      json: options.json,
    };
  });
}

async function mockL2toMainnet(mockServer: Mockttp) {
  return await mockServer
    .forGet(/getQuote/u)
    .withQuery({
      srcChainId: 59144,
      destChainId: 1,
      srcTokenAddress: '0x0000000000000000000000000000000000000000',
    })
    .thenCallback(() => {
      return {
        statusCode: 200,
        json: MOCK_BRIDGE_NATIVE_L2_TO_MAINNET,
      };
    });
}

async function mockNativeL2toL2(mockServer: Mockttp) {
  return await mockServer
    .forGet(/getQuote/u)
    .withQuery({
      srcChainId: 59144,
      destChainId: 42161,
      srcTokenAddress: '0x0000000000000000000000000000000000000000',
    })
    .thenCallback(() => {
      return {
        statusCode: 200,
        json: MOCK_BRIDGE_NATIVE_L2_TO_L2,
      };
    });
}
async function mockDAIL2toL2(mockServer: Mockttp) {
  return await mockServer
    .forGet(/getQuote/u)
    .withQuery({
      srcChainId: 59144,
      destChainId: 42161,
      srcTokenAddress: '0x4AF15ec2A0BD43Db75dd04E62FAA3B8EF36b00d5',
    })
    .thenCallback(() => {
      return {
        statusCode: 200,
        json: MOCK_BRIDGE_DAI_L2_TO_L2,
      };
    });
}

async function mockDAIL2toMainnet(mockServer: Mockttp) {
  return await mockServer
    .forGet(/getQuote/u)
    .withQuery({
      srcChainId: 59144,
      destChainId: 1,
      srcTokenAddress: '0x4AF15ec2A0BD43Db75dd04E62FAA3B8EF36b00d5',
      destTokenAddress: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
    })
    .thenCallback(() => {
      return {
        statusCode: 200,
        json: MOCK_BRIDGE_DAI_L2_TO_MAINNET,
      };
    });
}

async function mockAccountsTransactions(mockServer: Mockttp) {
  return await mockServer
    .forGet(
      /^https:\/\/accounts\.api\.cx\.metamask\.io\/v1\/accounts\/.*\/transactions/u,
    )
    .thenCallback(() => {
      return {
        statusCode: 200,
        json: {
          transactions: [],
          pagination: {
            next: null,
            prev: null,
          },
        },
      };
    });
}

async function mockAccountsBalances(mockServer: Mockttp) {
  return await mockServer
    .forGet(
      /^https:\/\/accounts\.api\.cx\.metamask\.io\/v2\/accounts\/.*\/balances/u,
    )
    .thenCallback(() => {
      return {
        statusCode: 200,
        json: {
          balances: {
            '1': {
              '0x0000000000000000000000000000000000000000': {
                balance: '100000000000000000000',
                token: {
                  address: '0x0000000000000000000000000000000000000000',
                  symbol: 'ETH',
                  decimals: 18,
                  name: 'Ethereum',
                  type: 'native',
                },
              },
              '0x6b175474e89094c44da98b954eedeac495271d0f': {
                balance: '50000000000000000000',
                token: {
                  address: '0x6b175474e89094c44da98b954eedeac495271d0f',
                  symbol: 'DAI',
                  decimals: 18,
                  name: 'Dai Stablecoin',
                  type: 'erc20',
                },
              },
            },
          },
        },
      };
    });
}

async function mockPriceSpotPrices(mockServer: Mockttp) {
  return await mockServer
    .forGet(
      /^https:\/\/price\.api\.cx\.metamask\.io\/v2\/chains\/\d+\/spot-prices/u,
    )
    .thenCallback(() => {
      return {
        statusCode: 200,
        json: {
          data: {
            '0x0000000000000000000000000000000000000000': {
              usd: 2000.0,
              // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
              // eslint-disable-next-line @typescript-eslint/naming-convention
              usd_24h_change: 2.5,
            },
            '0x6b175474e89094c44da98b954eedeac495271d0f': {
              usd: 1.0,
              // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
              // eslint-disable-next-line @typescript-eslint/naming-convention
              usd_24h_change: 0.1,
            },
          },
        },
      };
    });
}

async function mockPriceSpotPricesV3(mockServer: Mockttp) {
  return await mockServer
    .forGet(/^https:\/\/price\.api\.cx\.metamask\.io\/v3\/spot-prices/u)
    .thenCallback(() => {
      return {
        statusCode: 200,
        json: {
          'eip155:1/erc20:0x6b175474e89094c44da98b954eedeac495271d0f': {
            usd: 1.0,
            // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
            // eslint-disable-next-line @typescript-eslint/naming-convention
            usd_24h_change: 0.1,
          },
          'eip155:1/slip44:60': {
            usd: 2000.0,
            // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
            // eslint-disable-next-line @typescript-eslint/naming-convention
            usd_24h_change: 2.5,
          },
        },
      };
    });
}

async function mockSwapAggregatorLinea(mockServer: Mockttp) {
  return await mockServer
    .forGet('bridge.api.cx.metamask.io/networks/59144/aggregatorMetadata')
    .always()
    .thenCallback(() => {
      return {
        statusCode: 200,
        json: MOCK_SWAP_API_AGGREGATOR_LINEA,
      };
    });
}

export async function mockGasPricesArbitrum(mockServer: Mockttp) {
  return await mockServer
    .forGet('https://gas.api.cx.metamask.io/networks/42161/gasPrices')
    .always()
    .thenCallback(() => {
      return {
        statusCode: 200,
        json: {
          SafeGasPrice: '30',
          ProposeGasPrice: '30',
          FastGasPrice: '30',
        },
      };
    });
}

export async function mockGasPricesMainnet(mockServer: Mockttp) {
  return await mockServer
    .forGet('https://gas.api.cx.metamask.io/networks/1/gasPrices')
    .always()
    .thenCallback(() => {
      return {
        statusCode: 200,
        json: {
          SafeGasPrice: '30',
          ProposeGasPrice: '30',
          FastGasPrice: '30',
        },
      };
    });
}

export async function mockSwapAggregatorMetadataLinea(mockServer: Mockttp) {
  return await mockServer
    .forGet(
      'https://bridge.api.cx.metamask.io/networks/59144/aggregatorMetadata',
    )
    .always()
    .thenCallback(() => {
      return {
        statusCode: 200,
        json: MOCK_SWAP_API_AGGREGATOR_LINEA,
      };
    });
}

export async function mockSwapTokensLinea(mockServer: Mockttp) {
  return await mockServer
    .forGet('https://bridge.api.cx.metamask.io/networks/59144/tokens')
    .withQuery({ includeBlockedTokens: 'true' })
    .always()
    .thenCallback(() => {
      return {
        statusCode: 200,
        json: MOCK_TOKENS_LINEA,
      };
    });
}

export async function mockSwapTokensArbitrum(mockServer: Mockttp) {
  return await mockServer
    .forGet('https://bridge.api.cx.metamask.io/networks/42161/tokens')
    .withQuery({ includeBlockedTokens: 'true' })
    .always()
    .thenCallback(() => {
      return {
        statusCode: 200,
        json: MOCK_GET_TOKEN_ARBITRUM,
      };
    });
}

export async function mockSwapAggregatorMetadataArbitrum(mockServer: Mockttp) {
  return await mockServer
    .forGet(
      'https://bridge.api.cx.metamask.io/networks/42161/aggregatorMetadata',
    )
    .always()
    .thenCallback(() => {
      return {
        statusCode: 200,
        json: {
          airswapLight: {
            // Legitimate hex color value in test
            // eslint-disable-next-line @metamask/design-tokens/color-no-hex
            color: '#2B71FF',
            title: 'AirSwap',
            icon: "data:image/svg+xml,%3csvg width='75' height='31' viewBox='0 0 75 31' fill='none' xmlns='http://www.w3.org/2000/svg'%3e %3cpath fill-rule='evenodd' clip-rule='evenodd' d='M31.4038 12.231H30.1152V19.3099H31.4038V12.231Z' fill='%23FDFDFD'/%3e %3cpath fill-rule='evenodd' clip-rule='evenodd' d='M42.8265 15.1959C44.1549 15.5074 44.9217 15.9477 45.1053 16.8178C45.1368 16.9625 45.1513 17.1103 45.1485 17.2582C45.1485 18.5793 44.2197 19.4171 42.7077 19.4171C41.5541 19.4075 40.4409 18.9929 39.5649 18.2463L40.3317 17.3548C41.0229 17.9456 41.8437 18.3215 42.7401 18.3215C43.6365 18.3215 43.8849 17.9241 43.8849 17.3763C43.8849 16.8285 43.5933 16.5922 42.2541 16.2915C40.7205 15.937 39.8349 15.4322 39.8349 14.1218C39.8349 12.8114 40.7529 12.1239 42.1785 12.1239C43.1717 12.1129 44.1403 12.4303 44.9325 13.0262L44.2521 13.9607C43.6041 13.488 42.8697 13.1658 42.2109 13.1658C41.5521 13.1658 41.0985 13.5418 41.0985 14.0144C41.0985 14.487 41.4549 14.8736 42.8265 15.1959Z' fill='%23FDFDFD'/%3e %3c/svg%3e",
          },
          bancor: {
            // Legitimate hex color value in test
            // eslint-disable-next-line @metamask/design-tokens/color-no-hex
            color: '#c9c9c9',
            title: 'Bancor',
            icon: "data:image/svg+xml,%3csvg width='117' height='29' viewBox='0 0 117 29' fill='none' xmlns='http://www.w3.org/2000/svg'%3e %3cpath fill-rule='evenodd' clip-rule='evenodd' d='M9.15211 0.0550469L16.2358 3.98013C16.5117 4.1333 16.5117 4.51305 16.2358 4.66622L9.15211 8.5913C9.02579 8.66151 8.86623 8.66151 8.73992 8.5913L1.65627 4.66622C1.38037 4.51305 1.38037 4.1333 1.65627 3.98013L8.73992 0.0550469C8.86956 -0.018349 9.02579 -0.018349 9.15211 0.0550469Z' fill='%230A2540'/%3e %3c/svg%3e",
          },
          curve: {
            // Legitimate hex color value in test
            // eslint-disable-next-line @metamask/design-tokens/color-no-hex
            color: '#24292E',
            title: 'Curve',
            icon: "data:image/svg+xml,%3csvg width='74' height='30' viewBox='0 0 74 30' fill='none' xmlns='http://www.w3.org/2000/svg'%3e %3cpath d='M38.1738 15.9546C38.0552 16.9697 37.6794 17.7542 37.0466 18.3079C36.4182 18.8572 35.5811 19.1318 34.5352 19.1318C33.4014 19.1318 32.4917 18.7253 31.8062 17.9124C31.125 17.0994 30.7844 16.0117 30.7844 14.6494V13.7266C30.7844 12.8345 30.9426 12.05 31.259 11.3733C31.5798 10.6965 32.0325 10.178 32.6169 9.81763C33.2014 9.45288 33.8782 9.27051 34.6472 9.27051C35.6667 9.27051 36.4841 9.55615 37.0994 10.1274C37.7146 10.6943 38.0728 11.481 38.1738 12.4873H36.9016C36.7917 11.7227 36.5522 11.1689 36.1831 10.8262C35.8184 10.4834 35.3064 10.312 34.6472 10.312C33.8386 10.312 33.2036 10.6108 32.7422 11.2085C32.2852 11.8062 32.0566 12.6565 32.0566 13.7595V14.689C32.0566 15.7305 32.2742 16.5588 32.7092 17.1741C33.1443 17.7893 33.7529 18.0969 34.5352 18.0969C35.2383 18.0969 35.7766 17.9387 36.1501 17.6223C36.5281 17.3015 36.7786 16.7456 36.9016 15.9546H38.1738Z' fill='%23E6E6E6'/%3e %3c/svg%3e",
          },
        },
      };
    });
}

// Expected event types for Bridge metrics
export enum EventTypes {
  BridgeLinkClicked = 'Bridge Link Clicked',
  SwapBridgeButtonClicked = 'Unified SwapBridge Button Clicked',
  SwapBridgePageViewed = 'Unified SwapBridge Page Viewed',
  SwapBridgeInputChanged = 'Unified SwapBridge Input Changed',
  SwapBridgeQuotesRequested = 'Unified SwapBridge Quotes Requested',
  CrossChainQuotesReceived = 'Cross-chain Quotes Received',
  ActionSubmitted = 'Action Submitted',
  SwapBridgeSubmitted = 'Unified SwapBridge Submitted',
  TransactionAddedAnon = 'Transaction Added Anon',
  TransactionAdded = 'Transaction Added',
  TransactionSubmittedAnon = 'Transaction Submitted Anon',
  TransactionSubmitted = 'Transaction Submitted',
  TransactionApprovedAnon = 'Transaction Approved Anon',
  TransactionApproved = 'Transaction Approved',
  TransactionFinalizedAnon = 'Transaction Finalized Anon',
  TransactionFinalized = 'Transaction Finalized',
  SwapBridgeCompleted = 'Unified SwapBridge Completed',
  UnifiedSwapBridgeSubmitted = 'Unified SwapBridge Submitted',
  SwapBridgeTokenFlipped = 'Source and Destination Flipped',
}

export const EXPECTED_EVENT_TYPES = Object.values(EventTypes);

export const getBridgeFixtures = (
  title?: string,
  featureFlags: Partial<FeatureFlagResponse> = {},
  withErc20: boolean = true,
  withMockedSegment: boolean = false,
) => {
  const fixtureBuilder = new FixtureBuilder({
    inputChainId: CHAIN_IDS.MAINNET,
  })
    .withMetaMetricsController({
      metaMetricsId: MOCK_META_METRICS_ID,
      participateInMetaMetrics: true,
    })
    .withCurrencyController(MOCK_CURRENCY_RATES)
    .withBridgeControllerDefaultState()
    .withPreferencesControllerSmartTransactionsOptedOut()
    .withTokensController({
      allTokens: {
        '0x1': {
          '0x5cfe73b6021e818b776b421b1c4db2474086a7e1': [
            {
              address: '0x6b175474e89094c44da98b954eedeac495271d0f',
              symbol: 'DAI',
              decimals: 18,
              isERC721: false,
              aggregators: [],
            },
          ],
        },
      },
    })
    .withTokenListController({
      tokensChainsCache: {
        '0xa4b1': {
          data: {
            '0xaf88d065e77c8cC2239327C5EDb3A432268e5831': {
              name: 'USD Coin',
              symbol: 'USDC',
              address: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831',
            },
            '0xda10009cbd5d07dd0cecc66161fc93d7c9000da1': {
              name: 'Dai Stablecoin',
              symbol: 'DAI',
              address: '0xda10009cbd5d07dd0cecc66161fc93d7c9000da1',
            },
          },
        },
      },
    })
    .withEnabledNetworks({
      eip155: {
        '0x1': true,
        '0xe708': true,
        '0xa4b1': true,
      },
    });

  if (withErc20) {
    fixtureBuilder.withTokensControllerERC20({ chainId: 1 });
  }

  return {
    fixtures: fixtureBuilder.build(),
    testSpecificMock: async (mockServer: Mockttp) => {
      const standardMocks = [
        await mockPortfolioPage(mockServer),
        await mockGetTxStatus(mockServer),
        await mockTopAssetsLinea(mockServer),
        await mockTopAssetsArbitrum(mockServer),
        await mockTokensEthereum(mockServer),
        await mockTokensLinea(mockServer),
        await mockGetTokenArbitrum(mockServer),
        await mockETHtoETH(mockServer),
        await mockETHtoUSDC(mockServer),
        await mockDAItoETH(mockServer),
        await mockUSDCtoDAI(mockServer),
        await mockAccountsTransactions(mockServer),
        await mockAccountsBalances(mockServer),
        await mockPriceSpotPrices(mockServer),
        await mockPriceSpotPricesV3(mockServer),
        await mockSwapAggregatorLinea(mockServer),
        await mockGasPricesArbitrum(mockServer),
        await mockGasPricesMainnet(mockServer),
        await mockSwapAggregatorMetadataLinea(mockServer),
        await mockSwapTokensLinea(mockServer),
        await mockSwapTokensArbitrum(mockServer),
        await mockSwapAggregatorMetadataArbitrum(mockServer),
      ];

      if (withMockedSegment) {
        const segmentMocks = await mockSegment(
          mockServer,
          [
            EventTypes.BridgeLinkClicked,
            EventTypes.SwapBridgeButtonClicked,
            EventTypes.SwapBridgePageViewed,
            EventTypes.SwapBridgeInputChanged,
            EventTypes.SwapBridgeQuotesRequested,
            EventTypes.CrossChainQuotesReceived,
            EventTypes.ActionSubmitted,
            EventTypes.SwapBridgeSubmitted,
            EventTypes.TransactionAddedAnon,
            EventTypes.TransactionAdded,
            EventTypes.TransactionSubmittedAnon,
            EventTypes.TransactionSubmitted,
            EventTypes.TransactionApprovedAnon,
            EventTypes.TransactionApproved,
            EventTypes.TransactionFinalizedAnon,
            EventTypes.TransactionFinalized,
            EventTypes.SwapBridgeCompleted,
            EventTypes.UnifiedSwapBridgeSubmitted,
            EventTypes.SwapBridgeInputChanged,
            EventTypes.SwapBridgeTokenFlipped,
          ],
          { shouldAlwaysMatch: true },
        );
        standardMocks.push(...segmentMocks);
      } else {
        console.log('No custom segment mock provided');
      }

      return standardMocks.filter(Boolean);
    },
    manifestFlags: {
      remoteFeatureFlags: {
        bridgeConfig: featureFlags,
      },
      testing: { disableSmartTransactionsOverride: true },
    },
    ethConversionInUsd: ETH_CONVERSION_RATE_USD,
    smartContract: SMART_CONTRACTS.HST,
    localNodeOptions: [
      {
        type: 'anvil',
        options: {
          chainId: 1,
          hardfork: 'london',
          loadState: './test/e2e/seeder/network-states/with50Dai.json',
        },
      },
    ],
    title,
  };
};

export const getQuoteNegativeCasesFixtures = (
  options: { statusCode: number; json: unknown },
  featureFlags: Partial<FeatureFlagResponse> = {},
  title?: string,
) => {
  const fixtureBuilder = new FixtureBuilder({
    inputChainId: CHAIN_IDS.MAINNET,
  })
    .withCurrencyController(MOCK_CURRENCY_RATES)
    .withBridgeControllerDefaultState()
    .withTokensControllerERC20({ chainId: 1 })
    .withPreferencesControllerSmartTransactionsOptedOut()
    .withEnabledNetworks({
      eip155: {
        '0x1': true,
        '0xe708': true,
        '0xa4b1': true,
      },
    });

  return {
    fixtures: fixtureBuilder.build(),
    testSpecificMock: async (mockServer: Mockttp) => [
      await mockTopAssetsLinea(mockServer),
      await mockGetQuoteInvalid(mockServer, options),
      await mockTokensLinea(mockServer),
      await mockPriceSpotPrices(mockServer),
    ],
    manifestFlags: {
      remoteFeatureFlags: {
        bridgeConfig: featureFlags,
      },
      testing: { disableSmartTransactionsOverride: true },
    },
    smartContract: SMART_CONTRACTS.HST,
    localNodeOptions: [
      {
        type: 'anvil',
        options: {
          chainId: 1,
          hardfork: 'muirGlacier',
        },
      },
    ],
    title,
  };
};

export const getBridgeNegativeCasesFixtures = (
  options: { statusCode: number; json: unknown },
  featureFlags: Partial<FeatureFlagResponse> = {},
  title?: string,
) => {
  const fixtureBuilder = new FixtureBuilder({
    inputChainId: CHAIN_IDS.MAINNET,
  })
    .withCurrencyController(MOCK_CURRENCY_RATES)
    .withBridgeControllerDefaultState()
    .withPreferencesControllerSmartTransactionsOptedOut()
    .withTokensControllerERC20({ chainId: 1 })
    .withEnabledNetworks({
      eip155: {
        '0x1': true,
        '0xe708': true,
      },
    });

  return {
    fixtures: fixtureBuilder.build(),
    testSpecificMock: async (mockServer: Mockttp) => [
      await mockTopAssetsLinea(mockServer),
      await mockTokensLinea(mockServer),
      await mockETHtoETH(mockServer),
      await mockGetTxStatusInvalid(mockServer, options),
      await mockPriceSpotPrices(mockServer),
    ],
    manifestFlags: {
      remoteFeatureFlags: {
        bridgeConfig: featureFlags,
      },
      testing: { disableSmartTransactionsOverride: true },
    },
    smartContract: SMART_CONTRACTS.HST,
    localNodeOptions: [
      {
        type: 'anvil',
        options: {
          chainId: 1,
          hardfork: 'london',
        },
      },
    ],
    title,
  };
};

export const getInsufficientFundsFixtures = (
  featureFlags: Partial<FeatureFlagResponse> = {},
  title?: string,
) => {
  const fixtureBuilder = new FixtureBuilder({
    inputChainId: CHAIN_IDS.MAINNET,
  })
    .withCurrencyController(MOCK_CURRENCY_RATES)
    .withBridgeControllerDefaultState()
    .withTokensControllerERC20({ chainId: 1 })
    .withEnabledNetworks({
      eip155: {
        '0x1': true,
        '0xe708': true,
      },
    });

  return {
    fixtures: fixtureBuilder.build(),
    testSpecificMock: async (mockServer: Mockttp) => [
      await mockTokensLinea(mockServer),
      await mockTopAssetsLinea(mockServer),
      await mockETHtoWETH(mockServer),
    ],
    manifestFlags: {
      remoteFeatureFlags: {
        bridgeConfig: featureFlags,
      },
    },
    smartContract: SMART_CONTRACTS.HST,
    localNodeOptions: [
      {
        type: 'anvil',
        options: {
          chainId: 1,
          hardfork: 'london',
        },
      },
    ],
    title,
  };
};

export const getBridgeL2Fixtures = (
  title?: string,
  featureFlags: Partial<FeatureFlagResponse> = {},
) => {
  const fixtureBuilder = new FixtureBuilder({
    inputChainId: CHAIN_IDS.MAINNET,
  })
    .withCurrencyController(MOCK_CURRENCY_RATES)
    .withPreferencesControllerSmartTransactionsOptedOut()
    .withBridgeControllerDefaultState()
    .withNetworkControllerOnLineaLocahost()
    .withEnabledNetworks({
      eip155: {
        '0x1': true, // Ethereum Mainnet
        '0xa4b1': true, // Arbitrum One
        '0xe708': true, // Linea Mainnet
        '0xa': true, // Optimism
        '0x89': true, // Polygon
        '0x38': true, // BSC
        '0xa86a': true, // Avalanche
        '0x2105': true, // Base
        '0x144': true, // zkSync Era
      },
    });

  return {
    fixtures: fixtureBuilder.build(),
    testSpecificMock: async (mockServer: Mockttp) => [
      await mockPortfolioPage(mockServer),
      await mockGetTxStatus(mockServer),
      await mockTopAssetsLinea(mockServer),
      await mockTopAssetsArbitrum(mockServer),
      await mockTokensArbitrum(mockServer),
      await mockTokensEthereum(mockServer),
      await mockTokensLinea(mockServer),
      await mockGetTokenArbitrum(mockServer),
      await mockL2toMainnet(mockServer),
      await mockNativeL2toL2(mockServer),
      await mockDAIL2toL2(mockServer),
      await mockDAIL2toMainnet(mockServer),
      await mockGasPricesArbitrum(mockServer),
      await mockGasPricesMainnet(mockServer),
      await mockSwapAggregatorMetadataLinea(mockServer),
      await mockSwapTokensLinea(mockServer),
      await mockSwapTokensArbitrum(mockServer),
      await mockSwapAggregatorMetadataArbitrum(mockServer),
      await mockPriceSpotPrices(mockServer),
      await mockPriceSpotPricesV3(mockServer),
    ],
    manifestFlags: {
      remoteFeatureFlags: {
        bridgeConfig: featureFlags,
      },
      testing: { disableSmartTransactionsOverride: true },
    },
    ethConversionInUsd: ETH_CONVERSION_RATE_USD,
    smartContract: SMART_CONTRACTS.HST,
    localNodeOptions: [
      {
        type: 'anvil',
        options: {
          chainId: 59144,
          hardfork: 'muirGlacier',
        },
      },
    ],
    title,
  };
};
