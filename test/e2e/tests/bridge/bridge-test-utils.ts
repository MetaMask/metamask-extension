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
import {
  ETH_CONVERSION_RATE_USD,
  MOCK_CURRENCY_RATES,
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

  verifyPortfolioTab = async () => {
    await this.driver.switchToWindowWithTitle('E2E Test Page');
    await this.driver.waitForUrlContaining({
      url: 'portfolio.metamask.io/bridge',
    });
  };

  verifySwapPage = async () => {
    await this.driver.waitForUrlContaining({
      url: 'cross-chain/swaps',
    });
  };
}

export async function bridgeTransaction(
  driver: Driver,
  quote: BridgeQuote,
  transactionsCount: number,
  expectedWalletBalance: string,
) {
  // Navigate to Bridge page
  const homePage = new HomePage(driver);
  await homePage.startBridgeFlow();

  const bridgePage = new BridgeQuotePage(driver);
  await bridgePage.enterBridgeQuote(quote);
  await bridgePage.waitForQuote();
  await bridgePage.check_expectedNetworkFeeIsDisplayed();
  await bridgePage.submitQuote();

  await homePage.goToActivityList();

  const activityList = new ActivityListPage(driver);
  await activityList.check_completedBridgeTransactionActivity(
    transactionsCount,
  );

  if (quote.unapproved) {
    await activityList.check_txAction(`Bridge to ${quote.toChain}`);
    await activityList.check_txAction(
      `Approve ${quote.tokenFrom} for bridge`,
      2,
    );
  } else {
    await activityList.check_txAction(`Bridge to ${quote.toChain}`);
  }
  // Check the amount of ETH deducted in the activity is correct
  await activityList.check_txAmountInActivity(
    `-${quote.amount} ${quote.tokenFrom}`,
  );

  // Check the wallet ETH balance is correct
  const accountListPage = new AccountListPage(driver);
  await accountListPage.check_accountValueAndSuffixDisplayed(
    expectedWalletBalance,
  );
}

async function mockPortfolioPage(mockServer: Mockttp) {
  return await mockServer
    .forGet(`https://portfolio.metamask.io/bridge`)
    .always()
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
          chainId: srcChainId,
          txHash,
        },
        destChain: {
          chainId: destChainId,
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

async function mockTopAssetsArbitrum(mockServer: Mockttp) {
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
    .always()
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
    .always()
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
    .always()
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
    .always()
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
    .always()
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
    .always()
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
      destTokenAddress: '0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1',
    })
    .always()
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
    .always()
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
              usd_24h_change: 2.5,
            },
            '0x6b175474e89094c44da98b954eedeac495271d0f': {
              usd: 1.0,
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
            usd_24h_change: 0.1,
          },
          'eip155:1/slip44:60': {
            usd: 2000.0,
            usd_24h_change: 2.5,
          },
        },
      };
    });
}

export const getBridgeFixtures = (
  title?: string,
  featureFlags: Partial<FeatureFlagResponse> = {},
  withErc20: boolean = true,
) => {
  const fixtureBuilder = new FixtureBuilder({
    inputChainId: CHAIN_IDS.MAINNET,
  })
    .withCurrencyController(MOCK_CURRENCY_RATES)
    .withBridgeControllerDefaultState()
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
    });

  if (withErc20) {
    fixtureBuilder.withTokensControllerERC20({ chainId: 1 });
  }

  return {
    fixtures: fixtureBuilder.build(),
    testSpecificMock: async (mockServer: Mockttp) => [
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
    ],
    manifestFlags: {
      remoteFeatureFlags: {
        bridgeConfig: featureFlags,
      },
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
    .withTokensControllerERC20({ chainId: 1 });

  return {
    fixtures: fixtureBuilder.build(),
    testSpecificMock: async (mockServer: Mockttp) => [
      await mockTopAssetsLinea(mockServer),
      await mockGetQuoteInvalid(mockServer, options),
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
    .withTokensControllerERC20({ chainId: 1 });

  return {
    fixtures: fixtureBuilder.build(),
    testSpecificMock: async (mockServer: Mockttp) => [
      await mockTopAssetsLinea(mockServer),
      await mockETHtoETH(mockServer),
      await mockGetTxStatusInvalid(mockServer, options),
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

export const getInsufficientFundsFixtures = (
  featureFlags: Partial<FeatureFlagResponse> = {},
  title?: string,
) => {
  const fixtureBuilder = new FixtureBuilder({
    inputChainId: CHAIN_IDS.MAINNET,
  })
    .withCurrencyController(MOCK_CURRENCY_RATES)
    .withBridgeControllerDefaultState()
    .withTokensControllerERC20({ chainId: 1 });

  return {
    fixtures: fixtureBuilder.build(),
    testSpecificMock: async (mockServer: Mockttp) => [
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
    .withBridgeControllerDefaultState()
    .withNetworkControllerOnLineaLocahost();

  return {
    fixtures: fixtureBuilder.build(),
    testSpecificMock: async (mockServer: Mockttp) => [
      await mockPortfolioPage(mockServer),
      await mockGetTxStatus(mockServer),
      await mockTopAssetsLinea(mockServer),
      await mockTopAssetsArbitrum(mockServer),
      await mockTokensEthereum(mockServer),
      await mockTokensLinea(mockServer),
      await mockGetTokenArbitrum(mockServer),
      await mockL2toMainnet(mockServer),
      await mockNativeL2toL2(mockServer),
      await mockDAIL2toL2(mockServer),
      await mockDAIL2toMainnet(mockServer),
    ],
    manifestFlags: {
      remoteFeatureFlags: {
        bridgeConfig: featureFlags,
      },
    },
    ethConversionInUsd: ETH_CONVERSION_RATE_USD,
    smartContract: SMART_CONTRACTS.HST,
    localNodeOptions: [
      {
        type: 'anvil',
        options: {
          chainId: 59144,
        },
      },
    ],
    title,
  };
};
