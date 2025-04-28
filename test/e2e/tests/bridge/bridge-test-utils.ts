import { Mockttp } from 'mockttp';
import {
  type FeatureFlagResponse,
  BridgeClientId,
} from '@metamask/bridge-controller';

import { emptyHtmlPage } from '../../mock-e2e';
import FixtureBuilder from '../../fixture-builder';
import { SMART_CONTRACTS } from '../../seeder/smart-contracts';
import { CHAIN_IDS } from '../../../../shared/constants/network';
import { Driver } from '../../webdriver/driver';
import {
  DEFAULT_FEATURE_FLAGS_RESPONSE,
  ETH_CONVERSION_RATE_USD,
  MOCK_CURRENCY_RATES,
  MOCK_TOKENS_API,
  MOCK_GET_TOKEN_API,
  MOCK_BRIDGE_ETH_TO_ETH_LINEA,
  MOCK_BRIDGE_ETH_TO_USDC_ARBITRUM,
  MOCK_BRIDGE_DAI_TO_ETH_LINEA,
  MOCK_BRIDGE_DAI_TO_USDT_LINEA,
  MOCK_BRIDGE_NATIVE_L2_TO_MAINNET,
  MOCK_BRIDGE_NATIVE_L2_TO_L2,
  MOCK_BRIDGE_DAI_L2_TO_L2,
  MOCK_BRIDGE_DAI_L2_TO_MAINNET,
  TOP_ASSETS_API_LINEA_MOCK_RESULT,
  TOP_ASSETS_API_ARBITRUM_MOCK_RESULT,
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

export async function mockFeatureFlag(
  mockServer: Mockttp,
  featureFlagOverrides: Partial<FeatureFlagResponse>,
) {
  return await mockServer
    .forGet(/getAllFeatureFlags/u)
    .withHeaders({ 'X-Client-Id': BridgeClientId.EXTENSION })
    .always()
    .thenCallback(() => {
      return {
        statusCode: 200,
        json: {
          ...DEFAULT_FEATURE_FLAGS_RESPONSE,
          ...featureFlagOverrides,
          'extension-config': {
            ...DEFAULT_FEATURE_FLAGS_RESPONSE['extension-config'],
            ...featureFlagOverrides['extension-config'],
          },
        },
      };
    });
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

async function mockTokensApi(mockServer: Mockttp) {
  return await mockServer.forGet(/tokens/u).thenCallback(() => {
    return {
      statusCode: 200,
      json: MOCK_TOKENS_API,
    };
  });
}

async function mockGetTokenApi(mockServer: Mockttp) {
  return await mockServer
    .forGet(/getTokens/u)
    .withQuery({ chainId: 42161 })
    .thenCallback(() => {
      return {
        statusCode: 200,
        json: MOCK_GET_TOKEN_API,
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

async function mockDAItoUSDT(mockServer: Mockttp) {
  return await mockServer
    .forGet(/getQuote/u)
    .withQuery({
      srcTokenAddress: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
      destTokenAddress: '0xA219439258ca9da29E9Cc4cE5596924745e12B93',
    })
    .always()
    .thenCallback(() => {
      return {
        statusCode: 200,
        json: MOCK_BRIDGE_DAI_TO_USDT_LINEA,
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
      srcTokenAddress: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
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
    })
    .always()
    .thenCallback(() => {
      return {
        statusCode: 200,
        json: MOCK_BRIDGE_DAI_L2_TO_MAINNET,
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
      await mockFeatureFlag(mockServer, featureFlags),
      await mockPortfolioPage(mockServer),
      await mockGetTxStatus(mockServer),
      await mockTopAssetsLinea(mockServer),
      await mockTopAssetsArbitrum(mockServer),
      await mockTokensApi(mockServer),
      await mockGetTokenApi(mockServer),
      await mockETHtoETH(mockServer),
      await mockETHtoUSDC(mockServer),
      await mockDAItoETH(mockServer),
      await mockDAItoUSDT(mockServer),
    ],
    ethConversionInUsd: ETH_CONVERSION_RATE_USD,
    smartContract: SMART_CONTRACTS.HST,
    localNodeOptions: [
      {
        type: 'anvil',
        options: {
          chainId: 1,
          loadState: './test/e2e/seeder/network-states/with50Dai.json',
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
      await mockFeatureFlag(mockServer, featureFlags),
      await mockPortfolioPage(mockServer),
      await mockGetTxStatus(mockServer),
      await mockTopAssetsLinea(mockServer),
      await mockTopAssetsArbitrum(mockServer),
      await mockTokensApi(mockServer),
      await mockGetTokenApi(mockServer),
      await mockL2toMainnet(mockServer),
      await mockNativeL2toL2(mockServer),
      await mockDAIL2toL2(mockServer),
      await mockDAIL2toMainnet(mockServer),
    ],
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
