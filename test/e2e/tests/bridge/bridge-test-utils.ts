import { Mockttp } from 'mockttp';
import FixtureBuilder from '../../fixture-builder';
import { BRIDGE_CLIENT_ID } from '../../../../shared/constants/bridge';
import { SMART_CONTRACTS } from '../../seeder/smart-contracts';
import { CHAIN_IDS } from '../../../../shared/constants/network';
import { Driver } from '../../webdriver/driver';
import type { FeatureFlagResponse } from '../../../../shared/types/bridge';
import {
  DEFAULT_FEATURE_FLAGS_RESPONSE,
  ETH_CONVERSION_RATE_USD,
  MOCK_CURRENCY_RATES,
} from './constants';
import { Tenderly } from '../../tenderly-network';

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
    await this.driver.switchToWindowWithTitle('MetaMask Portfolio - Bridge');
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

async function mockFeatureFlag(
  mockServer: Mockttp,
  featureFlagOverrides: Partial<FeatureFlagResponse>,
) {
  return await mockServer
    .forGet(/getAllFeatureFlags/)
    .withHeaders({ 'X-Client-Id': BRIDGE_CLIENT_ID })
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

async function mockGetTxStatus(mockServer: Mockttp) {
  return await mockServer
    .forGet(/getTxStatus/)
    .always()
    .thenCallback(async (req) => {
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
            txHash:
              '0x7fadf05d079e457257564ee44c302968853a16c39a49428576d8ba1ca18127b7',
          },
        },
      };
    });
}

const GET_FEES_RESPONSE = {
  blockNumber: 20728974,
  id: '19d4eea3-8a49-463e-9e9c-099f9d9571ca',
  txs: [
    {
      cancelFees: [],
      return: '0x',
      status: 1,
      gasUsed: 190780,
      gasLimit: 239420,
      fees: [
        {
          maxFeePerGas: 4667609171,
          maxPriorityFeePerGas: 1000000004,
          gas: 239420,
          balanceNeeded: 1217518987960240,
          currentBalance: 751982303082919400,
          error: '',
        },
      ],
      feeEstimate: 627603309182220,
      baseFeePerGas: 2289670348,
      maxFeeEstimate: 1117518987720820,
    },
  ],
};

async function mockGetFees(mockServer: Mockttp) {
  return await mockServer
    .forPost('https://transaction.api.cx.metamask.io/networks/1/getFees')
    .thenJson(200, GET_FEES_RESPONSE);
}

export const getBridgeFixtures = (
  title?: string,
  featureFlags: Partial<FeatureFlagResponse> = {},
  withErc20: boolean = true,
) => {
  const fixtureBuilder = new FixtureBuilder({
    inputChainId: CHAIN_IDS.MAINNET,
  })
    .withNetworkControllerOnTenderly(Tenderly.Mainnet.url)
    .withCurrencyController(MOCK_CURRENCY_RATES)
    .withBridgeControllerDefaultState();

  if (withErc20) {
    fixtureBuilder.withTokensControllerERC20({ chainId: 1 });
  }

  return {
    driverOptions: {
      // openDevToolsForTabs: true,
      disableGanache: true,
    },
    fixtures: fixtureBuilder.build(),
    testSpecificMock: async (mockServer: Mockttp) => [
      await mockFeatureFlag(mockServer, featureFlags),
      await mockGetTxStatus(mockServer),
    ],
    smartContract: SMART_CONTRACTS.HST,
    ethConversionInUsd: ETH_CONVERSION_RATE_USD,
    title,
  };
};
