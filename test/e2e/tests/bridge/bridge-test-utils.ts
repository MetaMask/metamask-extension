import { strict as assert } from 'assert';
import { Mockttp } from 'mockttp';
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

export class BridgePage {
  driver: Driver;

  constructor(driver: Driver) {
    this.driver = driver;
  }

  load = async (
    location:
      | 'wallet-overview'
      | 'coin-overview'
      | 'token-overview' = 'wallet-overview',
  ) => {
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

  loadAssetPage = async (
    contractRegistry: GanacheContractAddressRegistry,
    symbol?: string,
  ) => {
    let tokenListItem;

    if (symbol) {
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
      await this.driver.delay(2000);
      tokenListItem = await this.driver.findElement({ text: symbol });
    } else {
      tokenListItem = await this.driver.findElement(
        '[data-testid="multichain-token-list-button"]',
      );
    }
    await tokenListItem.click();
    assert.ok((await this.driver.getCurrentUrl()).includes('asset'));
  };

  verifyPortfolioTab = async (_url: string, handleCount: number) => {
    // await this.driver.delay(2000);
    await this.driver.waitUntilXWindowHandles(handleCount);
    // await this.driver.switchToWindowWithUrl(_url);
  };

  verifySwapPage = async () => {
    await this.driver.delay(1000);
    const currentUrl = await this.driver.getCurrentUrl();
    assert.ok(currentUrl.includes('cross-chain/swaps'));
  };
}

const mockServer =
  (featureFlags: Record<string, boolean> = { 'extension-support': false }) =>
  async (mockServer_: Mockttp) =>
    [
      await mockServer_
        .forGet(`${BRIDGE_DEV_API_BASE_URL}/getAllFeatureFlags`)
        .withHeaders({ 'X-Client-Id': BRIDGE_CLIENT_ID })
        .always()
        .thenCallback(() => {
          return {
            statusCode: 200,
            json: featureFlags,
          };
        }),
      await mockServer_
        .forGet(`${BRIDGE_PROD_API_BASE_URL}/getAllFeatureFlags`)
        .withHeaders({ 'X-Client-Id': BRIDGE_CLIENT_ID })
        .always()
        .thenCallback(() => {
          return {
            statusCode: 200,
            json: featureFlags,
          };
        }),
    ];

export const getBridgeFixtures = (
  title?: string,
  featureFlags: Record<string, boolean> = { 'extension-support': false },
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
      openDevToolsForTabs: true,
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
