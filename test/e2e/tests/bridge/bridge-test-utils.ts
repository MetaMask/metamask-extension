import { strict as assert } from 'assert';
import { Mockttp } from 'mockttp';
import { Browser } from 'selenium-webdriver';
import FixtureBuilder from '../../fixture-builder';
import { generateGanacheOptions } from '../../helpers';
import {
  BRIDGE_CLIENT_ID,
  BRIDGE_DEV_API_BASE_URL,
  BRIDGE_PROD_API_BASE_URL,
} from '../../../../shared/constants/bridge';
import { SMART_CONTRACTS } from '../../seeder/smart-contracts';
import { CHAIN_IDS } from '../../../../shared/constants/network';
import { Driver } from '../../webdriver/driver';
import { FeatureFlagResponse } from '../../../../ui/pages/bridge/bridge.util';
import { isManifestV3 } from '../../../../shared/modules/mv3.utils';
import {
  DEFAULT_FEATURE_FLAGS_RESPONSE,
  ETH_CONVERSION_RATE_USD,
  MOCK_CURRENCY_RATES,
} from './constants';

const IS_FIREFOX = process.env.SELENIUM_BROWSER === Browser.FIREFOX;

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

    await this.driver.delay(2000);
    assert.ok((await this.driver.getCurrentUrl()).includes('asset'));
  };

  verifyPortfolioTab = async (expectedHandleCount: number) => {
    await this.driver.delay(4000);
    await this.driver.switchToWindowWithTitle('MetaMask Portfolio - Bridge');
    assert.equal(
      (await this.driver.getAllWindowHandles()).length,
      IS_FIREFOX || !isManifestV3
        ? expectedHandleCount
        : expectedHandleCount + 1,
    );
    assert.match(
      await this.driver.getCurrentUrl(),
      /^https:\/\/portfolio\.metamask\.io\/bridge/u,
    );
  };

  verifySwapPage = async (expectedHandleCount: number) => {
    await this.driver.delay(4000);
    await this.driver.waitForSelector({
      css: '.bridge__title',
      text: 'Bridge',
    });
    assert.equal(
      (await this.driver.getAllWindowHandles()).length,
      IS_FIREFOX || !isManifestV3
        ? expectedHandleCount
        : expectedHandleCount + 1,
    );
    assert.match(await this.driver.getCurrentUrl(), /.+cross-chain\/swaps/u);
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
              },
            };
          }),
    );
    return Promise.all(featureFlagMocks);
  };

export const getBridgeFixtures = (
  title?: string,
  featureFlags: Partial<FeatureFlagResponse> = {},
  withErc20: boolean = true,
) => {
  const fixtureBuilder = new FixtureBuilder({
    inputChainId: CHAIN_IDS.MAINNET,
  })
    .withNetworkControllerOnMainnet()
    .withCurrencyController(MOCK_CURRENCY_RATES)
    .withBridgeControllerDefaultState();

  if (withErc20) {
    fixtureBuilder.withTokensControllerERC20({ chainId: 1 });
  }

  return {
    driverOptions: {
      // openDevToolsForTabs: true,
    },
    fixtures: fixtureBuilder.build(),
    testSpecificMock: mockServer(featureFlags),
    smartContract: SMART_CONTRACTS.HST,
    ethConversionInUsd: ETH_CONVERSION_RATE_USD,
    ganacheOptions: generateGanacheOptions({
      hardfork: 'london',
      chain: { chainId: CHAIN_IDS.MAINNET },
    }),
    title,
  };
};
