import { strict as assert } from 'assert';
import { Mockttp } from 'mockttp';
import { Browser } from 'selenium-webdriver';
import FixtureBuilder from '../../fixture-builder';
import { clickNestedButton, generateGanacheOptions } from '../../helpers';
import {
  BRIDGE_CLIENT_ID,
  BRIDGE_DEV_API_BASE_URL,
  BRIDGE_PROD_API_BASE_URL,
} from '../../../../shared/constants/bridge';
import { SMART_CONTRACTS } from '../../seeder/smart-contracts';
import { CHAIN_IDS } from '../../../../shared/constants/network';
import GanacheContractAddressRegistry from '../../seeder/ganache-contract-address-registry';
import { Driver } from '../../webdriver/driver';
import { FeatureFlagResponse } from '../../../../ui/pages/bridge/bridge.util';

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

  navigateToAssetPage = async (
    contractRegistry: GanacheContractAddressRegistry,
    symbol: string,
    shouldImportToken = true,
  ) => {
    if (shouldImportToken) {
      // Import token
      const contractAddress = await contractRegistry.getContractAddress(
        SMART_CONTRACTS.HST,
      );
      await this.driver.clickElement({
        text: 'Import tokens',
        tag: 'button',
      });
      await clickNestedButton(this.driver, 'Custom token');
      await this.driver.fill(
        '[data-testid="import-tokens-modal-custom-address"]',
        contractAddress,
      );
      await this.driver.waitForSelector(
        '[data-testid="import-tokens-modal-custom-decimals"]',
      );
      await this.driver.clickElement({
        text: 'Next',
        tag: 'button',
      });
      await this.driver.clickElement(
        '[data-testid="import-tokens-modal-import-button"]',
      );
      await this.driver.assertElementNotPresent(
        '[data-testid="import-tokens-modal-import-button"]',
      );
      tokenListItem = await this.driver.findElement({ text: symbol });
    } else {
      tokenListItem = await this.driver.findElement({
        css: '[data-testid="multichain-token-list-button"]',
        text: symbol,
      });
    }
    await tokenListItem.click();
    assert.ok((await this.driver.getCurrentUrl()).includes('asset'));
  };

  verifyPortfolioTab = async (expectedHandleCount: number) => {
    await this.driver.delay(4000);
    await this.driver.switchToWindowWithTitle('MetaMask Portfolio - Bridge');
    assert.equal(
      (await this.driver.getAllWindowHandles()).length,
      IS_FIREFOX ? expectedHandleCount : expectedHandleCount + 1,
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
      IS_FIREFOX ? expectedHandleCount : expectedHandleCount + 1,
    );
    assert.match(await this.driver.getCurrentUrl(), /.+cross-chain\/swaps/u);
  };
}

const mockServer =
  (featureFlagOverrides: Partial<FeatureFlagResponse>) =>
  async (mockServer_: Mockttp) => {
    const DEFAULT_FEATURE_FLAGS_RESPONSE: FeatureFlagResponse = {
      'extension-support': false,
    };
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
  }).withNetworkControllerOnMainnet();

  if (withErc20) {
    fixtureBuilder.withTokensControllerERC20();
  }

  return {
    driverOptions: {
      // openDevToolsForTabs: true,
    },
    fixtures: fixtureBuilder.build(),
    testSpecificMock: mockServer(featureFlags),
    smartContract: SMART_CONTRACTS.HST,
    ganacheOptions: generateGanacheOptions({
      hardfork: 'london',
      chain: { chainId: CHAIN_IDS.MAINNET },
    }),
    title,
  };
};
