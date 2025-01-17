import { Mockttp } from 'mockttp';
import FixtureBuilder from '../../fixture-builder';
import {
  BRIDGE_CLIENT_ID,
  BRIDGE_DEV_API_BASE_URL,
  BRIDGE_PROD_API_BASE_URL,
} from '../../../../shared/constants/bridge';
import { SMART_CONTRACTS } from '../../seeder/smart-contracts';
import { CHAIN_IDS } from '../../../../shared/constants/network';
import { Driver } from '../../webdriver/driver';
import type { FeatureFlagResponse } from '../../../../shared/types/bridge';
import { emptyHtmlPage } from '../../mock-e2e';
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

const mockServer =
  (featureFlagOverrides: Partial<FeatureFlagResponse>) =>
  async (mockServer_: Mockttp) => {
    const featureFlagMocks = [
      `${BRIDGE_DEV_API_BASE_URL}/getAllFeatureFlags`,
      `${BRIDGE_PROD_API_BASE_URL}/getAllFeatureFlags`,
    ].map(
      async (url) =>
        await mockServer_
          .forGet(url)
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
          }),
    );
    const portfolioMock = mockServer_
      .forGet(`https://portfolio.metamask.io/bridge`)
      .always()
      .thenCallback(() => {
        return {
          statusCode: 200,
          body: emptyHtmlPage(),
        };
      });
    return Promise.all([...featureFlagMocks, portfolioMock]);
  };

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
    testSpecificMock: mockServer(featureFlags),
    smartContract: SMART_CONTRACTS.HST,
    ethConversionInUsd: ETH_CONVERSION_RATE_USD,
    localNodeOptions: {
      hardfork: 'london',
      chain: { chainId: CHAIN_IDS.MAINNET },
    },
    title,
  };
};
